from fastapi import FastAPI, File, UploadFile, Form
from pydantic import BaseModel
from typing import List
from transformers import pipeline, AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch
import io
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 모델 로드
pipe = pipeline("image-classification", model="dima806/facial_emotions_image_detection")
processor = AutoImageProcessor.from_pretrained("dima806/facial_emotions_image_detection")
model = AutoModelForImageClassification.from_pretrained("dima806/facial_emotions_image_detection")

class PredictionResult(BaseModel):
    class_name: str
    logit: float
    probability: float

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    try:
        # 이미지 로드 및 전처리
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        inputs = processor(images=image, return_tensors="pt")

        # 모델 추론
        with torch.no_grad():
            outputs = model(**inputs)

        # 로짓과 확률 계산
        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=-1)

        # 클래스별 예측 결과 저장 및 반환
        results = []
        for i, (logit, probability) in enumerate(zip(logits[0], probabilities[0])):
            class_name = model.config.id2label[i]
            rounded_probability = round(probability.item(), 2)
            results.append(PredictionResult(
                class_name=class_name,
                logit=logit.item(),
                probability=rounded_probability
            ))

        results.sort(key=lambda x: x.probability, reverse=True)
        top_results = results[:1]

        return {"predictions": top_results}
    
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
