import { speakText } from './speechSynthesis';

type CommandHandler = () => void;

const commands: { [key: string]: CommandHandler } = {};

let recognition: any;

export function initializeSpeechRecognition(cameraHandlers: {
  startCamera: () => void;
  stopCamera: () => void;
  startAnalysis: () => void;
  stopAnalysis: () => void;
  captureImage: () => void;
  toggleMode: () => void;
}) {
  if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
    recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'ja-JP';

    recognition.onresult = async (event: any) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.trim().toLowerCase();

      console.log('Recognized command:', command);

      if (command) {
        try {
          const response = await fetch('/api/processCommand', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
          }
          const result = await response.json();
          console.log('Processed command result:', result);
          
          let action = 'unknown';
          let parameters = {};
          
          if (result.response && result.response.candidates && result.response.candidates.length > 0) {
            const candidateText = result.response.candidates[0].content.parts[0].text;
            if (candidateText.toLowerCase().includes('カメラを起動')) {
              action = 'startCamera';
            }
          }
          
          executeAction(action, parameters, cameraHandlers);
        } catch (error: any) {
          console.error('Error processing command:', error);
          speakText('コマンドの処理中にエラーが発生しました。詳細: ' + error.message);
        }
      }
    };

  } else {
    console.error('Web Speech API is not supported in this browser.');
  }
}

export function startSpeechRecognition() {
  if (recognition) {
    recognition.start();
  }
}

export function stopSpeechRecognition() {
  if (recognition) {
    recognition.stop();
  }
}

function executeAction(action: string, parameters: any, cameraHandlers: {
  startCamera: () => void;
  stopCamera: () => void;
  startAnalysis: () => void;
  stopAnalysis: () => void;
  captureImage: () => void;
  toggleMode: () => void;
}) {
  switch (action) {
    case 'startCamera':
      cameraHandlers.startCamera();
      speakText('カメラを起動しました。');
      break;
    case 'stopCamera':
      cameraHandlers.stopCamera();
      speakText('カメラを停止しました。');
      break;
    case 'startAnalysis':
      cameraHandlers.startAnalysis();
      speakText('分析を開始しました。');
      break;
    case 'stopAnalysis':
      cameraHandlers.stopAnalysis();
      speakText('分析を停止しました。');
      break;
    case 'captureImage':
      cameraHandlers.captureImage();
      speakText('画像を撮影しました。');
      break;
    case 'switchMode':
      cameraHandlers.toggleMode();
      speakText('モードを切り替えました。');
      break;
    default:
      console.log('Unknown action:', action);
      speakText('認識できないコマンドです。');
  }
}

export function addVoiceCommand(command: string, handler: CommandHandler) {
  commands[command] = handler;
}