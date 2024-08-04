import type { NextApiRequest, NextApiResponse } from 'next';
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = 'us-central1';
const MODEL_NAME = 'gemini-1.0-pro-vision';

if (!PROJECT_ID) {
  throw new Error("GCP_PROJECT_ID is not set");
}

const vertexAi = new VertexAI({project: PROJECT_ID, location: LOCATION});
const model = vertexAi.preview.getGenerativeModel({
  model: MODEL_NAME,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { prompt, imageData, previousAnalysis } = req.body;
      
      const request = {
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: imageData.split(',')[1] } }
          ]
        }]
      };

      const response = await model.generateContent(request);
      const result = response.response;
      
      console.log('Vertex AI response:', JSON.stringify(result, null, 2));

      const analysisText = result.candidates![0].content.parts[0].text;
      
      res.status(200).json({ analysis: analysisText });
    } catch (error) {
      console.error("Error analyzing image with Vertex AI Gemini:", error);
      res.status(500).json({ error: 'Error analyzing image' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}