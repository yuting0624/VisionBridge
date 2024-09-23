import express from 'express';
import { PubSub } from '@google-cloud/pubsub';

const app = express();
const pubsub = new PubSub();

app.post('/analyze', async (req, res) => {
  const { data, analysisType } = req.body;
  const topicName = `visionbridge-${analysisType}-analysis`;

  try {
    const messageId = await pubsub.topic(topicName).publish(Buffer.from(JSON.stringify(data)));
    console.log(`Message ${messageId} published.`);
    res.status(202).json({ message: 'Analysis request received' });
  } catch (error) {
    console.error('Error publishing message:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});