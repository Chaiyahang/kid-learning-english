<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useLessons } from "../composables/useLessons";
import { TTS_HINT_KEY, readJson, writeJson } from "../services/storage";
import { isSpeechSupported, speak, stopSpeaking } from "../services/speech";

const router = useRouter();
const { activeLesson, activeItem, activeIndex, nextItem, previousItem } = useLessons();
const ttsHint = ref("");
const isSpeaking = ref(false);
let speakRunId = 0;

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

const progressPercent = computed(() => {
  const total = activeLesson.value?.items.length || 0;
  if (!total) return 0;
  return ((activeIndex.value + 1) / total) * 100;
});

function stopPlayback() {
  speakRunId += 1;
  isSpeaking.value = false;
  stopSpeaking();
}

async function handleSpeak() {
  const item = activeItem.value;
  if (!item) return;

  if (isSpeaking.value) {
    stopPlayback();
    return;
  }

  if (!isSpeechSupported()) {
    if (!readJson<string>(TTS_HINT_KEY, "")) {
      ttsHint.value = "请用 Safari 或 Chrome 打开，或添加到主屏幕后再听。";
      writeJson(TTS_HINT_KEY, "1");
    }
    return;
  }

  const runId = ++speakRunId;
  isSpeaking.value = true;
  await speak(item.english, {
    pitch: 1.12,
    rate: item.category === "sentence" ? 0.7 : 0.78
  });

  if (runId === speakRunId) isSpeaking.value = false;
}

function goToParent() {
  stopPlayback();
  router.push("/");
}

onBeforeUnmount(stopPlayback);
</script>

<template>
  <main v-if="activeLesson && activeItem" class="page page-play">
    <header class="play-header">
      <button class="parent-link" type="button" @click="goToParent">家长</button>
      <span class="play-date">{{ activeLesson.dateLabel }}</span>
      <span class="play-count">{{ activeIndex + 1 }} / {{ activeLesson.items.length }}</span>
    </header>

    <div
      class="progress-track"
      role="progressbar"
      aria-label="复习进度"
      :aria-valuemin="1"
      :aria-valuemax="activeLesson.items.length"
      :aria-valuenow="activeIndex + 1"
    >
      <div class="progress-fill" :style="{ width: `${progressPercent}%` }" />
    </div>

    <p class="play-english" :style="englishStyle">{{ activeItem.english }}</p>
    <p v-if="activeItem.chinese" class="play-chinese">{{ activeItem.chinese }}</p>
    <div class="play-emoji" aria-hidden="true">{{ activeItem.emoji }}</div>

    <button
      class="speak-button"
      :class="{ 'is-speaking': isSpeaking }"
      type="button"
      :aria-label="isSpeaking ? '停止发音' : '播放发音'"
      :aria-pressed="isSpeaking"
      @click="handleSpeak"
    >
      <span v-if="isSpeaking" class="speak-stop" aria-hidden="true" />
      <span v-else aria-hidden="true">▶</span>
    </button>
    <p v-if="ttsHint" class="tts-hint">{{ ttsHint }}</p>

    <div class="play-nav">
      <button type="button" @click="previousItem">上一个</button>
      <button type="button" @click="nextItem">下一个</button>
    </div>
  </main>
</template>
