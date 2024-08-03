import type { GetStaticProps, NextPage } from 'next'
import { Box, VStack, Heading, Flex, Container, useColorModeValue } from '@chakra-ui/react'
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
          >
            <Camera />
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  const locale = context.locale || 'ja'
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

export default Home