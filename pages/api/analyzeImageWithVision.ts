import type { NextApiRequest, NextApiResponse } from 'next';
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { imageData, mode } = req.body;
      const image = { content: imageData.split(',')[1] };
      let result;

      switch (mode) {
        case 'normal':
          result = await client.annotateImage({
            image,
            features: [
              { type: 'LABEL_DETECTION' },
              { type: 'OBJECT_LOCALIZATION' },
            ],
          });
          break;
        case 'person':
          result = await client.annotateImage({
            image,
            features: [
              { type: 'FACE_DETECTION' },
              { type: 'OBJECT_LOCALIZATION' },
            ],
          });
          break;
        case 'text':
          result = await client.annotateImage({
            image,
            features: [
              { type: 'TEXT_DETECTION' },
            ],
          });
          break;
        default:
          result = await client.annotateImage({
            image,
            features: [
              { type: 'LABEL_DETECTION' },
              { type: 'OBJECT_LOCALIZATION' },
              { type: 'FACE_DETECTION' },
              { type: 'TEXT_DETECTION' },
            ],
          });
      }

      res.status(200).json(result[0]);
    } catch (error) {
      console.error('Error analyzing image with Vision API:', error);
      res.status(500).json({ error: 'Error analyzing image with Vision API' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}