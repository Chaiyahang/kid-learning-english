# 儿童英语复习 · 本地优先双模式 Web 设计

日期：2026-09-15  
状态：已确认，待写实现计划

## 背景

这是一个给 4 岁孩子用的课后英语听读工具。家长粘贴老师发来的课堂总结，系统拆成单词和句子，孩子逐张点卡片听英文发音。

本版采用 Vue 3 + Vite 的手机端 PWA 形态：

- 从课堂总结拆单词/句子
- 浏览器 `speechSynthesis` 朗读
- `localStorage` 持久化
- PWA 壳（manifest + service worker）

关键取舍不在技术栈，而在产品结构：家长录入和孩子听读必须分开。四岁小孩会点到设置、搜图、同步，所以第一版只保留「粘贴 → 拆词 → 听读」闭环。

## 目标

第一版成功标准：家长粘贴老师发来的课堂总结，自动拆成单词和句子，孩子在另一页逐张点卡片听英文发音。数据只存在当前设备。

非目标（第一版明确不做）：

- 云同步 / 家庭编辑码
- 微信小程序
- 参考图搜索、上传、Wikimedia / Openverse
- 在线翻译（MyMemory / 浏览器 Translator）
- 自动播放学习模式
- 字母单元、拼写开关、音标
- 跟读打分、作业打卡、多孩子档案
- 多端（uni-app / Taro）

形态后定。本设计产出可安装的 PWA，微信里能当 H5 打开；小程序等闭环跑通后再评估。

## 用户与场景

两个角色，同一设备：

1. 家长拿到老师群发的课堂总结，打开应用，粘贴原文，确认拆词结果，保存。
2. 孩子打开孩子页，看到当前复习日的一张大卡片，点发音按钮听英文，再点「下一个」。

刷新后仍停留在上次看到的那张卡片。没有复习日时不能进入孩子页。

## 信息架构

两条路由，没有底部 Tab。

| 路由 | 角色 | 作用 |
| --- | --- | --- |
| `/` | 家长 | 粘贴、预览、保存、查看已有复习日、进入孩子页 |
| `/play` | 孩子 | 当前复习日的大卡片听读 |

孩子页不放设置入口，但**必须有看得见的返回入口**：顶栏左侧一个「家长」按钮，点一下即回家长页。家长页的「给孩子听」回到 `/play`。

> 早期版本用的是"长按屏幕左上角 1 秒"的隐形热区，实机验证失败：没有任何视觉提示，家长自己被卡在孩子页出不来。孩子页没有任何破坏性操作，孩子误触的代价只是看到一个粘贴框；而家长被卡住的代价高得多，所以改成显式按钮。

没有复习日时访问 `/play`，立即重定向到 `/`，并提示先录入。PWA 从主屏幕启动也走 `/play`，因此空数据时会落到家长页。

## 界面

### 家长页 `/`

从上到下：

1. 标题「录入复习」和「给孩子听」按钮（有复习日才可点）。
2. 已有复习日列表。每项显示日期标签、单词数、句子数。点一项设为当前复习日。当前项高亮。
3. 大文本框，占位符：「粘贴老师发来的课堂总结」。
4. 预览区。输入变化后即时拆词，显示「将拆成 N 个单词 · M 个句子」和条目列表（emoji + 英文 + 中文）。拆不出时显示「没识别到英文单词或句子」，保存按钮禁用。
5. 主按钮「保存并给孩子复习」。成功后把该复习日设为当前，跳到 `/play`。
6. 「学习设置」卡片：
   - 「自动朗读」开关。开启后，孩子页每次切到新卡片自动发音。
   - 「朗读次数」分段选择 1 / 2 / 3 次，仅在自动朗读开启时可选。
   - 设置即时保存到 `localStorage`，孩子页下次进入生效。

第一版不提供编辑已有复习日、删除单条词句、改中文释义。可以删除整份复习日：列表项上的删除需二次确认，允许删到零。删光后「给孩子听」禁用。

全局背景色为暖奶油色 `#fff3dc`（对儿童更友好，也适合睡前使用）；卡片、列表保持白底。

日期标签默认用当天，格式 `M月D日`，如 `9月15日`。同一天保存多次则生成多份，标题用 `9月15日复习`、`9月15日复习 2` 以此类推，不覆盖。

### 孩子页 `/play`

全屏一张卡，没有抽屉、没有列表、没有设置。

- 顶栏左侧「家长」按钮（可点区域高度不低于 44px），右侧日期标签和 `当前 / 总数`，例如 `9月15日` `2 / 3`。
- 顶栏下方一条细进度条，宽度为 `(当前下标 + 1) / 总数`，孩子能看出还剩多少。
- 英文：大字，按长度缩放。短词约 40px 单行；长句允许换行，不横向溢出。
- 中文：英文下方。没有中文则不渲染该行。
- 大图：对应 emoji，没有则单词用 📝、句子用 💬。
- 圆形发音按钮，直径 72px，三态：
  - 未播放：显示 ▶，`aria-label` 为「播放发音」。
  - 播放中：显示方块并按 1.1s 脉冲，`aria-label` 为「停止发音」，再点一下立即停止。
  - 播放结束（`onend`／`onerror`／超时兜底）：回到未播放。
  - 句子语速 0.7，单词 0.78。切换卡片或离开页面时停止朗读。
- 自动朗读：家长页开启后，`activeItem` 变化（上一张/下一张）时按设定的次数连读。**进入页面不自动播**——iOS 只允许用户手势触发语音，自动播会被静音，还会造成"点开就有声"的不可控体验。手动点发音按钮只播一遍。
- 底部「上一个」「下一个」，循环到两端（最后一张的下一个回到第一张）。
- 不显示拼写、音标、参考图片、迷你卡片条、今日学习内容。

浏览器不支持 `speechSynthesis` 时，发音按钮仍显示。点了一次提示：「请用 Safari 或 Chrome 打开，或添加到主屏幕后再听。」提示只出现一次，存在 `localStorage`。

## 数据

全部存在当前浏览器 `localStorage`。键名带版本后缀，避免不同版本之间互相覆盖。

```
kid-learning-english.lessons.v1
kid-learning-english.progress.v1
kid-learning-english.settings.v1
kid-learning-english.tts-hint.v1
```

结构：

```ts
type ItemCategory = "word" | "sentence";

interface ReviewItem {
  id: string;
  english: string;
  chinese: string;
  category: ItemCategory;
  emoji: string;
}

interface ReviewLesson {
  id: string;
  dateLabel: string;      // "9月15日"
  title: string;          // "9月15日复习"
  teacherText: string;    // 家长粘贴的原文
  items: ReviewItem[];
  createdAt: string;      // ISO
}

interface Progress {
  activeLessonId: string;
  indexByLessonId: Record<string, number>;
}
```

读写失败（隐私模式配额、JSON 损坏）时：当次按空列表处理，不弹系统 alert。家长页顶部给一句「本机存储不可用，刷新后内容可能丢失」。

进度只记当前卡片下标。刷新、关闭再开，仍停在该张。删除某复习日后，从 `indexByLessonId` 去掉对应键；若删的是当前复习日，把 `activeLessonId` 指到列表第一份，没有则清空。

## 拆词规则

拆词要覆盖老师常用的几种写法，并避开会产出错卡的边界（实现时补了测试）：

- 按行扫描，支持 `pineapple 菠萝`、`pineapple（菠萝）`、逗号/顿号分隔，以及 ` / ` 斜杠分隔的单词表（老师常用格式）。
- 标题行 `单词` / `句子` / `Words` / `Sentences` 只切换后续类别，本身不入库。
- 去掉老师原文里的项目符号、emoji 装饰、`1️⃣` 这类序号。
- 英文后紧跟中文则中文作为释义；没有中文则 `chinese` 为空字符串。第一版不调用任何翻译 API。
- 中文词以拉丁字母开头时（如 `X光片`），该字母属于中文词，不留在英文里。
- 跳过教学说明：含 `《...》` 的教材/歌名行不入库；括号内中文超过 12 字视为说明而非释义；`Xx～Zz` 这类字母区间不入库。
- 同一行括号对之外的剩余内容继续解析，例如 `apple（苹果），pear 梨` 会得到两个单词。
- 去重键：英文小写、去末尾标点。重复行只保留第一次。
- 类别：以 `.?!` 结尾或超过 3 个英文词 → `sentence`，否则 `word`。第一版不收录 letter 类别。
- emoji：先查英文词表，再按中英关键词兜底；句子默认 💬，单词默认 📝。

保存时用当时预览的结果写入，不再二次解析。预览与保存必须走同一函数。

## 发音

封装浏览器语音朗读：

- 有 `window.speechSynthesis` 才调用。
- 每次先 `cancel()` 再朗读，避免连点叠音。
- `lang: "en-US"`，`pitch: 1.12`。
- 超时兜底：`max(1800, text.length * 180)` 毫秒后结束 Promise，避免部分浏览器不触发 `onend`。

不预生成音频，不接云端 TTS。微信内置浏览器经常没有 TTS，走上面的一次性提示。

## PWA

- `manifest.webmanifest`：名称「儿童英语复习」，`display: standalone`，`start_url` 为 `./play`（相对路径，兼容子路径部署）。有复习日时从主屏幕打开直接进入孩子页；没有复习日则重定向到 `/`。
- 图标必须提供 PNG：iOS 不认 SVG 的 `apple-touch-icon`，Android 启动器需要 maskable。素材是「字母积木 A + 发音气泡」，源文件 `public/app-icon.svg`（浏览器直接用），PNG 由 `scripts/generate-icons.py` 生成（Pillow，1024px 超采样后缩到目标尺寸）：
  - `apple-touch-icon.png` 180×180（iOS 主屏幕）
  - `icon-192.png` / `icon-512.png`（manifest `purpose: any`）
  - `icon-maskable-512.png`（`purpose: maskable`，内容缩进 80% 安全区）
- `index.html` 带 `apple-mobile-web-app-capable`、禁止缩放的 viewport（避免小孩双指放大把卡片弄乱）。
- 仅 production 注册 service worker。HTML 网络优先，静态资源缓存优先。
- 第一版不加「添加到主屏幕」引导条。能装即可。

## 部署

GitHub Pages（仓库子路径 `https://<账号>.github.io/kid-learning-english/`）：

- `pnpm build:pages` 使用 `VITE_DEPLOY_TARGET=github-pages`，`base` 切到 `/kid-learning-english/`；本地与普通构建仍是 `/`。
- 路由用 `createWebHistory(import.meta.env.BASE_URL)`，service worker 也按 `BASE_URL` 注册，图标与 manifest 在 `index.html` 里用 `%BASE_URL%` 前缀。
- 客户端路由是 history 模式，Pages 没有服务端 rewrite，因此构建产物把 `index.html` 复制一份成 `404.html` 作为深链回退。`/play` 直接打开时 HTTP 状态是 404，但返回的是应用外壳，SPA 启动后正常渲染。
- `.github/workflows/pages.yml` 在 main 推送时跑测试、构建并部署；Pages 的 Source 设为 GitHub Actions。

## 技术结构

独立仓库。拆词、emoji 对照表、发音封装各自独立成文件，其余重写。

```
src/
  App.vue                 路由出口
  pages/ParentPage.vue    家长页
  pages/PlayPage.vue      孩子页
  composables/useLessons.ts
  data/parseReviewText.ts
  data/reviewEmojis.ts
  services/speech.ts
  services/storage.ts
  types/review.ts
  styles/main.css
```

- Vue 3 + Vite + TypeScript + vue-router。
- 不用 Element Plus。控件自己写，保证孩子页按钮够大（发音按钮不小于 72px，上一个/下一个高度不小于 48px）。
- 单文件职责：拆词、存储、发音、页面互不耦合。`useLessons` 是唯一读写 `localStorage` 课程数据的入口。

路由用 `createWebHistory`。GitHub Pages 子路径部署见部署章节；本地 `pnpm dev` 用 HTTPS（`@vitejs/plugin-basic-ssl`），因为部分浏览器在 HTTP 下限制 `speechSynthesis` 和 PWA。

## 错误处理

| 情况 | 行为 |
| --- | --- |
| 拆不出词句 | 预览提示，保存禁用 |
| TTS 不可用 | 按钮可点，首次提示换浏览器 |
| 无复习日进 `/play` | 重定向 `/`，提示先录入 |
| `localStorage` 不可用 | 当次内存可用，顶部提示可能丢失 |
| 朗读失败 / `onerror` | 静默结束，不弹窗 |

## 测试

第一版以手动验收为主，覆盖：

1. 粘贴 Letter X / 水果冰沙这类课堂原文，拆出的单词和句子符合预期（允许漏掉作业说明里的非词句行）。
2. 保存后进入孩子页，点发音能听到英文。
3. 「下一个」循环；刷新后停留在同一张。
4. 无数据时 `/play` 回到家长页。
5. 孩子页看不到录入框和删除按钮。

不强制上自动化测试。若补测试，优先给 `parseReviewText` 写纯函数用例。

## 风险

- 微信内置浏览器 TTS 不可用。第一版接受，用文案引导 Safari / Chrome / 主屏幕。这是形态后定的原因之一。
- 老师原文格式各异，拆词会漏或误收。第一版只保证「英文 + 中文」行和短句；家长以预览为准，不接受再手动改条目。
- iOS Safari 对 `speechSynthesis` 有时需用户手势才能出声。发音放在明确的点击按钮上，不自动播。

## 后续（不在第一版）

闭环跑通后，按实际使用再选：

- 加云同步，让家长手机录入、孩子平板复习。
- 发一个微信可打开的 HTTPS 链接（仍是本 PWA）。
- 若必须在微信里稳定发音，再评估云端 TTS 或小程序。
