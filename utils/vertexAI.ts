import { VertexAI } from '@google-cloud/vertexai';

const vertexai = new VertexAI({project: process.env.NEXT_PUBLIC_GCP_PROJECT_ID, location: 'us-central1'});
const model = 'gemini-pro-vision';

export async function processImageWithVertexAI(imageData: string, mode: string) {
  const generativeModel = vertexai.preview.getGenerativeModel({
    model: model,
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.4,
      topP: 1,
      topK: 32,
    },
  });

  const prompt = `あなたは視覚障害者のための視覚サポートAIアシスタントです。
  以下の画像を分析し、${mode}モードに基づいて重要な情報を提供してください。`;

  const result = await generativeModel.generateContent({
    contents: [
      { role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: imageData.split(',')[1] } }] }
    ],
  });

  const response = await result.response;
  if (response.candidates && response.candidates.length > 0) {
    return response.candidates[0].content.parts[0].text;
  } else {
    return '候補が見つかりません。';
  }
}
