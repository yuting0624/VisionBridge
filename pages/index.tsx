import type { GetStaticProps, NextPage } from 'next'
import { Box, VStack, Heading, Flex, Container, useColorModeValue, Image } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Camera from '../components/Camera'
import ColorModeToggle from '../components/ColorModeToggle'
import LanguageSwitch from '../components/LanguageSwitch'

const Home: NextPage = () => {
  const { t } = useTranslation('common')
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const headerBgColor = useColorModeValue('white', 'gray.800')

  return (
    <Box minHeight="100vh" bg={bgColor}>
      <VStack 
        as="header" 
        spacing={4}
        align="stretch"
        padding="1.5rem" 
        bg={headerBgColor} 
        color={useColorModeValue('gray.600', 'white')}
        boxShadow="sm"
      >
        <Flex justify="flex-start" align="center">
          <Image src="/images/logo.png" alt="VisionBridge Logo" boxSize="100px" mr={2} />
          <Heading as="h1" size="lg" letterSpacing={'tighter'}>
            {t('title')}
          </Heading>
        </Flex>

        <Flex justify="flex-end">
          <ColorModeToggle />
          <Box ml={4}>
            <LanguageSwitch />
          </Box>
        </Flex>
      </VStack>

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