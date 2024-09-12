import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { speakText } from '../utils/speechSynthesis';
import { handleCommand, initializeSpeechRecognition, startSpeechRecognition, stopSpeechRecognition } from '../utils/speechRecognition';
import { Button, Text, VStack, Icon, useColorModeValue } from '@chakra-ui/react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

interface VoiceCommandsProps {
  onStartCamera: () => Promise<void>;
  onStopCamera: () => void;
  onToggleAnalysis: () => void;
  onCaptureImage: () => Promise<void>;
  onToggleMode: () => void;
  onStopSpeaking: () => void;
  onStartNavigation: (destination: string) => Promise<void>;
}

const VoiceCommands: React.FC<VoiceCommandsProps> = (props) => {
  const { t } = useTranslation('common');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const buttonBg = useColorModeValue('blue.500', 'blue.200');
  const buttonColor = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    initializeSpeechRecognition({
      onTranscript: (text: string) => setTranscript(text),
      onError: (err: string) => setError(err),
      onListeningChange: (listening: boolean) => setIsListening(listening),
      startCamera: props.onStartCamera,
      stopCamera: props.onStopCamera,
      toggleAnalysis: props.onToggleAnalysis,
      captureImage: props.onCaptureImage,
      toggleMode: props.onToggleMode,
      stopSpeaking: props.onStopSpeaking,
      startNavigation: props.onStartNavigation,
    });
  }, [props]);

  const toggleListening = () => {
    if (isListening) {
      stopSpeechRecognition();
      setIsListening(false);
    } else {
      startSpeechRecognition();
      setIsListening(true);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Button
        onClick={toggleListening}
        size="lg"
        leftIcon={<Icon as={isListening ? FaMicrophoneSlash : FaMicrophone} />}
        bg={buttonBg}
        color={buttonColor}
        _hover={{ opacity: 0.8 }}
        _active={{ opacity: 0.6 }}
        borderRadius="full"
        boxShadow="lg"
        transition="all 0.2s"
      >
        {isListening ? t('stopListening') : t('startListening')}
      </Button>
      {transcript && (
        <Text fontSize="md" fontWeight="medium" textAlign="center">
          {t('lastCommand')}: {transcript}
        </Text>
      )}
      {error && (
        <Text color="red.500" fontSize="sm" textAlign="center">
          {error}
        </Text>
      )}
    </VStack>
  );
};

export default VoiceCommands;