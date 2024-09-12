import { speakText } from './speechSynthesis';

interface SpeechRecognitionHandlers {
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  toggleAnalysis: () => void;
  captureImage: () => Promise<void>;
  toggleMode: () => void;
  stopSpeaking: () => void;
  onTranscript: (transcript: string) => void;
  onError: (error: string) => void;
  onListeningChange: (isListening: boolean) => void;
}

let isListening = false;
let handlers: SpeechRecognitionHandlers;
let mediaRecorder: MediaRecorder | null = null;
let audioStream: MediaStream | null = null;

export function initializeSpeechRecognition(cameraHandlers: SpeechRecognitionHandlers) {
  handlers = cameraHandlers;
}

export async function startSpeechRecognition() {
  if (isListening) return;

  try {
    if (!audioStream) {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    mediaRecorder = new MediaRecorder(audioStream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      isListening = false;
      handlers.onListeningChange(false);

      const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        try {
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ audio: base64Audio.split(',')[1] }),
          });
          const data = await response.json();
          if (data.transcription) {
            handlers.onTranscript(data.transcription);
            await handleCommand(data.transcription, handlers);
          }
        } catch (error) {
          console.error('Error processing audio:', error);
          handlers.onError('音声処理エラー: ' + (error instanceof Error ? error.message : String(error)));
        }
      };
    };

    mediaRecorder.start();
    isListening = true;
    handlers.onListeningChange(true);

    setTimeout(() => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }, 5000); // 5秒間録音
  } catch (error) {
    console.error('Speech recognition error:', error);
    handlers.onError('音声認識エラー: ' + (error instanceof Error ? error.message : String(error)));
    stopSpeechRecognition();
  }
}

export function stopSpeechRecognition() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  isListening = false;
  handlers.onListeningChange(false);
}

export const handleCommand = async (
  command: string,
  handlers: SpeechRecognitionHandlers
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
        await handlers.startCamera();
        speakText(data.fulfillmentText);
        break;
      case 'stopCamera':
        handlers.stopCamera();
        speakText(data.fulfillmentText);
        break;
      case 'captureImage':
        await handlers.captureImage();
        //speakText(data.fulfillmentText);
        break;
      case 'startAnalysis':
        handlers.toggleAnalysis();
        //speakText(data.fulfillmentText);
        break;
      case 'stopAnalysis':
        handlers.toggleAnalysis();
        //speakText(data.fulfillmentText);
        break;
      case 'toggleMode':
        handlers.toggleMode();
        speakText(data.fulfillmentText);
        break;
      case 'stopSpeaking':
        handlers.stopSpeaking();
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