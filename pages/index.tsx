import type { NextPage } from 'next'
import { Box, Heading } from '@chakra-ui/react'
import Camera from '../components/Camera'

const Home: NextPage = () => {
  return (
    <Box p={4}>
      <Heading as="h1" mb={4}>VisionBridge</Heading>
      <Camera />
    </Box>
  )
}

export default Home