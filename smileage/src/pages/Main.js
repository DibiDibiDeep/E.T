import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function Main() {
    const [count, setCount] = useState(0);
    const [isCounting, setIsCounting] = useState(false);
    const [emotionName, setEmotionName] = useState('');
    const [emotionProbability, setEmotionProbability] = useState(0);
    const [imageURL, setImageURL] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [displayedProbability, setDisplayedProbability] = useState(0);
    const countdownRef = useRef(null);
    const videoRef = useRef(null);

    useEffect(() => {
        const startVideo = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('웹캠 접근 오류:', error);
            }
        };

        startVideo();

        return () => {
            const stream = videoRef.current?.srcObject;
            if (stream) {
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (isCounting && count > 0) {
            const timer = setInterval(() => {
                setCount(prevCount => prevCount - 1);
            }, 1000);

            return () => clearInterval(timer);
        } else if (count === 0 && isCounting) {
            setIsCounting(false);
            captureImage();
        }
    }, [isCounting, count]);

    const startCountdown = () => {
        setCount(3);
        setIsCounting(true);
    };

    const captureImage = () => {
        const video = videoRef.current;
        if (video) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(async (blob) => {
                const url = URL.createObjectURL(blob);
                setImageURL(url);
                await sendImageToServer(blob);
            }, 'image/png');
        }
    };

    const sendImageToServer = async (blob) => {
        try {
            const formData = new FormData();
            formData.append('file', blob, 'captured_image.jpg');

            const response = await fetch('http://localhost:8000/predict', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`서버 응답 오류: ${response.status}. 내용: ${errorText}`);
            }

            const result = await response.json();

            if (result.error) {
                throw new Error(`서버 오류: ${result.error}`);
            }

            if (result.results && result.results.length > 0) {
                const topResult = result.results[0];
                setEmotionName(topResult.class);
                setEmotionProbability(topResult.probability * 100);
                setModalVisible(true);
            } else {
                throw new Error('서버 응답에 유효한 결과가 없습니다.');
            }

        } catch (error) {
            console.error('이미지 전송 중 오류:', error);
            alert(`오류 발생: ${error.message}`);
        }
    };

    const animateProbability = (start, end) => {
        let currentProbability = start;
        const increment = (end - start) / 100;
        const interval = setInterval(() => {
            currentProbability += increment;
            if (currentProbability >= end) {
                currentProbability = end;
                clearInterval(interval);
            }
            setDisplayedProbability(currentProbability.toFixed(2));
        }, 20);
    };

    useEffect(() => {
        if (modalVisible) {
            animateProbability(0, emotionProbability);
        }
    }, [modalVisible, emotionProbability]);

    const closeModal = () => {
        setModalVisible(false);
        setImageURL('');
        setEmotionName('');
        setEmotionProbability(0);
        setDisplayedProbability(0);

    };

    return (
        <div id="wrap">
            <header id="header">
                {/* 헤더 콘텐츠 */}
            </header>
            <main id="main">
                <video ref={videoRef} id="video" autoPlay playsInline></video>
                {isCounting && (
                    <div id="countdown" ref={countdownRef}>
                        {count > 0 ? count : 'GO!'}
                    </div>
                )}
                {modalVisible && (
                    <>
                        <div id="overlay" onClick={closeModal}></div>
                        <div id="emotionModal">
                            <img src={imageURL} alt="Captured" />
                            <div className="emotion-info">
                                <p className="emotion-name">감정: {emotionName}</p>
                                <div className="progressCircle">
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
                                    <div className="percentage">{displayedProbability}%</div>
                                </div>
                            </div>
                            <button onClick={closeModal}>닫기</button>
                        </div>
                    </>
                )}
            </main>
            <br />
            <div id="btnArea">
                <p>시작하시겠습니까?</p>
                <button type="button" id="startBtn" onClick={startCountdown}>
                    시작
                </button>
            </div>
        </div>
    );
}

export default Main;
