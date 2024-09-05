import { SessionsClient } from '@google-cloud/dialogflow-cx';
import { useEffect, useState } from 'react';

const projectId = process.env.NEXT_PUBLIC_DIALOGFLOW_PROJECT_ID;
const location = process.env.NEXT_PUBLIC_DIALOGFLOW_LOCATION;
const agentId = process.env.NEXT_PUBLIC_DIALOGFLOW_AGENT_ID;

const sessionsClient = new SessionsClient();

const useDialogFlow = () => {
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(7));
  }, []);

  const detectIntent = async (query: string) => {
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
          text: query,
        },
        languageCode: 'ja',
      },
    };

    try {
      const [response] = await sessionsClient.detectIntent(request);
      return response.queryResult;
    } catch (error) {
      console.error('Error detecting intent:', error);
      throw error;
    }
  };

  return { detectIntent };
};

export const VoiceCommandProcessor: React.FC = () => {
  const { detectIntent } = useDialogFlow();
  const [isListening, setIsListening] = useState(false);

  const processVoiceCommand = async (command: string) => {
    try {
      const result = await detectIntent(command);
      if (result.intent) {
        switch (result.intent.displayName) {
          case 'StartNavigation':
            // ナビゲーション開始ロジック
            console.log('Starting navigation to:', result.parameters?.fields?.destination?.stringValue);
            break;
          case 'CaptureImage':
            // 画像キャプチャロジック
            console.log('Capturing image');
            break;
          case 'DescribeEnvironment':
            // 環境描写ロジック
            console.log('Describing environment');
            break;
          default:
            console.log('Unknown intent:', result.intent.displayName);
        }
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const command = event.results[0][0].transcript;
        processVoiceCommand(command);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
    } else {
      console.error('Web Speech API is not supported in this browser.');
    }
  };

  return (
    <div>
      <button onClick={startListening} disabled={isListening}>
        {isListening ? '音声認識中...' : '音声コマンドを開始'}
      </button>
    </div>
  );
};

export default useDialogFlow;