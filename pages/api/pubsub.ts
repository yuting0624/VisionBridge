import type { NextApiRequest, NextApiResponse } from 'next';
import { Message, PubSub } from '@google-cloud/pubsub';

const pubsub = new PubSub({
  projectId: process.env.GCP_PROJECT_ID,
});
const videoStreamTopic = 'visionbridge-video-stream';
const videoAnalysisResultsTopic = 'visionbridge-video-analysis-results';

let lastPublishTime = 0;
const PUBLISH_INTERVAL = 8000; // 8秒ごとに1回送信

interface PubSubMessage extends Message {
  ackId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { action, data } = req.body;

    switch (action) {
      case 'publishVideoStream':
        try {
          const currentTime = Date.now();
          if (currentTime - lastPublishTime < PUBLISH_INTERVAL) {
            res.status(200).json({ message: 'Skipped due to rate limiting' });
            return;
          }

          const messageId = await pubsub.topic(videoStreamTopic).publish(Buffer.from(data, 'base64'));
          lastPublishTime = currentTime;
          res.status(200).json({ messageId });
        } catch (error) {
          console.error('Error publishing video stream:', error);
          res.status(500).json({ error: 'Failed to publish video stream' });
        }
        break;

      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } else if (req.method === 'GET') {
    try {
      const subscription = pubsub.subscription(`visionbridge-video-analysis-results-sub`);

      const [message] = await new Promise<[Message | null, number | null]>((resolve, reject) => {
        subscription.once('message', (message: Message) => {
          resolve([message, null]);
        });
        subscription.once('error', (error) => {
          reject(error);
        });
      });

      if (message) {
        const result = JSON.parse(message.data.toString());
        message.ack();
        res.status(200).json(result);
      } else {
        res.status(204).end();
      }
    } catch (error) {
      console.error('Error receiving video analysis results:', error);
      res.status(500).json({ error: 'Failed to receive video analysis results', details: (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}