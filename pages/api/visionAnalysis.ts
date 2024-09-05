import type { NextApiRequest, NextApiResponse } from 'next';
import { analyzeImageWithVision } from '../../utils/visionHelper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { imageData, analysisMode } = req.body;
      const result = await analyzeImageWithVision(imageData, analysisMode);
      res.status(200).json({ result });
    } catch (error) {
      res.status(500).json({ error: 'Vision AI analysis failed' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}