import React, { useRef, useEffect, useState } from 'react';
import { Box, Button } from '@chakra-ui/react';

const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = async () => {
  if (videoRef.current) {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    
    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageDataUrl }),
      });
      const data = await response.json();
      console.log("Vision API response:", data);
      // ここで結果を処理したり、状態を更新したりします
    } catch (error) {
      console.error("Error calling Vision API:", error);
    }
  }
};

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Box>
      <video ref={videoRef} autoPlay playsInline />
      <Button onClick={startCamera} m={2}>Start Camera</Button>
      <Button onClick={stopCamera} m={2}>Stop Camera</Button>
      <Button onClick={captureImage} m={2}>Capture Image</Button>
    </Box>
  );
};

export default Camera;