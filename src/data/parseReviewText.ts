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
  // 《...》 marks teaching material titles such as a song name, never vocabulary.
  if (/[《》]/.test(cleaned)) return [];

  // Slash-separated word lists are common in teacher messages.
  if ((cleaned.match(/[／/]/g) || []).length >= 2) {
    return cleaned
      .split(/\s*[／/]\s*/)
      .flatMap((segment) => parseSegment(segment))
      .filter(Boolean);
  }

  return parseSegment(cleaned);
}

function parseSegment(text: string): ReviewItem[] {
  const cleaned = cleanLine(text);
  if (!cleaned || !/[A-Za-z]/.test(cleaned)) return [];

  const { items: parenthesized, remainder } = parseParenthesizedPairs(cleaned);
  const rest = remainder.trim();
  const tail = rest && /[A-Za-z]/.test(rest) ? splitByComma(rest) || parseSinglePair(rest) : [];
  const combined = [...parenthesized, ...tail];
  if (combined.length) return combined;

  return splitByComma(cleaned) || parseSinglePair(cleaned);
}

function splitByComma(text: string): ReviewItem[] | null {
  if (!/[、,，]/.test(text)) return null;
  const pieces = text
    .split(/[、,，]/)
    .flatMap((piece) => parseSinglePair(piece))
    .filter(Boolean);
  return pieces.length > 1 ? pieces : null;
}

function parseParenthesizedPairs(line: string): { items: ReviewItem[]; remainder: string } {
  const items: ReviewItem[] = [];
  const pattern = /([A-Za-z][A-Za-z0-9\s'.?!,-]*[A-Za-z0-9.?!])\s*[（(]([^）)]+)[）)]/g;
  let match: RegExpExecArray | null;
  let remainder = line;
  while ((match = pattern.exec(line))) {
    // Long parentheticals are teacher instructions, not translations.
    if (match[2].trim().length > 12) continue;
    items.push(buildReviewItem(stripPromptPrefix(match[1]), match[2]));
    remainder = remainder.replace(match[0], " ");
  }
  return { items, remainder };
}

function parseSinglePair(line: string): ReviewItem[] {
  const cleaned = cleanLine(line);
  const englishStart = cleaned.search(/[A-Za-z]/);
  if (englishStart < 0) return [];

  const englishAndChinese = cleaned.slice(englishStart);
  const chineseStart = englishAndChinese.search(/[\u4e00-\u9fff]/);

  if (chineseStart >= 0) {
    const english = stripTrailingLoneLetter(
      stripPromptPrefix(englishAndChinese.slice(0, chineseStart))
    );
    const chinese = englishAndChinese.slice(chineseStart).replace(/[。.!?？：:]+$/g, "");
    return english ? [buildReviewItem(english, chinese)] : [];
  }

  const emojiPair = parseEmojiPair(englishAndChinese);
  if (emojiPair) return [emojiPair];

  const englishOnly = stripPromptPrefix(englishAndChinese);
  if (!shouldKeepEnglishOnly(englishOnly)) return [];
  return [buildReviewItem(englishOnly)];
}

/**
 * Chinese words can start with a Latin letter, as in "X光片". The letter reads as
 * part of the Chinese term, so drop it from the English side.
 */
function stripTrailingLoneLetter(english: string): string {
  const match = english.match(/^(.*\S)\s+[A-Za-z]$/);
  return match ? match[1] : english;
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
  // Letter ranges such as "Xx～Zz" describe the alphabet, not a word to review.
  if (/^[A-Za-z]{1,3}\s*[～~\-–—]\s*[A-Za-z]{1,3}$/.test(text)) return false;
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
