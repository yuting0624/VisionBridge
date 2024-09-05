import { VideoIntelligenceServiceClient, protos } from '@google-cloud/video-intelligence';
import { VertexAI } from '@google-cloud/vertexai';

const client = new VideoIntelligenceServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const vertexai = new VertexAI({project: process.env.GCP_PROJECT_ID});
const model = 'gemini-1.5-flash-001';

async function retryWithBackoff(operation: () => Promise<any>, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.warn(`Retry attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

export async function analyzeVideoStream(videoStream: Buffer) {
  const request = {
    inputContent: videoStream.toString('base64'),
    features: [
      protos.google.cloud.videointelligence.v1.Feature.OBJECT_TRACKING,
      protos.google.cloud.videointelligence.v1.Feature.LABEL_DETECTION,
      protos.google.cloud.videointelligence.v1.Feature.SHOT_CHANGE_DETECTION,
      protos.google.cloud.videointelligence.v1.Feature.PERSON_DETECTION,
    ],
  };

  try {
    const [operation] = await retryWithBackoff(() => client.annotateVideo(request));
    const [operationResult] = await operation.promise();

    return {
      objectAnnotations: operationResult.annotationResults[0].objectAnnotations,
      labelAnnotations: operationResult.annotationResults[0].segmentLabelAnnotations,
      shotChangeAnnotations: operationResult.annotationResults[0].shotAnnotations,
      personDetections: operationResult.annotationResults[0].personDetections,
    };
  } catch (error) {
    console.error("Error in video analysis:", error);
    throw new Error(`Video analysis failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function analyzeVideoWithGemini(videoData: Buffer, previousAnalysis: string = ''): Promise<string> {
  try {
    const annotations = await retryWithBackoff(() => analyzeVideoStream(videoData));
    const analysisResult = JSON.stringify(annotations, null, 2);

    const prompt = `
    動画の分析結果を以下に示します。これを基に、以下の点に焦点を当てて簡潔に説明してください：
    1. 検出された主要なオブジェクトとその動き
    2. 潜在的な障害物や危険要素
    3. シーンの変化や重要なイベント
    4. 前回の分析からの主な変更点（ある場合）
    
    回答は3-4の短い日本語の文で、シンプルで直接的な表現を使用してください。
    例: '歩行者が右から左に移動しています。2メートル先に椅子があります。車が接近しているため注意が必要です。'
    
    前回の分析: "${previousAnalysis || '初回分析'}"
    動画分析結果: ${analysisResult}
    `;

    const generativeModel = vertexai.preview.getGenerativeModel({
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
    return generatedText;

  } catch (error) {
    console.error('Error in video analysis with Gemini:', error);
    throw new Error(`Video analysis with Gemini failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}