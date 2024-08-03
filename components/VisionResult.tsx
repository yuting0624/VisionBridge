import React, { useEffect, useRef } from 'react';
import { Box, Text, List, ListItem, Button } from '@chakra-ui/react';

interface VisionResultProps {
  result: {
    labels?: Array<{ description: string; score: number }>;
  } | null;
}

const VisionResult: React.FC<VisionResultProps> = ({ result }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakResults = async () => {
    if (!result || !result.labels || result.labels.length === 0) return;

    const text = `Vision API Results: ${result.labels.map(label => 
      `${label.description} with confidence ${(label.score * 100).toFixed(2)}%`
    ).join('. ')}`;

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('Failed to synthesize speech');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  if (!result || !result.labels || result.labels.length === 0) {
    return (
      <Box mt={4}>
        <Text fontSize="xl" fontWeight="bold" mb={2}>No results available</Text>
      </Box>
    );
  }

  return (
    <Box mt={4}>
      <Text fontSize="xl" fontWeight="bold" mb={2}>Vision API Results:</Text>
      <List spacing={2}>
        {result.labels.map((label, index) => (
          <ListItem key={index}>
            {label.description} - Confidence: {(label.score * 100).toFixed(2)}%
          </ListItem>
        ))}
      </List>
      <Button onClick={speakResults} mt={4}>Speak Results</Button>
      <audio ref={audioRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default VisionResult;