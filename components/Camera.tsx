import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Button, VStack, HStack, Container, Center, AspectRatio, Text, Select, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Spinner, Alert, AlertIcon, VisuallyHidden, Radio, RadioGroup } from '@chakra-ui/react';
import { analyzeImageWithGemini } from '../utils/imageAnalysis';
import { speakText, stopSpeaking, setSpeechRate, setSpeechVolume } from '../utils/speechSynthesis';
import { provideNavigation, provideDetailedNavigation, updateCurrentPosition } from '../utils/navigation';
import { initializeSpeechRecognition, addVoiceCommand } from '../utils/speechRecognition';
import { UserSettings, saveUserSettings, loadUserSettings } from '../utils/userSettings';
import { resizeAndCompressImage } from '../utils/imageProcessing';
import { debounce } from '../utils/apiHelper';
import { useTranslation } from 'next-i18next'

type AnalysisMode = 'normal' | 'person' | 'text';

const Camera: React.FC = () => {
  const { t } = useTranslation('common')
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [previousAnalysis, setPreviousAnalysis] = useState<string | null>(null);
  const [isFirstAnalysis, setIsFirstAnalysis] = useState(true);
  const [settings, setSettings] = useState<UserSettings>(loadUserSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navigationInfo, setNavigationInfo] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('normal');

  const handleNavigation = useCallback(() => {
    if (analysisResult) {
      const navigation = provideDetailedNavigation(analysisResult);
      setNavigationInfo(navigation);
    }
  }, [analysisResult]);

  useEffect(() => {
    // 実際の実装ではGeolocation APIを使用
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        updateCurrentPosition(position.coords.latitude, position.coords.longitude);
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);
  
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

  const debouncedAnalyzeImage = useCallback(
  debounce(async (imageDataUrl: string, mode: AnalysisMode) => {
    try {
      const result = await analyzeImageWithGemini(imageDataUrl, mode, isFirstAnalysis ? null : previousAnalysis);
      setAnalysisResult(result);
      if (isFirstAnalysis || (result !== "変更なし" && result !== "")) {
        speakText(result);
        provideDetailedNavigation(result);
      }
      
      setPreviousAnalysis(result);
      setIsFirstAnalysis(false);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setError("画像分析中にエラーが発生しました");
      speakText("画像分析中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, 300),
  [isFirstAnalysis, previousAnalysis]
);

const handleModeChange = (newMode: AnalysisMode) => {
    setAnalysisMode(newMode);
    // モード変更時に必要な処理があれば追加
  };

const captureAndAnalyzeImage = useCallback(async () => {
  if (videoRef.current) {
    setIsLoading(true);
    setError(null);
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    
    try {
      const compressedImageDataUrl = await resizeAndCompressImage(imageDataUrl);
      await debouncedAnalyzeImage(compressedImageDataUrl, analysisMode);
       
    } catch (error) {
      console.error("Error capturing or analyzing image:", error);
      setError("画像のキャプチャまたは分析中にエラーが発生しました");
      setIsLoading(false);
    }
  }
}, [debouncedAnalyzeImage, analysisMode]);

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
     <Container maxW="container.xl" centerContent p={4}>
      <VStack spacing={4} align="stretch" width="100%">
        <Text mt={4} fontWeight="bold" textAlign="center">{t('currentMode')}: {
          analysisMode === 'normal' ? '通常' :
          analysisMode === 'person' ? '人物認識' :
          '文字認識'
        }</Text>
        
        <AspectRatio maxW="100%" ratio={16/9}>
          <video ref={videoRef} autoPlay playsInline aria-label="カメラビュー" />
        </AspectRatio>
        
        <RadioGroup onChange={(value) => handleModeChange(value as AnalysisMode)} value={analysisMode}>
          <HStack justify="center" spacing={4}>
            <Radio value="normal">{t('defaultMode')}</Radio>
            <Radio value="person">{t('personMode')}</Radio>
            <Radio value="text">{t('textMode')}</Radio>
          </HStack>
        </RadioGroup>
        
        <HStack justify="center" wrap="wrap" spacing={2}>
          <Button onClick={startCamera} isDisabled={!!stream || isLoading} aria-label="カメラ開始">
            {t('startCamera')}
          </Button>
          <Button onClick={stopCamera} isDisabled={!stream || isLoading} aria-label="カメラ停止">
            {t('stopCamera')}
          </Button>
          <Button onClick={startAnalysis} isDisabled={!stream || isAnalyzing || isLoading} aria-label="分析開始">
            {t('startAnalysis')}
          </Button>
          <Button onClick={stopAnalysis} isDisabled={!isAnalyzing || isLoading} aria-label="分析停止">
            {t('stopAnalysis')}
          </Button>
          <Button onClick={stopSpeaking} colorScheme="red" isDisabled={isLoading} aria-label="読み上げ停止">
            {t('stopSpeaking')}
          </Button>
        </HStack>
        
        {isLoading && (
          <Center aria-live="polite" aria-busy="true">
            <Spinner />
            <VisuallyHidden>{t('loading')}</VisuallyHidden>
          </Center>
        )}
        
        {error && (
          <Alert status="error" aria-live="assertive">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        {analysisResult && (
          <Box mt={4} p={4} borderWidth={1} borderRadius="md" aria-live="polite">
            <Text fontWeight="bold">{t('AnalysisResult')}:</Text>
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
        
        <Button onClick={handleNavigation} isDisabled={!analysisResult || isLoading}>
          {t('navigationInfo')}
        </Button>
        
        {navigationInfo && (
          <Box mt={4} p={4} borderWidth={1} borderRadius="md">
            <Text fontWeight="bold">{t('navigationInfo')}:</Text>
            <Text>{navigationInfo}</Text>
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default Camera;