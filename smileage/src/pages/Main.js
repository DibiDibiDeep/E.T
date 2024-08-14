import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import styles from './Main.module.css';

function Main() {
    const videoRef = useRef(null);
    const [predictions, setPredictions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState('');

    // 사용자 웹캠에 접근
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
    }, [videoRef]);

        // 캡처한 이미지를 서버로 전송
        const captureImage = () => {
            const canvas = document.createElement('canvas');
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                const file = new File([blob], 'capture.png', { type: 'image/png' });
                sendToServer(file); // 서버로 전송
            }, 'image/png');
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
                setPredictions(response.data.predictions);
            } catch (error) {
                console.error('Error sending image to server:', error);
            }
        };

    const handleClose = () => setShowModal(false);

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
                            <div className={styles.camBox}>
                                <video className='container' ref={videoRef}></video>
                            </div>
                            <button onClick={captureImage}>Capture and Predict</button>
                            {/* Modal for showing predictions */}
                            <Modal show={showModal} onHide={handleClose}>
                                <Modal.Header closeButton>
                                    <Modal.Title>Emotion Detection Result</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <p>{message}</p>
                                    {predictions.length > 0 && (
                                        <ul>
                                            {predictions.map((prediction, index) => (
                                                <li key={index}>
                                                    {prediction.class}: {prediction.probability}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button variant="secondary" onClick={handleClose}>
                                        Close
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
