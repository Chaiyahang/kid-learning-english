<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useLessons } from "../composables/useLessons";
import { TTS_HINT_KEY, readJson, writeJson } from "../services/storage";
import { isSpeechSupported, speak } from "../services/speech";

const router = useRouter();
const { activeLesson, activeItem, activeIndex, nextItem, previousItem } = useLessons();
const ttsHint = ref("");
let holdTimer: number | null = null;

onMounted(() => {
  if (!activeLesson.value) {
    router.replace({ path: "/", query: { needLesson: "1" } });
  }
});

const englishStyle = computed(() => {
  const length = activeItem.value?.english.trim().length || 1;
  const size = Math.min(40, Math.max(20, Math.floor(360 / length)));
  return { fontSize: `${size}px` };
});

function handleSpeak() {
  const item = activeItem.value;
  if (!item) return;

  if (!isSpeechSupported()) {
    if (!readJson<string>(TTS_HINT_KEY, "")) {
      ttsHint.value = "请用 Safari 或 Chrome 打开，或添加到主屏幕后再听。";
      writeJson(TTS_HINT_KEY, "1");
    }
    return;
  }

  void speak(item.english, {
    pitch: 1.12,
    rate: item.category === "sentence" ? 0.7 : 0.78
  });
}

function startHold() {
  clearHold();
  holdTimer = window.setTimeout(() => {
    router.push("/");
  }, 1000);
}

function clearHold() {
  if (holdTimer !== null) {
    window.clearTimeout(holdTimer);
    holdTimer = null;
  }
}

onBeforeUnmount(clearHold);
</script>

<template>
  <main v-if="activeLesson && activeItem" class="page page-play">
    <button
      class="parent-hold"
      type="button"
      aria-label="长按返回家长页"
      @pointerdown="startHold"
      @pointerup="clearHold"
      @pointercancel="clearHold"
      @pointerleave="clearHold"
    />

    <header class="play-header">
      <span>{{ activeLesson.dateLabel }}</span>
      <span>{{ activeIndex + 1 }} / {{ activeLesson.items.length }}</span>
    </header>

    <p class="play-english" :style="englishStyle">{{ activeItem.english }}</p>
    <p v-if="activeItem.chinese" class="play-chinese">{{ activeItem.chinese }}</p>
    <div class="play-emoji" aria-hidden="true">{{ activeItem.emoji }}</div>

    <button class="speak-button" type="button" aria-label="播放发音" @click="handleSpeak">
      ▶
    </button>
    <p v-if="ttsHint" class="tts-hint">{{ ttsHint }}</p>

    <div class="play-nav">
      <button type="button" @click="previousItem">上一个</button>
      <button type="button" @click="nextItem">下一个</button>
    </div>
  </main>
</template>
