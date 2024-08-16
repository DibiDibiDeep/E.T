import React, { useState, useRef, useEffect } from 'react';
import styles from './Main.module.css';

const App = () => {
    const [overlayVisible, setOverlayVisible] = useState(false);
    const [capturedImage, setCapturedImage] = useState('');
    const [emotionName, setEmotionName] = useState('');
    const [emotionProbability, setEmotionProbability] = useState(0);
    const [displayedProbability, setDisplayedProbability] = useState(0); // 화면에 보여질 확률
    const [modalVisible, setModalVisible] = useState(false);
    const [showEmotion, setShowEmotion] = useState(false); // 감정 이름 표시 상태
    const [showSuccess, setShowSuccess] = useState(false); // 성공 메시지 표시 상태
    const [flashVisible, setFlashVisible] = useState(false); // 하얗게 반짝이는 효과 상태
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const flashRef = useRef(null);
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

        context.save();
        context.scale(-1, 1); // 좌우 반전
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        context.restore();

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

            // 분석 결과에서 감정 이름과 확률 추출
            const { class_name, probability } = result.predictions[0];
            setEmotionName(class_name);
            setEmotionProbability((probability * 100).toFixed(10)); // 소수점 첫째 자리까지 표시

            // 감정 이름을 애니메이션으로 표시
            setShowEmotion(true);
            setModalVisible(true);

            // 2초 후 확률 게이지 애니메이션 시작
            setTimeout(() => {
                animateProbability(0, parseFloat((probability * 100).toFixed(10)));
            }, 2000);

        } catch (error) {
            console.error('Error sending image to server: ', error);
        }
    };

    const animateProbability = (start, end) => {
        let current = start;
        const increment = (end - start) / 50; // 50번에 걸쳐 천천히 증가
        const interval = setInterval(() => {
            current += increment;
            if (current >= end) {
                current = end;
                clearInterval(interval);

                // 감정이 "HAPPY"이고 확률이 90% 이상일 때 "성공" 표시
                if (emotionName === "HAPPY" && current >= 0.5) {
                    setShowSuccess(true);
                }
            }
            setDisplayedProbability(current.toFixed(10)); // 소수점 첫째 자리까지 표시
        }, 20); // 20ms마다 업데이트 (약 1초 동안 증가)
    };

    const startCountdown = () => {
        setOverlayVisible(true);
        setFlashVisible(false);
        let countdown = 3;

        countdownTimer = setInterval(() => {
            if (countdown > 0 && overlayRef.current) {
                overlayRef.current.textContent = countdown;
                countdown--;
            } else if (countdown === 0) {
                overlayRef.current.textContent = 'Smile!';
                setFlashVisible(true);
                setTimeout(() => {
                    setFlashVisible(false);
                    clearInterval(countdownTimer);
                    setOverlayVisible(false);
                    takePicture();
                }, 500); // 하얗게 반짝이는 효과가 끝나면 사진 촬영
            }
        }, 1000);
    };

    const takePicture = () => {
        const imageData = captureImage();
        sendImageToServer(imageData);
    };

    const closeModal = () => {
        setModalVisible(false);
        setCapturedImage('');
        setShowEmotion(false); // 감정 이름 초기화
        setDisplayedProbability(0); // 확률 초기화
        setShowSuccess(false); // 성공 메시지 초기화
        startVideo();
    };

    return (
        <div id={styles.wrap}>
            <div id={styles.header}>
                <img src="smileage/src/images/logo.png" alt="Logo" /><br />
                <h1>얼굴 근육에 smileage를 쌓아라!</h1>
            </div>
            <div>
                <video id={styles.video} ref={videoRef} autoPlay playsInline></video>
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                {overlayVisible && <div ref={overlayRef} id={styles.overlay}></div>}
                {flashVisible && <div className={styles.flash}></div>}
            </div>
            <div id={styles.btnArea}>
                <button type="button" id={styles.startBtn} onClick={startCountdown}>Smile</button>
            </div>

            {/* 사용자 정의 모달 */}
            {modalVisible && (
                <div id={styles.modalContent}>
                    <h2>결과</h2>
                    <img id={styles.modalImage} src={capturedImage} alt="Captured Image" />
                    
                    <p className={styles.emotion}>당신의 감정은?</p>

                    {/* 감정 이름이 짠하고 등장하는 애니메이션 */}
                    {showEmotion && <p className={styles.emotionName}>{emotionName}</p>}
                    
                    {/* 원형 게이지 */}
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
                        <div className={styles.percentage}>{displayedProbability}%</div>
                    </div>

                    {/* 성공 메시지 */}
                    {showSuccess && <p className={styles.successMessage}>스마일리지 획득!</p>}
                    
                    <button id={styles.closeModal} onClick={closeModal}>닫기</button>
                </div>
            )}
        </div>
    );
};

export default App;
