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

# CORS middleware
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

# Cost estimation based on severity and damage type
COST_ESTIMATES = {
    "pothole": {"low": 500, "medium": 1500, "high": 3500},
    "crack": {"low": 300, "medium": 800, "high": 2000},
    "rutting": {"low": 400, "medium": 1200, "high": 3000},
    "patching": {"low": 200, "medium": 600, "high": 1500},
    "erosion": {"low": 600, "medium": 1800, "high": 4000},
}


def estimate_cost(damage_type: str, severity: str) -> float:
    """Estimate repair cost based on damage type and severity"""
    base_cost = COST_ESTIMATES.get(damage_type, COST_ESTIMATES["pothole"])
    cost = base_cost.get(severity, base_cost["medium"])
    # Add some variation
    import random
    variation = random.uniform(0.9, 1.1)
    return round(cost * variation, 2)


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
        estimated_cost: Estimated repair cost
        confidence: Model confidence score
    """
    temp_path = None
    
    try:
        # Save uploaded file temporarily
        file_ext = os.path.splitext(image.filename)[1] or ".jpg"
        temp_filename = f"{uuid.uuid4()}{file_ext}"
        temp_path = os.path.join(TEMP_DIR, temp_filename)
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Run YOLO inference
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
        
        damage_type = result.get("type", "pothole")
        severity = result.get("severity", "medium")
        confidence = result.get("confidence", 0.5)
        
        # Estimate cost
        estimated_cost = estimate_cost(damage_type, severity)
        
        return {
            "damage_type": damage_type,
            "severity": severity,
            "estimated_cost": estimated_cost,
            "confidence": confidence,
            "area_ratio": result.get("area_ratio", 0),
            "visual_path": result.get("visual_path"),
            "report_id": report_id,
        }
        
    except Exception as e:
        print(f"Analysis error: {e}")
        return {
            "error": str(e),
            "damage_type": "pothole",  # Fallback
            "severity": "medium",
            "estimated_cost": 1500,
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
