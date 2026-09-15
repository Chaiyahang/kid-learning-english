<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useLessons } from "../composables/useLessons";
import { parseReviewText } from "../data/parseReviewText";

const route = useRoute();
const router = useRouter();
const { lessons, activeLesson, storageAvailable, saveLesson, selectLesson, deleteLesson } =
  useLessons();

const teacherText = ref("");
const previewItems = computed(() => parseReviewText(teacherText.value));
const wordCount = computed(
  () => previewItems.value.filter((item) => item.category === "word").length
);
const sentenceCount = computed(
  () => previewItems.value.filter((item) => item.category === "sentence").length
);
const canSave = computed(() => previewItems.value.length > 0);
const canPlay = computed(() => lessons.value.length > 0);
const showNeedLesson = computed(
  () => route.query.needLesson === "1" && lessons.value.length === 0
);

function lessonCounts(lessonId: string) {
  const lesson = lessons.value.find((item) => item.id === lessonId);
  if (!lesson) return { word: 0, sentence: 0 };
  return {
    word: lesson.items.filter((item) => item.category === "word").length,
    sentence: lesson.items.filter((item) => item.category === "sentence").length
  };
}

function handleSave() {
  if (!canSave.value) return;
  saveLesson(teacherText.value, previewItems.value);
  teacherText.value = "";
  router.push("/play");
}

function handleDelete(lessonId: string) {
  if (!window.confirm("删除这份复习日？")) return;
  deleteLesson(lessonId);
}

function goPlay() {
  if (!canPlay.value) return;
  router.push("/play");
}
</script>

<template>
  <main class="page page-parent">
    <p v-if="!storageAvailable" class="banner">本机存储不可用，刷新后内容可能丢失</p>
    <p v-if="showNeedLesson" class="banner">请先录入复习内容</p>

    <header class="parent-header">
      <h1>录入复习</h1>
      <button class="text-button" type="button" :disabled="!canPlay" @click="goPlay">
        给孩子听
      </button>
    </header>

    <section v-if="lessons.length" class="lesson-list" aria-label="已有复习日">
      <div
        v-for="lesson in lessons"
        :key="lesson.id"
        class="lesson-row"
        :class="{ active: lesson.id === activeLesson?.id }"
      >
        <button class="lesson-select" type="button" @click="selectLesson(lesson.id)">
          <strong>{{ lesson.title }}</strong>
          <small>
            {{ lessonCounts(lesson.id).word }} 个单词 ·
            {{ lessonCounts(lesson.id).sentence }} 个句子
          </small>
        </button>
        <button class="lesson-delete" type="button" @click="handleDelete(lesson.id)">删除</button>
      </div>
    </section>

    <label class="paste-label">
      <span class="sr-only">老师发来的课堂总结</span>
      <textarea v-model="teacherText" rows="8" placeholder="粘贴老师发来的课堂总结" />
    </label>

    <section class="preview" aria-live="polite">
      <p v-if="canSave">将拆成 {{ wordCount }} 个单词 · {{ sentenceCount }} 个句子</p>
      <p v-else>没识别到英文单词或句子</p>
      <ul v-if="canSave">
        <li v-for="item in previewItems" :key="item.id">
          <span>{{ item.emoji }} {{ item.english }}</span>
          <small v-if="item.chinese">{{ item.chinese }}</small>
        </li>
      </ul>
    </section>

    <button class="primary-button" type="button" :disabled="!canSave" @click="handleSave">
      保存并给孩子复习
    </button>
  </main>
</template>
