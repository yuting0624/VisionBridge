import React, { useState } from 'react';
import { Box, Button, Text, VStack } from '@chakra-ui/react';

const VoiceGuide: React.FC = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakGuide = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const guides = [
    "ようこそ、VisionBridgeへ。このアプリは、あなたの周囲をナビゲートし理解するのに役立ちます。",
"カメラを使うには、画面上部の「カメラ開始」ボタンを押してください。",
"画像をキャプチャして分析するには、「画像キャプチャ」ボタンを押してください。",
"ナビゲーションセクションでは、現在の場所と近くの場所が表示されます。",
"音声コマンドでアプリを操作できます。「リスニング開始」と言って始めてください。"
  ];

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">Voice Guide</Text>
      {guides.map((guide, index) => (
        <Button
          key={index}
          onClick={() => speakGuide(guide)}
          isDisabled={isSpeaking}
        >
          Speak Guide {index + 1}
        </Button>
      ))}
    </VStack>
  );
};

export default VoiceGuide;