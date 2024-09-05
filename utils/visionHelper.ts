import * as visionImport from '@google-cloud/vision';

let vision: typeof visionImport;
if (typeof window === 'undefined') {
  vision = visionImport;
}

export async function analyzeImageWithVision(imageData: string, analysisMode: string) {
  if (typeof window !== 'undefined') {
    throw new Error('This function can only be called from the server side');
  }

  const client = new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });

  const image = { content: imageData.split(',')[1] };
  let result;

  switch (analysisMode) {
    case 'normal':
      result = await client.annotateImage({
        image,
        features: [
          { type: 'LABEL_DETECTION' },
          { type: 'OBJECT_LOCALIZATION' },
        ],
      });
      break;
    case 'person':
      result = await client.annotateImage({
        image,
        features: [
          { type: 'FACE_DETECTION' },
          { type: 'OBJECT_LOCALIZATION' },
        ],
      });
      break;
    case 'text':
      result = await client.annotateImage({
        image,
        features: [
          { type: 'TEXT_DETECTION' },
        ],
      });
      break;
    default:
      result = await client.annotateImage({
        image,
        features: [
          { type: 'LABEL_DETECTION' },
          { type: 'OBJECT_LOCALIZATION' },
          { type: 'FACE_DETECTION' },
          { type: 'TEXT_DETECTION' },
        ],
      });
  }

  return result[0];
}