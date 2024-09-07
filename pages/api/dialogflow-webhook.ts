import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { queryResult } = req.body;
    const intent = queryResult.intent.displayName;

    switch (intent) {
      case 'startCamera':
        // カメラ起動のロジックをここに実装
        res.status(200).json({
          fulfillmentText: 'カメラを起動しました。',
          action: 'startCamera',
        });
        break;
      // 他のインテントのケースをここに追加
      default:
        res.status(400).json({ error: 'Unknown intent' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}