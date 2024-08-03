import React, { useRef, useEffect, useState } from 'react';
import { Box, Button, VStack } from '@chakra-ui/react';
import VisionResult from './VisionResult';

interface VisionResult {
  labels: Array<{ description: string; score: number }>;
}

const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);

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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data || !data.labels) {
        throw new Error('Invalid response from Vision API');
      }
      setVisionResult(data);
    } catch (error) {
      console.error("Error calling Vision API:", error);
      setVisionResult({ labels: [] });
    }
  }
};

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <video ref={videoRef} autoPlay playsInline />
      </Box>
      <Box>
        <Button onClick={startCamera} mr={2}>Start Camera</Button>
        <Button onClick={stopCamera} mr={2}>Stop Camera</Button>
        <Button onClick={captureImage}>Capture Image</Button>
      </Box>
      <VisionResult result={visionResult} />
    </VStack>
  );
};

export default Camera;