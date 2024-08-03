import React, { useState, useEffect } from 'react';
import { Box, Button, Text, VStack } from '@chakra-ui/react';

const Navigation: React.FC = () => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPosition(position);
          fetchNearbyPlaces(position.coords.latitude, position.coords.longitude);
        },
        (error) => setError(error.message)
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  }, []);

  const fetchNearbyPlaces = async (lat: number, lon: number) => {
    // この部分は実際のAPIを使用して近くの場所を取得する必要があります
    // ここではダミーデータを使用しています
    setNearbyPlaces(['Convenience Store', 'Bus Stop', 'Park']);
  };

  const speakPosition = () => {
    if (position && 'speechSynthesis' in window) {
      const text = `Your current position is: latitude ${position.coords.latitude}, longitude ${position.coords.longitude}. Nearby places are: ${nearbyPlaces.join(', ')}`;
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">Navigation</Text>
      {position && (
        <Text>
          Latitude: {position.coords.latitude}, Longitude: {position.coords.longitude}
        </Text>
      )}
      {nearbyPlaces.length > 0 && (
        <Box>
          <Text fontWeight="bold">Nearby Places:</Text>
          {nearbyPlaces.map((place, index) => (
            <Text key={index}>{place}</Text>
          ))}
        </Box>
      )}
      {error && <Text color="red">{error}</Text>}
      <Button onClick={speakPosition}>Speak Position and Nearby Places</Button>
    </VStack>
  );
};

export default Navigation;