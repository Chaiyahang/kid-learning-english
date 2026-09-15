import { beforeEach, describe, expect, it } from "vitest";
import { createReviewId } from "../data/parseReviewText";
import { LESSONS_KEY, PROGRESS_KEY } from "../services/storage";
import { useLessons } from "./useLessons";
import type { ReviewItem } from "../types/review";

function word(english: string, chinese: string): ReviewItem {
  return {
    id: createReviewId("item"),
    english,
    chinese,
    category: "word",
    emoji: "📝"
  };
}

describe("useLessons", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty and persists a saved lesson", () => {
    const store = useLessons();
    expect(store.lessons.value).toEqual([]);
    expect(store.activeLesson.value).toBeNull();

    const lesson = store.saveLesson("pineapple 菠萝", [word("pineapple", "菠萝")]);
    expect(lesson.title).toMatch(/复习/);
    expect(store.lessons.value).toHaveLength(1);
    expect(store.activeLesson.value?.id).toBe(lesson.id);
    expect(store.activeIndex.value).toBe(0);

    const again = useLessons();
    expect(again.lessons.value[0].id).toBe(lesson.id);
    expect(JSON.parse(window.localStorage.getItem(LESSONS_KEY) || "[]")).toHaveLength(1);
    expect(JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || "{}").activeLessonId).toBe(
      lesson.id
    );
  });

  it("cycles next and previous and remembers the index", () => {
    const store = useLessons();
    store.saveLesson("a\nb", [word("a", "啊"), word("b", "哔")]);
    expect(store.activeItem.value?.english).toBe("a");
    store.nextItem();
    expect(store.activeItem.value?.english).toBe("b");
    store.nextItem();
    expect(store.activeItem.value?.english).toBe("a");
    store.previousItem();
    expect(store.activeItem.value?.english).toBe("b");

    const again = useLessons();
    expect(again.activeItem.value?.english).toBe("b");
  });

  it("deletes a lesson and points active at the remaining first item", () => {
    const store = useLessons();
    const first = store.saveLesson("one", [word("one", "一")]);
    const second = store.saveLesson("two", [word("two", "二")]);
    expect(store.activeLesson.value?.id).toBe(second.id);
    store.deleteLesson(second.id);
    expect(store.lessons.value.map((lesson) => lesson.id)).toEqual([first.id]);
    expect(store.activeLesson.value?.id).toBe(first.id);
    store.deleteLesson(first.id);
    expect(store.lessons.value).toEqual([]);
    expect(store.activeLesson.value).toBeNull();
  });

  it("numbers same-day titles", () => {
    const store = useLessons();
    const a = store.saveLesson("a", [word("a", "啊")]);
    const b = store.saveLesson("b", [word("b", "哔")]);
    expect(a.title.endsWith("复习")).toBe(true);
    expect(b.title.endsWith("复习 2")).toBe(true);
  });
});
