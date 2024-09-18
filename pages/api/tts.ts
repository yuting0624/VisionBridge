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
          sampleRateHertz: 48000,
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
      let errorMessage = '音声認識中にエラーが発生しました';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
        if ('code' in error) {
          errorMessage += ` (エラーコード: ${(error as any).code})`;
        }
      }
      res.status(500).json({ error: errorMessage });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}