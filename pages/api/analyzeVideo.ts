import type { NextApiRequest, NextApiResponse } from 'next';
import { analyzeVideoWithGemini } from '../../utils/videoAnalysis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { videoData, previousAnalysis } = req.body;
      if (!videoData) {
        return res.status(400).json({ error: 'No video data provided' });
      }

      const buffer = Buffer.from(videoData.split(',')[1], 'base64');
      const analysisResult = await analyzeVideoWithGemini(buffer, previousAnalysis);

      res.status(200).json({ analysis: analysisResult });
    } catch (error) {
      console.error('Error analyzing video:', error);
      if (error.code === 8 && error.details.includes('Quota exceeded')) {
        console.warn('Quota exceeded, waiting for 1 minute before retrying...');
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1分待機
        return handler(req, res); // 再試行
      } else {
        res.status(500).json({ error: 'Error analyzing video' });
      }
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}