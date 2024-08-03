import type { NextPage } from 'next'
import { Box, Heading, VStack, Container } from '@chakra-ui/react'
import dynamic from 'next/dynamic'
import Camera from '../components/Camera'
import VoiceCommands from '../components/VoiceCommands'
import VoiceGuide from '../components/VoiceGuide'
import ErrorBoundary from '../components/ErrorBoundary'

const DynamicNavigation = dynamic(() => import('../components/Navigation'), {
  ssr: false,
})

const Home: NextPage = () => {
  return (
    <ErrorBoundary>
      <Container maxW="container.xl" p={4}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="2xl" textAlign="center">VisionBridge</Heading>
          <VoiceGuide />
          <Camera />
          <DynamicNavigation />
          <VoiceCommands />
        </VStack>
      </Container>
    </ErrorBoundary>
  )
}

export default Home