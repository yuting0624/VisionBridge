import type { NextApiRequest, NextApiResponse } from 'next';
import { SessionsClient } from '@google-cloud/dialogflow-cx';

const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const location = process.env.DIALOGFLOW_LOCATION;
const agentId = process.env.DIALOGFLOW_AGENT_ID;

const sessionsClient = new SessionsClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { command } = req.body;
    const sessionId = Math.random().toString(36).substring(7);
    if (!projectId || !location || !agentId) {
      throw new Error('プロジェクトID、ロケーション、エージェントIDが指定されていません。');
    }
    const sessionPath = sessionsClient.projectLocationAgentSessionPath(
      projectId,
      location,
      agentId,
      sessionId
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: command,
        },
        languageCode: 'ja',
      },
    };

    try {
      const [response] = await sessionsClient.detectIntent(request);
      const result = response.queryResult;
      if (result) {
        res.status(200).json({
          action: result.intent?.displayName,
          parameters: result.parameters?.fields,
        });
      } else {
        console.error('結果が取得できませんでした。');
        res.status(500).json({ error: 'Failed to process command' });
      }
    } catch (error) {
      console.error('インテントの検出中にエラーが発生しました:', error);
      res.status(500).json({ error: 'Failed to process command' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}