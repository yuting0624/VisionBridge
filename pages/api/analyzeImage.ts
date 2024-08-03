import type { NextApiRequest, NextApiResponse } from 'next';
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = 'us-central1';
const MODEL_NAME = 'gemini-1.5-pro-vision';

if (!PROJECT_ID) {
  throw new Error("GCP_PROJECT_ID is not set");
}

const vertexAi = new VertexAI({project: PROJECT_ID, location: LOCATION});
const model = vertexAi.preview.getGenerativeModel({
  model: MODEL_NAME,
});

const createPrompt = (previousAnalysis: string | null) => {
  return `
前回の分析: "${previousAnalysis || '初回分析'}"

上記の前回の分析と比較して、現在の画像の主要な変更点や新しい障害物、危険要素のみを簡潔に説明してください。変更がない場合は「変更なし」と回答してください。回答は2-3の短い日本語の文で、シンプルで直接的な表現を使用してください。
分析例：1椅子に座っている男がいます。2男が立ち上がりました。3男がいなくなりました。
`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { imageData, previousAnalysis } = req.body;
      
      const prompt = createPrompt(previousAnalysis);
      
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
      
      
      // 応答構造をログに出力して確認
      console.log('Vertex AI response:', JSON.stringify(result, null, 2));

      // result.candidates[0].content.parts[0].text を使用して結果を取得
      const analysisText = result.candidates[0].content.parts[0].text;
      
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