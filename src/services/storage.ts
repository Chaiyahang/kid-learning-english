export const LESSONS_KEY = "kid-learning-english.lessons.v1";
export const PROGRESS_KEY = "kid-learning-english.progress.v1";
export const TTS_HINT_KEY = "kid-learning-english.tts-hint.v1";

export function probeStorage(): boolean {
  try {
    const token = "kid-learning-english.probe";
    window.localStorage.setItem(token, "1");
    window.localStorage.removeItem(token);
    return true;
  } catch {
    return false;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
