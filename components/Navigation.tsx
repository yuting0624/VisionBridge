import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';

interface NavigationProps {
  directions: string | null;
}

const Navigation: React.FC<NavigationProps> = ({ directions }) => {
  const { t } = useTranslation('common');

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">{t('navigation')}</Text>
      <Box border="1px solid" borderColor="gray.200" p={4} borderRadius="md">
        <Text fontWeight="bold" mb={2}>{t('directions')}:</Text>
        {directions ? (
          <Text whiteSpace="pre-wrap">{directions}</Text>
        ) : (
          <Text>{t('noDirectionsAvailable')}</Text>
        )}
      </Box>
    </VStack>
  );
};

export default Navigation;