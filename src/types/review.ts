export type ItemCategory = "word" | "sentence";

export interface ReviewItem {
  id: string;
  english: string;
  chinese: string;
  category: ItemCategory;
  emoji: string;
}

export interface ReviewLesson {
  id: string;
  dateLabel: string;
  title: string;
  teacherText: string;
  items: ReviewItem[];
  createdAt: string;
}

export interface Progress {
  activeLessonId: string;
  indexByLessonId: Record<string, number>;
}

export const emptyProgress = (): Progress => ({
  activeLessonId: "",
  indexByLessonId: {}
});
