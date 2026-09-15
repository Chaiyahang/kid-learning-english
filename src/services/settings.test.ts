import { beforeEach, describe, expect, it } from "vitest";
import { PLAY_SETTINGS_KEY, loadPlaySettings, savePlaySettings } from "./settings";

describe("play settings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to manual play once", () => {
    expect(loadPlaySettings()).toEqual({ autoPlay: false, repeatCount: 1 });
  });

  it("round-trips saved settings", () => {
    savePlaySettings({ autoPlay: true, repeatCount: 2 });
    expect(loadPlaySettings()).toEqual({ autoPlay: true, repeatCount: 2 });
  });

  it("falls back to sane values for corrupt input", () => {
    window.localStorage.setItem(PLAY_SETTINGS_KEY, '{"autoPlay":"yes","repeatCount":9}');
    expect(loadPlaySettings()).toEqual({ autoPlay: false, repeatCount: 1 });
  });
});
