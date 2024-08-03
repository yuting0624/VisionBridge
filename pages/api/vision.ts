import type { NextApiRequest, NextApiResponse } from 'next';
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { image } = req.body;
      const [result] = await client.labelDetection(image);
      const labels = result.labelAnnotations;
      res.status(200).json({ labels });
    } catch (error) {
      res.status(500).json({ error: 'Error processing image' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}