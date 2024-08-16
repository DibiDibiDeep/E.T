import os
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import numpy as np
from transformers import AutoFeatureExtractor, AutoModelForImageClassification
import torch

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 운영 환경에서는 구체적인 오리진을 지정하세요
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 모델과 프로세서 로드
model_name = "dima806/facial_emotions_image_detection"  # 예시 모델, 실제 사용하는 모델로 변경하세요
processor = AutoFeatureExtractor.from_pretrained(model_name)
model = AutoModelForImageClassification.from_pretrained(model_name)

# 감정 레이블 (예시, 실제 모델의 레이블로 변경하세요)
emotion_labels = list(model.config.id2label.values())

@app.post("/predict")
async def predict_emotion(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        inputs = processor(images=image, return_tensors="pt")
        
        with torch.no_grad():
            outputs = model(**inputs)
        
        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=-1)
        
        top_prob, top_class = probabilities.topk(1)
        
        predicted_class = model.config.id2label[top_class.item()]
        probability = top_prob.item()
        
        logger.info(f"Prediction: class={predicted_class}, probability={probability:.4f}")
        
        return {
            "results": [
                {
                    "class": predicted_class,
                    "probability": float(probability)
                }
            ]
        }
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return {"error": str(e)}, 500

