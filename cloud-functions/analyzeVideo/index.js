const { VertexAI } = require('@google-cloud/vertexai');
const { VideoIntelligenceServiceClient } = require('@google-cloud/video-intelligence');
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

const videoClient = new VideoIntelligenceServiceClient();
const vertexAi = new VertexAI({ project: projectId, location: location });

async function analyzeVideoStream(videoData) {
  let inputContent;
  if (typeof videoData === 'string') {
    inputContent = videoData.split(',')[1]; 
  } else if (videoData instanceof Buffer) {
    inputContent = videoData.toString('base64');
  } else {
    throw new Error('Unsupported video data format');
  }

  const request = {
    inputContent: inputContent,
    features: ['OBJECT_TRACKING', 'LABEL_DETECTION', 'SHOT_CHANGE_DETECTION', 'PERSON_DETECTION'],
  };

  try {
    const [operation] = await videoClient.annotateVideo(request);
    const [operationResult] = await operation.promise();

    return {
      objectAnnotations: operationResult.annotationResults[0].objectAnnotations,
      labelAnnotations: operationResult.annotationResults[0].segmentLabelAnnotations,
      shotChangeAnnotations: operationResult.annotationResults[0].shotAnnotations,
      personDetections: operationResult.annotationResults[0].personDetections,
    };
  } catch (error) {
    console.error("Error in video analysis:", error);
    throw new Error(`Video analysis failed: ${error.message}`);
  }
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

      const analysisResult = await analyzeVideoStream(videoData);

      const prompt = `
      動画の分析結果を以下に示します。これを基に、以下の点に焦点を当てて簡潔に説明してください：
      1. 検出された主要なオブジェクトとその動き
      2. 潜在的な障害物や危険要素
      3. シーンの変化や重要なイベント
      4. 前回の分析からの主な変更点（ある場合）

      回答は3-4の短い日本語の文で、シンプルで直接的な表現を使用してください。
      例: '歩行者が右から左に移動しています。2メートル先に椅子があります。車が接近しているため注意が必要です。'

      前回の分析: "${previousAnalysis || '初回分析'}"
      動画分析結果: ${JSON.stringify(analysisResult)}
      `;

      const generativeModel = vertexAi.preview.getGenerativeModel({
        model: model,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.9,
          topP: 1
        },
      });

      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
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