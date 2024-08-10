import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence';
import { analyzeImageWithGemini } from './imageAnalysis';

const client = new VideoIntelligenceServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export async function analyzeVideoStream(videoStream: Buffer) {
  const request = {
    inputContent: videoStream.toString('base64'),
    features: ['OBJECT_TRACKING'],
  };

  try {
    const [operation] = await client.annotateVideo(request);
    const [operationResult] = await operation.promise();

    const annotations = operationResult.annotationResults[0].objectAnnotations;
    return annotations;
  } catch (error) {
    if (error.code === 8 && error.details.includes('Quota exceeded')) {
      console.warn('Quota exceeded, waiting for 1 minute before retrying...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1分待機
      return analyzeVideoStream(videoStream); // 再試行
    } else {
      throw error;
    }
  }
}

export async function analyzeVideoWithGemini(videoStream: Buffer, previousAnalysis: string | null) {
  const annotations = await analyzeVideoStream(videoStream);
  const analysisResult = JSON.stringify(annotations, null, 2);

  // Geminiに渡すためのプロンプトを作成
  const prompt = `
  動画の分析結果を以下に示します。これを基に、重要な要素や潜在的な障害物、危険要素を簡潔に説明してください。回答は2-3の短い日本語の文で、シンプルで直接的な表現を使用してください。
  例: '前方1メートルに椅子があります。右に曲がってください。' '床にコードがあり、つまずく可能性があります。注意してください。
  ${analysisResult}
  `;

  // Gemini APIを使用して結果を解釈
  const geminiResult = await analyzeImageWithGemini(prompt, 'normal', previousAnalysis);
  return geminiResult;
}