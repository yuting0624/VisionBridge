import { NextPage } from 'next'
import { Box, Container, VStack, useColorModeValue } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

interface AboutProps {
  content: string
}

const About: NextPage<AboutProps> = ({ content }) => {
  const { t } = useTranslation('common')
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.800', 'gray.100')

  return (
    <Box minHeight="100vh" bg={bgColor} color={textColor}>
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <Box 
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: content }} 
            sx={{
              'h1': { fontSize: '3xl', fontWeight: 'bold', mb: 4 },
              'h2': { fontSize: '2xl', fontWeight: 'semibold', mt: 8, mb: 4 },
              'p': { mb: 4 },
              'ul, ol': { pl: 6, mb: 4 },
              'li': { mb: 2 },
              'a': { color: 'blue.500', textDecoration: 'underline' },
            }}
          />
        </VStack>
      </Container>
    </Box>
  )
}

export async function getStaticProps({ locale }: { locale: string }) {
  const filePath = path.join(process.cwd(), 'pages', `about${locale === 'en' ? '.en' : ''}.md`)
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { content } = matter(fileContents)
  const processedContent = await remark().use(html).process(content)
  const contentHtml = processedContent.toString()

  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'ja', ['common'])),
      content: contentHtml,
    },
  }
}

export default About