import { PubSub } from '@google-cloud/pubsub';

const pubsub = new PubSub();
const subscriptionName = 'visionbridge-results-subscription';

export async function startResultsListener() {
  const subscription = pubsub.subscription(subscriptionName);

  subscription.on('message', message => {
    console.log('Received message:', message.data.toString());
    // ここでWebSocketを使用してクライアントに結果を送信
    message.ack();
  });

  console.log(`Listening for messages on ${subscriptionName}`);
}