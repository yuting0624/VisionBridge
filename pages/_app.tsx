import type { AppProps } from 'next/app'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { appWithTranslation } from 'next-i18next'
import theme from '../styles/theme'
import OfflineNotification from '../components/OfflineNotification'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <Component {...pageProps} />
      <OfflineNotification />
    </ChakraProvider>
  )
}

export default appWithTranslation(MyApp)