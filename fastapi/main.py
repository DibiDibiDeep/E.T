# 라우터를 애플리케이션에 포함
for router, kwargs in routers:
    app.include_router(router=router, **kwargs)
    
    from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import io
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.routes import routers

app = FastAPI()

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 허용할 Origin 목록
    allow_credentials=True,
    allow_methods=["*"],  # 허용할 HTTP 메서드
    allow_headers=["*"],  # 허용할 HTTP 헤더
)


# 모델과 프로세서 로드
processor = AutoImageProcessor.from_pretrained("dima806/facial_emotions_image_detection")
model = AutoModelForImageClassification.from_pretrained("dima806/facial_emotions_image_detection")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # 파일을 메모리에서 열기
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))

        # 이미지 처리
        inputs = processor(images=image, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)

        # 결과 추출
        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=-1)
        results = []

        for i, (logit, probability) in enumerate(zip(logits[0], probabilities[0])):
            class_name = model.config.id2label[i]
            rounded_probability = round(probability.item(), 2)
            results.append({
                "class": class_name,
                "probability": rounded_probability
            })

        # 결과를 확률에 따라 내림차순으로 정렬
        results.sort(key=lambda x: x['probability'], reverse=True)

        return JSONResponse(content={"predictions": results})

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=400)
