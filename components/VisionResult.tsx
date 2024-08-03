import React from 'react';
import { Box, Text, List, ListItem } from '@chakra-ui/react';

interface VisionResultProps {
  result: {
    labels?: Array<{ description: string; score: number }>;
  } | null;
}

const VisionResult: React.FC<VisionResultProps> = ({ result }) => {
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
    </Box>
  );
};

export default VisionResult;