import type { NextApiRequest, NextApiResponse } from 'next';
import { SessionsClient } from '@google-cloud/dialogflow-cx';
import { analyzeImageWithAI } from '../../utils/imageAnalysis';

const projectId = process.env.VERTEX_AI_PROJECT_ID;
const location = process.env.VERTEX_AI_LOCATION;
const agentId = process.env.VERTEX_AI_AGENT_ID;

const sessionClient = new SessionsClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { command, imageData } = req.body;
      const sessionId = Math.random().toString(36).substring(7);
      const sessionPath = sessionClient.projectLocationAgentSessionPath(
        projectId ?? '',
        location ?? '',
        agentId ?? '',
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

      const [response] = await sessionClient.detectIntent(request);
      console.log('Detected intent');

      const result = response.queryResult;
      if (result) {
        console.log(`  Query: ${result.text}`);
        console.log(`  Response: ${result.responseMessages}`);

        if (result.intent) {
          console.log(`  Intent: ${result.intent.displayName}`);

          // インテントに基づいてアクションを実行
          if (result.intent.displayName === 'image_analysis') {
            const analysisResult = await analyzeImageWithAI(imageData, 'normal', null);
            res.status(200).json({
              action: 'image_analysis',
              result: analysisResult,
              fulfillmentText: `画像分析結果: ${analysisResult}`
            });
          } else {
            // その他のインテントの処理
            res.status(200).json({
              action: result.intent.displayName,
              parameters: result.parameters,
              fulfillmentText: result.responseMessages?.[0]?.text?.text?.[0] ?? '意図を理解できませんでした。'
            });
          }
        } else {
          console.log('  No intent matched.');
          res.status(200).json({ action: 'unknown', parameters: {}, fulfillmentText: '意図を理解できませんでした。' });
        }
      }
    } catch (error: any) {
      console.error('Error in processCommand:', error);
      res.status(500).json({ error: 'コマンドの処理中にエラーが発生しました', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}