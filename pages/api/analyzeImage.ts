import type { NextApiRequest, NextApiResponse } from 'next';
import { VertexAI } from '@google-cloud/vertexai';

const projectId = process.env.GCP_PROJECT_ID;
const location = 'us-central1';
const model = 'gemini-1.5-flash-001';

if (!projectId) {
  throw new Error('GCP_PROJECT_ID environment variable is not set');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { prompt, imageData, previousAnalysis } = req.body;

      const vertexAi = new VertexAI({
        project: projectId,
        location: location,
      });

      const generativeModel = vertexAi.preview.getGenerativeModel({
        model: model,
        generation_config: {
          max_output_tokens: 2048,
          temperature: 0.4,
          top_p: 1,
          top_k: 32,
        },
      });

      let imagePart;
      if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
        const base64Data = imageData.split(',')[1];
        imagePart = {
          inline_data: {
            data: base64Data,
            mime_type: 'image/jpeg',
          },
        };
      } else if (typeof imageData === 'object') {
        imagePart = {
          text: JSON.stringify(imageData),
        };
      } else {
        throw new Error('Invalid image data format');
      }

      const result = await generativeModel.generateContent({
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
          { role: 'user', parts: [imagePart] },
        ],
      });

      const response = await result.response;
      const generatedText = response.candidates[0].content.parts[0].text;

      res.status(200).json({ analysis: generatedText });
    } catch (error) {
      console.error('Error analyzing image with Vertex AI Gemini:', error);
      res.status(500).json({ error: 'Image analysis failed', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}