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

const createPrompt = (previousAnalysis: string | null) => {
if (previousAnalysis === null) {
    return `
画像の主要素と即時の危険を3つまで、15字以内の短文で列挙してください。例：
1. 前方に椅子あり
2. 右側に人物接近中
3. 床に障害物あり
`;
  }
  return `
前回の分析: "${previousAnalysis || '初回分析'}"

現在の画像で新たに発生した変化や危険を3つまで、15字以内の短文で列挙してください。変化がない場合は「変化なし」と回答してください。例：
1. 人物が立ち上がる
2. 左側から車が接近
3. 信号が青に変わる
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