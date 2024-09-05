import type { NextApiRequest, NextApiResponse } from 'next';
import { analyzeVideoWithGemini } from '../../utils/videoAnalysis';
import formidable from 'formidable';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const form = formidable({ allowEmptyFiles: true, minFileSize: 1 });
    try {
      const [fields, files] = await form.parse(req);
      const videoFile = files.video?.[0];
      
      if (!videoFile || videoFile.size === 0) {
        res.status(400).json({ error: 'No video file provided or file is empty' });
        return;
      }

      const videoBuffer = await fs.readFile(videoFile.filepath);
      const result = await analyzeVideoWithGemini(videoBuffer, '');
      await fs.unlink(videoFile.filepath); // 一時ファイルを削除
      res.status(200).json({ analysis: result });
    } catch (error) {
      console.error('Error processing video:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ error: 'Video analysis failed', details: errorMessage });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}