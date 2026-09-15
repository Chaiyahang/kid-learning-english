import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import App from "./App.vue";
import { router } from "./router";
import { savePlaySettings } from "./services/settings";

const SMOOTHIE =
  "apple 苹果 / dragon fruit 火龙果 / mango 芒果 / kiwifruit 奇异果 / pineapple 菠萝 / smoothie 冰沙 / ice cube 冰块 / sugar 糖 / syrup 糖浆 / blender 搅拌机 / cup 杯子 / straw 吸管 / What fruit do you like? / I like ... / What do we need to make smoothie? / We need ...";

interface FakeUtterance {
  text: string;
  onend?: () => void;
  onerror?: () => void;
}

function stubSpeech() {
  const spoken: FakeUtterance[] = [];
  const cancel = vi.fn();

  class Utterance {
    lang = "";
    pitch = 1;
    rate = 1;
    onend?: () => void;
    onerror?: () => void;
    constructor(text: string) {
      this.text = text;
    }
  }

  vi.stubGlobal("speechSynthesis", {
    speak: (utterance: FakeUtterance) => spoken.push(utterance),
    cancel
  });
  vi.stubGlobal("SpeechSynthesisUtterance", Utterance);

  return { spoken, cancel };
}

async function mountApp(): Promise<VueWrapper> {
  await router.push("/");
  await router.isReady();
  const wrapper = mount(App, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
}

async function mountAt(path: string): Promise<VueWrapper> {
  await router.push(path);
  await router.isReady();
  const wrapper = mount(App, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
}

async function pasteAndSave(wrapper: VueWrapper) {
  await wrapper.find("textarea").setValue(SMOOTHIE);
  await flushPromises();
  await wrapper.find(".primary-button").trigger("click");
  await flushPromises();
}

describe("app flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves teacher text and shows the first card on the child page", async () => {
    const wrapper = await mountApp();
    expect(wrapper.find("h1").text()).toBe("录入复习");
    expect(wrapper.find(".preview p").text()).toBe("没识别到英文单词或句子");
    expect(wrapper.find(".primary-button").attributes("disabled")).toBeDefined();

    await pasteAndSave(wrapper);

    expect(router.currentRoute.value.path).toBe("/play");
    expect(wrapper.find(".play-english").text()).toBe("apple");
    expect(wrapper.find(".play-chinese").text()).toBe("苹果");
    expect(wrapper.findAll(".play-header span")[1].text()).toBe("1 / 16");
    expect(wrapper.find("textarea").exists()).toBe(false);
  });

  it("previews every extracted word and sentence before saving", async () => {
    const wrapper = await mountApp();
    await wrapper.find("textarea").setValue(SMOOTHIE);
    await flushPromises();

    expect(wrapper.find(".preview p").text()).toBe("将拆成 12 个单词 · 4 个句子");
    expect(wrapper.findAll(".preview li")).toHaveLength(16);
    expect(wrapper.find(".preview li").text()).toContain("apple");
  });

  it("wraps navigation in both directions", async () => {
    const wrapper = await mountApp();
    await pasteAndSave(wrapper);

    await wrapper.find(".play-nav button:last-child").trigger("click");
    expect(wrapper.find(".play-english").text()).toBe("dragon fruit");

    await wrapper.find(".play-nav button:first-child").trigger("click");
    expect(wrapper.find(".play-english").text()).toBe("apple");

    await wrapper.find(".play-nav button:first-child").trigger("click");
    expect(wrapper.findAll(".play-header span")[1].text()).toBe("16 / 16");
  });

  it("restores the card position after a reload", async () => {
    const wrapper = await mountApp();
    await pasteAndSave(wrapper);
    await wrapper.find(".play-nav button:last-child").trigger("click");
    await flushPromises();
    wrapper.unmount();

    const reloaded = await mountAt("/play");
    expect(reloaded.findAll(".play-header span")[1].text()).toBe("2 / 16");
    expect(reloaded.find(".play-english").text()).toBe("dragon fruit");
  });

  it("sends an empty child page back to the parent page with a hint", async () => {
    const wrapper = await mountApp();
    await router.push("/play");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/");
    expect(wrapper.find(".banner").text()).toBe("请先录入复习内容");
  });

  it("deletes a lesson and disables the child page again", async () => {
    const wrapper = await mountApp();
    await pasteAndSave(wrapper);
    await router.push("/");
    await flushPromises();
    expect(wrapper.findAll(".lesson-row")).toHaveLength(1);

    window.confirm = () => true;
    await wrapper.find(".lesson-delete").trigger("click");
    await flushPromises();

    expect(wrapper.findAll(".lesson-row")).toHaveLength(0);
    expect(wrapper.find(".text-button").attributes("disabled")).toBeDefined();
  });

  it("returns to the parent page from the visible header button", async () => {
    const wrapper = await mountApp();
    await pasteAndSave(wrapper);
    expect(router.currentRoute.value.path).toBe("/play");

    const parentLink = wrapper.find(".parent-link");
    expect(parentLink.exists()).toBe(true);
    expect(parentLink.text()).toBe("家长");

    await parentLink.trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/");
    expect(wrapper.find("h1").text()).toBe("录入复习");
  });

  it("fills the progress bar as the child moves through the cards", async () => {
    const wrapper = await mountApp();
    await pasteAndSave(wrapper);

    const widthOf = () =>
      (wrapper.find(".progress-fill").element as HTMLElement).style.width;
    expect(widthOf()).toBe("6.25%");

    await wrapper.find(".play-nav button:last-child").trigger("click");
    expect(widthOf()).toBe("12.5%");

    await wrapper.find(".play-nav button:first-child").trigger("click");
    expect(widthOf()).toBe("6.25%");
  });

  it("shows the play button as speaking until the utterance ends", async () => {
    const spoken: Array<{ text: string; onend?: () => void }> = [];
    const cancel = vi.fn();

    class FakeUtterance {
      lang = "";
      pitch = 1;
      rate = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {}
      set endHandler(handler: () => void) {
        this.onend = handler;
      }
    }

    vi.stubGlobal("speechSynthesis", {
      speak: (utterance: FakeUtterance) => spoken.push(utterance),
      cancel
    });
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);

    const wrapper = await mountApp();
    await pasteAndSave(wrapper);

    const button = () => wrapper.find(".speak-button");
    expect(button().classes()).not.toContain("is-speaking");
    expect(button().attributes("aria-label")).toBe("播放发音");

    await button().trigger("click");
    expect(spoken).toHaveLength(1);
    expect(spoken[0].text).toBe("apple");
    expect(button().classes()).toContain("is-speaking");
    expect(button().attributes("aria-label")).toBe("停止发音");

    spoken[0].onend?.();
    await flushPromises();

    expect(button().classes()).not.toContain("is-speaking");
    expect(button().attributes("aria-label")).toBe("播放发音");

    await button().trigger("click");
    await button().trigger("click");
    await flushPromises();

    expect(cancel).toHaveBeenCalled();
    expect(button().classes()).not.toContain("is-speaking");

    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("auto speaks the configured number of times after switching cards", async () => {
    const { spoken } = stubSpeech();
    savePlaySettings({ autoPlay: true, repeatCount: 2 });

    const wrapper = await mountApp();
    await pasteAndSave(wrapper);
    expect(spoken).toHaveLength(0);

    await wrapper.find(".play-nav button:last-child").trigger("click");
    expect(spoken).toHaveLength(1);
    expect(spoken[0].text).toBe("dragon fruit");

    spoken[0].onend?.();
    await flushPromises();
    expect(spoken).toHaveLength(2);

    spoken[1].onend?.();
    await flushPromises();
    expect(spoken).toHaveLength(2);

    await wrapper.find(".play-nav button:last-child").trigger("click");
    expect(spoken).toHaveLength(3);
    expect(spoken[2].text).toBe("mango");
  });

  it("keeps manual play silent-triggered only when auto play is off", async () => {
    const { spoken } = stubSpeech();
    savePlaySettings({ autoPlay: false, repeatCount: 1 });

    const wrapper = await mountApp();
    await pasteAndSave(wrapper);

    await wrapper.find(".play-nav button:last-child").trigger("click");
    await flushPromises();
    expect(spoken).toHaveLength(0);

    await wrapper.find(".speak-button").trigger("click");
    expect(spoken).toHaveLength(1);
    expect(spoken[0].text).toBe("dragon fruit");
  });

  it("shows the phonetic on the child card for known words", async () => {
    const wrapper = await mountApp();
    await wrapper.find("textarea").setValue(SMOOTHIE);
    await flushPromises();
    expect(wrapper.find(".preview-phonetic").text()).toBe("/ˈæpəl/");

    await wrapper.find(".primary-button").trigger("click");
    await flushPromises();

    expect(wrapper.find(".play-english").text()).toBe("apple");
    expect(wrapper.find(".play-phonetic").text()).toBe("/ˈæpəl/");
    expect(wrapper.find(".play-chinese").text()).toBe("苹果");
  });

  it("hides the phonetic for sentences and unknown words", async () => {
    const wrapper = await mountApp();
    await pasteAndSave(wrapper);

    for (let i = 0; i < 12; i += 1) {
      await wrapper.find(".play-nav button:last-child").trigger("click");
    }
    expect(wrapper.find(".play-english").text()).toBe("What fruit do you like?");
    expect(wrapper.find(".play-phonetic").exists()).toBe(false);

    await router.push("/");
    await flushPromises();
    await wrapper.find("textarea").setValue("florp 佛洛普");
    await flushPromises();
    expect(wrapper.find(".preview-phonetic").exists()).toBe(false);

    await wrapper.find(".primary-button").trigger("click");
    await flushPromises();
    expect(wrapper.find(".play-english").text()).toBe("florp");
    expect(wrapper.find(".play-phonetic").exists()).toBe(false);
    expect(wrapper.find(".play-chinese").text()).toBe("佛洛普");
  });
});
