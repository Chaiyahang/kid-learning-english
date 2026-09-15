// Offline sentence translation for the child cards: children's English is
// highly patterned, so a small set of sentence templates plus a word
// glossary covers most classroom sentences. Anything the templates cannot
// translate is left untranslated — no online API, no wrong guesses.

const GLOSSARY: Record<string, string> = {
  // fruit & food
  "apple": "苹果",
  "banana": "香蕉",
  "pear": "梨",
  "orange": "橘子",
  "watermelon": "西瓜",
  "pineapple": "菠萝",
  "mango": "芒果",
  "dragon fruit": "火龙果",
  "kiwifruit": "奇异果",
  "peach": "桃子",
  "grape": "葡萄",
  "lemon": "柠檬",
  "strawberry": "草莓",
  "smoothie": "冰沙",
  "ice cream": "冰淇淋",
  "ice cube": "冰块",
  "milk": "牛奶",
  "bread": "面包",
  "egg": "鸡蛋",
  "cake": "蛋糕",
  "candy": "糖果",
  "juice": "果汁",
  "rice": "米饭",
  "yogurt": "酸奶",
  "sugar": "糖",
  "syrup": "糖浆",
  "butter": "黄油",
  "cheese": "奶酪",
  "cookie": "饼干",
  "hamburger": "汉堡",

  // animals
  "cat": "猫",
  "dog": "狗",
  "bird": "鸟",
  "fish": "鱼",
  "duck": "鸭子",
  "pig": "猪",
  "cow": "奶牛",
  "horse": "马",
  "sheep": "绵羊",
  "goat": "山羊",
  "lion": "狮子",
  "tiger": "老虎",
  "elephant": "大象",
  "monkey": "猴子",
  "bear": "熊",
  "rabbit": "兔子",
  "panda": "熊猫",
  "frog": "青蛙",
  "snake": "蛇",
  "mouse": "老鼠",
  "wolf": "狼",
  "fox": "狐狸",
  "zebra": "斑马",
  "giraffe": "长颈鹿",
  "kangaroo": "袋鼠",
  "penguin": "企鹅",
  "dolphin": "海豚",
  "whale": "鲸鱼",
  "shark": "鲨鱼",
  "ox": "公牛",
  "yak": "牦牛",
  "turtle": "乌龟",
  "chicken": "鸡",

  // letters x / y / z starter words
  "x-ray": "X光片",
  "six": "六",
  "box": "盒子",
  "yawn": "打哈欠",
  "yacht": "游艇",
  "zero": "零",
  "zoo": "动物园",
  "zipper": "拉链",

  // home & objects
  "cup": "杯子",
  "straw": "吸管",
  "blender": "搅拌机",
  "bowl": "碗",
  "spoon": "勺子",
  "plate": "盘子",
  "chair": "椅子",
  "table": "桌子",
  "bed": "床",
  "door": "门",
  "window": "窗户",
  "clock": "时钟",
  "lamp": "台灯",
  "key": "钥匙",

  // school & toys
  "book": "书",
  "pencil": "铅笔",
  "pen": "钢笔",
  "bag": "书包",
  "school": "学校",
  "teacher": "老师",
  "ball": "球",
  "balloon": "气球",
  "doll": "玩偶",
  "kite": "风筝",
  "drum": "鼓",
  "gift": "礼物",
  "toy": "玩具",

  // vehicles
  "car": "汽车",
  "bus": "公交车",
  "train": "火车",
  "plane": "飞机",
  "airplane": "飞机",
  "boat": "小船",
  "ship": "轮船",
  "bicycle": "自行车",
  "taxi": "出租车",

  // people & body
  "boy": "男孩",
  "girl": "女孩",
  "baby": "宝宝",
  "family": "家人",
  "friend": "朋友",
  "head": "头",
  "hair": "头发",
  "face": "脸",
  "eye": "眼睛",
  "ear": "耳朵",
  "nose": "鼻子",
  "mouth": "嘴",
  "hand": "手",
  "foot": "脚",
  "arm": "手臂",
  "leg": "腿",

  // nature & weather
  "sun": "太阳",
  "moon": "月亮",
  "star": "星星",
  "cloud": "云",
  "rain": "雨",
  "snow": "雪",
  "wind": "风",
  "tree": "树",
  "flower": "花",
  "leaf": "叶子",
  "grass": "草",
  "sea": "海",
  "fruit": "水果",

  // colors
  "red": "红色",
  "blue": "蓝色",
  "yellow": "黄色",
  "green": "绿色",
  "pink": "粉色",
  "black": "黑色",
  "white": "白色",

  // numbers
  "one": "一",
  "two": "二",
  "three": "三",
  "four": "四",
  "five": "五",
  "seven": "七",
  "eight": "八",
  "nine": "九",
  "ten": "十",
  "number": "数字",

  // actions & adjectives
  "run": "跑",
  "jump": "跳",
  "walk": "走",
  "swim": "游泳",
  "fly": "飞",
  "eat": "吃",
  "drink": "喝",
  "play": "玩",
  "sing": "唱歌",
  "dance": "跳舞",
  "read": "读",
  "write": "写",
  "draw": "画画",
  "sleep": "睡觉",
  "big": "大",
  "small": "小",
  "tall": "高",
  "tired": "累",
  "happy": "开心",
  "sad": "难过"
};

const ADJECTIVES = new Set([
  "red",
  "blue",
  "yellow",
  "green",
  "pink",
  "black",
  "white",
  "big",
  "small",
  "tall",
  "happy",
  "sad",
  "tired"
]);

const NUMBERS = new Set([
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten"
]);

const EXACT_SENTENCES: Record<string, string> = {
  "what do you see?": "你看见了什么？",
  "what fruit do you like?": "你喜欢什么水果？",
  "what do we need to make smoothie?": "做冰沙我们需要什么？",
  "i am tired. i yawn.": "我累了，我打哈欠。",
  "i pull my zipper.": "我拉我的拉链。",
  "i go to the zoo.": "我去动物园。",
  "i like ...": "我喜欢……",
  "we need ...": "我们需要……"
};

interface SentencePattern {
  regex: RegExp;
  render: (slots: string[]) => string;
}

const SENTENCE_PATTERNS: SentencePattern[] = [
  { regex: /^the (.+?) is (.+?)[.?!]?$/i, render: ([noun, adjective]) => `这${noun}很${adjective}。` },
  { regex: /^i see (?:a |an |the )?(.+?)[.?!]?$/i, render: ([word]) => `我看见${word}。` },
  { regex: /^i like (?:a |an |the )?(.+?)[.?!]?$/i, render: ([word]) => `我喜欢${word}。` },
  { regex: /^i have (?:a |an |the )?(.+?)[.?!]?$/i, render: ([word]) => `我有${word}。` },
  { regex: /^i am (.+?)[.?!]?$/i, render: ([word]) => `我很${word}。` },
  { regex: /^i can (.+?)[.?!]?$/i, render: ([word]) => `我会${word}。` },
  { regex: /^this is (?:a |an |the )?(.+?)[.?!]?$/i, render: ([word]) => `这是${word}。` },
  { regex: /^it is (?:a |an |the )?(.+?)[.?!]?$/i, render: ([word]) => `它是${word}。` },
  { regex: /^we see (?:a |an |the )?(.+?)[.?!]?$/i, render: ([word]) => `我们看见${word}。` },
  { regex: /^we like (?:a |an |the )?(.+?)[.?!]?$/i, render: ([word]) => `我们喜欢${word}。` },
  { regex: /^where is (?:a |an |the )?(.+?)[.?]?$/i, render: ([word]) => `${word}在哪里？` },
  { regex: /^do you like (?:a |an |the )?(.+?)[.?]$/i, render: ([word]) => `你喜欢${word}吗？` },
  { regex: /^i pull my (.+?)[.?!]?$/i, render: ([word]) => `我拉我的${word}。` },
  { regex: /^i go to the (.+?)[.?!]?$/i, render: ([word]) => `我去${word}。` },
  { regex: /^(.+?) is (?:a |an )?(.+?)[.?!]?$/i, render: ([subject, complement]) => `${subject}是${complement}。` }
];

function lookupWord(token: string): string {
  const key = token.toLowerCase();
  if (!key) return "";

  const direct = GLOSSARY[key];
  if (direct) return direct;

  if (key.endsWith("s")) {
    const singular = GLOSSARY[key.slice(0, -1)];
    if (singular) return singular;
    if (key.endsWith("es")) {
      const stem = GLOSSARY[key.slice(0, -2)];
      if (stem) return stem;
    }
  }

  return "";
}

function translateSlot(slot: string): string {
  const cleaned = slot.trim().replace(/[.?!]+$/, "").trim();
  if (!cleaned) return "";

  const exact = GLOSSARY[cleaned.toLowerCase()];
  if (exact) return exact;

  const tokens = cleaned.split(/\s+/);
  const translated = tokens.map(lookupWord);
  if (translated.some((word) => !word)) return "";
  if (tokens.length === 1) return translated[0];

  if (tokens.length === 2 && ADJECTIVES.has(tokens[0].toLowerCase())) {
    return `${translated[0]}的${translated[1]}`;
  }
  if (tokens.length === 2 && NUMBERS.has(tokens[0].toLowerCase())) {
    return `${translated[0]}个${translated[1]}`;
  }
  return translated.join(" ");
}

export function translateSentence(english: string): string {
  const text = english.trim().replace(/\s+/g, " ");
  if (!text) return "";

  const exact = EXACT_SENTENCES[text.toLowerCase()];
  if (exact) return exact;

  for (const pattern of SENTENCE_PATTERNS) {
    const match = text.match(pattern.regex);
    if (!match) continue;

    const slots = match.slice(1).map(translateSlot);
    if (slots.some((slot) => !slot)) continue;
    return pattern.render(slots);
  }

  return "";
}
