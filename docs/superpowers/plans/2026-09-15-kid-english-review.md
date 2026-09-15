# 儿童英语复习 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做一个本地优先的双模式 Web：家长粘贴课堂总结并预览拆词，孩子在另一页点卡片听英文发音。

**Architecture:** 独立 Vue 3 仓库，两条路由 `/`（家长）和 `/play`（孩子）。拆词、emoji 对照表、发音封装各自独立成文件；课程数据只经 `useLessons` 读写 `localStorage`。第一版无云同步、无翻译、无参考图、无 Element Plus。

**Tech Stack:** Vue 3, Vue Router, Vite, TypeScript, Vitest, `@vitejs/plugin-basic-ssl`（本地 HTTPS）, 浏览器 `speechSynthesis`。

**Spec:** `docs/superpowers/specs/2026-09-15-kid-english-review-design.md`

---

## File map

```
package.json
vite.config.ts
vitest.config.ts
tsconfig.json
tsconfig.app.json
index.html
.gitignore
README.md
public/manifest.webmanifest
public/sw.js
public/app-icon.svg
src/main.ts
src/env.d.ts
src/App.vue
src/router.ts
src/types/review.ts
src/data/reviewEmojis.ts
src/data/parseReviewText.ts
src/data/parseReviewText.test.ts
src/data/lessonTitle.ts
src/data/lessonTitle.test.ts
src/services/storage.ts
src/services/storage.test.ts
src/services/speech.ts
src/composables/useLessons.ts
src/composables/useLessons.test.ts
src/pages/ParentPage.vue
src/pages/PlayPage.vue
src/styles/main.css
```

职责：

- `types/review.ts` — `ReviewItem` / `ReviewLesson` / `Progress`
- `data/reviewEmojis.ts` — 静态英文词 → emoji 对照表
- `data/parseReviewText.ts` — 拆词、去重、emoji、类别；家长预览和保存共用
- `data/lessonTitle.ts` — `9月15日` / `9月15日复习 2`
- `services/storage.ts` — `localStorage` 读写与可用性探测
- `services/speech.ts` — `speechSynthesis` 封装
- `composables/useLessons.ts` — 课程与进度的唯一持久化入口
- `pages/ParentPage.vue` / `pages/PlayPage.vue` — 两个角色界面



---

### Task 1: Scaffold Vite + Vue 3 + Vitest

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `index.html`
- Create: `src/env.d.ts`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Write project files**

`.gitignore`:

```
node_modules/
dist/
.env
.env.local
.DS_Store
*.log
.superpowers/
```

`package.json`:

```json
{
  "name": "kid-learning-english",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "NODE_OPTIONS=--no-experimental-webstorage vitest run"
  },
  "dependencies": {
    "vue": "^3.5.17",
    "vue-router": "^4.5.1"
  },
  "devDependencies": {
    "@vitejs/plugin-basic-ssl": "^2.3.0",
    "@vitejs/plugin-vue": "^5.2.4",
    "happy-dom": "^20.14.5",
    "typescript": "^5.8.3",
    "vite": "^6.3.5",
    "vitest": "^3.2.4"
  }
}
```

`vite.config.ts`:

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [
    vue(),
    basicSsl({
      name: "kid-learning-english"
    })
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true
  }
});
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "happy-dom"
  }
});
```

`tsconfig.json`:

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }]
}
```

`tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "src/**/*.d.ts"]
}
```

`index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
    />
    <meta name="theme-color" content="#2d63e8" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="儿童英语复习" />
    <title>儿童英语复习</title>
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" href="/app-icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/app-icon.svg" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/env.d.ts`:

```ts
/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
```

`src/App.vue`:

```vue
<template>
  <router-view />
</template>
```

`src/main.ts`:

```ts
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "./styles/main.css";

function disablePageZoom() {
  const preventDefault = (event: Event) => {
    event.preventDefault();
  };
  const preventMultiTouch = (event: TouchEvent) => {
    if (event.touches.length > 1) event.preventDefault();
  };

  document.addEventListener("gesturestart", preventDefault, { passive: false });
  document.addEventListener("gesturechange", preventDefault, { passive: false });
  document.addEventListener("gestureend", preventDefault, { passive: false });
  document.addEventListener("touchstart", preventMultiTouch, { passive: false });
  document.addEventListener("touchmove", preventMultiTouch, { passive: false });
}

disablePageZoom();

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  });
}

registerServiceWorker();

createApp(App).use(router).mount("#app");
```

`README.md`:

```md
# 儿童英语复习

给 4 岁孩子用的课后英语听读工具。家长粘贴老师发来的课堂总结，孩子逐张点卡片听英文发音。

## 本地运行

```bash
pnpm install
pnpm test
pnpm dev
```

访问 `https://127.0.0.1:5173/`。首次会提示自签名证书不受信任，继续访问即可。
```

Temporarily create stubs so `main.ts` typechecks until later tasks:

`src/router.ts`:

```ts
import { createRouter, createWebHistory } from "vue-router";

export const router = createRouter({
  history: createWebHistory(),
  routes: []
});
```

`src/styles/main.css`:

```css
html,
body,
#app {
  margin: 0;
  min-height: 100%;
}
```

- [ ] **Step 2: Install dependencies**

Run: `pnpm install`

Expected: lockfile created, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.ts vitest.config.ts tsconfig.json tsconfig.app.json index.html .gitignore README.md src
git commit -m "chore: scaffold Vue 3 Vite app with Vitest and HTTPS dev"
```

---

### Task 2: Types and localStorage primitives

**Files:**
- Create: `src/types/review.ts`
- Create: `src/services/storage.ts`
- Create: `src/services/storage.test.ts`
- Create: `src/data/lessonTitle.ts`
- Create: `src/data/lessonTitle.test.ts`

- [ ] **Step 1: Write failing tests**

`src/data/lessonTitle.test.ts`:

```ts
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
```

`src/services/storage.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LESSONS_KEY,
  PROGRESS_KEY,
  TTS_HINT_KEY,
  readJson,
  writeJson,
  probeStorage
} from "./storage";

describe("storage keys", () => {
  it("uses kid-learning-english prefixed keys", () => {
    expect(LESSONS_KEY).toBe("kid-learning-english.lessons.v1");
    expect(PROGRESS_KEY).toBe("kid-learning-english.progress.v1");
    expect(TTS_HINT_KEY).toBe("kid-learning-english.tts-hint.v1");
  });
});

describe("readJson / writeJson", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips JSON", () => {
    writeJson(LESSONS_KEY, [{ id: "a" }]);
    expect(readJson(LESSONS_KEY, [])).toEqual([{ id: "a" }]);
  });

  it("returns fallback for missing or corrupt values", () => {
    expect(readJson(LESSONS_KEY, [{ id: "fallback" }])).toEqual([{ id: "fallback" }]);
    window.localStorage.setItem(LESSONS_KEY, "{not-json");
    expect(readJson(LESSONS_KEY, [])).toEqual([]);
  });

  it("returns false from probeStorage when setItem throws", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(probeStorage()).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/data/lessonTitle.test.ts src/services/storage.test.ts`

Expected: FAIL with cannot find module `./lessonTitle` / `./storage`.

- [ ] **Step 3: Write types and implementation**

`src/types/review.ts`:

```ts
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
```

`src/data/lessonTitle.ts`:

```ts
export function formatDateLabel(date: Date = new Date()): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function buildLessonTitle(dateLabel: string, existingTitles: string[]): string {
  const base = `${dateLabel}复习`;
  if (!existingTitles.includes(base)) return base;
  let suffix = 2;
  while (existingTitles.includes(`${base} ${suffix}`)) suffix += 1;
  return `${base} ${suffix}`;
}
```

`src/services/storage.ts`:

```ts
export const LESSONS_KEY = "kid-learning-english.lessons.v1";
export const PROGRESS_KEY = "kid-learning-english.progress.v1";
export const TTS_HINT_KEY = "kid-learning-english.tts-hint.v1";

export function probeStorage(): boolean {
  try {
    const token = "kid-learning-english.probe";
    window.localStorage.setItem(token, "1");
    window.localStorage.removeItem(token);
    return true;
  } catch {
    return false;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/data/lessonTitle.test.ts src/services/storage.test.ts`

Expected: PASS (4 tests in lessonTitle, 3 in storage).

- [ ] **Step 5: Commit**

```bash
git add src/types/review.ts src/data/lessonTitle.ts src/data/lessonTitle.test.ts src/services/storage.ts src/services/storage.test.ts
git commit -m "feat: add review types, title helpers, and localStorage primitives"
```

---

### Task 3: Copy emoji table and parse classroom text

**Files:**
- Create: `src/data/reviewEmojis.ts` (copy)
- Create: `src/data/parseReviewText.ts`
- Create: `src/data/parseReviewText.test.ts`

- [ ] **Step 1: Write the failing parser tests**

`src/data/parseReviewText.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseReviewText } from "./parseReviewText";

const letterXText = `📆【今日学习内容】
————————————
👩‍🏫教学重点
1.唱歌曲《A is for Apple》A-Z(结合歌曲记忆字母发音及相关单词）

——相关单词
1️⃣X-ray X光片
2️⃣six 六
3️⃣box 盒子，箱子
4️⃣ox 公牛
————
1️⃣yogurt 酸奶酪
2️⃣yawn 打哈欠🥱
3️⃣yak 牦牛
4️⃣yacht 游艇🛥️
———
1️⃣zero 数字0
2️⃣zoo 动物园
3️⃣zebra 斑马🦓
4️⃣zipper 拉链

—重点句型朗读
 I see an X-ray.
I have six toys.
This is my box.
The ox is big.
 I like yogurt.
 I am tired. I yawn.
The yak is big.
We see a yacht.
Zero is a number.
I go to the zoo.
I see a zebra.
 I pull my zipper.

🌞【家庭作业】:
🧡口语作业💬
1️⃣观看外教老师指读视频字母Xx～Zz`;

describe("parseReviewText", () => {
  it("extracts english+chinese word pairs and sentences from teacher text", () => {
    const items = parseReviewText(letterXText);
    const words = items.filter((item) => item.category === "word").map((item) => item.english);
    const sentences = items
      .filter((item) => item.category === "sentence")
      .map((item) => item.english);

    expect(words).toEqual([
      "X-ray",
      "six",
      "box",
      "ox",
      "yogurt",
      "yawn",
      "yak",
      "yacht",
      "zero",
      "zoo",
      "zebra",
      "zipper"
    ]);
    expect(sentences).toContain("I see an X-ray.");
    expect(sentences).toContain("I like yogurt.");
    expect(sentences).toContain("I am tired. I yawn.");
    expect(items.every((item) => item.category === "word" || item.category === "sentence")).toBe(
      true
    );
  });

  it("reads parenthesized chinese and comma-separated pairs", () => {
    const items = parseReviewText("apple（苹果），pear 梨\nI like yogurt.");
    expect(items.map((item) => `${item.english}|${item.chinese}|${item.category}`)).toEqual([
      "apple|苹果|word",
      "pear|梨|word",
      "I like yogurt.||sentence"
    ]);
  });

  it("dedupes by lowercase english without trailing punctuation", () => {
    const items = parseReviewText("Apple 苹果\napple 苹果\nApple.");
    expect(items).toHaveLength(1);
    expect(items[0].english).toBe("Apple");
  });

  it("returns an empty list when there is no english", () => {
    expect(parseReviewText("今天回家多跟读～")).toEqual([]);
  });

  it("uses pineapple emoji for pineapple", () => {
    const items = parseReviewText("pineapple 菠萝");
    expect(items[0].emoji).toBe("🍍");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/data/parseReviewText.test.ts`

Expected: FAIL with cannot find module `./parseReviewText`.

- [ ] **Step 3: Create the emoji table and implement parser**

Create `src/data/reviewEmojis.ts`: a static `Record<string, string>` of lowercase English word → emoji (about 240 entries covering the words used in kids' classes: fruit, animals, body, toys, actions), plus

- `irregularForms` for `children/feet/geese/mice/people/teeth/women/men`
- `export function findEnglishEmoji(english: string): string` — normalize (lowercase, strip `a/an/the`, drop punctuation), try the exact key, then the base word via the candidate list `ies→y`, `ied→y`, `ves→f`, `ing`, `ing+e`, de-duplicated final letter, `ed`, `ed+e`, `es`, `s`; return `""` when nothing matches.

`src/data/parseReviewText.ts` (letter/note categories stripped from the first version):

```ts
import { findEnglishEmoji } from "./reviewEmojis";
import type { ItemCategory, ReviewItem } from "../types/review";

export function createReviewId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function sanitizeReviewText(value: string): string {
  return Array.from(value)
    .filter((character) => {
      if (character.length > 1) return true;
      const codePoint = character.charCodeAt(0);
      return codePoint < 0xd800 || codePoint > 0xdfff;
    })
    .join("");
}

export function buildReviewItem(
  english: string,
  chinese = "",
  category?: ItemCategory
): ReviewItem {
  const normalizedEnglish = sanitizeReviewText(english).trim().replace(/\s+/g, " ");
  const normalizedChinese = sanitizeReviewText(chinese).trim();
  const explicitEmoji = extractReviewEmoji(normalizedChinese);
  return {
    id: createReviewId("item"),
    english: normalizedEnglish,
    chinese: normalizedChinese,
    category: category || inferCategory(normalizedEnglish),
    emoji: explicitEmoji || pickEmoji(normalizedEnglish, normalizedChinese)
  };
}

function extractReviewEmoji(text: string): string {
  return (
    text.match(
      /(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|[#*0-9]\uFE0F?\u20E3|\uFE0F|\u200D)+/u
    )?.[0] || ""
  );
}

export function getReviewItemDedupeKey(english: string): string {
  return english
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[…]+/g, "...")
    .replace(/[.?!,，。！？]+$/g, "")
    .toLowerCase();
}

export function dedupeReviewItems(items: ReviewItem[]): ReviewItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (isLetterTitleReviewItem(item)) return false;
    const key = getReviewItemDedupeKey(item.english);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function assignContextualEmojis(items: ReviewItem[]): ReviewItem[] {
  const wordItems = items.filter(
    (item) =>
      item.category === "word" && item.emoji && !["🔊", "📝", "💬"].includes(item.emoji)
  );

  return items.map((item) => {
    if (item.emoji && !["🔊", "📝", "💬"].includes(item.emoji)) return item;
    const normalizedEnglish = item.english.toLocaleLowerCase();
    const relatedWord = wordItems.find((wordItem) =>
      normalizedEnglish.includes(wordItem.english.toLocaleLowerCase())
    );
    return relatedWord ? { ...item, emoji: relatedWord.emoji } : item;
  });
}

function isLetterTitleReviewItem(item: Pick<ReviewItem, "english" | "category">): boolean {
  return /^letter\s+[a-z]{1,2}$/i.test(item.english.trim());
}

export function parseReviewText(rawText: string): ReviewItem[] {
  let currentCategory: ItemCategory | undefined;
  const parsed = rawText.split(/\r?\n/).flatMap((line) => {
    const heading = cleanLine(line).replace(/[：:]$/g, "").trim();
    if (/^(words?|单词)$/i.test(heading)) {
      currentCategory = "word";
      return [];
    }
    if (/^(sentences?|句子)$/i.test(heading)) {
      currentCategory = "sentence";
      return [];
    }
    return parseReviewLine(line).map((item) => ({
      ...item,
      category: currentCategory || item.category
    }));
  });

  return assignContextualEmojis(
    dedupeReviewItems(
      parsed.filter(
        (item) =>
          Boolean(item.english) && (item.category === "word" || item.category === "sentence")
      )
    )
  );
}

function parseReviewLine(line: string): ReviewItem[] {
  const cleaned = cleanLine(line);
  if (!cleaned || !/[A-Za-z]/.test(cleaned)) return [];

  const parenthesized = parseParenthesizedPairs(cleaned);
  if (parenthesized.length) return parenthesized;

  if (/[、,，]/.test(cleaned)) {
    const pieces = cleaned
      .split(/[、,，]/)
      .flatMap((piece) => parseSinglePair(piece))
      .filter(Boolean);
    if (pieces.length > 1) return pieces;
  }

  return parseSinglePair(cleaned);
}

function parseParenthesizedPairs(line: string): ReviewItem[] {
  const pairs: ReviewItem[] = [];
  const pattern = /([A-Za-z][A-Za-z0-9\s'.?!,-]*[A-Za-z0-9.?!])\s*[（(]([^）)]+)[）)]/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line))) {
    pairs.push(buildReviewItem(stripPromptPrefix(match[1]), match[2]));
  }
  return pairs;
}

function parseSinglePair(line: string): ReviewItem[] {
  const cleaned = cleanLine(line);
  const englishStart = cleaned.search(/[A-Za-z]/);
  if (englishStart < 0) return [];

  const englishAndChinese = cleaned.slice(englishStart);
  const chineseStart = englishAndChinese.search(/[\u4e00-\u9fff]/);

  if (chineseStart >= 0) {
    const english = stripPromptPrefix(englishAndChinese.slice(0, chineseStart));
    const chinese = englishAndChinese.slice(chineseStart).replace(/[。.!?？：:]+$/g, "");
    return english ? [buildReviewItem(english, chinese)] : [];
  }

  const emojiPair = parseEmojiPair(englishAndChinese);
  if (emojiPair) return [emojiPair];

  const englishOnly = stripPromptPrefix(englishAndChinese);
  if (!shouldKeepEnglishOnly(englishOnly)) return [];
  return [buildReviewItem(englishOnly)];
}

function parseEmojiPair(text: string): ReviewItem | null {
  const emojiMatch = text.match(
    /\s+((?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|\uFE0F|\u200D)+)\s*$/u
  );
  if (!emojiMatch || emojiMatch.index === undefined) return null;
  const english = stripPromptPrefix(text.slice(0, emojiMatch.index));
  const emoji = emojiMatch[1];
  if (!english || !shouldKeepEnglishOnly(english)) return null;
  return { ...buildReviewItem(english, emoji), emoji };
}

function cleanLine(line: string): string {
  return line
    .replace(/[📆👩‍🏫🌞💬👇🧑‍🏫📖✍️🍍🦓]/gu, "")
    .replace(/^[\s—\-＿_【\]】]+|[\s—\-＿_【\]】]+$/g, "")
    .replace(/^[0-9①②③④⑤⑥⑦⑧⑨1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣.、)\s-]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripPromptPrefix(text: string): string {
  return text
    .replace(/^[QqAa][：:]\s*/g, "")
    .replace(/[“”"']/g, "")
    .replace(/[…]+/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldKeepEnglishOnly(text: string): boolean {
  if (!text) return false;
  if (/^(LG|Super ABC|ABC|A-Z)$/i.test(text)) return false;
  return /[.?!]$/.test(text) || text.split(/\s+/).length <= 4;
}

function inferCategory(english: string): ItemCategory {
  if (/[.?!]$/.test(english) || english.split(/\s+/).length > 3) return "sentence";
  return "word";
}

function pickEmoji(english: string, chinese: string): string {
  const englishEmoji = findEnglishEmoji(english);
  if (englishEmoji) return englishEmoji;

  const text = `${english} ${chinese}`.toLocaleLowerCase();
  const emojiMap: Array<[RegExp, string]> = [
    [/pineapple|菠萝/, "🍍"],
    [/apple|苹果/, "🍎"],
    [/pear|梨/, "🍐"],
    [/orange|橘子/, "🍊"],
    [/watermelon|西瓜/, "🍉"],
    [/dragon fruit|火龙果/, "🐲"],
    [/mango|芒果/, "🥭"],
    [/kiwi|奇异果/, "🥝"],
    [/smoothie|冰沙/, "🥤"],
    [/ice cube|冰块/, "🧊"],
    [/sugar|糖/, "🍬"],
    [/syrup|糖浆/, "🍯"],
    [/blender|搅拌机/, "🔄"],
    [/\bcup\b|杯子/, "🥤"],
    [/straw|吸管/, "🧃"],
    [/x-ray|x ray|x光/, "🩻"],
    [/\bsix\b|六/, "6️⃣"],
    [/\bbox\b|盒子|箱子/, "📦"],
    [/\box\b|公牛/, "🐂"],
    [/yogurt|酸奶酪|酸奶/, "🥣"],
    [/yawn|打哈欠/, "🥱"],
    [/\byak\b|牦牛/, "🦬"],
    [/yacht|游艇/, "🛥️"],
    [/zero|数字 0|数字0/, "0️⃣"],
    [/\bzoo\b|动物园/, "🦁"],
    [/zebra|斑马/, "🦓"],
    [/zipper|拉链/, "🧥"],
    [/letter|字母/, "🔤"],
    [/number|数字/, "🔢"],
    [/yuan|rmb|money|price|how much|元|人民币|钱|价格/, "💰"]
  ];
  const matchedEmoji = emojiMap.find(([pattern]) => pattern.test(text))?.[1];
  if (matchedEmoji) return matchedEmoji;
  return inferCategory(english) === "sentence" ? "💬" : "📝";
}
```

The emoji file is plain data with no dependencies; it only needs to export `findEnglishEmoji` for the parser and tests.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/data/parseReviewText.test.ts`

Expected: PASS. If a sentence is missing because `shouldKeepEnglishOnly` filtered it, adjust the assertion only after checking the actual `items` output — do not weaken the word-pair list.

- [ ] **Step 5: Commit**

```bash
git add src/data/reviewEmojis.ts src/data/parseReviewText.ts src/data/parseReviewText.test.ts
git commit -m "feat: parse classroom text into words and sentences"
```

---

### Task 4: Speech helper

**Files:**
- Create: `src/services/speech.ts`

No unit test: `speechSynthesis` is a browser API. Keep the module tiny and isomorphic with the original.

- [ ] **Step 1: Implement speak()**

`src/services/speech.ts`:

```ts
interface SpeakOptions {
  lang?: string;
  pitch?: number;
  rate?: number;
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  if (!isSpeechSupported()) return Promise.resolve();
  if (!text.trim()) return Promise.resolve();

  window.speechSynthesis.cancel();

  return new Promise((resolve) => {
    let fallbackTimer: number | null = null;
    const finish = () => {
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      resolve();
    };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || "en-US";
    utterance.pitch = options.pitch ?? 1.12;
    utterance.rate = options.rate ?? 0.78;
    utterance.onend = finish;
    utterance.onerror = finish;
    fallbackTimer = window.setTimeout(finish, Math.max(1800, text.length * 180));
    window.speechSynthesis.speak(utterance);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/speech.ts
git commit -m "feat: add browser speech helper with cancel and timeout"
```

---

### Task 5: useLessons composable

**Files:**
- Create: `src/composables/useLessons.ts`
- Create: `src/composables/useLessons.test.ts`

This is the only module that reads/writes `LESSONS_KEY` and `PROGRESS_KEY`.

- [ ] **Step 1: Write the failing tests**

`src/composables/useLessons.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/composables/useLessons.test.ts`

Expected: FAIL with cannot find module `./useLessons`.

- [ ] **Step 3: Implement useLessons**

`src/composables/useLessons.ts`:

```ts
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
    commit(
      [lesson, ...lessons.value],
      {
        activeLessonId: lesson.id,
        indexByLessonId: { ...progress.value.indexByLessonId, [lesson.id]: 0 }
      }
    );
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/composables/useLessons.test.ts`

Expected: PASS. Same-day title test assumes both saves happen on the real current date — that is intended.

- [ ] **Step 5: Commit**

```bash
git add src/composables/useLessons.ts src/composables/useLessons.test.ts
git commit -m "feat: persist lessons and card progress in localStorage"
```

---

### Task 6: Router and parent page

**Files:**
- Modify: `src/router.ts`
- Create: `src/pages/ParentPage.vue`
- Create: `src/pages/PlayPage.vue` (stub, filled in Task 7)

- [ ] **Step 1: Wire routes**

`src/router.ts`:

```ts
import { createRouter, createWebHistory } from "vue-router";
import ParentPage from "./pages/ParentPage.vue";
import PlayPage from "./pages/PlayPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "parent", component: ParentPage },
    { path: "/play", name: "play", component: PlayPage }
  ]
});
```

Stub `src/pages/PlayPage.vue` so the parent page can navigate:

```vue
<template>
  <p>play stub</p>
</template>
```

- [ ] **Step 2: Implement ParentPage.vue**

Must:

- Show banner when `storageAvailable` is false: `本机存储不可用，刷新后内容可能丢失`
- Title `录入复习`
- Button `给孩子听` disabled when `lessons.length === 0`, otherwise `router.push('/play')`
- Lesson list: `dateLabel` / title, `N 个单词 · M 个句子`, highlight active, click to `selectLesson`
- Delete with `window.confirm("删除这份复习日？")`
- Textarea placeholder `粘贴老师发来的课堂总结`
- Preview uses `parseReviewText(teacherText)` — same function as save
- Empty parse: show `没识别到英文单词或句子`, disable save
- Save: `saveLesson(teacherText, previewItems)` then `router.push('/play')`

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useLessons } from "../composables/useLessons";
import { parseReviewText } from "../data/parseReviewText";

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

    <header class="parent-header">
      <h1>录入复习</h1>
      <button class="text-button" type="button" :disabled="!canPlay" @click="goPlay">
        给孩子听
      </button>
    </header>

    <section v-if="lessons.length" class="lesson-list" aria-label="已有复习日">
      <button
        v-for="lesson in lessons"
        :key="lesson.id"
        class="lesson-row"
        :class="{ active: lesson.id === activeLesson?.id }"
        type="button"
        @click="selectLesson(lesson.id)"
      >
        <span class="lesson-row-main">
          <strong>{{ lesson.title }}</strong>
          <small>
            {{ lessonCounts(lesson.id).word }} 个单词 ·
            {{ lessonCounts(lesson.id).sentence }} 个句子
          </small>
        </span>
        <span
          class="lesson-delete"
          role="button"
          @click.stop="handleDelete(lesson.id)"
        >
          删除
        </span>
      </button>
    </section>

    <label class="paste-label">
      <span class="sr-only">老师发来的课堂总结</span>
      <textarea
        v-model="teacherText"
        rows="8"
        placeholder="粘贴老师发来的课堂总结"
      />
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
```

- [ ] **Step 3: Commit**

```bash
git add src/router.ts src/pages/ParentPage.vue src/pages/PlayPage.vue
git commit -m "feat: add parent paste-and-preview page"
```

---

### Task 7: Child play page

**Files:**
- Modify: `src/pages/PlayPage.vue`

Must:

- If `!activeLesson`, `router.replace({ path: '/', query: { needLesson: '1' } })`
- Parent page may optionally show `请先录入复习内容` when `needLesson=1` — add this one line to `ParentPage.vue` in this task
- Top: `dateLabel` and `{{ activeIndex + 1 }} / {{ items.length }}`
- English large, Chinese omitted when empty
- Emoji as the picture
- Round speak button ≥ 72px. Word rate `0.78`, sentence rate `0.7`, pitch `1.12`
- Previous / next ≥ 48px height, wrapping
- No textarea, no delete, no settings
- Long-press top-left 1s → `router.push('/')`
- If `!isSpeechSupported()`, first tap shows `请用 Safari 或 Chrome 打开，或添加到主屏幕后再听。` and writes `TTS_HINT_KEY`

- [ ] **Step 1: Add redirect hint on parent page**

In `ParentPage.vue` script add:

```ts
import { useRoute } from "vue-router";
const route = useRoute();
const showNeedLesson = computed(() => route.query.needLesson === "1" && lessons.value.length === 0);
```

In template, under the banner:

```vue
<p v-if="showNeedLesson" class="banner">请先录入复习内容</p>
```

- [ ] **Step 2: Implement PlayPage.vue**

```vue
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
  const size = Math.min(40, Math.max(22, Math.floor(360 / length)));
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
```

Note: `useLessons()` in ParentPage and PlayPage each create their own refs, but both read/write the same `localStorage` keys. That is enough for first version because navigation unmounts one page and mounts the other, re-reading storage. Do not introduce a global store in this task.

- [ ] **Step 3: Commit**

```bash
git add src/pages/PlayPage.vue src/pages/ParentPage.vue
git commit -m "feat: add child card playback page with speech and hold-to-exit"
```

---

### Task 8: Styles

**Files:**
- Modify: `src/styles/main.css`

Kid-proof constraints from spec: speak button ≥ 72px, prev/next ≥ 48px, no horizontal overflow, long sentences wrap.

- [ ] **Step 1: Replace main.css**

```css
:root {
  color-scheme: light;
  font-family:
    "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif;
  --ink: #202735;
  --muted: #667386;
  --paper: #ffffff;
  --bg: #cfe3f7;
  --primary: #2f66ef;
  --primary-dark: #1f4fd3;
  --line: #d8e5f2;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  min-height: 100%;
  width: 100%;
  margin: 0;
  touch-action: pan-x pan-y;
}

body {
  min-width: 320px;
  overflow-x: hidden;
  background: var(--bg);
  color: var(--ink);
}

button,
textarea {
  font: inherit;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.page {
  width: 100%;
  max-width: 430px;
  min-height: 100dvh;
  margin: 0 auto;
  padding: 12px 12px calc(16px + env(safe-area-inset-bottom));
}

.banner {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff4d6;
  color: #7a5b00;
  font-size: 14px;
}

.parent-header,
.play-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.parent-header h1 {
  margin: 0;
  font-size: 22px;
}

.text-button,
.primary-button,
.play-nav button,
.lesson-delete {
  border: 0;
  border-radius: 12px;
  background: var(--primary);
  color: #fff;
}

.text-button:disabled,
.primary-button:disabled {
  opacity: 0.45;
}

.text-button {
  padding: 8px 12px;
  background: transparent;
  color: var(--primary);
}

.lesson-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
}

.lesson-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--paper);
  text-align: left;
}

.lesson-row.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(47, 102, 239, 0.2);
}

.lesson-row-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lesson-row-main small,
.preview small {
  color: var(--muted);
}

.lesson-delete {
  align-self: center;
  padding: 8px 10px;
  background: #ff6f61;
  font-size: 13px;
}

.paste-label textarea {
  width: 100%;
  min-height: 160px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 16px;
  resize: vertical;
}

.preview {
  margin: 12px 0 16px;
}

.preview ul {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f8fbff;
}

.primary-button {
  width: 100%;
  min-height: 48px;
  font-size: 16px;
  font-weight: 700;
}

.page-play {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.parent-hold {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
}

.play-header {
  width: 100%;
  color: var(--muted);
  font-size: 14px;
}

.play-english {
  margin: 24px 0 8px;
  width: 100%;
  font-weight: 800;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.play-chinese {
  margin: 0 0 16px;
  font-size: 20px;
  color: var(--muted);
}

.play-emoji {
  width: 168px;
  height: 140px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 28px;
  background: #fff7e8;
  font-size: 72px;
}

.speak-button {
  width: 72px;
  height: 72px;
  margin-bottom: 16px;
  border: 0;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 28px;
}

.tts-hint {
  margin: 0 0 12px;
  color: #7a5b00;
  font-size: 14px;
}

.play-nav {
  display: flex;
  gap: 8px;
  width: 100%;
}

.play-nav button {
  flex: 1;
  min-height: 48px;
}

.play-nav button:first-child {
  background: #eef2fb;
  color: var(--ink);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/main.css
git commit -m "style: add parent and child mobile layouts"
```

---

### Task 9: PWA shell

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/sw.js`
- Create: `public/app-icon.svg`

- [ ] **Step 1: Add installable assets**

Write `public/app-icon.svg`: a 512×512 rounded square (fill `#2d63e8`) with a white book shape and a yellow circular badge holding a dark letter `A`.

`public/manifest.webmanifest`:

```json
{
  "name": "儿童英语复习",
  "short_name": "英语复习",
  "description": "课后英语听读复习",
  "start_url": "/play",
  "scope": "/",
  "display": "standalone",
  "background_color": "#cfe3f7",
  "theme_color": "#2d63e8",
  "icons": [
    {
      "src": "app-icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

`public/sw.js` (trimmed from original; HTML network-first, assets cache-first):

```js
const CACHE_PREFIX = "kid-learning-english";
const CACHE_VERSION = "2026-09-15";
const SHELL_CACHE = `${CACHE_PREFIX}-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`;
const APP_SCOPE = new URL(self.registration.scope);
const INDEX_URL = new URL("./index.html", APP_SCOPE).href;
const ROOT_URL = new URL("./", APP_SCOPE).href;
const PLAY_URL = new URL("./play", APP_SCOPE).href;
const SHELL_URLS = [
  ROOT_URL,
  INDEX_URL,
  PLAY_URL,
  new URL("./manifest.webmanifest", APP_SCOPE).href,
  new URL("./app-icon.svg", APP_SCOPE).href
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name.startsWith(CACHE_PREFIX))
            .filter((name) => name !== SHELL_CACHE && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (
      (await caches.match(request)) ||
      (await caches.match(INDEX_URL)) ||
      (await caches.match(ROOT_URL)) ||
      Response.error()
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}
```

SPA note: `createWebHistory` `/play` must fall back to `index.html` in production. Vite preview does this. First version does not deploy to GitHub Pages.

- [ ] **Step 2: Commit**

```bash
git add public/manifest.webmanifest public/sw.js public/app-icon.svg
git commit -m "feat: add PWA manifest and service worker"
```

---

### Task 10: Full test run and manual checklist

**Files:**
- Modify: `README.md` (add acceptance checklist)

- [ ] **Step 1: Run the full unit suite**

Run: `pnpm test`

Expected: all tests PASS (`lessonTitle`, `storage`, `parseReviewText`, `useLessons`).

- [ ] **Step 2: Append acceptance notes to README.md**

```md
## 验收

1. `pnpm test` 全绿。
2. 粘贴 Letter X 课堂原文，预览出现 X-ray / six / box 等单词和 `I see an X-ray.` 等句子。
3. 保存后进入孩子页，点 ▶ 能听到英文（Safari / Chrome；微信内置浏览器可能无 TTS）。
4. 「下一个」从最后一张回到第一张；刷新后停在同一张。
5. 无数据时打开 `/play` 回到家长页并提示先录入。
6. 孩子页没有输入框和删除按钮；长按左上角约 1 秒回到家长页。
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add first-version acceptance checklist"
```

---

## Self-review

**Spec coverage**

| Spec section | Task |
| --- | --- |
| 家长粘贴 + 预览 + 保存 | Task 6 |
| 孩子大卡片听读 | Task 7 |
| 无复习日进 `/play` 重定向 | Task 7 |
| 长按回家长页 | Task 7 |
| localStorage 三键 | Task 2 / 5 / 7 |
| 同日标题递增 | Task 2 / 5 |
| 允许删到零 | Task 5 / 6 |
| 拆词规则 / 不翻译 | Task 3 |
| TTS 语速、cancel、超时、一次性提示 | Task 4 / 7 |
| PWA `start_url: /play` | Task 9 |
| 禁止缩放 viewport | Task 1 |
| 按钮尺寸 | Task 8 |
| 不做云同步 / 小程序 / 参考图 / 自动播放 | 全计划未引入 |

**Placeholder scan:** none remaining.

**Type consistency:** `ReviewItem` / `ReviewLesson` / `Progress` / `ItemCategory` names match across types, parser, `useLessons`, and pages. Storage keys are the three spec keys. `useLessons` is the only writer of lesson+progress keys.
