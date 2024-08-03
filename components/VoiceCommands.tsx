import React, { useState, useEffect } from 'react';
import { Box, Text, Button } from '@chakra-ui/react';

const VoiceCommands: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    let recognition: any = null;

    if ('webkitSpeechRecognition' in window) {
      recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');

        setTranscript(transcript);
        handleCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
      };
    }

    return () => {
      if (recognition) recognition.stop();
    };
  }, []);

  const handleCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes('capture image')) {
      // Trigger image capture
    } else if (lowerCommand.includes('start navigation')) {
      // Start navigation
    }
    // Add more commands as needed
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      (window as any).webkitSpeechRecognition().start();
    } else {
      (window as any).webkitSpeechRecognition().stop();
    }
  };

  return (
    <Box>
      <Text fontSize="xl" fontWeight="bold">Voice Commands</Text>
      <Button onClick={toggleListening}>
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </Button>
      <Text mt={2}>Transcript: {transcript}</Text>
    </Box>
  );
};

export default VoiceCommands;