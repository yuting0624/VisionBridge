import type { NextApiRequest, NextApiResponse } from 'next';
import textToSpeech from '@google-cloud/text-to-speech';

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { text, rate = 1.3, volume = 1.0 } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'No text provided' });
      }

      const request = {
        input: { text },
        voice: { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B', ssmlGender: 'FEMALE' as const },
        audioConfig: { 
          audioEncoding: 'MP3' as const,
          speakingRate: rate,
          volumeGainDb: (volume - 1) * 6, // Convert 0-1 range to dB
        },
      };

      const [response] = await client.synthesizeSpeech(request);
      const audioContent = response.audioContent;

      if (!audioContent) {
        throw new Error('No audio content received from Text-to-Speech API');
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(audioContent));
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      let errorMessage = 'テキスト読み上げ中にエラーが発生しました';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      res.status(500).json({ error: errorMessage });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}