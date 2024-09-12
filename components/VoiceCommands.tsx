import React, { useState, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { speakText } from '../utils/speechSynthesis';
import { handleCommand } from '../utils/speechRecognition';

interface VoiceCommandsProps {
  onStartCamera: () => void;
  onStopCamera: () => void;
  onToggleAnalysis: () => void;
  onCaptureImage: () => void;
  onToggleMode: () => void;
  onStopSpeaking: () => void;
}

const VoiceCommands: React.FC<VoiceCommandsProps> = ({
  onStartCamera,
  onStopCamera,
  onToggleAnalysis,
  onCaptureImage,
  onToggleMode,
  onStopSpeaking,
}) => {
  const { t } = useTranslation('common');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(() => {
    setIsListening(true);
    setError(null);

    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        console.log('音声認識開始');
        //speakText('音声認識を開始しました');
      };

      recognition.onresult = (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase();
        setTranscript(command);
        handleCommand(command, onStartCamera, onStopCamera, onCaptureImage, onToggleAnalysis, onToggleMode, onStopSpeaking, speakText);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setError('音声認識エラー: ' + event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('音声認識終了');
        setIsListening(false);
        //speakText('音声認識を終了しました');
      };

      recognition.start();
    } else {
      setError('このブラウザは音声認識をサポートしていません。');
      setIsListening(false);
    }
  }, [onStartCamera, onStopCamera, onCaptureImage, onToggleAnalysis, onToggleMode, onStopSpeaking]);

  const stopListening = useCallback(() => {
    if ('webkitSpeechRecognition' in window) {
      (window as any).webkitSpeechRecognition.abort();
    }
    setIsListening(false);
  }, []);

  return (
    <div>
      <button
        onClick={isListening ? stopListening : startListening}
        className={`px-4 py-2 rounded ${
          isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        } text-white font-bold`}
      >
        {isListening ? t('stopListening') : t('startListening')}
      </button>
      {transcript && <p>{t('lastCommand')}: {transcript}</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default VoiceCommands;