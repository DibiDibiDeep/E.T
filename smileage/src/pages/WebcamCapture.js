import React, { useState, useRef, useCallback } from 'react';
import { uploadImage } from 'services/api';
import useWebcam from 'hooks/useWebcam';
import Modal from 'components/common/Modal';
import styles from 'styles/webcam.css';
import { Button } from '@mui/material';

const WebcamCapture = () => {
  const [countdown, setCountdown] = useState(null);
  const [btnText, setBtnText] = useState('테스트 시작하기');
  const [result, setResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [modalTitle, setModalTitle] = useState('결과');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useWebcam(videoRef);

  const startCountdown = useCallback(() => {
    if (countdown !== null) return;

    let count = 3;
    setCountdown(count);
    const intervalId = setInterval(() => {
      count -= 1;
      setCountdown(count > 0 ? count : null);
      
      if (count === 0) {
        clearInterval(intervalId);
        setBtnText('찰칵');
        captureImage();
      }
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [countdown]);

  const captureImage = useCallback(async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imgData = canvas.toDataURL('image/jpeg');
      setCapturedImage(imgData);

      try {
        const response = await uploadImage(imgData);
        const results = response.data["results"];
        setResult(results);
        
        if (results && results.length > 0) {
          setModalTitle(results[0][0].toUpperCase());
        }

        setIsModalOpen(true);
        setBtnText("테스트 시작하기");
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('이미지 업로드에 실패했습니다.');
      }
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setResult(null);
    setCapturedImage(null);
    setModalTitle('결과');
  }, []);

  return (
    <section className="webcam-container">
      <video ref={videoRef} id="webcam" autoPlay playsInline />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <Button
        className="start-button"
        onClick={startCountdown}
        disabled={countdown !== null}
        variant='outlined'
      >
        {countdown !== null ? countdown : btnText}
      </Button>
      
      <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
        {capturedImage && (
          <div>
            <img src={capturedImage} alt="Captured" className="captured-image" />
          </div>
        )}
        <b>상세 결과</b>
        {result && (
          <ul>
            {result.map(([emotion, probability], index) => (
              <li key={index}>
                {emotion}: {Math.round(probability)}%
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </section>
  );
};

export default WebcamCapture;
