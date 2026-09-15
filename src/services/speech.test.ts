import { describe, expect, it } from "vitest";
import { pickPreferredVoice } from "./speech";

const voices = [
  { lang: "zh-CN", name: "Ting-Ting" },
  { lang: "en-US", name: "Samantha" },
  { lang: "en-GB", name: "Daniel" },
  { lang: "fr-FR", name: "Amélie" }
];

describe("pickPreferredVoice", () => {
  it("prefers a known high-quality english voice", () => {
    expect(pickPreferredVoice(voices)?.name).toBe("Samantha");
  });

  it("falls back to an en-US voice when no preferred name exists", () => {
    const result = pickPreferredVoice([
      { lang: "zh-CN", name: "Ting-Ting" },
      { lang: "en-US", name: "Compact Voice" },
      { lang: "en-GB", name: "British Voice" }
    ]);
    expect(result?.name).toBe("Compact Voice");
  });

  it("falls back to the first english voice by list order", () => {
    const result = pickPreferredVoice([
      { lang: "en-GB", name: "British Voice" },
      { lang: "en-AU", name: "Australian Voice" }
    ]);
    expect(result?.name).toBe("British Voice");
  });

  it("returns null when the device has no english voice", () => {
    expect(pickPreferredVoice([{ lang: "zh-CN", name: "Ting-Ting" }])).toBeNull();
  });

  it("matches preferred names case-insensitively", () => {
    const result = pickPreferredVoice([
      { lang: "en-US", name: "google us english" }
    ]);
    expect(result?.name).toBe("google us english");
  });
});
