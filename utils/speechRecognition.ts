import { speakText } from './speechSynthesis';

let recognition: any;

export function initializeSpeechRecognition(cameraHandlers: {
  startCamera: () => void;
  stopCamera: () => void;
  toggleAnalysis: () => void;
  captureImage: () => void;
  toggleMode: () => void;
  stopSpeaking: () => void;
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
        await handleCommand(
          command,
          cameraHandlers.startCamera,
          cameraHandlers.stopCamera,
          cameraHandlers.captureImage,
          cameraHandlers.toggleAnalysis,
          cameraHandlers.toggleMode,
          cameraHandlers.stopSpeaking,
          speakText
        );
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

export const handleCommand = async (
  command: string,
  onStartCamera: () => void,
  onStopCamera: () => void,
  onCaptureImage: () => void,
  onToggleAnalysis: () => void,
  onToggleMode: () => void,
  onStopSpeaking: () => void, 
  speakText: (text: string) => void
) => {
  try {
    const response = await fetch('/api/processCommand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });
    const data = await response.json();
    console.log('Processed command result:', data);

    switch (data.action) {
      case 'startCamera':
        onStartCamera();
        speakText(data.fulfillmentText);
        break;
      case 'stopCamera':
        onStopCamera();
        speakText(data.fulfillmentText);
        break;
      case 'captureImage':
        onCaptureImage();
        speakText(data.fulfillmentText);
        break;
      case 'startAnalysis':
        await onToggleAnalysis();
        speakText(data.fulfillmentText);
        break;
      case 'stopAnalysis':
        await onToggleAnalysis();
        speakText(data.fulfillmentText);
        break;
      case 'toggleMode':
        onToggleMode();
        speakText(data.fulfillmentText);
        break;
      case 'stopSpeaking':
        onStopSpeaking();
        speakText(data.fulfillmentText);
        break;
      default:
        console.log('Unknown action:', data.action);
        speakText(data.fulfillmentText);
    }
  } catch (error) {
    console.error('Error processing command:', error);
    speakText('コマンドの処理中にエラーが発生しました');
  }
};