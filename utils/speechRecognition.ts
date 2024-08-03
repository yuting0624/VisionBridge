type CommandHandler = () => void;

const commands: { [key: string]: CommandHandler } = {};

export function initializeSpeechRecognition() {
  if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'ja-JP';

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.trim().toLowerCase();

      console.log('Recognized command:', command);

      if (commands[command]) {
        commands[command]();
      }
    };

    recognition.start();
  } else {
    console.error('Web Speech API is not supported in this browser.');
  }
}

export function addVoiceCommand(command: string, handler: CommandHandler) {
  commands[command] = handler;
}