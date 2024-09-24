import type { NextPage } from 'next'
import { Box, VStack, Heading, Text, Button, Container, useColorModeValue, Image, Flex, Stack, HStack } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import LanguageSwitch from '../components/LanguageSwitch'
import Link from 'next/link'

const Home: NextPage = () => {
  const { t } = useTranslation('common')
  const bgColor = useColorModeValue('gray.900', 'gray.900')
  const textColor = useColorModeValue('white', 'white')

  return (
    <Box minHeight="100vh" bg={bgColor} color={textColor}>
      <Container maxW="container.xl" px={{ base: 4, md: 8 }} py={4}>
        <VStack spacing={8} align="stretch" minHeight="100vh" justify="space-between">
          <Flex as="header" justify="space-between" align="center" wrap="wrap">
            <Flex align="center" mb={{ base: 4, md: 0 }}>
              <Image src="/images/logo.png" alt="VisionBridge Logo" boxSize="70px" mr={2} />
              <Heading as="h1" size="lg" letterSpacing={'tighter'}>
                Vision Bridge
              </Heading>
            </Flex>
            <HStack spacing={4}>
              <LanguageSwitch />
            </HStack>
          </Flex>

          <Flex direction={{ base: 'column', lg: 'row' }} align="center" justify="space-between" flex={1} py={8}>
            <Box flex={1.2} mr={{ base: 0, lg: 8 }} mb={{ base: 8, lg: 0 }} maxW={{ base: '100%', lg: '55%' }}>
              <Image src="/images/app-preview.png" alt="App Preview" w="full" maxH="600px" objectFit="contain" borderRadius="lg" />
            </Box>
            <VStack align={{ base: 'center', lg: 'start' }} spacing={8} flex={1} textAlign={{ base: 'center', lg: 'left' }}>
              <VStack align={{ base: 'center', lg: 'start' }} spacing={2}>
                <Heading as="h2" size="3xl" fontWeight="bold">
                  Vision Bridge
                </Heading>
                <Text fontSize="xl" fontWeight="bold" color="blue.300">
                  TECHNOLOGY FOR ALL
                </Text>
              </VStack>
              <Text fontSize="lg">
                {t('appDescription')}
              </Text>
              <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} width="100%">
                <Button
                  as={Link}
                  href="/camera"
                  colorScheme="blue"
                  size="lg"
                  height="56px"
                  fontSize="lg"
                  width="100%"
                >
                  {t('getStarted')}
                </Button>
                <Button
                  as={Link}
                  href="/about"
                  size="lg"
                  variant="outline"
                  height="56px"
                  fontSize="lg"
                  width="100%"
                >
                  {t('learnMore')}
                </Button>
              </Stack>
            </VStack>
          </Flex>

          <VStack as="footer" spacing={2} align="center" py={4}>
            <Flex align="center">
              <Text fontSize="sm" mr={2}>
                Built with
              </Text>
              <Image src="/images/gemini-logo.png" alt="Gemini Logo" h="20px" />
            </Flex>
            <Text fontSize="xs" color="gray.500">
              Google Cloud AI Hackathon Project 2024
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  )
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...await serverSideTranslations(locale ?? 'ja', ['common']),
  },
})

export default Home