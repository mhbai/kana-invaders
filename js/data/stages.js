// 關卡進程資料庫（十七大闖關戰役：平假名篇 ➔ 片假名篇 ➔ 實戰與外來語篇）
window.CAMPAIGN_STAGES = [
  // ==========================================
  // 【第一篇章：平假名・基礎與變化篇（第 1 ~ 6 關）】
  // ==========================================
  {
    id: 1,
    name: '第 1 關：平假名・あ行 ＆ か行',
    subtitle: 'あ・い・う・え・お ＋ か・き・く・け・こ',
    targetCount: 50,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => ['a', 'ka'].includes(k.row) && k.group === 'seion')
  },
  {
    id: 2,
    name: '第 2 關：平假名・さ行 ＆ た行',
    subtitle: 'さ・し・す・せ・そ ＋ た・ち・つ・て・と',
    targetCount: 50,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => ['sa', 'ta'].includes(k.row) && k.group === 'seion')
  },
  {
    id: 3,
    name: '第 3 關：平假名・な行 ＆ は行',
    subtitle: 'な・に・ぬ・ね・の ＋ は・ひ・ふ・へ・ほ',
    targetCount: 50,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => ['na', 'ha'].includes(k.row) && k.group === 'seion')
  },
  {
    id: 4,
    name: '第 4 關：平假名・ま行〜わ行 ＆ ん',
    subtitle: 'ま〜も・や〜よ・ら〜ろ・わ・を・ん',
    targetCount: 50,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => ['ma', 'ya', 'ra', 'wa'].includes(k.row) && k.group === 'seion')
  },
  {
    id: 5,
    name: '第 5 關：【平假名清音大考驗】五十音總驗收',
    subtitle: 'あ〜ん 46 個清音全體空襲 Boss 戰',
    targetCount: 50,
    speed: 0.95,
    isBoss: true,
    getPool: () => window.KANA_DATA.filter(k => k.group === 'seion')
  },
  {
    id: 6,
    name: '第 6 關：平假名・濁音、半濁音 ＆ 拗音',
    subtitle: 'が行〜ぱ行 ＋ きゃ〜ぴょ 變化音空襲',
    targetCount: 50,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => ['dakuon', 'handakuon', 'yoon'].includes(k.group))
  },

  // ==========================================
  // 【第二篇章：片假名・基礎與變化篇（第 7 ~ 12 關）】
  // ==========================================
  {
    id: 7,
    name: '第 7 關：片假名・ア行 ＆ カ行',
    subtitle: 'ア・イ・ウ・エ・オ ＋ カ・キ・ク・ケ・コ',
    targetCount: 50,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => ['a', 'ka'].includes(k.row) && k.group === 'seion').map(k => ({
      displayKana: k.katakana,
      subText: k.hiragana,
      romajiList: k.romaji,
      isWord: false,
      originalData: k
    }))
  },
  {
    id: 8,
    name: '第 8 關：片假名・サ行 ＆ タ行',
    subtitle: 'サ・シ・ス・セ・ソ ＋ タ・チ・ツ・テ・ト（辨析 シ vs ツ）',
    targetCount: 50,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => ['sa', 'ta'].includes(k.row) && k.group === 'seion').map(k => ({
      displayKana: k.katakana,
      subText: k.hiragana,
      romajiList: k.romaji,
      isWord: false,
      originalData: k
    }))
  },
  {
    id: 9,
    name: '第 9 關：片假名・ナ行 ＆ ハ行',
    subtitle: 'ナ・ニ・ヌ・ネ・ノ ＋ ハ・ヒ・フ・ヘ・ホ',
    targetCount: 50,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => ['na', 'ha'].includes(k.row) && k.group === 'seion').map(k => ({
      displayKana: k.katakana,
      subText: k.hiragana,
      romajiList: k.romaji,
      isWord: false,
      originalData: k
    }))
  },
  {
    id: 10,
    name: '第 10 關：片假名・マ行〜ワ行 ＆ ン',
    subtitle: 'マ〜モ・ヤ〜ヨ・ラ〜ロ・ワ・ヲ・ン（辨析 ソ vs ン）',
    targetCount: 50,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => ['ma', 'ya', 'ra', 'wa'].includes(k.row) && k.group === 'seion').map(k => ({
      displayKana: k.katakana,
      subText: k.hiragana,
      romajiList: k.romaji,
      isWord: false,
      originalData: k
    }))
  },
  {
    id: 11,
    name: '第 11 關：【片假名清音大考驗】全域清音總驗收',
    subtitle: 'ア〜ン 46 個片假名全域空襲 Boss 戰',
    targetCount: 50,
    speed: 0.95,
    isBoss: true,
    getPool: () => window.KANA_DATA.filter(k => k.group === 'seion').map(k => ({
      displayKana: k.katakana,
      subText: k.hiragana,
      romajiList: k.romaji,
      isWord: false,
      originalData: k
    }))
  },
  {
    id: 12,
    name: '第 12 關：片假名・濁音、半濁音 ＆ 拗音',
    subtitle: 'ガ〜ポ ＋ キャ〜ピョ 片假名變化音空襲',
    targetCount: 50,
    speed: 0.85,
    getPool: () => window.KANA_DATA.filter(k => ['dakuon', 'handakuon', 'yoon'].includes(k.group)).map(k => ({
      displayKana: k.katakana,
      subText: k.hiragana,
      romajiList: k.romaji,
      isWord: false,
      originalData: k
    }))
  },

  // ==========================================
  // 【第三篇章：平片混合 ＆ 實戰詞彙篇（第 13 ~ 17 關）】
  // ==========================================
  {
    id: 13,
    name: '第 13 關：【平片假名大對決】平片雙向混合',
    subtitle: '平假名 ↔ 片假名 隨機雙向出擊，考驗神經反射',
    targetCount: 50,
    speed: 0.90,
    getPool: () => {
      const hira = window.KANA_DATA.filter(k => k.group === 'seion').map(k => ({
        displayKana: k.hiragana,
        subText: k.katakana,
        romajiList: k.romaji,
        isWord: false,
        originalData: k
      }));
      const kata = window.KANA_DATA.filter(k => k.group === 'seion').map(k => ({
        displayKana: k.katakana,
        subText: k.hiragana,
        romajiList: k.romaji,
        isWord: false,
        originalData: k
      }));
      return [...hira, ...kata];
    }
  },
  {
    id: 14,
    name: '第 14 關：【生活實戰單字篇】日常問候與高頻詞',
    subtitle: 'こんにちは、ありがとう、さくら、ほん、くるま...',
    targetCount: 50,
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
    id: 15,
    name: '第 15 關：【生活實戰單字篇】動物、美食與感覺',
    subtitle: 'ねこ、いぬ、すし、らーめん、りんご、おいしい...',
    targetCount: 50,
    speed: 0.80,
    getPool: () => window.VOCAB_DATA.filter(w => ['可愛動物', '美味飲食', '基礎形容詞'].includes(w.category)).map(item => ({
      displayKana: item.kana,
      subText: `${item.meaning} [${item.kanji || item.kana}]`,
      romajiList: item.romaji,
      isWord: true,
      originalData: item
    }))
  },
  {
    id: 16,
    name: '第 16 關：【片假名外來語篇】實用生活外來語',
    subtitle: 'コーヒー、テレビ、カメラ、パン、バス、ホテル、トイレ...',
    targetCount: 50,
    speed: 0.80,
    getPool: () => window.VOCAB_DATA.filter(w => w.category === '片假名外來語').map(item => ({
      displayKana: item.kana,
      subText: `${item.meaning} [外來語]`,
      romajiList: item.romaji,
      isWord: true,
      originalData: item
    }))
  },
  {
    id: 17,
    name: '第 17 關：【終極大決戰】日語全領域冒險',
    subtitle: '平片五十音 ＋ 濁拗音 ＋ N5 外來語全單字最終試煉',
    targetCount: 50,
    speed: 0.95,
    isBoss: true,
    getPool: () => {
      const hira = window.KANA_DATA.map(k => ({
        displayKana: k.hiragana,
        subText: k.romaji[0],
        romajiList: k.romaji,
        isWord: false,
        originalData: k
      }));
      const kata = window.KANA_DATA.map(k => ({
        displayKana: k.katakana,
        subText: k.hiragana,
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
      return [...hira, ...kata, ...words];
    }
  }
];
