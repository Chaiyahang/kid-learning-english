import { readJson, writeJson } from "./storage";

export interface PlaySettings {
  autoPlay: boolean;
  repeatCount: number;
}

export const PLAY_SETTINGS_KEY = "kid-learning-english.settings.v1";
export const ALLOWED_REPEAT_COUNTS = [1, 2, 3] as const;

function normalizeRepeatCount(value: unknown): number {
  const count = Number(value);
  return (ALLOWED_REPEAT_COUNTS as readonly number[]).includes(count) ? count : 1;
}

export function loadPlaySettings(): PlaySettings {
  const raw = readJson<Partial<PlaySettings>>(PLAY_SETTINGS_KEY, {});
  return {
    autoPlay: raw.autoPlay === true,
    repeatCount: normalizeRepeatCount(raw.repeatCount)
  };
}

export function savePlaySettings(settings: PlaySettings): PlaySettings {
  const normalized: PlaySettings = {
    autoPlay: settings.autoPlay === true,
    repeatCount: normalizeRepeatCount(settings.repeatCount)
  };
  writeJson(PLAY_SETTINGS_KEY, normalized);
  return normalized;
}
