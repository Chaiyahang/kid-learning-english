// American English IPA for common preschool words. Lookup is best-effort:
// words missing from the table simply show no phonetic line. Keys are
// lowercase; matching also tries the singular form of simple plurals.
const reviewPhonetics: Record<string, string> = {
  // fruit & food
  "apple": "ˈæpəl",
  "banana": "bəˈnænə",
  "pear": "per",
  "orange": "ˈɔːrɪndʒ",
  "watermelon": "ˈwɔːtərˌmelən",
  "pineapple": "ˈpaɪnˌæpəl",
  "mango": "ˈmæŋɡoʊ",
  "dragon fruit": "ˈdræɡən fruːt",
  "kiwifruit": "ˈkiːwiːfruːt",
  "peach": "piːtʃ",
  "grape": "ɡreɪp",
  "lemon": "ˈlemən",
  "strawberry": "ˈstrɔːberi",
  "smoothie": "ˈsmuːði",
  "ice cream": "ˌaɪs ˈkriːm",
  "ice cube": "ˈaɪs kjuːb",
  "milk": "mɪlk",
  "bread": "bred",
  "egg": "eɡ",
  "cake": "keɪk",
  "candy": "ˈkændi",
  "juice": "dʒuːs",
  "rice": "raɪs",
  "noodles": "ˈnuːdəlz",
  "yogurt": "ˈjoʊɡərt",
  "sugar": "ˈʃʊɡər",
  "syrup": "ˈsɪrəp",
  "butter": "ˈbʌtər",
  "cheese": "tʃiːz",
  "cookie": "ˈkʊki",
  "hamburger": "ˈhæmbɜːrɡər",

  // animals
  "cat": "kæt",
  "dog": "dɔːɡ",
  "bird": "bɜːrd",
  "fish": "fɪʃ",
  "duck": "dʌk",
  "pig": "pɪɡ",
  "cow": "kaʊ",
  "horse": "hɔːrs",
  "sheep": "ʃiːp",
  "goat": "ɡoʊt",
  "lion": "ˈlaɪən",
  "tiger": "ˈtaɪɡər",
  "elephant": "ˈelɪfənt",
  "monkey": "ˈmʌŋki",
  "bear": "ber",
  "rabbit": "ˈræbɪt",
  "panda": "ˈpændə",
  "frog": "frɔːɡ",
  "snake": "sneɪk",
  "mouse": "maʊs",
  "wolf": "wʊlf",
  "fox": "fɑːks",
  "zebra": "ˈziːbrə",
  "giraffe": "dʒəˈræf",
  "kangaroo": "ˌkæŋɡəˈruː",
  "penguin": "ˈpeŋɡwɪn",
  "dolphin": "ˈdɑːlfɪn",
  "whale": "weɪl",
  "shark": "ʃɑːrk",
  "ox": "ɑːks",
  "yak": "jæk",
  "turtle": "ˈtɜːrtəl",
  "chicken": "ˈtʃɪkɪn",

  // letters x / y / z starter words
  "x-ray": "ˈeks reɪ",
  "six": "sɪks",
  "box": "bɑːks",
  "yawn": "jɔːn",
  "yacht": "jɑːt",
  "zero": "ˈzɪroʊ",
  "zoo": "zuː",
  "zipper": "ˈzɪpər",

  // home & objects
  "cup": "kʌp",
  "straw": "strɔː",
  "blender": "ˈblendər",
  "bowl": "boʊl",
  "spoon": "spuːn",
  "plate": "pleɪt",
  "chair": "tʃer",
  "table": "ˈteɪbəl",
  "bed": "bed",
  "door": "dɔːr",
  "window": "ˈwɪndoʊ",
  "clock": "klɑːk",
  "lamp": "læmp",
  "key": "kiː",

  // school & toys
  "book": "bʊk",
  "pencil": "ˈpensəl",
  "pen": "pen",
  "bag": "bæɡ",
  "school": "skuːl",
  "teacher": "ˈtiːtʃər",
  "ball": "bɔːl",
  "balloon": "bəˈluːn",
  "doll": "dɑːl",
  "kite": "kaɪt",
  "drum": "drʌm",
  "gift": "ɡɪft",
  "toy": "tɔɪ",

  // vehicles
  "car": "kɑːr",
  "bus": "bʌs",
  "train": "treɪn",
  "plane": "pleɪn",
  "airplane": "ˈerpleɪn",
  "boat": "boʊt",
  "ship": "ʃɪp",
  "bicycle": "ˈbaɪsɪkəl",
  "taxi": "ˈtæksi",

  // people & body
  "boy": "bɔɪ",
  "girl": "ɡɜːrl",
  "baby": "ˈbeɪbi",
  "family": "ˈfæməli",
  "friend": "frend",
  "head": "hed",
  "hair": "her",
  "face": "feɪs",
  "eye": "aɪ",
  "ear": "ɪr",
  "nose": "noʊz",
  "mouth": "maʊθ",
  "hand": "hænd",
  "foot": "fʊt",
  "arm": "ɑːrm",
  "leg": "leɡ",

  // nature & weather
  "sun": "sʌn",
  "moon": "muːn",
  "star": "stɑːr",
  "cloud": "klaʊd",
  "rain": "reɪn",
  "snow": "snoʊ",
  "wind": "wɪnd",
  "tree": "triː",
  "flower": "ˈflaʊər",
  "leaf": "liːf",
  "grass": "ɡræs",
  "sea": "siː",

  // colors & numbers
  "red": "red",
  "blue": "bluː",
  "yellow": "ˈjeloʊ",
  "green": "ɡriːn",
  "pink": "pɪŋk",
  "black": "blæk",
  "white": "waɪt",
  "one": "wʌn",
  "two": "tuː",
  "three": "θriː",
  "four": "fɔːr",
  "five": "faɪv",
  "seven": "ˈsevən",
  "eight": "eɪt",
  "nine": "naɪn",
  "ten": "ten",

  // actions & adjectives
  "run": "rʌn",
  "jump": "dʒʌmp",
  "walk": "wɔːk",
  "swim": "swɪm",
  "fly": "flaɪ",
  "eat": "iːt",
  "drink": "drɪŋk",
  "play": "pleɪ",
  "sing": "sɪŋ",
  "dance": "dæns",
  "read": "riːd",
  "write": "raɪt",
  "draw": "drɔː",
  "sleep": "sliːp",
  "happy": "ˈhæpi",
  "sad": "sæd",
  "big": "bɪɡ",
  "small": "smɔːl",
  "tall": "tɔːl"
};

export function getReviewPhonetic(english: string): string {
  const key = english.trim().replace(/\s+/g, " ").toLowerCase();
  if (!key) return "";

  const direct = reviewPhonetics[key];
  if (direct) return direct;

  // simple plural / third person fallback: "apples" -> "apple"
  if (key.endsWith("s")) {
    const singular = reviewPhonetics[key.slice(0, -1)];
    if (singular) return singular;
    if (key.endsWith("es")) {
      const stem = reviewPhonetics[key.slice(0, -2)];
      if (stem) return stem;
    }
  }

  return "";
}
