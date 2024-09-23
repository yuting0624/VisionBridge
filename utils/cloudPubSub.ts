let lastPublishTime = 0;
const PUBLISH_INTERVAL = 8000; // 8秒ごとに1回送信

export async function publishVideoStream(data: Blob) {

  const currentTime = Date.now();
  if (currentTime - lastPublishTime < PUBLISH_INTERVAL) {
    console.log('Skipping publish due to rate limiting');
    return;
  }

  const buffer = await data.arrayBuffer();
  const base64Data = Buffer.from(buffer).toString('base64');

  try {
    const response = await fetch('/api/pubsub', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'publishVideoStream', data: base64Data }),
    });

    if (!response.ok) {
      throw new Error('Failed to publish video stream');
    }

    const result = await response.json();
    console.log('Message published:', result.messageId);
    lastPublishTime = currentTime;
  } catch (error) {
    console.error('Error publishing video stream:', error);
    throw error;
  }
}

export async function subscribeToVideoAnalysisResults(): Promise<any> {
  try {
    const response = await fetch('/api/pubsub');
    if (response.status === 204) {
      return null; // 結果がまだない場合
    }
    if (!response.ok) {
      throw new Error('Failed to receive video analysis results');
    }
    return await response.json();
  } catch (error) {
    console.error('Error receiving video analysis results:', error);
    throw error;
  }
}

export async function pollForVideoAnalysisResults(maxAttempts: number = 10, interval: number = 5000): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await subscribeToVideoAnalysisResults();
    if (result) {
      return result;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('Timeout waiting for video analysis results');
}
