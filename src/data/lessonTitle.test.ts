import { describe, expect, it } from "vitest";
import { buildLessonTitle, formatDateLabel } from "./lessonTitle";

describe("formatDateLabel", () => {
  it("formats month and day without padding", () => {
    expect(formatDateLabel(new Date(2026, 8, 15))).toBe("9月15日");
    expect(formatDateLabel(new Date(2026, 0, 3))).toBe("1月3日");
  });
});

describe("buildLessonTitle", () => {
  it("uses the base title on the first save of the day", () => {
    expect(buildLessonTitle("9月15日", [])).toBe("9月15日复习");
  });

  it("appends an increment when the base title exists", () => {
    expect(buildLessonTitle("9月15日", ["9月15日复习"])).toBe("9月15日复习 2");
    expect(buildLessonTitle("9月15日", ["9月15日复习", "9月15日复习 2"])).toBe(
      "9月15日复习 3"
    );
  });
});
