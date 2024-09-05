import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Text, Button, VStack } from '@chakra-ui/react';
import { analyzeImageWithAI } from '../utils/imageAnalysis';
import { debounce } from '../utils/apiHelper';

const RealtimeProcessing: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFrame = useCallback(debounce(async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context?.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      try {
        const result = await analyzeImageWithAI(imageData, 'normal', null);
        setAnalysisResult(result);
      } catch (error) {
        console.error('Error analyzing image:', error);
        setError('画像分析中にエラーが発生しました');
      }
    }
  }, 1000), []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let intervalId: NodeJS.Timeout;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setError('カメラへのアクセスに失敗しました');
      }
    };

    const startProcessing = () => {
      setIsProcessing(true);
      intervalId = setInterval(processFrame, 1000);
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [processFrame]);

  const toggleProcessing = () => {
    setIsProcessing(prev => !prev);
    if (!isProcessing) {
      processFrame();
    }
  };

return (
    <VStack spacing={4}>
      <Box position="relative" width="640px" height="480px">
        <video ref={videoRef} style={{ position: 'absolute', top: 0, left: 0 }} autoPlay playsInline />
        <canvas ref={canvasRef} width={640} height={480} style={{ position: 'absolute', top: 0, left: 0 }} />
      </Box>
      <Button onClick={toggleProcessing}>
        {isProcessing ? '処理を停止' : '処理を開始'}
      </Button>
      {error && <Text color="red.500">{error}</Text>}
      <Text>分析結果: {analysisResult}</Text>
    </VStack>
  );
};

export default RealtimeProcessing;