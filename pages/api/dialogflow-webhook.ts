import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Webhook received request:', JSON.stringify(req.body, null, 2));

  if (req.method === 'POST') {
    const { queryResult } = req.body;
    const intent = queryResult?.intent?.displayName;

    console.log('Detected intent:', intent);

    switch (intent) {
      case 'startCamera':
        console.log('Executing startCamera action');
        res.status(200).json({
          fulfillmentText: 'カメラを起動しました。',
          action: 'startCamera',
        });
        break;
      default:
        console.log('Unknown intent:', intent);
        res.status(200).json({ 
          fulfillmentText: '認識できないコマンドです。',
          action: 'unknown'
        });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}