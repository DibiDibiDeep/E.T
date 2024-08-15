import React, { useState, useRef, useEffect } from 'react';
import styles from './Main.module.css';

const App = () => {
    const [overlayVisible, setOverlayVisible] = useState(false);
    const [capturedImage, setCapturedImage] = useState('');
    const [analysisResult, setAnalysisResult] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);b 
    const fireworksContainerRef = useRef(null);
    let countdownTimer;

    useEffect(() => {
        startVideo();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (modalVisible) {
            triggerFireworks();
        }
    }, [modalVisible]);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
        } catch (error) {
            console.error('Error accessing webcam: ', error);
        }
    };

    const captureImage = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.save(); // 이전 상태 저장
        context.scale(-1, 1); // 좌우 반전
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height); // 좌우 반전 후 이미지 그리기
        context.restore(); // 이전 상태로 복원
        const imageData = canvas.toDataURL('image/jpeg');
        
        setCapturedImage(imageData);
        return imageData;
    };

    const sendImageToServer = async (imageData) => {
        try {
            const blob = await fetch(imageData).then(res => res.blob());
            const formData = new FormData();
            formData.append('file', blob, 'captured_image.jpg');

            const response = await fetch('http://localhost:8000/analyze', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            setAnalysisResult(JSON.stringify(result, null, 2));
            setModalVisible(true);
        } catch (error) {
            console.error('Error sending image to server: ', error);
        }
    };

    const startCountdown = () => {
        setOverlayVisible(true);
        let countdown = 3;

        countdownTimer = setInterval(() => {
            if (countdown > 0 && overlayRef.current) {
                overlayRef.current.textContent = countdown;
                countdown--;
            } else {
                clearInterval(countdownTimer);
                setOverlayVisible(false);
                takePicture();
            }
        }, 1000);
    };

    const takePicture = () => {
        const imageData = captureImage();
        sendImageToServer(imageData);
    };

    const triggerFireworks = () => {
        const container = fireworksContainerRef.current;
        for (let i = 0; i < 20; i++) { // 폭죽 수
            const firework = document.createElement('div');
            firework.className = styles.firework;
            firework.style.top = `${Math.random() * 100}%`;
            firework.style.left = `${Math.random() * 100}%`;
            firework.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`; // 무작위 색상
            container.appendChild(firework);

            setTimeout(() => {
                firework.remove();
            }, 1000); // 1초 후에 폭죽을 제거
        }
    };

    const closeModal = () => {
        setModalVisible(false);
        setCapturedImage('');
        startVideo();
    };

    return (
        <div id={styles.wrap}>
            <div id={styles.header}>
                <img src="../src/images/logo.png" alt="Logo"/><br/>
                <h1>얼굴 근육에 smilage를 쌓아라!</h1>
            </div>
            <div id={styles.main}>
                <video className={styles.videoMirror} ref={videoRef} autoPlay playsInline></video>
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                {overlayVisible && <div ref={overlayRef} className={styles.overlay}></div>}
            </div>
            <div id={styles.btnArea}>
                <button type="button" id={styles.startBtn} onClick={startCountdown}>Smile~</button>
            </div>

            {/* 폭죽 애니메이션 컨테이너 */}
            <div id="fireworks-container" ref={fireworksContainerRef}></div>

            {/* Modal for showing analysis results */}
            {modalVisible && (
                <>
                    <div className={styles.modalOverlay}></div>
                    <div className={styles.modalContent}>
                        <div id={styles.resultArea}>
                            {capturedImage && <img id={styles.capturedImage} src={capturedImage} alt="Captured Image" />}
                        </div>
                        <pre id={styles.result}>{analysisResult}</pre>
                        <button id={styles.closeModal} onClick={closeModal}>닫기</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default App;
