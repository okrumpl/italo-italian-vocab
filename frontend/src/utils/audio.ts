// Sdílený AudioContext singleton
let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume pokud je suspended (autoplay policy)
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
};

// Zvukový syntetizátor s využitím Web Audio API
export const playSound = (type: 'correct' | 'incorrect' | 'complete' | 'match-correct' | 'match-incorrect') => {
  const audioCtx = getAudioContext();
  if (!audioCtx) return;

  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;

    if (type === 'correct') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'incorrect') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(185.00, now);
      osc.frequency.setValueAtTime(130.81, now + 0.15);
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'complete') {
      osc.type = 'sine';
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, index) => {
        osc.frequency.setValueAtTime(freq, now + index * 0.12);
      });
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.65);
    } else if (type === 'match-correct') {
      osc.frequency.setValueAtTime(600, now);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'match-incorrect') {
      osc.frequency.setValueAtTime(150, now);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (error) {
    console.error('Přehrávání zvuku se nezdařilo:', error);
  }
};

// Funkce pro předčítání italského textu (Web Speech API)
export const speakItalian = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = 0.85;
    
    // Pokusíme se najít italský hlas
    const voices = window.speechSynthesis.getVoices();
    const itVoice = voices.find(voice => voice.lang.startsWith('it'));
    if (itVoice) {
      utterance.voice = itVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
};

// Fisher-Yates shuffle — rovnoměrný shuffle
export const shuffle = <T>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
