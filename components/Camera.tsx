import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Button, VStack, AspectRatio, Text, Select, Slider, SliderTrack, SliderFilledTrack, SliderThumb } from '@chakra-ui/react';
import { analyzeImageWithGemini } from '../utils/imageAnalysis';
import { speakText, stopSpeaking, setSpeechRate, setSpeechVolume } from '../utils/speechSynthesis';
import { provideNavigation } from '../utils/navigation';
import { initializeSpeechRecognition, addVoiceCommand } from '../utils/speechRecognition';
import { UserSettings, saveUserSettings, loadUserSettings } from '../utils/userSettings';

const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [previousAnalysis, setPreviousAnalysis] = useState<string | null>(null);
  const [isFirstAnalysis, setIsFirstAnalysis] = useState(true);
  const [settings, setSettings] = useState<UserSettings>(loadUserSettings());

  useEffect(() => {
    setSettings(loadUserSettings());
    initializeSpeechRecognition();
    addVoiceCommand('開始', startAnalysis);
    addVoiceCommand('停止', stopAnalysis);
    addVoiceCommand('ナビゲーション', () => provideNavigation(analysisResult || ''));
  }, []);

  useEffect(() => {
    setSpeechRate(settings.speechRate);
    setSpeechVolume(settings.speechVolume);
    saveUserSettings(settings);
  }, [settings]);

  const handleSettingsChange = (key: keyof UserSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

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

  const captureAndAnalyzeImage = useCallback(async () => {
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
  }, [isFirstAnalysis, previousAnalysis]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isAnalyzing) {
      intervalId = setInterval(() => {
        captureAndAnalyzeImage();
      }, settings.captureInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAnalyzing, settings.captureInterval, captureAndAnalyzeImage]);


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
      {analysisResult && (
        <Box mt={4}>
          <Text fontWeight="bold">Analysis Result:</Text>
          <Text>{analysisResult}</Text>
        </Box>
      )}
      <Text>Capture Interval</Text>
      <Select
        value={settings.captureInterval}
        onChange={(e) => handleSettingsChange('captureInterval', Number(e.target.value))}
      >
        <option value={3000}>Every 3 seconds</option>
        <option value={5000}>Every 5 seconds</option>
        <option value={10000}>Every 10 seconds</option>
      </Select>
      <Text>Speech Rate</Text>
      <Slider
        min={0.5}
        max={2}
        step={0.1}
        value={settings.speechRate}
        onChange={(v) => handleSettingsChange('speechRate', v)}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
      <Text>Speech Volume</Text>
      <Slider
        min={0}
        max={1}
        step={0.1}
        value={settings.speechVolume}
        onChange={(v) => handleSettingsChange('speechVolume', v)}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
      <Button onClick={() => provideNavigation(analysisResult || '')}>Provide Navigation</Button>
    </VStack>
  );
};

export default Camera;