let speechRate = 1.3;
let speechVolume = 1;

export function speakText(text: string) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = speechRate;
    utterance.volume = speechVolume;
    window.speechSynthesis.speak(utterance);
  } else {
    console.error("Speech synthesis not supported");
  }
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function setSpeechRate(rate: number) {
  speechRate = rate;
}

export function setSpeechVolume(volume: number) {
  speechVolume = volume;
}