<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useLessons } from "../composables/useLessons";
import { parseReviewText } from "../data/parseReviewText";
import {
  ALLOWED_REPEAT_COUNTS,
  loadPlaySettings,
  savePlaySettings
} from "../services/settings";
import { getReviewPhonetic } from "../data/reviewPhonetics";

const route = useRoute();
const router = useRouter();
const { lessons, activeLesson, storageAvailable, saveLesson, selectLesson, deleteLesson } =
  useLessons();

const playSettings = ref(loadPlaySettings());

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

function toggleAutoPlay() {
  playSettings.value = savePlaySettings({
    ...playSettings.value,
    autoPlay: !playSettings.value.autoPlay
  });
}

function setRepeatCount(count: number) {
  playSettings.value = savePlaySettings({ ...playSettings.value, repeatCount: count });
}

function previewPhonetic(english: string) {
  return getReviewPhonetic(english);
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
          <span class="preview-english">
            {{ item.emoji }} {{ item.english }}
            <small v-if="previewPhonetic(item.english)" class="preview-phonetic">
              /{{ previewPhonetic(item.english) }}/
            </small>
          </span>
          <small v-if="item.chinese">{{ item.chinese }}</small>
        </li>
      </ul>
    </section>

    <button class="primary-button" type="button" :disabled="!canSave" @click="handleSave">
      保存并给孩子复习
    </button>

    <section class="settings-card" aria-label="学习设置">
      <h2>学习设置</h2>
      <div class="settings-row">
        <div class="settings-copy">
          <strong>自动朗读</strong>
          <small>切到新卡片时自动发音</small>
        </div>
        <button
          class="switch"
          :class="{ on: playSettings.autoPlay }"
          type="button"
          role="switch"
          :aria-checked="playSettings.autoPlay"
          aria-label="自动朗读"
          @click="toggleAutoPlay"
        >
          <span class="knob" />
        </button>
      </div>
      <div class="settings-row" :class="{ disabled: !playSettings.autoPlay }">
        <div class="settings-copy">
          <strong>朗读次数</strong>
          <small>自动朗读时每张卡片念几遍</small>
        </div>
        <div class="segmented" role="group" aria-label="朗读次数">
          <button
            v-for="count in ALLOWED_REPEAT_COUNTS"
            :key="count"
            type="button"
            :class="{ active: playSettings.repeatCount === count }"
            :disabled="!playSettings.autoPlay"
            @click="setRepeatCount(count)"
          >
            {{ count }} 次
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
