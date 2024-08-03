import type { NextApiRequest, NextApiResponse } from 'next';
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'No image data provided' });
      }
      
      // Base64データからバッファを作成
      const buffer = Buffer.from(image.split(',')[1], 'base64');
      
      const [result] = await client.labelDetection({
        image: { content: buffer }
      });
      
      const labels = result.labelAnnotations || [];
      res.status(200).json({ labels });
    } catch (error) {
      console.error('Error processing image:', error);
      res.status(500).json({ error: 'Error processing image', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}