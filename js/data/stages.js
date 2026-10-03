// 關卡進程資料庫（十七大闖關戰役）
window.CAMPAIGN_STAGES = [
  {
    id: 1,
    name: '第 1 關：あ行 初探',
    subtitle: 'あ・い・う・え・お',
    targetCount: 10,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => k.row === 'a' && k.group === 'seion')
  },
  {
    id: 2,
    name: '第 2 關：か行 斬擊',
    subtitle: 'か・き・く・け・こ',
    targetCount: 12,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => k.row === 'ka' && k.group === 'seion')
  },
  {
    id: 3,
    name: '第 3 關：さ行 疾風',
    subtitle: 'さ・し・す・せ・そ',
    targetCount: 12,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => k.row === 'sa' && k.group === 'seion')
  },
  {
    id: 4,
    name: '第 4 關：た行 突擊',
    subtitle: 'た・ち・つ・て・と',
    targetCount: 12,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => k.row === 'ta' && k.group === 'seion')
  },
  {
    id: 5,
    name: '第 5 關：な行 漫步',
    subtitle: 'な・に・ぬ・ね・の',
    targetCount: 12,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => k.row === 'na' && k.group === 'seion')
  },
  {
    id: 6,
    name: '第 6 關：【中場大驗收】あ~な行 總動員',
    subtitle: '清音前半部綜合 Boss 戰',
    targetCount: 16,
    speed: 0.95,
    isBoss: true,
    getPool: () => window.KANA_DATA.filter(k => ['a', 'ka', 'sa', 'ta', 'na'].includes(k.row) && k.group === 'seion')
  },
  {
    id: 7,
    name: '第 7 關：は行 波濤',
    subtitle: 'は・ひ・ふ・へ・ほ',
    targetCount: 12,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => k.row === 'ha' && k.group === 'seion')
  },
  {
    id: 8,
    name: '第 8 關：ま行 旋律',
    subtitle: 'ま・み・む・め・も',
    targetCount: 12,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => k.row === 'ma' && k.group === 'seion')
  },
  {
    id: 9,
    name: '第 9 關：や・ら・わ行 終章',
    subtitle: 'や行・ら行・わ行・拨音 ん',
    targetCount: 14,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => ['ya', 'ra', 'wa'].includes(k.row) && k.group === 'seion')
  },
  {
    id: 10,
    name: '第 10 關：【清音大會戰】五十音試煉',
    subtitle: '清音 46 假名全域空襲',
    targetCount: 20,
    speed: 0.95,
    isBoss: true,
    getPool: () => window.KANA_DATA.filter(k => k.group === 'seion')
  },
  {
    id: 11,
    name: '第 11 關：濁音降臨・が行 ＆ ざ行',
    subtitle: 'がぎぐげご、ざじずぜぞ',
    targetCount: 14,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => ['ga', 'za'].includes(k.row))
  },
  {
    id: 12,
    name: '第 12 關：濁音與半濁・だ行・ば行・ぱ行',
    subtitle: 'だ行、ば行、ぱぴぷぺぽ',
    targetCount: 15,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => ['da', 'ba', 'pa'].includes(k.row))
  },
  {
    id: 13,
    name: '第 13 關：拗音旋風',
    subtitle: 'きゃ、しゃ、ちゃ、にゃ、ひゃ...',
    targetCount: 15,
    speed: 0.80,
    getPool: () => window.KANA_DATA.filter(k => k.group === 'yoon')
  },
  {
    id: 14,
    name: '第 14 關：片假名崛起',
    subtitle: 'ア・イ・ウ・エ・オ ... 外來語符號',
    targetCount: 16,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => k.group === 'seion').map(k => ({
      displayKana: k.katakana,
      subText: k.hiragana,
      romajiList: k.romaji,
      isWord: false,
      originalData: k
    }))
  },
  {
    id: 15,
    name: '第 15 關：實戰單字篇・生活日常',
    subtitle: 'こんにちは、さくら、ほん、くるま...',
    targetCount: 15,
    speed: 0.80,
    getPool: () => window.VOCAB_DATA.filter(w => ['問候常用', '自然生活'].includes(w.category)).map(item => ({
      displayKana: item.kana,
      subText: `${item.meaning} [${item.kanji || item.kana}]`,
      romajiList: item.romaji,
      isWord: true,
      originalData: item
    }))
  },
  {
    id: 16,
    name: '第 16 關：實戰單字篇・動物與美食',
    subtitle: 'ねこ、いぬ、すし、らーめん、りんご...',
    targetCount: 15,
    speed: 0.80,
    getPool: () => window.VOCAB_DATA.filter(w => ['可愛動物', '美味飲食'].includes(w.category)).map(item => ({
      displayKana: item.kana,
      subText: `${item.meaning} [${item.kanji || item.kana}]`,
      romajiList: item.romaji,
      isWord: true,
      originalData: item
    }))
  },
  {
    id: 17,
    name: '第 17 關：【終極大決戰】日語全領域冒險',
    subtitle: '五十音 + 濁拗音 + N5 全詞彙最終試煉',
    targetCount: 25,
    speed: 0.95,
    isBoss: true,
    getPool: () => {
      const kana = window.KANA_DATA.map(k => ({
        displayKana: k.hiragana,
        subText: k.romaji[0],
        romajiList: k.romaji,
        isWord: false,
        originalData: k
      }));
      const words = window.VOCAB_DATA.map(item => ({
        displayKana: item.kana,
        subText: `${item.meaning} [${item.kanji || item.kana}]`,
        romajiList: item.romaji,
        isWord: true,
        originalData: item
      }));
      return [...kana, ...words];
    }
  }
];
