import React, { useState, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';

const OfflineNotification: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <Box 
      position="fixed" 
      bottom={4} 
      left={4} 
      right={4} 
      bg="red.500" 
      color="white" 
      p={2} 
      borderRadius="md"
      textAlign="center"
    >
      <Text>現在オフラインです。一部の機能が利用できない可能性があります。</Text>
    </Box>
  );
};

export default OfflineNotification;