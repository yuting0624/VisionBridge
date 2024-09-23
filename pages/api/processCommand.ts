import type { NextApiRequest, NextApiResponse } from 'next';
import { SessionsClient } from '@google-cloud/dialogflow-cx';

const projectId = process.env.VERTEX_AI_PROJECT_ID;
const location = process.env.VERTEX_AI_LOCATION;
const agentId = process.env.VERTEX_AI_AGENT_ID;

// エンドポイントを正しく設定
const endpoint = 'asia-northeast1-dialogflow.googleapis.com';
const sessionClient = new SessionsClient({ apiEndpoint: endpoint });


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { command } = req.body;
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
      const result = response.queryResult;
      if (result) {

        let dialogflowResponse;

        if (result.match && result.match.intent) {
 
        } else {
 
          if (result.responseMessages && result.responseMessages.length > 0) {
            for (const message of result.responseMessages) {
              if (message.text && message.text.text && message.text.text.length > 0) {
                const generatedResponse = message.text.text[0];
                try {
                  // JSON文字列から実際のJSONオブジェクトを抽出
                  const jsonMatch = generatedResponse.match(/```json\n([\s\S]*?)\n```/);
                  if (jsonMatch && jsonMatch[1]) {
                    dialogflowResponse = JSON.parse(jsonMatch[1]);
                  } else {
                    throw new Error('JSON not found in the response');
                  }
                } catch (error) {
                  console.error('Error parsing generator response:', error);
                  dialogflowResponse = {
                    action: 'NO_MATCH',
                    fulfillmentText: '申し訳ありません。正しく理解できませんでした。',
                    parameters: {}
                  };
                }
                break;
              }
            }
          }
        }

        if (!dialogflowResponse) {
          dialogflowResponse = {
            action: 'NO_MATCH',
            fulfillmentText: '応答を生成できませんでした。',
            parameters: {}
          };
        }

        console.log('Sending response:', JSON.stringify(dialogflowResponse, null, 2));
        res.status(200).json(dialogflowResponse);
      } else {
        console.log('No query result.');
        res.status(200).json({ 
          action: 'ERROR',
          fulfillmentText: '応答を取得できませんでした。',
          parameters: {}
        });
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