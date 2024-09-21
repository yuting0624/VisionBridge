import { speakText, stopSpeaking } from './speechSynthesis';
import { getDirections, interpretDirectionsWithGemini } from './navigationHelper';

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
  startNavigation: (destination: string) => Promise<void>;
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
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
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
          const response = await fetch('/api/stt', {
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
        await speakText(data.fulfillmentText);
        break;
      case 'stopCamera':
        handlers.stopCamera();
        await speakText(data.fulfillmentText);
        break;
      case 'captureImage':
        await handlers.captureImage();
        //await speakText(data.fulfillmentText);
        break;
      case 'startAnalysis':
        handlers.toggleAnalysis();
        //await speakText(data.fulfillmentText);
        break;
      case 'stopAnalysis':
        handlers.toggleAnalysis();
        //await speakText(data.fulfillmentText);
        break;
      case 'toggleMode':
        handlers.toggleMode();
        await speakText(data.fulfillmentText);
        break;
      case 'stopSpeaking':
        stopSpeaking();
        await speakText(data.fulfillmentText);
        break;
      case 'startNavigation':
        if (data.parameters && data.parameters.destination) {
          await speakText(data.fulfillmentText);
          await handlers.startNavigation(data.parameters.destination);
        } else {
          await speakText('目的地が指定されていません。');
        }
        break;
      default:
        console.log('Unknown action:', data.action);
        await speakText(data.fulfillmentText);
    }
  } catch (error) {
    console.error('Error processing command:', error);
    await speakText('コマンドの処理中にエラーが発生しました');
  }
};

export async function startNavigation(destination: string): Promise<string> {
  try {
    console.log('Starting navigation to:', destination);
    const currentPosition = await getCurrentPosition();
    console.log('Current position:', currentPosition);
    const directionsData = await getDirections(
      `${currentPosition.latitude},${currentPosition.longitude}`,
      destination
    );
    console.log('Directions data:', directionsData);
    const interpretedDirections = await interpretDirectionsWithGemini(directionsData);
    console.log('Interpreted directions:', interpretedDirections);
    speakText(interpretedDirections);
    return interpretedDirections;
  } catch (error) {
    console.error('Navigation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'ナビゲーションの開始中にエラーが発生しました';
    await speakText(errorMessage);
    throw new Error(errorMessage);
  }
}

function getCurrentPosition(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => reject(error)
    );
  });
}