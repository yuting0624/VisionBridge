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
    const response = await fetch(process.env.NEXT_PUBLIC_VIDEO_ANALYSIS_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoData: videoData.toString('base64'), previousAnalysis }),
    });

    if (!response.ok) {
      throw new Error(`Video analysis failed: ${response.statusText}`);
    }

    const { analysis } = await response.json();
    return analysis;
  } catch (error) {
    console.error('Error in video analysis with Gemini:', error);
    throw new Error(`Video analysis with Gemini failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}