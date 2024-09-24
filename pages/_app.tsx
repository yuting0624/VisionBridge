import type { AppProps } from 'next/app'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { appWithTranslation } from 'next-i18next'
import theme from '../styles/theme'
import OfflineNotification from '../components/OfflineNotification'
import Head from 'next/head'
import { Libraries, useJsApiLoader } from '@react-google-maps/api'
import { initializeDirectionsService } from '../utils/navigationHelper'
import { useEffect, useMemo } from 'react'

const libraries = ['places'];

function MyApp({ Component, pageProps }: AppProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: libraries as Libraries,
  });

  useEffect(() => {
    if (isLoaded) {
      initializeDirectionsService();
    }
  }, [isLoaded]);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <Head>
        <title>Vision Bridge - AIによる視覚支援</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="images/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="images/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

      </Head>
      <Component {...pageProps} />
      <OfflineNotification />
    </ChakraProvider>
  )
}

export default appWithTranslation(MyApp)