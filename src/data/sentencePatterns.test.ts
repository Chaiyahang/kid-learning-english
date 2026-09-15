import { describe, expect, it } from "vitest";
import { translateSentence } from "./sentencePatterns";

describe("translateSentence", () => {
  it("translates exact classroom sentences", () => {
    expect(translateSentence("What do you see?")).toBe("你看见了什么？");
    expect(translateSentence("What fruit do you like?")).toBe("你喜欢什么水果？");
    expect(translateSentence("I am tired. I yawn.")).toBe("我累了，我打哈欠。");
  });

  it("translates patterned sentences with glossary words", () => {
    expect(translateSentence("I see a cat.")).toBe("我看见猫。");
    expect(translateSentence("I see an X-ray.")).toBe("我看见X光片。");
    expect(translateSentence("I like yogurt.")).toBe("我喜欢酸奶。");
    expect(translateSentence("I have six toys.")).toBe("我有六个玩具。");
    expect(translateSentence("The lion is big.")).toBe("这狮子很大。");
    expect(translateSentence("I am tired.")).toBe("我很累。");
    expect(translateSentence("We see a yacht.")).toBe("我们看见游艇。");
    expect(translateSentence("Zero is a number.")).toBe("零是数字。");
  });

  it("translates adjective + noun slots with 的", () => {
    expect(translateSentence("I like the blue bird.")).toBe("我喜欢蓝色的鸟。");
  });

  it("leaves unknown sentences untranslated", () => {
    expect(translateSentence("Zorp blorf snarf.")).toBe("");
    expect(translateSentence("I see a zorp.")).toBe("");
    expect(translateSentence("")).toBe("");
  });

  it("is case-insensitive and tolerates extra spaces", () => {
    expect(translateSentence("  i   see a CAT. ")).toBe("我看见猫。");
  });
});
