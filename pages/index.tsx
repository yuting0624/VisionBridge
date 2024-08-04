import type { GetStaticProps, NextPage } from 'next'
import { Box, VStack, Heading, Flex, Container, useColorModeValue, Grid, GridItem, Button, useToast, Image } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { FaMicrophone, FaVolumeUp, FaMapMarkerAlt } from 'react-icons/fa'
import Camera from '../components/Camera'
import ColorModeToggle from '../components/ColorModeToggle'
import LanguageSwitch from '../components/LanguageSwitch'
import { useCallback } from 'react'
import { speakText } from '../utils/speechSynthesis'

const Home: NextPage = () => {
  const { t } = useTranslation('common')
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const headerBgColor = useColorModeValue('white', 'gray.800')
  const toast = useToast()

  const handleAudioGuide = useCallback(() => {
    const guideText = t('audioGuideText')
    speakText(guideText)
  }, [t])

  const handleVoiceInput = useCallback(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.lang = 'ja-JP'
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        toast({
          title: '音声入力',
          description: transcript,
          status: 'info',
          duration: 5000,
          isClosable: true,
        })
      }
      recognition.start()
    } else {
      toast({
        title: 'エラー',
        description: '音声認識がサポートされていません',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }, [toast])

  const handleGetLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const locationText = `現在地: 緯度 ${latitude}, 経度 ${longitude}`
          speakText(locationText)
          toast({
            title: '現在地',
            description: locationText,
            status: 'info',
            duration: 5000,
            isClosable: true,
          })
        },
        (error) => {
          toast({
            title: 'エラー',
            description: '位置情報の取得に失敗しました',
            status: 'error',
            duration: 3000,
            isClosable: true,
          })
        }
      )
    } else {
      toast({
        title: 'エラー',
        description: '位置情報がサポートされていません',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }, [toast])

  return (
    <Box minHeight="100vh" bg={bgColor}>
      <Flex 
        as="header" 
        align="center" 
        justify="space-between" 
        wrap="wrap" 
        padding="1.5rem" 
        bg={headerBgColor} 
        color={useColorModeValue('gray.600', 'white')}
        boxShadow="sm"
      >
        <Flex align="center" mr={5}>
          <Image src="/images/logo.png" alt="VisionBridge Logo" boxSize="80px" mr={0} />
          <Heading as="h1" size="lg" letterSpacing={'tighter'}>
            {t('title')}
          </Heading>
        </Flex>

        <Flex>
          <ColorModeToggle />
          <Box ml={4}>
            <LanguageSwitch />
          </Box>
        </Flex>
      </Flex>

      <Container maxW="container.xl" centerContent py={8}>
        <VStack spacing={8} align="stretch" w="100%">
          <Box 
            bg={useColorModeValue('white', 'gray.700')} 
            p={6} 
            rounded="md" 
            boxShadow="md"
            width="100%"
          >
            <Camera />
          </Box>
          
          <Grid templateColumns={["repeat(1, 1fr)", "repeat(3, 1fr)"]} gap={6}>
            <GridItem>
              <Button leftIcon={<FaVolumeUp />} colorScheme="blue" width="100%" onClick={handleAudioGuide}>
                {t('audioGuide')}
              </Button>
            </GridItem>
            <GridItem>
              <Button leftIcon={<FaMicrophone />} colorScheme="green" width="100%" onClick={handleVoiceInput}>
                {t('voiceInput')}
              </Button>
            </GridItem>
            <GridItem>
              <Button leftIcon={<FaMapMarkerAlt />} colorScheme="purple" width="100%" onClick={handleGetLocation}>
                {t('getLocation')}
              </Button>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </Box>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...await serverSideTranslations(locale ?? 'ja', ['common']),
  },
})

export default Home