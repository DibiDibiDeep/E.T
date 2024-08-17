import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import ProgressBar from 'react-bootstrap/ProgressBar';
import styles from './Main.module.css';
import html2canvas from 'html2canvas';

const emotionTranslations = {
    "happy": "행복",
    "sad": "슬픔",
    "angry": "화남",
    "surprise": "놀람",
    "neutral": "평온"
};

const translateEmotion = (emotion) => {
    return emotionTranslations[emotion] || emotion;
};

function Main() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [predictions, setPredictions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [displayedProbability, setDisplayedProbability] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [mileage, setMileage] = useState(0);
    const [captureCount, setCaptureCount] = useState(0);

    const getUserCamera = () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                let video = videoRef.current;
                video.srcObject = stream;
                video.play();
            })
            .catch((error) => {
                console.log(error);
            });
    };

    useEffect(() => {
        getUserCamera();
    }, []);

    const captureFrame = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(new File([blob], 'frame.jpg', { type: 'image/jpeg' }));
            }, 'image/jpeg');
        });
    };

    const sendToServer = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:8000/predict', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data.predictions;
        } catch (error) {
            console.error('Error sending image to server:', error);
            return null;
        }
    };

    const startAnalyzing = async () => {
        if (captureCount >= 5) {
            alert("일일 최대 캡처 횟수를 초과했습니다.");
            return;
        }

        setIsAnalyzing(true);
        let frameCount = 0;
        const maxFrames = 50; // 5초 동안 분석 (10 FPS * 5초)

        while (isAnalyzing && frameCount < maxFrames) {
            const file = await captureFrame();
            const predictions = await sendToServer(file);
            
            if (predictions && predictions.length > 0) {
                const happyPrediction = predictions.find(p => p.class === "happy");
                if (happyPrediction && happyPrediction.probability >= 0.7) {
                    setCapturedImage(canvasRef.current.toDataURL('image/jpeg'));
                    setPredictions(predictions);
                    setDisplayedProbability(Math.round(happyPrediction.probability * 100));
                    setShowModal(true);
                    setIsAnalyzing(false);
                    setMileage(prev => prev + 20);
                    setCaptureCount(prev => prev + 1);
                    break;
                }
            }
            
            frameCount++;
            await new Promise(resolve => setTimeout(resolve, 100)); // 10 FPS
        }

        if (frameCount >= maxFrames) {
            alert("행복한 표정을 찾지 못했습니다. 다시 시도해주세요!");
        }

        setIsAnalyzing(false);
    };

    const handleClose = () => {
        setShowModal(false);
        setDisplayedProbability(0);
    };

    const handleSave = () => {
        const modalContent = document.querySelector(`.${styles.modalContent}`);
        html2canvas(modalContent).then((canvas) => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'happy-moment.png';
            link.click();
        });
    };

    return (
        <>
            <div className={styles.container}>
                <div className={styles.containerBox}>
                    <div className={styles.boxWrapper}>
                        <div className={styles.mainText}>
                            <div className={styles.logo1}>
                                <img src='./img/logo1.png' alt="Logo" />
                            </div>
                            <hr className={styles.line1} />
                            <div className={styles.mileageInfo}>
                                <span>오늘의 마일리지: {mileage}</span>
                                <span>남은 횟수: {5 - captureCount}/5</span>
                            </div>
                            <div className={styles.camBox}>
                                <div className={styles.videoWrapper}>
                                    <video className={styles.video} ref={videoRef}></video>
                                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                                </div>
                                <button onClick={startAnalyzing} className={styles.btn1} disabled={isAnalyzing}>
                                    {isAnalyzing ? 'Analyzing...' : 'Capture'}
                                </button>
                            </div>
                            <Modal show={showModal} className={styles.modalBox}>
                                <Modal.Body className={styles.modalContent}>
                                    {capturedImage && (
                                        <div className={styles.imagePreview}>
                                            <img src={capturedImage} alt="Captured" className={styles.capturedImage} />
                                        </div>
                                    )}
                                    <div className={styles.emotionResult}>
                                        <div>
                                            Smileage #{captureCount}
                                        </div>
                                        {predictions.length > 0 && (
                                            <>
                                                <div className={styles.progressCircle}>
                                                    <svg>
                                                        <circle cx="70" cy="70" r="60"></circle>
                                                        <circle
                                                            cx="70"
                                                            cy="70"
                                                            r="60"
                                                            style={{
                                                                strokeDashoffset: `calc(377 - (377 * ${displayedProbability}) / 100)`
                                                            }}
                                                        ></circle>
                                                    </svg>
                                                    <div className={styles.percentage}>{translateEmotion(predictions[0].class)}: {displayedProbability}%</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className={styles.mileageGain}>
                                        <span>획득한 마일리지: 20</span>
                                    </div>
                                </Modal.Body>
                                <Modal.Footer className={styles.buttonContainer}>
                                    <Button variant="secondary" onClick={handleClose} className={styles.closeBtn}>
                                        Close
                                    </Button>
                                    <Button variant="primary" onClick={handleSave} className={styles.saveBtn}>
                                        Save
                                    </Button>
                                </Modal.Footer>
                            </Modal>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Main;