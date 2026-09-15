import { beforeEach, describe, expect, it } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import App from "./App.vue";
import { router } from "./router";

const SMOOTHIE =
  "apple 苹果 / dragon fruit 火龙果 / mango 芒果 / kiwifruit 奇异果 / pineapple 菠萝 / smoothie 冰沙 / ice cube 冰块 / sugar 糖 / syrup 糖浆 / blender 搅拌机 / cup 杯子 / straw 吸管 / What fruit do you like? / I like ... / What do we need to make smoothie? / We need ...";

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
});
