import type { NextApiRequest, NextApiResponse } from 'next';
import { TranslationServiceClient } from '@google-cloud/translate';

const translationClient = new TranslationServiceClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { text, sourceLanguage, targetLanguage } = req.body;
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const location = 'global';

      if (!projectId) {
        throw new Error('GOOGLE_CLOUD_PROJECT_ID is not set');
      }

      const request = {
        parent: `projects/${projectId}/locations/${location}`,
        contents: [text],
        mimeType: 'text/plain',
        sourceLanguageCode: sourceLanguage,
        targetLanguageCode: targetLanguage,
      };

      console.log('Translation request:', JSON.stringify(request, null, 2));

      const [response] = await translationClient.translateText(request);
      const translatedText = response.translations?.[0]?.translatedText || text;

      res.status(200).json({ translatedText });
    } catch (error) {
      console.error('Error translating text:', error);
      
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      res.status(500).json({ error: 'Error translating text', details: errorMessage });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}