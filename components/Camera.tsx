import React, { useRef, useEffect, useState } from 'react';
import { Box, Button, VStack, AspectRatio, Text, Select } from '@chakra-ui/react';
import { analyzeImageWithGemini } from '../utils/imageAnalysis';
import { speakText } from '../utils/speechSynthesis';
import { stopSpeaking } from '../utils/speechSynthesis';

const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [previousAnalysis, setPreviousAnalysis] = useState<string | null>(null);
  const [captureInterval, setCaptureInterval] = useState<number>(5000);

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
      setIsAnalyzing(false);
    }
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isAnalyzing) {
      intervalId = setInterval(() => {
        captureAndAnalyzeImage();
      }, captureInterval); // 1秒ごとに分析
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAnalyzing, captureInterval]);

   const handleIntervalChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCaptureInterval(Number(event.target.value));
  };

 const captureAndAnalyzeImage = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      
      try {
        const result = await analyzeImageWithGemini(imageDataUrl, previousAnalysis);
        setAnalysisResult(result);
        if (result !== "変更なし") {
          speakText(result);
        }
        setPreviousAnalysis(result);
      } catch (error) {
        console.error("Error analyzing image:", error);
        setAnalysisResult("画像分析中にエラーが発生しました");
        speakText("画像分析中にエラーが発生しました");
      }
    }
  };

  const calculateDiff = (prev: string | null, current: string): string => {
    if (!prev) return current;
    // 簡単な差分計算の例（実際にはより洗練された方法を使用することをお勧めします）
    const prevWords = new Set(prev.split(' '));
    const currentWords = current.split(' ');
    const newWords = currentWords.filter(word => !prevWords.has(word));
    return newWords.length > 0 ? newWords.join(' ') : "No significant changes detected.";
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
    </VStack>
  );
};

export default Camera;