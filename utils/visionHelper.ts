import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient();

export async function analyzeImageWithVision(imageData: string, mode: string) {
  const image = { content: imageData.split(',')[1] };
  let result;

  switch (mode) {
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