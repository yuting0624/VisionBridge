import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { speakText } from '../utils/speechSynthesis';
import { getDirections } from '../utils/navigationHelper';

const Navigation: React.FC = () => {
  const { t } = useTranslation('common');
  const [isListening, setIsListening] = useState(false);
  const [destination, setDestination] = useState('');
  const [directions, setDirections] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(() => {
    setIsListening(true);
    // Speech-to-Text APIを呼び出す
    // この部分は実際のAPI呼び出しに置き換える必要があります
    setTimeout(() => {
      const mockDestination = '東京駅';
      setDestination(mockDestination);
      setIsListening(false);
      getNavigationDirections(mockDestination);
    }, 3000);
  }, []);

  const getNavigationDirections = useCallback(async (dest: string) => {
    try {
      const currentPosition = await getCurrentPosition();
      const result = await getDirections(
        `${currentPosition.latitude},${currentPosition.longitude}`,
        dest
      );
      const directionsText = await interpretDirectionsWithGemini(result);
      setDirections(directionsText);
      speakText(directionsText);
    } catch (err) {
      setError('ナビゲーション情報の取得に失敗しました');
      speakText('ナビゲーション情報の取得に失敗しました');
    }
  }, []);

  const getCurrentPosition = (): Promise<GeolocationCoordinates> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => reject(error)
      );
    });
  };

  const interpretDirectionsWithGemini = async (directionsData: any): Promise<string> => {
    // Gemini APIを使用して方向データを解釈し、人間が理解しやすい形式に変換
    // この部分は実際のGemini API呼び出しに置き換える必要があります
    const response = await fetch('/api/interpretDirections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directionsData }),
    });
    if (!response.ok) throw new Error('Failed to interpret directions');
    const { interpretation } = await response.json();
    return interpretation;
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">{t('navigation')}</Text>
      <Button onClick={startListening} isLoading={isListening}>
        {isListening ? t('listening') : t('startNavigation')}
      </Button>
      {destination && (
        <Text>{t('destinationSet', { destination })}</Text>
      )}
      {directions && (
        <Box>
          <Text fontWeight="bold">{t('directions')}:</Text>
          <Text>{directions}</Text>
        </Box>
      )}
      {error && <Text color="red">{error}</Text>}
    </VStack>
  );
};

export default Navigation;