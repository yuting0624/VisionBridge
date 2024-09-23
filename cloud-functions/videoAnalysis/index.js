const cors = require('cors')({origin: true});
const { VideoIntelligenceServiceClient } = require('@google-cloud/video-intelligence');
const formidable = require('formidable');
const fs = require('fs').promises;

const videoClient = new VideoIntelligenceServiceClient();

async function analyzeVideoStream(videoData) {
  const request = {
    inputContent: videoData.toString('base64'),
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

exports.videoAnalysis = (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        res.status(400).json({ error: 'Error parsing form data' });
        return;
      }

      try {
        console.log('Received fields:', fields);
        console.log('Received files:', files);

        const videoFile = files.video?.[0];
        if (!videoFile) {
          console.error('No video file received');
          return res.status(400).json({ error: 'No video file provided' });
        }

        const videoBuffer = await fs.readFile(videoFile.filepath);
        console.log('Video buffer size:', videoBuffer.length);

        // ここで videoBuffer を使用して分析を行う
        const analysisResult = await analyzeVideoStream(videoBuffer);

        res.status(200).json({ analysis: analysisResult });
      } catch (error) {
        console.error('Error in video analysis:', error);
        res.status(500).json({ error: 'Video analysis failed', details: error.message });
      }
    });
  });
};