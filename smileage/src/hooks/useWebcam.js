import { useEffect } from 'react';

const useWebcam = (videoRef) => {
  useEffect(() => {
    const video = videoRef.current;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
      })
      .catch(error => {
        console.error("Error accessing webcam: ", error);
      });
  }, [videoRef]);
};

export default useWebcam;
