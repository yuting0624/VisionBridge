import { PubSub } from '@google-cloud/pubsub';

const pubsub = new PubSub();
const videoAnalysisTopic = 'visionbridge-video-analysis';
const audioAnalysisTopic = 'visionbridge-audio-analysis';
const imageAnalysisTopic = 'visionbridge-image-analysis';

export async function publishVideoAnalysis(data: any) {
  await publishToTopic(videoAnalysisTopic, data);
}

export async function publishAudioAnalysis(data: any) {
  await publishToTopic(audioAnalysisTopic, data);
}

export async function publishImageAnalysis(data: any) {
  await publishToTopic(imageAnalysisTopic, data);
}

async function publishToTopic(topicName: string, data: any) {
  const dataBuffer = Buffer.from(JSON.stringify(data));
  try {
    const messageId = await pubsub.topic(topicName).publish(dataBuffer);
    console.log(`Message ${messageId} published to ${topicName}.`);
  } catch (error) {
    console.error(`Error publishing message to ${topicName}:`, error);
  }
}
