import React, { useRef, useEffect, useState } from 'react';
import { Box, Button, VStack, AspectRatio, Text } from '@chakra-ui/react';
import VisionResult from './VisionResult';

const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [visionResult, setVisionResult] = useState<any | null>(null);

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
        setVisionResult(data);
      } catch (error) {
        console.error("Error calling Vision API:", error);
        setVisionResult(null);
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
      <Text fontSize="xl" fontWeight="bold">Camera</Text>
      <AspectRatio maxW="100%" ratio={16/9}>
        {stream ? (
          <video ref={videoRef} autoPlay playsInline />
        ) : (
          <Box bg="gray.200" display="flex" alignItems="center" justifyContent="center">
            <Text>Camera is off</Text>
          </Box>
        )}
      </AspectRatio>
      <Box>
        {!stream ? (
          <Button onClick={startCamera} colorScheme="green">Start Camera</Button>
        ) : (
          <>
            <Button onClick={stopCamera} colorScheme="red" mr={2}>Stop Camera</Button>
            <Button onClick={captureImage} colorScheme="blue">Capture Image</Button>
          </>
        )}
      </Box>
      <VisionResult result={visionResult} />
    </VStack>
  );
};

export default Camera;