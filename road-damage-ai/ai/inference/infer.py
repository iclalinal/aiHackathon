"""
Road Damage AI - Inference Module
Analyzes road images for potholes using YOLO model with real-world size estimation
"""

from ultralytics import YOLO
import cv2
import os
import uuid
import math
import time

# ============================================================================
# SETUP & CONSTANTS
# ============================================================================

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_DIR = os.path.dirname(SCRIPT_DIR)  # Parent 'ai' directory
MODEL_PATH = os.path.join(AI_DIR, "models", "best.pt")

# Load YOLO model
model = YOLO(MODEL_PATH)

# Output directory for annotated images
OUTPUT_DIR = os.path.join(os.path.dirname(AI_DIR), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

DEBUG_DIR = os.path.join(AI_DIR, "debug_runs")
os.makedirs(DEBUG_DIR, exist_ok=True)

# Reference constants for real-world size estimation
REAL_LINE_WIDTH_CM = 3.0        # Standard road line width in cm (reference)
FIXED_FRAME_AREA_M2 = 4.0       # Fallback frame area if no reference line found (2m x 2m)
UNIT_PRICE_PER_M3 = 3000.0      # Cost per cubic meter in TL

# Depth estimates based on severity (in meters)
DEPTH_BY_SEVERITY = {
    "low": 0.03,      # 3 cm
    "medium": 0.08,   # 8 cm
    "high": 0.15      # 15 cm
}

# Class names that represent road reference lines
LINE_CLASS_NAMES = ["line", "road_line", "marking", "lane_line"]

# Class names for damage types
DAMAGE_CLASS_NAMES = ["pothole", "crack", "damage", "D00", "D10", "D20", "D40"]


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_box_dimensions(box):
    """Extract box coordinates and calculate width/height in pixels"""
    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
    width = x2 - x1
    height = y2 - y1
    area = width * height
    return x1, y1, x2, y2, width, height, area


def determine_severity(area_m2):
    """Determine severity based on real-world area in m²"""
    if area_m2 < 0.05:
        return "low"
    elif area_m2 < 0.20:
        return "medium"
    else:
        return "high"


def calculate_cost(area_m2, severity):
    """Calculate repair cost based on area and severity-based depth"""
    depth = DEPTH_BY_SEVERITY.get(severity, 0.08)
    volume_m3 = float(area_m2) * depth
    cost = volume_m3 * UNIT_PRICE_PER_M3
    return float(round(cost, 2))


def get_class_name(box, model):
    """Get the class name for a detection box"""
    class_id = int(box.cls[0].cpu().numpy())
    return model.names.get(class_id, "unknown").lower()


# ============================================================================
# MAIN ANALYSIS FUNCTION
# ============================================================================

def analyze_image(image_path):
    """
    Analyze road image for damage detection with real-world size estimation.
    
    Uses two modes:
    1. Precision Mode: If a road line is detected, uses it as reference for scale
    2. Fallback Mode: If no line detected, assumes fixed frame area
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Dictionary with detection results, costs, and visual path
        None if no damage detected
    """
    # Read image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Image not found: {image_path}")

    img_height, img_width, _ = img.shape
    img_area_pixels = img_height * img_width

    # Run YOLO inference
    results = model(image_path, conf=0.10)[0]

    if len(results.boxes) == 0:
        return None

    # DEBUG: Print all detected classes
    print(f"\n🔍 DETECTED CLASSES IN IMAGE:")
    all_classes = set()
    for box in results.boxes:
        class_name = get_class_name(box, model)
        conf = float(box.conf[0])
        all_classes.add(class_name)
        print(f"  - {class_name} ({conf:.2%})")
    print(f"Available model classes: {list(model.names.values())}\n")

    line_detections = []
    damage_detections = []

    for box in results.boxes:
        class_name = get_class_name(box, model)
        conf = float(box.conf[0]) # Güven skoru

        # 🟢 ÇİZGİ KONTROLÜ (Hassas davran, %10 bile olsa al)
        if any(line_name in class_name for line_name in LINE_CLASS_NAMES):
            line_detections.append(box)
            print(f"✅ LINE DETECTED: {class_name} with {conf:.2%} confidence")
        
        # 🔴 HASAR KONTROLÜ (Sert davran, %45'ten aşağısını gölge sanıp ele)
        elif any(damage_name in class_name for damage_name in DAMAGE_CLASS_NAMES):
            if conf > 0.45:  # <-- BU AYAR ÇOK ÖNEMLİ (Gölgeyi engeller)
                damage_detections.append(box)
                print(f"✅ DAMAGE DETECTED: {class_name} with {conf:.2%} confidence")
            else:
                print(f"❌ DAMAGE REJECTED (low conf): {class_name} with {conf:.2%} confidence")

    # Eğer filtreleme sonrası elinde hasar kalmadıysa dön
    if len(damage_detections) == 0:
        return None

    # ========================================================================
    # DETERMINE CALCULATION METHOD
    # ========================================================================
    
    cm_per_pixel = None
    calculation_method = "Standard"

    if len(line_detections) > 0:
        # PRECISION MODE: Use reference line for scale
        # Find the line with highest confidence
        best_line = max(line_detections, key=lambda b: float(b.conf[0]))
        _, _, _, _, line_width_px, line_height_px, _ = get_box_dimensions(best_line)
        
        # Use the smaller dimension as line width (lines are typically thin)
        line_pixel_width = min(line_width_px, line_height_px)
        
        print(f"\n📏 REFERENCE LINE ANALYSIS:")
        print(f"  Line width (px): {line_width_px:.1f}")
        print(f"  Line height (px): {line_height_px:.1f}")
        print(f"  Using dimension (px): {line_pixel_width:.1f}")
        print(f"  Real line width (cm): {REAL_LINE_WIDTH_CM}")
        
        if line_pixel_width > 0:
            cm_per_pixel = REAL_LINE_WIDTH_CM / line_pixel_width
            calculation_method = "ReferenceLine"
            print(f"  ✅ cm/pixel ratio: {cm_per_pixel:.4f}")
            print(f"  ✅ Using PRECISION MODE (ReferenceLine)\n")
        else:
            print(f"  ❌ Line too small, using Standard mode\n")
    else:
        print(f"\n⚠️  NO REFERENCE LINE DETECTED - Using Standard mode")
        print(f"  Assuming frame area: {FIXED_FRAME_AREA_M2} m²\n")

    # ========================================================================
    # PROCESS DAMAGE DETECTIONS
    # ========================================================================
    
    total_cost = 0.0
    processed_damages = []
    annotated_img = img.copy()

    # Draw reference lines if detected (for visualization)
    if len(line_detections) > 0:
        for line_box in line_detections:
            x1, y1, x2, y2, _, _, _ = get_box_dimensions(line_box)
            conf = float(line_box.conf[0])
            class_name = get_class_name(line_box, model)
            
            # Draw blue box for reference lines
            cv2.rectangle(annotated_img, 
                          (int(x1), int(y1)), 
                          (int(x2), int(y2)), 
                          (255, 255, 0), 2)  # Cyan color for lines
            
            # Add label
            label = f"REF: {class_name} ({conf:.0%})"
            cv2.putText(annotated_img, label,
                        (int(x1), int(y1) - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)

    for box in damage_detections:
        x1, y1, x2, y2, width_px, height_px, area_px = get_box_dimensions(box)
        confidence = float(box.conf[0].cpu().numpy())
        class_name = get_class_name(box, model)
        
        # Calculate real-world area
        if cm_per_pixel is not None:
            # PRECISION MODE
            width_cm = width_px * cm_per_pixel
            height_cm = height_px * cm_per_pixel
            area_cm2 = width_cm * height_cm
            area_m2 = area_cm2 / 10000  # Convert cm² to m²
        else:
            # FALLBACK MODE: Use area ratio with fixed frame size
            area_ratio = area_px / img_area_pixels
            area_m2 = area_ratio * FIXED_FRAME_AREA_M2

        # Determine severity and cost
        severity = determine_severity(area_m2)
        cost = calculate_cost(area_m2, severity)
        total_cost += cost

        # Store damage info - convert numpy types to Python native for JSON serialization
        processed_damages.append({
            "class": class_name,
            "confidence": float(round(confidence, 2)),
            "area_m2": float(round(area_m2, 4)),
            "severity": severity,
            "cost": float(cost)
        })

        # Draw bounding box
        color = {
            "low": (0, 255, 0),      # Green
            "medium": (0, 165, 255),  # Orange
            "high": (0, 0, 255)       # Red
        }.get(severity, (255, 0, 0))

        cv2.rectangle(annotated_img, 
                      (int(x1), int(y1)), 
                      (int(x2), int(y2)), 
                      color, 3)

        # Add label
        label = f"{class_name}: {severity} ({cost:.0f} TL)"
        label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        cv2.rectangle(annotated_img,
                      (int(x1), int(y1) - label_size[1] - 10),
                      (int(x1) + label_size[0], int(y1)),
                      color, -1)
        cv2.putText(annotated_img, label,
                    (int(x1), int(y1) - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    # ========================================================================
    # ADD SUMMARY TEXT TO IMAGE
    # ========================================================================
    
    # Draw summary box at top
    summary_text = f"Estimated Cost: {total_cost:.0f} TL | Method: {calculation_method}"
    text_size, _ = cv2.getTextSize(summary_text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
    
    cv2.rectangle(annotated_img, (10, 10), (text_size[0] + 20, text_size[1] + 20), (0, 0, 0), -1)
    cv2.putText(annotated_img, summary_text, (15, text_size[1] + 15),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    # Add detection count
    count_text = f"Detections: {len(processed_damages)}"
    cv2.putText(annotated_img, count_text, (15, text_size[1] + 45),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    # ========================================================================
    # SAVE OUTPUT IMAGE
    # ========================================================================
    
    output_name = f"{uuid.uuid4()}.jpg"
    output_path = os.path.join(OUTPUT_DIR, output_name)
    cv2.imwrite(output_path, annotated_img)

    timestamp = time.strftime("%Y%m%d-%H%M%S")
    debug_filename = f"{timestamp}_{calculation_method}_Cost{int(total_cost)}.jpg"
    debug_path = os.path.join(DEBUG_DIR, debug_filename)
    
    cv2.imwrite(debug_path, annotated_img)
    print(f"✅ DEBUG KAYDI OLUŞTURULDU: {debug_path}")

    # ========================================================================
    # PREPARE RESULT
    # ========================================================================
    
    # Get primary damage (largest area)
    primary_damage = max(processed_damages, key=lambda d: d["area_m2"])

    return {
        "type": primary_damage["class"],
        "confidence": float(primary_damage["confidence"]),
        "severity": primary_damage["severity"],
        "area_m2": float(primary_damage["area_m2"]),
        "estimated_cost": float(round(total_cost, 2)),
        "calculation_method": calculation_method,
        "detection_count": len(processed_damages),
        "all_damages": processed_damages,
        "visual_path": output_path
    }


# ============================================================================
# CLI TESTING
# ============================================================================

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        test_path = sys.argv[1]
    else:
        test_path = "demo/test.jpg"
    
    print(f"Analyzing: {test_path}")
    result = analyze_image(test_path)
    
    if result:
        print("\n=== Analysis Result ===")
        print(f"Type: {result['type']}")
        print(f"Severity: {result['severity']}")
        print(f"Area: {result['area_m2']:.4f} m²")
        print(f"Estimated Cost: {result['estimated_cost']:.2f} TL")
        print(f"Method: {result['calculation_method']}")
        print(f"Detection Count: {result['detection_count']}")
        print(f"Visual: {result['visual_path']}")
    else:
        print("No damage detected.")
