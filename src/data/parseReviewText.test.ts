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

  it("splits slash-separated word lists", () => {
    const items = parseReviewText(
      "apple 苹果 / dragon fruit 火龙果 / pineapple 菠萝 / What fruit do you like? / I like ..."
    );

    expect(items).toHaveLength(5);
    expect(items.map((item) => item.english)).toEqual([
      "apple",
      "dragon fruit",
      "pineapple",
      "What fruit do you like?",
      "I like ..."
    ]);
    expect(items[1].chinese).toBe("火龙果");
    expect(items[4].category).toBe("sentence");
  });

  it("ignores song titles and letter ranges from teaching notes", () => {
    const items = parseReviewText(
      "1.唱歌曲《A is for Apple》A-Z(结合歌曲记忆字母发音及相关单词）\n1️⃣观看外教老师指读视频字母Xx～Zz"
    );
    expect(items).toEqual([]);
  });
});
