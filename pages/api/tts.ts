import type { NextApiRequest, NextApiResponse } from 'next';
import textToSpeech from '@google-cloud/text-to-speech';

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'No text provided' });
      }

      const request = {
        input: { text },
        voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' as const },
        audioConfig: { audioEncoding: 'MP3' as const },
      };

      const [response] = await client.synthesizeSpeech(request);
      const audioContent = response.audioContent;

      if (!audioContent) {
        throw new Error('No audio content received from Text-to-Speech API');
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(audioContent);
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      res.status(500).json({ error: 'Error synthesizing speech', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}