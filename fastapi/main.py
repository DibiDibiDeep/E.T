from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from io import BytesIO
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification
import torch

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic 모델 정의
class ImageData(BaseModel):
    image: str

def decode_image(image_data: str) -> Image.Image:
    # Base64로 인코딩된 이미지를 디코딩하여 PIL 이미지 객체로 반환하는 함수
    try:
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(BytesIO(image_bytes))
        return image
    except Exception as e:
        raise ValueError("Invalid image data") from e

def preprocess_image(image: Image.Image, processor) -> dict:
    # 이미지 객체를 모델 입력에 맞게 전처리하는 함수
    return processor(images=image, return_tensors="pt")

def infer_image(inputs: dict, model) -> dict:
    # 모델에 입력을 전달하고 결과를 얻는 함수
    with torch.no_grad():
        outputs = model(**inputs)
    logits = outputs.logits
    probabilities = torch.nn.functional.softmax(logits, dim=-1)
    return logits, probabilities

def postprocess_results(logits: torch.Tensor, probabilities: torch.Tensor, model) -> list:
    # 모델 결과를 후처리하여 정렬된 결과를 반환하는 함수
    results = []
    for i, (logit, probability) in enumerate(zip(logits[0], probabilities[0])):
        class_name = model.config.id2label[i]
        rounded_probability = round(probability.item() * 100, 2)
        results.append((class_name, rounded_probability))
        print(f"Class: {class_name},\t Prob: {rounded_probability}")

    results.sort(key=lambda x: x[1], reverse=True)
    return results[:3]

@app.post("/infer/")
async def infer(data: ImageData):
    try:
        processor = AutoImageProcessor.from_pretrained("dima806/facial_emotions_image_detection")
        model = AutoModelForImageClassification.from_pretrained("dima806/facial_emotions_image_detection")

        # 이미지 데이터 디코딩
        image = decode_image(data.image)

        # 이미지 전처리
        inputs = preprocess_image(image, processor)

        # 모델 추론
        logits, probabilities = infer_image(inputs, model)

        # 결과 후처리
        results = postprocess_results(logits, probabilities, model)

        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")
