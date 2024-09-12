const { VertexAI } = require('@google-cloud/vertexai');
const cors = require('cors')({
  origin: true,
  credentials: true  
});
const projectId = process.env.GCP_PROJECT_ID;
const location = 'asia-northeast1';
const model = 'gemini-1.5-flash-001';

if (!projectId) {
  throw new Error('GCP_PROJECT_ID environment variable is not set');
}

const vertexAi = new VertexAI({ project: projectId, location: location });

function createPromptForVideo(previousAnalysis) {
  return `あなたは視覚障害者のための視覚サポートAIアシスタントです。以下の指示に従って、動画分析結果を簡潔で明確な音声フィードバックに変換してください：

1. 最も重要な情報（安全性、移動に関わる要素）を最優先で伝えてください。（例：交通信号、通行人、車両）。
2. 環境の変化や新たに検出された物体に焦点を当て、前回の分析との違いを明確にしてください。（例：信号が青から赤に変わった）。
3. 位置情報を含め、ユーザーの空間認識を助ける具体的な表現を使用してください（例：「2メートル先」「右手前」）。
4. 各情報は15字以内の短文で伝えてください。
5. 危険な状況や障害物を特に強調してください。
6. 人物、テキスト、標識などの重要な視覚情報も含めてください。
7. 安全に関わるため、ハルシネーションは絶対にしないでください。
8. 動きのある物体の方向と速度を具体的に説明してください。
9. シーンの急激な変化や重要なイベントを即座に報告してください。

前回の分析: "${previousAnalysis || '初回分析'}"

例:
'歩行者が右から左へ急ぎ足。
2メートル先、椅子に注意。
車が後方から接近中、要注意。
画面右上、出口サイン点滅。'

上記の指示に従って、与えられた動画を分析し、視覚障害者向けのリアルタイム音声フィードバックを生成してください。重要度順に箇条書きで出力してください。`;
}

exports.analyzeVideo = (req, res) => {
  return cors(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Allow-Credentials', 'true');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { videoData, previousAnalysis } = req.body;
      if (!videoData) {
        console.error('No video data received');
        return res.status(400).json({ error: 'No video data provided' });
      }

      console.log('Received video data type:', typeof videoData);
      console.log('Received video data length:', videoData.length);

      const generativeModel = vertexAi.preview.getGenerativeModel({
        model: model,
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 1,
          topP: 0.95,
        },
        safetySettings: [
          {
            'category': 'HARM_CATEGORY_HATE_SPEECH',
            'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',
            'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            'category': 'HARM_CATEGORY_HARASSMENT',
            'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ],
      });

      const prompt = createPromptForVideo(previousAnalysis);

      const result = await generativeModel.generateContent({
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
          { role: 'user', parts: [{ inlineData: { mimeType: 'video/mp4', data: videoData.split(',')[1] } }] },
        ],
      });

      const response = await result.response;
      const generatedText = response.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No text generated';

      res.status(200).json({ analysis: generatedText });
    } catch (error) {
      console.error('Error in video analysis:', error);
      res.status(500).json({ error: 'Video analysis failed', details: error.message });
    }
  });
};