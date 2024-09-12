const { VertexAI } = require('@google-cloud/vertexai');
const cors = require('cors')({
  origin: 'https://visionbridge-776625182572.asia-northeast1.run.app',
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
    // プリフライトリクエストに対する処理
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
      まず目的地までの距離、かかる時間を報告してから、歩行者向けのナビゲーションとして重要な曲がり角、目印、および注意点を含めてください。
      説明は簡潔で、順序立てて、安全性を重視したものにしてください。
      各ステップは50文字以内で説明してください。

      経路情報:
      ${JSON.stringify(directionsData, null, 2)}
    `;

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = await result.response;
    const interpretation = response.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No text generated';

    res.status(200).json({ interpretation });
  } catch (error) {
    console.error('Error interpreting directions:', error);
    res.status(500).json({ error: 'Failed to interpret directions' });
  }
});
};