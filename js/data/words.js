// 實用日文單字庫（初學 N5 高頻核心詞彙）
window.VOCAB_DATA = [
  // === 問候與常用會話 ===
  { kana: 'こんにちは', kanji: '今日は', romaji: ['konnichiwa', 'konniciwa'], meaning: '你好', category: '問候常用' },
  { kana: 'ありがとう', kanji: '有難う', romaji: ['arigatou', 'arigato'], meaning: '謝謝', category: '問候常用' },
  { kana: 'おはよう', kanji: 'お早う', romaji: ['ohayou', 'ohayo'], meaning: '早安', category: '問候常用' },
  { kana: 'こんばんは', kanji: '今晩は', romaji: ['konbanwa'], meaning: '晚安（見面時）', category: '問候常用' },
  { kana: 'おやすみ', kanji: 'お休み', romaji: ['oyasumi'], meaning: '晚安（睡前）', category: '問候常用' },
  { kana: 'すみません', kanji: '済みません', romaji: ['sumimasen'], meaning: '不好意思／對不起', category: '問候常用' },
  { kana: 'ごめんなさい', kanji: '御免なさい', romaji: ['gomennasai'], meaning: '對不起', category: '問候常用' },
  { kana: 'さようなら', kanji: '左様なら', romaji: ['sayounara', 'sayonara'], meaning: '再見', category: '問候常用' },
  { kana: 'はい', kanji: '', romaji: ['hai'], meaning: '是的／好的', category: '問候常用' },
  { kana: 'いいえ', kanji: '', romaji: ['iie'], meaning: '不／不是', category: '問候常用' },

  // === 動物世界 ===
  { kana: 'ねこ', kanji: '猫', romaji: ['neko'], meaning: '貓咪', category: '可愛動物' },
  { kana: 'いぬ', kanji: '犬', romaji: ['inu'], meaning: '狗狗', category: '可愛動物' },
  { kana: 'とり', kanji: '鳥', romaji: ['tori'], meaning: '小鳥', category: '可愛動物' },
  { kana: 'さかな', kanji: '魚', romaji: ['sakana'], meaning: '魚', category: '可愛動物' },
  { kana: 'うさぎ', kanji: '兎', romaji: ['usagi'], meaning: '兔子', category: '可愛動物' },
  { kana: 'さる', kanji: '猿', romaji: ['saru'], meaning: '猴子', category: '可愛動物' },
  { kana: 'くま', kanji: '熊', romaji: ['kuma'], meaning: '熊', category: '可愛動物' },
  { kana: 'うま', kanji: '馬', romaji: ['uma'], meaning: '馬', category: '可愛動物' },
  { kana: 'ぶた', kanji: '豚', romaji: ['buta'], meaning: '豬', category: '可愛動物' },
  { kana: 'ぞう', kanji: '象', romaji: ['zou', 'zo'], meaning: '大象', category: '可愛動物' },
  { kana: 'ぱんだ', kanji: '', romaji: ['panda'], meaning: '熊貓', category: '可愛動物' },

  // === 美食與飲品 ===
  { kana: 'すし', kanji: '寿司', romaji: ['sushi', 'susi'], meaning: '壽司', category: '美味飲食' },
  { kana: 'らーめん', kanji: '拉麺', romaji: ['ra-men', 'ramen'], meaning: '拉麵', category: '美味飲食' },
  { kana: 'おちゃ', kanji: 'お茶', romaji: ['ocha', 'otya'], meaning: '茶／日式綠茶', category: '美味飲食' },
  { kana: 'みず', kanji: '水', romaji: ['mizu'], meaning: '水', category: '美味飲食' },
  { kana: 'ごはん', kanji: 'ご飯', romaji: ['gohan'], meaning: '米飯／飯', category: '美味飲食' },
  { kana: 'にく', kanji: '肉', romaji: ['niku'], meaning: '肉', category: '美味飲食' },
  { kana: 'たまご', kanji: '卵', romaji: ['tamago'], meaning: '雞蛋', category: '美味飲食' },
  { kana: 'りんご', kanji: '林檎', romaji: ['ringo'], meaning: '蘋果', category: '美味飲食' },
  { kana: 'いちご', kanji: '苺', romaji: ['ichigo', 'itigo'], meaning: '草莓', category: '美味飲食' },
  { kana: 'パン', kanji: '', romaji: ['pan'], meaning: '麵包', category: '美味飲食' },
  { kana: 'みかん', kanji: '蜜柑', romaji: ['mikan'], meaning: '橘子', category: '美味飲食' },

  // === 自然與日常物品 ===
  { kana: 'さくら', kanji: '桜', romaji: ['sakura'], meaning: '櫻花', category: '自然生活' },
  { kana: 'はな', kanji: '花', romaji: ['hana'], meaning: '花朵', category: '自然生活' },
  { kana: 'やま', kanji: '山', romaji: ['yama'], meaning: '山峰', category: '自然生活' },
  { kana: 'かわ', kanji: '川', romaji: ['kawa'], meaning: '河流', category: '自然生活' },
  { kana: 'そら', kanji: '空', romaji: ['sora'], meaning: '天空', category: '自然生活' },
  { kana: 'あめ', kanji: '雨', romaji: ['ame'], meaning: '下雨', category: '自然生活' },
  { kana: 'ほん', kanji: '本', romaji: ['hon'], meaning: '書本', category: '自然生活' },
  { kana: 'くるま', kanji: '車', romaji: ['kuruma'], meaning: '汽車', category: '自然生活' },
  { kana: 'いえ', kanji: '家', romaji: ['ie'], meaning: '房子／家', category: '自然生活' },
  { kana: 'みち', kanji: '道', romaji: ['michi', 'miti'], meaning: '道路', category: '自然生活' },
  { kana: 'て', kanji: '手', romaji: ['te'], meaning: '手', category: '自然生活' },
  { kana: 'め', kanji: '目', romaji: ['me'], meaning: '眼睛', category: '自然生活' },

  // === 實用形容詞與感覺 ===
  { kana: 'かわいい', kanji: '可愛い', romaji: ['kawaii'], meaning: '可愛的', category: '基礎形容詞' },
  { kana: 'おいしい', kanji: '美味しい', romaji: ['oishii', 'oisii'], meaning: '美味好吃的', category: '基礎形容詞' },
  { kana: 'おおきい', kanji: '大きい', romaji: ['ookii', 'okii'], meaning: '巨大的', category: '基礎形容詞' },
  { kana: 'ちいさい', kanji: '小さい', romaji: ['chiisai', 'tiisai'], meaning: '嬌小的', category: '基礎形容詞' },
  { kana: 'たのしい', kanji: '楽しい', romaji: ['tanoshii', 'tanosii'], meaning: '歡樂有趣的', category: '基礎形容詞' },
  { kana: 'すごい', kanji: '凄い', romaji: ['sugoi'], meaning: '好厲害／棒', category: '基礎形容詞' },
  { kana: 'あつい', kanji: '熱い/暑い', romaji: ['atsui', 'atui'], meaning: '熱的／燙的', category: '基礎形容詞' },
  { kana: 'さむい', kanji: '寒い', romaji: ['samui'], meaning: '寒冷的', category: '基礎形容詞' },

  // === 數字篇 ===
  { kana: 'いち', kanji: '一', romaji: ['ichi', 'iti'], meaning: '數字 1', category: '數字' },
  { kana: 'に', kanji: '二', romaji: ['ni'], meaning: '數字 2', category: '數字' },
  { kana: 'さん', kanji: '三', romaji: ['san'], meaning: '數字 3', category: '數字' },
  { kana: 'よん', kanji: '四', romaji: ['yon', 'shi'], meaning: '數字 4', category: '數字' },
  { kana: 'ご', kanji: '五', romaji: ['go'], meaning: '數字 5', category: '數字' },
  { kana: 'ろく', kanji: '六', romaji: ['roku'], meaning: '數字 6', category: '數字' },
  { kana: 'なな', kanji: '七', romaji: ['nana', 'shichi'], meaning: '數字 7', category: '數字' },
  { kana: 'はち', kanji: '八', romaji: ['hachi', 'hati'], meaning: '數字 8', category: '數字' },
  { kana: 'きゅう', kanji: '九', romaji: ['kyuu', 'kyu'], meaning: '數字 9', category: '數字' },
  { kana: 'じゅう', kanji: '十', romaji: ['juu', 'zyu', 'ju'], meaning: '數字 10', category: '數字' }
];
