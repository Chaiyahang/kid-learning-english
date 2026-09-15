interface SpeakOptions {
  lang?: string;
  pitch?: number;
  rate?: number;
}

interface VoiceLike {
  lang: string;
  name: string;
}

// On devices whose system language is Chinese, the default TTS voice is a
// Chinese one and reads English words with Chinese phonetics. Setting only
// utterance.lang is not reliable there, so pick an explicit English voice.
const PREFERRED_VOICE_NAMES = [
  "Samantha", // iOS / macOS en-US
  "Google US English", // Android, desktop Chrome
  "Microsoft Aria", // Edge
  "Microsoft Jenny",
  "Alex", // macOS
  "Daniel", // macOS en-GB
  "Karen", // macOS en-AU
  "Moira" // macOS en-IE
];

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function pickPreferredVoice(
  voices: VoiceLike[],
  language = "en"
): VoiceLike | null {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith(language));
  if (!english.length) return null;

  for (const name of PREFERRED_VOICE_NAMES) {
    const lowered = name.toLowerCase();
    const match = english.find((voice) => voice.name.toLowerCase().includes(lowered));
    if (match) return match;
  }

  return english.find((voice) => voice.lang.toLowerCase().startsWith("en-us")) || english[0];
}

let cachedVoice: VoiceLike | null = null;

export function refreshSpeechVoice(): void {
  if (!isSpeechSupported()) return;
  const getVoices = (window.speechSynthesis as SpeechSynthesis).getVoices;
  if (typeof getVoices !== "function") return;
  cachedVoice = pickPreferredVoice(getVoices.call(window.speechSynthesis));
}

if (isSpeechSupported()) {
  refreshSpeechVoice();
  // Voices load asynchronously on iOS and Chrome; re-pick when they arrive.
  if (typeof window.speechSynthesis.addEventListener === "function") {
    window.speechSynthesis.addEventListener("voiceschanged", refreshSpeechVoice);
  }
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}

export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  if (!isSpeechSupported()) return Promise.resolve();
  if (!text.trim()) return Promise.resolve();

  window.speechSynthesis.cancel();

  return new Promise((resolve) => {
    let fallbackTimer: number | null = null;
    const finish = () => {
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      resolve();
    };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || "en-US";
    if (!cachedVoice) refreshSpeechVoice();
    if (cachedVoice) utterance.voice = cachedVoice as SpeechSynthesisVoice;
    utterance.pitch = options.pitch ?? 1.12;
    utterance.rate = options.rate ?? 0.78;
    utterance.onend = finish;
    utterance.onerror = finish;
    fallbackTimer = window.setTimeout(finish, Math.max(1800, text.length * 180));
    window.speechSynthesis.speak(utterance);
  });
}
