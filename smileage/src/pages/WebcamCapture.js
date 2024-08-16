import React, { useState, useRef } from 'react';
import { uploadImage } from 'services/api';
import useWebcam from 'hooks/useWebcam';
import Modal from 'components/common/Modal';
import styles from 'styles/webcam.css';

const WebcamCapture = () => {
  const [countdown, setCountdown] = useState(null);
  const [btnText, setBtnText] = useState('테스트 시작하기');
  const [result, setResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useWebcam(videoRef);

  const startCountdown = () => {
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
  };

  const captureImage = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imgData = canvas.toDataURL('image/jpeg');

      try {
        const response = await uploadImage(imgData);
        setResult(response.data["results"]);
        setIsModalOpen(true); // Open modal with result
        setBtnText("테스트 시작하기");
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('이미지 업로드에 실패했습니다.');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setResult(null);
  };

  return (
    <section className="webcam-container">
      <video ref={videoRef} id="webcam" autoPlay playsInline />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button
        className="start-button"
        onClick={startCountdown}
        disabled={countdown !== null}
      >
        {countdown !== null ? countdown : btnText}
      </button>
      
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <h2>결과</h2>
        {result && (
          <ul>
            {result.map(([emotion, probability], index) => (
              <li key={index}>
                {emotion}: {probability}%
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </section>
  );
};

export default WebcamCapture;
