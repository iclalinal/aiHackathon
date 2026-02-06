"""
AI Service API - Wrapper for YOLO inference
Provides HTTP endpoint for the Node.js backend to call
"""

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import sys
import shutil
import uuid

# Add parent directory to path to import inference module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from inference.infer import analyze_image

app = FastAPI(title="Road Damage AI Service")

# CORS middleware - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary upload directory
TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp_uploads")
os.makedirs(TEMP_DIR, exist_ok=True)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "road-damage-ai"}


@app.post("/analyze")
async def analyze(
    image: UploadFile = File(...),
    report_id: str = Form(None)
):
    """
    Analyze a road damage image using YOLO model
    
    Args:
        image: The image file to analyze
        report_id: Optional report ID for reference
    
    Returns:
        damage_type: Type of damage detected
        severity: low, medium, or high
        estimated_cost: Estimated repair cost (from infer.py - Area × Depth × 3000 TL/m³)
        confidence: Model confidence score
        calculation_method: "Reference Line" or "Standard"
        area_m2: Calculated area in square meters
    """
    temp_path = None
    
    try:
        # Save uploaded file temporarily with uuid
        file_ext = os.path.splitext(image.filename)[1] or ".jpg"
        temp_filename = f"{uuid.uuid4()}{file_ext}"
        temp_path = os.path.join(TEMP_DIR, temp_filename)
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Run YOLO inference - all cost calculation happens in analyze_image
        result = analyze_image(temp_path)
        
        if result is None:
            # No damage detected
            return {
                "damage_type": None,
                "severity": None,
                "estimated_cost": 0,
                "confidence": 0,
                "message": "No road damage detected in the image",
                "report_id": report_id,
            }
        
        # Return values directly from the inference result
        # Cost is already calculated in infer.py using: Area × Depth × UNIT_PRICE_PER_M3
        return {
            "damage_type": result.get("type", "pothole"),
            "severity": result.get("severity", "medium"),
            "estimated_cost": result.get("estimated_cost", 0),
            "confidence": result.get("confidence", 0.5),
            "area_m2": result.get("area_m2", 0),
            "calculation_method": result.get("calculation_method", "Standard"),
            "detection_count": result.get("detection_count", 1),
            "visual_path": result.get("visual_path"),
            "report_id": report_id,
        }
        
    except Exception as e:
        print(f"Analysis error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "damage_type": None,
            "severity": None,
            "estimated_cost": 0,
            "confidence": 0,
            "report_id": report_id,
        }
        
    finally:
        # Cleanup temp file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass


if __name__ == "__main__":
    print("🚀 Starting AI Service on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
