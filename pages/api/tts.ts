import type { NextApiRequest, NextApiResponse } from 'next';
import { SpeechClient } from '@google-cloud/speech';

const speechClient = new SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { audio } = req.body;
      if (!audio) {
        return res.status(400).json({ error: 'No audio data provided' });
      }

      const request = {
        audio: {
          content: audio,
        },
        config: {
          encoding: 'WEBM_OPUS' as const,
          languageCode: 'ja-JP',
        },
      };

      const [response] = await speechClient.recognize(request);
      const transcription = response.results
        ?.map(result => result.alternatives?.[0]?.transcript)
        .join('\n');

      res.status(200).json({ transcription });
    } catch (error) {
      console.error('Error in speech recognition:', error);
      res.status(500).json({ error: 'Error in speech recognition', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}