interface SpeakOptions {
  lang?: string;
  pitch?: number;
  rate?: number;
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
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
    utterance.pitch = options.pitch ?? 1.12;
    utterance.rate = options.rate ?? 0.78;
    utterance.onend = finish;
    utterance.onerror = finish;
    fallbackTimer = window.setTimeout(finish, Math.max(1800, text.length * 180));
    window.speechSynthesis.speak(utterance);
  });
}
