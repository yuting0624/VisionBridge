import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Button, VStack, HStack, Container, Center, Text, Spinner, Alert, AlertIcon, VisuallyHidden, useColorMode, Icon } from '@chakra-ui/react';
import { FaImage, FaVideo, FaCamera, FaPlay, FaStop } from 'react-icons/fa';
import { analyzeImageWithAI } from '../utils/imageAnalysis';
import { speakText, stopSpeaking } from '../utils/speechSynthesis';
import { useTranslation } from 'next-i18next'
import Navigation from './Navigation';
import { initializeSpeechRecognition, startNavigation} from '../utils/speechRecognition';
import VoiceCommands from './VoiceCommands';

const Camera: React.FC = () => {
  const { t } = useTranslation('common')
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [navigationDirections, setNavigationDirections] = useState<string | null>(null);

  const toggleCamera = async () => {
    if (stream) {
      stopEverything();
      speakText(t('cameraStopped'));
    } else {
      await startCamera();
      speakText(t('cameraStarted'));
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error("カメラへのアクセスエラー:", error);
      setErrorWithVoice(t('cameraAccessError'));
    }
  };

  const stopEverything = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsAnalyzing(false);
    setIsVideoMode(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleAnalysis = () => {
    if (isAnalyzing) {
      setIsAnalyzing(false);
      if (isVideoMode) {
        stopVideoRecording();
      }
      speakText(t('analysisStopped'));
    } else {
      setIsAnalyzing(true);
      if (isVideoMode) {
        startVideoRecording();
      }
      speakText(t('analysisStarted'));
    }
  };

  const startVideoRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      mediaRecorderRef.current = new MediaRecorder(videoRef.current.srcObject as MediaStream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        analyzeVideo(blob);
        chunksRef.current = [];
      };
      mediaRecorderRef.current.start();
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const analyzeVideo = async (videoBlob: Blob) => {
    try {
      setIsLoading(true); 
      const response = await analyzeImageWithAI(videoBlob, 'video', null);
      console.log("Video analysis result:", response);
      setAnalysisResult(response); 
      speakText(response); 
    } catch (error) {
      console.error("Error analyzing video:", error);
      setErrorWithVoice(t('videoAnalysisError'));
    } finally {
      setIsLoading(false); 
    }
  };

  const captureAndAnalyzeImage = useCallback(async () => {
    if (videoRef.current && canvasRef.current) {
      setIsLoading(true);
      setError(null);
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
        
        try {
          const result = await analyzeImageWithAI(imageDataUrl, 'normal', null);
          setAnalysisResult(result);
          speakText(result);
        } catch (error) {
          console.error("Error analyzing image:", error);
          setErrorWithVoice(t('imageAnalysisError'));
        } finally {
          setIsLoading(false);
        }
      }
    }
  }, [t]);

  const captureImage = useCallback(async () => {
    if (videoRef.current && canvasRef.current) {
      setIsLoading(true);
      setError(null);
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(imageDataUrl);
        speakText(t('imageCaptured'));
        
        try {
          const result = await analyzeImageWithAI(imageDataUrl, 'detailed', null);
          setAnalysisResult(result);
          speakText(result);
        } catch (error) {
          console.error("Error analyzing image:", error);
          setErrorWithVoice(t('imageAnalysisError'));
        } finally {
          setIsLoading(false);
        }
      }
    }
  }, [t]);

  const handleStartNavigation = useCallback(async (destination: string) => {
    const directions = await startNavigation(destination);
    setNavigationDirections(directions);
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isAnalyzing && !isVideoMode) {
      intervalId = setInterval(() => {
        captureAndAnalyzeImage();
      }, 7000); 
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAnalyzing, isVideoMode, captureAndAnalyzeImage]);

  const toggleMode = () => {
    setIsVideoMode(!isVideoMode);
    setIsAnalyzing(false);
  };

  const { colorMode } = useColorMode();

  const setErrorWithVoice = (errorMessage: string) => {
    setError(errorMessage);
    speakText(errorMessage);
  };

  useEffect(() => {
    initializeSpeechRecognition({
      startCamera: startCamera,
      stopCamera: stopEverything,
      toggleAnalysis: toggleAnalysis,
      captureImage: captureImage,
      toggleMode: toggleMode,
      stopSpeaking: stopSpeaking,
      startNavigation: handleStartNavigation,
      onTranscript: (transcript) => console.log('Transcript:', transcript),
      onError: (error) => console.error('Speech recognition error:', error),
      onListeningChange: (isListening) => console.log('Listening:', isListening),
    });
  }, []);

  return (
    <Container maxW="container.xl" centerContent p={4}>
      <VStack spacing={6} align="stretch" width="100%">
        <Text mt={4} fontWeight="bold" textAlign="center">
          {t('currentMode')}: {isVideoMode ? t('videoAnalysisMode') : t('imageAnalysisMode')}
        </Text>
        
        {/* カメラビュー */}
        <Box position="relative" width="100%" paddingTop="56.25%">
          <video
            ref={videoRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            autoPlay
            playsInline
            aria-label={t('cameraView')}
          />
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
          <Box position="absolute" top={2} left={2} bg={colorMode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'} p={2} borderRadius="md">
            <Icon as={isVideoMode ? FaVideo : FaImage} color={colorMode === 'dark' ? 'white' : 'black'} />
          </Box>
          {(isAnalyzing || isLoading) && (
            <Box position="absolute" top={2} right={2} bg={colorMode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'} p={2} borderRadius="md">
              <Spinner size="sm" color={colorMode === 'dark' ? 'white' : 'black'} />
            </Box>
          )}
        </Box>
        
        {/* 音声コマンド */}
        <VoiceCommands
          onStartNavigation={handleStartNavigation}
          onStartCamera={startCamera}
          onStopCamera={stopEverything}
          onToggleAnalysis={toggleAnalysis}
          onCaptureImage={captureImage}
          onToggleMode={toggleMode}
          onStopSpeaking={stopSpeaking}
        />
        
        {/* カメラコントロール */}
        <HStack justify="center" wrap="wrap" spacing={4}>
          <Button 
            onClick={toggleCamera} 
            colorScheme={stream ? "red" : "green"}
            leftIcon={<Icon as={stream ? FaStop : FaPlay} />}
            aria-label={stream ? t('stopCamera') : t('startCamera')}
          >
            {stream ? t('stopCamera') : t('startCamera')}
          </Button>
          <Button 
            onClick={toggleAnalysis} 
            isDisabled={!stream} 
            colorScheme={isAnalyzing ? "red" : "green"}
            leftIcon={<Icon as={isAnalyzing ? FaStop : FaPlay} />}
            aria-label={isAnalyzing ? t('stopAnalysis') : t('startAnalysis')}
          >
            {isAnalyzing ? t('stopAnalysis') : t('startAnalysis')}
          </Button>
          <Button 
            onClick={toggleMode} 
            isDisabled={!stream || isAnalyzing}
            leftIcon={<Icon as={isVideoMode ? FaImage : FaVideo} />}
            aria-label={isVideoMode ? t('switchToImageMode') : t('switchToVideoMode')}
          >
            {isVideoMode ? t('switchToImageMode') : t('switchToVideoMode')}
          </Button>
          <Button
            onClick={captureImage}
            isDisabled={!stream || isLoading}
            colorScheme="blue"
            leftIcon={<Icon as={FaCamera} />}
            aria-label={t('captureImage')}
          >
            {t('captureImage')}
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
            <Text fontWeight="bold">{t('analysisResult')}:</Text>
            <Text>{analysisResult}</Text>
          </Box>
        )}
        
        <Navigation directions={navigationDirections} />
      </VStack>
    </Container>
  );
};

export default Camera;