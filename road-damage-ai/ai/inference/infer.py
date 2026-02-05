from ultralytics import YOLO
import cv2
import os
import uuid

model = YOLO("ai/models/best.pt")

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def analyze_image(image_path):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Image not found: {image_path}")

    h, w, _ = img.shape
    img_area = h * w

    # 🔹 Inference
    results = model(image_path, conf=0.25, iou=0.5)[0]

    if len(results.boxes) == 0:
        return None

    # 🔹 En anlamlı hasarı seç (alan × confidence)
    box = max(
        results.boxes,
        key=lambda b: (
            (b.xyxy[0][2] - b.xyxy[0][0]) *
            (b.xyxy[0][3] - b.xyxy[0][1]) *
            float(b.conf[0])
        )
    )

    x1, y1, x2, y2 = box.xyxy[0]
    area_ratio = float((x2 - x1) * (y2 - y1) / img_area)
    confidence = float(box.conf[0])

    # 🔹 Severity
    if area_ratio < 0.05:
        severity = "low"
    elif area_ratio < 0.15:
        severity = "medium"
    else:
        severity = "high"

    # 🔹 Görsel kanıt üret
    output_name = f"{uuid.uuid4()}.jpg"
    output_path = os.path.join(OUTPUT_DIR, output_name)

    model.predict(
        image_path,
        save=True,
        conf=0.25,
        project=OUTPUT_DIR,
        name=output_name.replace(".jpg", ""),
        exist_ok=True
    )

    return {
        "type": "pothole",
        "confidence": round(confidence, 2),
        "area_ratio": round(area_ratio, 3),
        "severity": severity,
        "visual_path": f"{OUTPUT_DIR}/{output_name}/{os.path.basename(image_path)}"
    }


if __name__ == "__main__":
    result = analyze_image("demo/test.jpg")
    print(result)
