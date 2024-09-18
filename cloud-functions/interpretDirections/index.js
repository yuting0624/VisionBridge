const { VertexAI } = require('@google-cloud/vertexai');
const cors = require('cors')({
  origin: true,
  credentials: true
});
const projectId = process.env.GCP_PROJECT_ID;
const location = 'asia-northeast1';
const model = 'gemini-1.5-flash-001';

exports.interpretDirections = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Credentials', 'true');
  return cors(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '3600');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { directionsData } = req.body;
      console.log('Received directionsData:', JSON.stringify(directionsData, null, 2));

      // データの前処理
      const processedData = processDirectionsData(directionsData);

      const vertexAi = new VertexAI({
        project: projectId,
        location: location,
      });

      const generativeModel = vertexAi.preview.getGenerativeModel({
        model: model,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.2,
          topP: 1,
          topK: 32,
        },
      });

      const prompt = `
        以下の経路情報を、視覚障害者にとって理解しやすい日本語の説明に変換してください。
        1. 目的地までの総距離と予想所要時間を報告してください。
        2. 歩行者向けのナビゲーションとして、以下の情報を含めてください：
           - 主要な曲がり角
           - 目印となる建物や施設
           - 注意が必要な箇所（交差点、段差など）
        3. 説明は簡潔で、順序立てて、安全性を重視したものにしてください。
        4. 各ステップは50文字以内で説明してください。

        経路情報:
        ${JSON.stringify(processedData, null, 2)}
      `;

      console.log('Sending prompt to Vertex AI:', prompt);

      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      console.log('Received result from Vertex AI:', JSON.stringify(result, null, 2));

      const response = await result.response;
      const interpretation = response.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No text generated';

      res.status(200).json({ interpretation });
    } catch (error) {
      console.error('Error interpreting directions:', error);
      res.status(500).json({ error: 'Failed to interpret directions', details: error.message });
    }
  });
};

function processDirectionsData(data) {
  // ここでdirectionsDataを処理し、必要な情報のみを抽出します
  const route = data.routes[0];
  const leg = route.legs[0];
  return {
    distance: leg.distance.text,
    duration: leg.duration.text,
    steps: leg.steps.map(step => ({
      instructions: step.instructions,
      distance: step.distance.text,
      duration: step.duration.text
    }))
  };
}