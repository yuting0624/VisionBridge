import React, { useRef, useEffect, useState } from 'react';
import { Box, Button, VStack, AspectRatio, Text, Select } from '@chakra-ui/react';
import { analyzeImageWithGemini } from '../utils/imageAnalysis';
import { speakText, stopSpeaking } from '../utils/speechSynthesis';

const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [previousAnalysis, setPreviousAnalysis] = useState<string | null>(null);
  const [captureInterval, setCaptureInterval] = useState<number>(5000);
  const [isFirstAnalysis, setIsFirstAnalysis] = useState(true);

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
    stopAnalysis();
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setIsFirstAnalysis(true);
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    setPreviousAnalysis(null);
    setIsFirstAnalysis(true);
  };

  const captureAndAnalyzeImage = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      
      try {
        const result = await analyzeImageWithGemini(imageDataUrl, isFirstAnalysis ? null : previousAnalysis);
        setAnalysisResult(result);
        
        if (isFirstAnalysis || (result !== "変更なし" && result !== "")) {
          speakText(result);
        }
        
        setPreviousAnalysis(result);
        setIsFirstAnalysis(false);
      } catch (error) {
        console.error("Error analyzing image:", error);
        setAnalysisResult("画像分析中にエラーが発生しました");
        speakText("画像分析中にエラーが発生しました");
      }
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isAnalyzing) {
      intervalId = setInterval(() => {
        captureAndAnalyzeImage();
      }, captureInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAnalyzing, captureInterval]);

  const handleIntervalChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCaptureInterval(Number(event.target.value));
  };

  return (
    <VStack spacing={4} align="stretch">
      <AspectRatio maxW="100%" ratio={16/9}>
        <video ref={videoRef} autoPlay playsInline />
      </AspectRatio>
      <Box>
        <Button onClick={startCamera} mr={2} isDisabled={!!stream}>Start Camera</Button>
        <Button onClick={stopCamera} mr={2} isDisabled={!stream}>Stop Camera</Button>
        <Button onClick={startAnalysis} mr={2} isDisabled={!stream || isAnalyzing}>Start Analysis</Button>
        <Button onClick={stopAnalysis} isDisabled={!isAnalyzing}>Stop Analysis</Button>
        <Button onClick={stopSpeaking} colorScheme="red">Stop Speaking</Button>
      </Box>
      <Select onChange={handleIntervalChange} value={captureInterval}>
        <option value={3000}>Every 3 seconds</option>
        <option value={5000}>Every 5 seconds</option>
        <option value={10000}>Every 10 seconds</option>
      </Select>
      {analysisResult && (
        <Box mt={4}>
          <Text fontWeight="bold">Analysis Result:</Text>
          <Text>{analysisResult}</Text>
        </Box>
      )}
    </VStack>
  );
};

export default Camera;