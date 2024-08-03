import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Button, VStack, AspectRatio, Text, Select, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Spinner, Alert, AlertIcon, VisuallyHidden } from '@chakra-ui/react';
import { analyzeImageWithGemini } from '../utils/imageAnalysis';
import { speakText, stopSpeaking, setSpeechRate, setSpeechVolume } from '../utils/speechSynthesis';
import { provideNavigation, provideDetailedNavigation, updateCurrentPosition } from '../utils/navigation';
import { initializeSpeechRecognition, addVoiceCommand } from '../utils/speechRecognition';
import { UserSettings, saveUserSettings, loadUserSettings } from '../utils/userSettings';
import { resizeAndCompressImage } from '../utils/imageProcessing';
import { debounce } from '../utils/apiHelper';

const Camera: React.FC = () => {
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
  debounce(async (imageDataUrl: string) => {
    try {
      const result = await analyzeImageWithGemini(imageDataUrl, isFirstAnalysis ? null : previousAnalysis);
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
      await debouncedAnalyzeImage(compressedImageDataUrl);
       
      } catch (error) {
        console.error("Error capturing or analyzing image:", error);
        setError("画像のキャプチャまたは分析中にエラーが発生しました");
        setIsLoading(false);
      }
    }
  }, [debouncedAnalyzeImage]);

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
        <video ref={videoRef} autoPlay playsInline aria-label="カメラビュー" />
      </AspectRatio>
      <Box>
        <Button onClick={startCamera} mr={2} isDisabled={!!stream || isLoading} aria-label="カメラ開始">
          カメラ開始
        </Button>
        <Button onClick={stopCamera} mr={2} isDisabled={!stream || isLoading} aria-label="カメラ停止">
          カメラ停止
        </Button>
        <Button onClick={startAnalysis} mr={2} isDisabled={!stream || isAnalyzing || isLoading} aria-label="分析開始">
          分析開始
        </Button>
        <Button onClick={stopAnalysis} isDisabled={!isAnalyzing || isLoading} aria-label="分析停止">
          分析停止
        </Button>
        <Button onClick={stopSpeaking} colorScheme="red" isDisabled={isLoading} aria-label="読み上げ停止">
          読み上げ停止
        </Button>
      </Box>
      {isLoading && (
        <Box aria-live="polite" aria-busy="true">
          <Spinner />
          <VisuallyHidden>読み込み中</VisuallyHidden>
        </Box>
      )}
      {error && (
        <Alert status="error" aria-live="assertive">
          <AlertIcon />
          {error}
        </Alert>
      )}
      {analysisResult && (
        <Box mt={4} p={4} borderWidth={1} borderRadius="md" aria-live="polite">
          <Text fontWeight="bold">分析結果:</Text>
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
        詳細ナビ
      </Button>
       {navigationInfo && (
        <Box mt={4} p={4} borderWidth={1} borderRadius="md">
          <Text fontWeight="bold">ナビゲーション情報:</Text>
          <Text>{navigationInfo}</Text>
        </Box>
      )}
    </VStack>
  );
};

export default Camera;