import { computed, ref } from "vue";
import { createReviewId } from "../data/parseReviewText";
import { buildLessonTitle, formatDateLabel } from "../data/lessonTitle";
import {
  LESSONS_KEY,
  PROGRESS_KEY,
  probeStorage,
  readJson,
  writeJson
} from "../services/storage";
import { emptyProgress, type Progress, type ReviewItem, type ReviewLesson } from "../types/review";

function persist(lessons: ReviewLesson[], progress: Progress): boolean {
  const lessonsOk = writeJson(LESSONS_KEY, lessons);
  const progressOk = writeJson(PROGRESS_KEY, progress);
  return lessonsOk && progressOk;
}

export function useLessons() {
  const lessons = ref<ReviewLesson[]>(readJson<ReviewLesson[]>(LESSONS_KEY, []));
  const progress = ref<Progress>(readJson<Progress>(PROGRESS_KEY, emptyProgress()));
  const storageAvailable = ref(probeStorage());

  const activeLesson = computed(() => {
    return lessons.value.find((lesson) => lesson.id === progress.value.activeLessonId) || null;
  });

  const activeIndex = computed(() => {
    const lesson = activeLesson.value;
    if (!lesson?.items.length) return 0;
    const stored = progress.value.indexByLessonId[lesson.id] || 0;
    return Math.min(Math.max(stored, 0), lesson.items.length - 1);
  });

  const activeItem = computed(() => activeLesson.value?.items[activeIndex.value] || null);

  function commit(nextLessons: ReviewLesson[], nextProgress: Progress) {
    lessons.value = nextLessons;
    progress.value = nextProgress;
    storageAvailable.value = persist(nextLessons, nextProgress);
  }

  function saveLesson(teacherText: string, items: ReviewItem[]): ReviewLesson {
    const dateLabel = formatDateLabel();
    const title = buildLessonTitle(
      dateLabel,
      lessons.value.map((lesson) => lesson.title)
    );
    const lesson: ReviewLesson = {
      id: createReviewId("lesson"),
      dateLabel,
      title,
      teacherText,
      items,
      createdAt: new Date().toISOString()
    };
    commit([lesson, ...lessons.value], {
      activeLessonId: lesson.id,
      indexByLessonId: { ...progress.value.indexByLessonId, [lesson.id]: 0 }
    });
    return lesson;
  }

  function selectLesson(lessonId: string) {
    if (!lessons.value.some((lesson) => lesson.id === lessonId)) return;
    commit(lessons.value, { ...progress.value, activeLessonId: lessonId });
  }

  function deleteLesson(lessonId: string) {
    const nextLessons = lessons.value.filter((lesson) => lesson.id !== lessonId);
    const indexByLessonId = { ...progress.value.indexByLessonId };
    delete indexByLessonId[lessonId];
    const activeLessonId =
      progress.value.activeLessonId === lessonId
        ? nextLessons[0]?.id || ""
        : progress.value.activeLessonId;
    commit(nextLessons, { activeLessonId, indexByLessonId });
  }

  function setActiveIndex(nextIndex: number) {
    const lesson = activeLesson.value;
    if (!lesson?.items.length) return;
    const wrapped = (nextIndex + lesson.items.length) % lesson.items.length;
    commit(lessons.value, {
      ...progress.value,
      indexByLessonId: { ...progress.value.indexByLessonId, [lesson.id]: wrapped }
    });
  }

  function nextItem() {
    setActiveIndex(activeIndex.value + 1);
  }

  function previousItem() {
    setActiveIndex(activeIndex.value - 1);
  }

  return {
    lessons,
    progress,
    storageAvailable,
    activeLesson,
    activeIndex,
    activeItem,
    saveLesson,
    selectLesson,
    deleteLesson,
    setActiveIndex,
    nextItem,
    previousItem
  };
}
