import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LESSONS_KEY,
  PROGRESS_KEY,
  TTS_HINT_KEY,
  readJson,
  writeJson,
  probeStorage
} from "./storage";

describe("storage keys", () => {
  it("uses kid-learning-english prefixed keys", () => {
    expect(LESSONS_KEY).toBe("kid-learning-english.lessons.v1");
    expect(PROGRESS_KEY).toBe("kid-learning-english.progress.v1");
    expect(TTS_HINT_KEY).toBe("kid-learning-english.tts-hint.v1");
  });
});

describe("readJson / writeJson", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips JSON", () => {
    writeJson(LESSONS_KEY, [{ id: "a" }]);
    expect(readJson(LESSONS_KEY, [])).toEqual([{ id: "a" }]);
  });

  it("returns fallback for missing or corrupt values", () => {
    expect(readJson(LESSONS_KEY, [{ id: "fallback" }])).toEqual([{ id: "fallback" }]);
    window.localStorage.setItem(LESSONS_KEY, "{not-json");
    expect(readJson(LESSONS_KEY, [])).toEqual([]);
  });

  it("returns false from probeStorage when setItem throws", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(probeStorage()).toBe(false);
  });
});
