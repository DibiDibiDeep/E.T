from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from io import BytesIO
from PIL import Image, ImageOps
from transformers import AutoImageProcessor, AutoModelForImageClassification
import torch
import mediapipe as mp
import numpy as np

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

processor = AutoImageProcessor.from_pretrained("dima806/facial_emotions_image_detection")
model = AutoModelForImageClassification.from_pretrained("dima806/facial_emotions_image_detection")

mp_selfie_segmentation = mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=1)

# Pydantic 모델 정의
class ImageData(BaseModel):
    image: str

def decode_image(image_data: str) -> Image.Image:
    try:
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(BytesIO(image_bytes))
        return image
    except Exception as e:
        raise ValueError("Invalid image data") from e

def preprocess_image(image: Image.Image, processor) -> dict:
    return processor(images=image, return_tensors="pt")

def infer_image(inputs: dict, model) -> dict:
    with torch.no_grad():
        outputs = model(**inputs)
    logits = outputs.logits
    probabilities = torch.nn.functional.softmax(logits, dim=-1)
    return logits, probabilities

def postprocess_results(logits: torch.Tensor, probabilities: torch.Tensor, model) -> list:
    results = []
    for i, (logit, probability) in enumerate(zip(logits[0], probabilities[0])):
        class_name = model.config.id2label[i]
        rounded_probability = round(probability.item() * 100, 2)
        results.append((class_name, rounded_probability))
    results.sort(key=lambda x: x[1], reverse=True)
    return results[:3]

def remove_background_mediapipe(image: Image.Image) -> Image.Image:
    # Convert PIL Image to numpy array
    image_np = np.array(image)

    # Perform background removal using Mediapipe
    results = mp_selfie_segmentation.process(image_np)
    mask = results.segmentation_mask > 0.5

    # Prepare the alpha channel (transparency mask)
    alpha_channel = (mask * 255).astype(np.uint8)

    # Merge alpha channel with the original image
    image_rgba = np.dstack((image_np, alpha_channel))

    # Convert back to PIL Image
    return Image.fromarray(image_rgba)

def encode_image(image: Image.Image) -> str:
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"

@app.post("/infer/")
async def infer(data: ImageData):
    try:
        # 이미지 데이터 디코딩
        image = decode_image(data.image)

        # Mediapipe를 사용한 배경 제거
        processed_image = remove_background_mediapipe(image)

        # 이미지 전처리
        inputs = preprocess_image(image, processor)

        # 모델 추론
        logits, probabilities = infer_image(inputs, model)

        # 결과 후처리
        results = postprocess_results(logits, probabilities, model)

        # 배경 제거된 이미지 인코딩
        encoded_image = encode_image(processed_image)

        return {"results": results, "processed_image": encoded_image}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")
