import React, { useState, useRef, useEffect } from 'react';
import styles from './Main.module.css';

const App = () => {
    const [overlayVisible, setOverlayVisible] = useState(false);
    const [capturedImage, setCapturedImage] = useState('');
    const [analysisResult, setAnalysisResult] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
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
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
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
            if (countdown > 0) {
                document.getElementById('overlay').textContent = countdown;
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

    const closeModal = () => {
        setModalVisible(false);
        setCapturedImage('');
        startVideo();
    };

    return (
        <div id={styles.wrap}>
            <div id={styles.header}>
                <img src="/images/logo.png" alt="Logo"/><br/>
                <h1>얼굴 근육에 smilage를 쌓아라!</h1>
            </div>
            <div id="main">
                <video id="video" ref={videoRef} autoPlay playsInline></video>
                <canvas id="canvas" ref={canvasRef} style={{ display: 'none' }}></canvas>
                {overlayVisible && <div id="overlay"></div>}
            </div>
            <div id="btnArea">
                <button type="button" id="startBtn" onClick={startCountdown}>Smile~</button>
            </div>

            {/* Modal for showing analysis results */}
            {modalVisible && (
                <div id="modal">
                <div id="resultArea">
                        {capturedImage && <img id="capturedImage" src={capturedImage} alt="Captured Image" />}
                </div>
                    <div id="modalContent">
                        <span id="closeModal" onClick={closeModal}>&times;</span>
                        <h2>결과창</h2>
                        <pre id="result">{analysisResult}</pre>
                    </div>
                </div>
            )}

        </div>
    );
};

export default App;
