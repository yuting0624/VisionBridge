let speechRate = 1.3;
let speechVolume = 1;

let audioContext: AudioContext | null = null;
let _isAudioInitialized = false;
let audioQueue: string[] = [];
let isPlaying = false;

export function isAudioInitialized(): boolean {
  return _isAudioInitialized;
}

export async function initializeAudio(): Promise<void> {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  _isAudioInitialized = true;
  await playEmptySoundForMobile();
}

async function playEmptySoundForMobile(): Promise<void> {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  oscillator.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.001);

  return new Promise((resolve) => {
    setTimeout(resolve, 1);
  });
}

export async function speakText(text: string): Promise<void> {
  if (!_isAudioInitialized) {
    await initializeAudio();
  }

  audioQueue.push(text);
  if (!isPlaying) {
    playNextInQueue();
  }
}

async function playNextInQueue() {
  if (audioQueue.length === 0) {
    isPlaying = false;
    return;
  }

  isPlaying = true;
  const text = audioQueue.shift()!;

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, rate: speechRate, volume: speechVolume }),
    });

    if (!response.ok) {
      throw new Error('TTS API request failed');
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext!.decodeAudioData(arrayBuffer);
    const source = audioContext!.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext!.destination);
    
    source.onended = () => {
      playNextInQueue();
    };

    source.start();
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    playNextInQueue();
  }
}

export function stopSpeaking() {
  audioQueue = [];
  if (audioContext) {
    audioContext.close().then(() => {
      audioContext = null;
      _isAudioInitialized = false;
    });
  }
}

export function setSpeechRate(rate: number) {
  speechRate = rate;
}

export function setSpeechVolume(volume: number) {
  speechVolume = volume;
}

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}