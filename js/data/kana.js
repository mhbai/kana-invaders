// 五十音完整資料庫（平假名、片假名、多種羅馬拼音容錯）
window.KANA_DATA = [
  // === あ行 ===
  { hiragana: 'あ', katakana: 'ア', romaji: ['a'], group: 'seion', row: 'a' },
  { hiragana: 'い', katakana: 'イ', romaji: ['i'], group: 'seion', row: 'a' },
  { hiragana: 'う', katakana: 'ウ', romaji: ['u'], group: 'seion', row: 'a' },
  { hiragana: 'え', katakana: 'エ', romaji: ['e'], group: 'seion', row: 'a' },
  { hiragana: 'お', katakana: 'オ', romaji: ['o'], group: 'seion', row: 'a' },

  // === か行 ===
  { hiragana: 'か', katakana: 'カ', romaji: ['ka'], group: 'seion', row: 'ka' },
  { hiragana: 'き', katakana: 'キ', romaji: ['ki'], group: 'seion', row: 'ka' },
  { hiragana: 'く', katakana: 'ク', romaji: ['ku'], group: 'seion', row: 'ka' },
  { hiragana: 'け', katakana: 'ケ', romaji: ['ke'], group: 'seion', row: 'ka' },
  { hiragana: 'こ', katakana: 'コ', romaji: ['ko'], group: 'seion', row: 'ka' },

  // === さ行 ===
  { hiragana: 'さ', katakana: 'サ', romaji: ['sa'], group: 'seion', row: 'sa' },
  { hiragana: 'し', katakana: 'シ', romaji: ['shi', 'si'], group: 'seion', row: 'sa' },
  { hiragana: 'す', katakana: 'ス', romaji: ['su'], group: 'seion', row: 'sa' },
  { hiragana: 'せ', katakana: 'セ', romaji: ['se'], group: 'seion', row: 'sa' },
  { hiragana: 'そ', katakana: 'ソ', romaji: ['so'], group: 'seion', row: 'sa' },

  // === た行 ===
  { hiragana: 'た', katakana: 'タ', romaji: ['ta'], group: 'seion', row: 'ta' },
  { hiragana: 'ち', katakana: 'チ', romaji: ['chi', 'ti'], group: 'seion', row: 'ta' },
  { hiragana: 'つ', katakana: 'ツ', romaji: ['tsu', 'tu'], group: 'seion', row: 'ta' },
  { hiragana: 'て', katakana: 'テ', romaji: ['te'], group: 'seion', row: 'ta' },
  { hiragana: 'と', katakana: 'ト', romaji: ['to'], group: 'seion', row: 'ta' },

  // === な行 ===
  { hiragana: 'な', katakana: 'ナ', romaji: ['na'], group: 'seion', row: 'na' },
  { hiragana: 'に', katakana: 'ニ', romaji: ['ni'], group: 'seion', row: 'na' },
  { hiragana: 'ぬ', katakana: 'ヌ', romaji: ['nu'], group: 'seion', row: 'na' },
  { hiragana: 'ね', katakana: 'ネ', romaji: ['ne'], group: 'seion', row: 'na' },
  { hiragana: 'の', katakana: 'ノ', romaji: ['no'], group: 'seion', row: 'na' },

  // === は行 ===
  { hiragana: 'は', katakana: 'ハ', romaji: ['ha'], group: 'seion', row: 'ha' },
  { hiragana: 'ひ', katakana: 'ヒ', romaji: ['hi'], group: 'seion', row: 'ha' },
  { hiragana: 'ふ', katakana: 'フ', romaji: ['fu', 'hu'], group: 'seion', row: 'ha' },
  { hiragana: 'へ', katakana: 'ヘ', romaji: ['he'], group: 'seion', row: 'ha' },
  { hiragana: 'ほ', katakana: 'ホ', romaji: ['ho'], group: 'seion', row: 'ha' },

  // === ま行 ===
  { hiragana: 'ま', katakana: 'マ', romaji: ['ma'], group: 'seion', row: 'ma' },
  { hiragana: 'み', katakana: 'ミ', romaji: ['mi'], group: 'seion', row: 'ma' },
  { hiragana: 'む', katakana: 'ム', romaji: ['mu'], group: 'seion', row: 'ma' },
  { hiragana: 'め', katakana: 'メ', romaji: ['me'], group: 'seion', row: 'ma' },
  { hiragana: 'も', katakana: 'モ', romaji: ['mo'], group: 'seion', row: 'ma' },

  // === や行 ===
  { hiragana: 'や', katakana: 'ヤ', romaji: ['ya'], group: 'seion', row: 'ya' },
  { hiragana: 'ゆ', katakana: 'ユ', romaji: ['yu'], group: 'seion', row: 'ya' },
  { hiragana: 'よ', katakana: 'ヨ', romaji: ['yo'], group: 'seion', row: 'ya' },

  // === ら行 ===
  { hiragana: 'ら', katakana: 'ラ', romaji: ['ra'], group: 'seion', row: 'ra' },
  { hiragana: 'り', katakana: 'リ', romaji: ['ri'], group: 'seion', row: 'ra' },
  { hiragana: 'る', katakana: 'ル', romaji: ['ru'], group: 'seion', row: 'ra' },
  { hiragana: 'れ', katakana: 'レ', romaji: ['re'], group: 'seion', row: 'ra' },
  { hiragana: 'ろ', katakana: 'ロ', romaji: ['ro'], group: 'seion', row: 'ra' },

  // === わ行・拨音 ===
  { hiragana: 'わ', katakana: 'ワ', romaji: ['wa'], group: 'seion', row: 'wa' },
  { hiragana: 'を', katakana: 'ヲ', romaji: ['wo', 'o'], group: 'seion', row: 'wa' },
  { hiragana: 'ん', katakana: 'ン', romaji: ['nn', 'n'], group: 'seion', row: 'wa' },

  // === 濁音 (が行、ざ行、だ行、ば行) ===
  { hiragana: 'が', katakana: 'ガ', romaji: ['ga'], group: 'dakuon', row: 'ga' },
  { hiragana: 'ぎ', katakana: 'ギ', romaji: ['gi'], group: 'dakuon', row: 'ga' },
  { hiragana: 'ぐ', katakana: 'グ', romaji: ['gu'], group: 'dakuon', row: 'ga' },
  { hiragana: 'げ', katakana: 'ゲ', romaji: ['ge'], group: 'dakuon', row: 'ga' },
  { hiragana: 'ご', katakana: 'ゴ', romaji: ['go'], group: 'dakuon', row: 'ga' },

  { hiragana: 'ざ', katakana: 'ザ', romaji: ['za'], group: 'dakuon', row: 'za' },
  { hiragana: 'じ', katakana: 'ジ', romaji: ['ji', 'zi'], group: 'dakuon', row: 'za' },
  { hiragana: 'ず', katakana: 'ズ', romaji: ['zu'], group: 'dakuon', row: 'za' },
  { hiragana: 'ぜ', katakana: 'ゼ', romaji: ['ze'], group: 'dakuon', row: 'za' },
  { hiragana: 'ぞ', katakana: 'ゾ', romaji: ['zo'], group: 'dakuon', row: 'za' },

  { hiragana: 'だ', katakana: 'ダ', romaji: ['da'], group: 'dakuon', row: 'da' },
  { hiragana: 'ぢ', katakana: 'ヂ', romaji: ['ji', 'di'], group: 'dakuon', row: 'da' },
  { hiragana: 'づ', katakana: 'ヅ', romaji: ['zu', 'du', 'dzu'], group: 'dakuon', row: 'da' },
  { hiragana: 'で', katakana: 'デ', romaji: ['de'], group: 'dakuon', row: 'da' },
  { hiragana: 'ど', katakana: 'ド', romaji: ['do'], group: 'dakuon', row: 'da' },

  { hiragana: 'ば', katakana: 'バ', romaji: ['ba'], group: 'dakuon', row: 'ba' },
  { hiragana: 'び', katakana: 'ビ', romaji: ['bi'], group: 'dakuon', row: 'ba' },
  { hiragana: 'ぶ', katakana: 'ブ', romaji: ['bu'], group: 'dakuon', row: 'ba' },
  { hiragana: 'べ', katakana: 'ベ', romaji: ['be'], group: 'dakuon', row: 'ba' },
  { hiragana: 'ぼ', katakana: 'ボ', romaji: ['bo'], group: 'dakuon', row: 'ba' },

  // === 半濁音 (ぱ行) ===
  { hiragana: 'ぱ', katakana: 'パ', romaji: ['pa'], group: 'handakuon', row: 'pa' },
  { hiragana: 'ぴ', katakana: 'ピ', romaji: ['pi'], group: 'handakuon', row: 'pa' },
  { hiragana: 'ぷ', katakana: 'プ', romaji: ['pu'], group: 'handakuon', row: 'pa' },
  { hiragana: 'ぺ', katakana: 'ペ', romaji: ['pe'], group: 'handakuon', row: 'pa' },
  { hiragana: 'ぽ', katakana: 'ポ', romaji: ['po'], group: 'handakuon', row: 'pa' },

  // === 拗音 (きゃ、しゃ、ちゃ...) ===
  { hiragana: 'きゃ', katakana: 'キャ', romaji: ['kya'], group: 'yoon', row: 'kya' },
  { hiragana: 'きゅ', katakana: 'キュ', romaji: ['kyu'], group: 'yoon', row: 'kya' },
  { hiragana: 'きょ', katakana: 'キョ', romaji: ['kyo'], group: 'yoon', row: 'kya' },

  { hiragana: 'しゃ', katakana: 'シャ', romaji: ['sha', 'sya'], group: 'yoon', row: 'sha' },
  { hiragana: 'しゅ', katakana: 'シュ', romaji: ['shu', 'syu'], group: 'yoon', row: 'sha' },
  { hiragana: 'しょ', katakana: 'ショ', romaji: ['sho', 'syo'], group: 'yoon', row: 'sha' },

  { hiragana: 'ちゃ', katakana: 'チャ', romaji: ['cha', 'tya'], group: 'yoon', row: 'cha' },
  { hiragana: 'ちゅ', katakana: 'チュ', romaji: ['chu', 'tyu'], group: 'yoon', row: 'cha' },
  { hiragana: 'ちょ', katakana: 'チョ', romaji: ['cho', 'tyo'], group: 'yoon', row: 'cha' },

  { hiragana: 'にゃ', katakana: 'ニャ', romaji: ['nya'], group: 'yoon', row: 'nya' },
  { hiragana: 'にゅ', katakana: 'ニュ', romaji: ['nyu'], group: 'yoon', row: 'nya' },
  { hiragana: 'にょ', katakana: 'ニョ', romaji: ['nyo'], group: 'yoon', row: 'nya' },

  { hiragana: 'ひゃ', katakana: 'ヒャ', romaji: ['hya'], group: 'yoon', row: 'hya' },
  { hiragana: 'ひゅ', katakana: 'ヒュ', romaji: ['hyu'], group: 'yoon', row: 'hya' },
  { hiragana: 'ひょ', katakana: 'ヒョ', romaji: ['hyo'], group: 'yoon', row: 'hya' },

  { hiragana: 'みゃ', katakana: 'ミャ', romaji: ['mya'], group: 'yoon', row: 'mya' },
  { hiragana: 'みゅ', katakana: 'ミュ', romaji: ['myu'], group: 'yoon', row: 'mya' },
  { hiragana: 'みょ', katakana: 'ミョ', romaji: ['myo'], group: 'yoon', row: 'mya' },

  { hiragana: 'りゃ', katakana: 'リャ', romaji: ['rya'], group: 'yoon', row: 'rya' },
  { hiragana: 'りゅ', katakana: 'リュ', romaji: ['ryu'], group: 'yoon', row: 'rya' },
  { hiragana: 'りょ', katakana: 'リョ', romaji: ['ryo'], group: 'yoon', row: 'rya' },

  { hiragana: 'ぎゃ', katakana: 'ギャ', romaji: ['gya'], group: 'yoon', row: 'gya' },
  { hiragana: 'ぎゅ', katakana: 'ギュ', romaji: ['gyu'], group: 'yoon', row: 'gya' },
  { hiragana: 'ぎょ', katakana: 'ギョ', romaji: ['gyo'], group: 'yoon', row: 'gya' },

  { hiragana: 'じゃ', katakana: 'ジャ', romaji: ['ja', 'zya'], group: 'yoon', row: 'ja' },
  { hiragana: 'じゅ', katakana: 'ジュ', romaji: ['ju', 'zyu'], group: 'yoon', row: 'ja' },
  { hiragana: 'じょ', katakana: 'ジョ', romaji: ['jo', 'zyo'], group: 'yoon', row: 'ja' },

  { hiragana: 'びゃ', katakana: 'ビャ', romaji: ['bya'], group: 'yoon', row: 'bya' },
  { hiragana: 'びゅ', katakana: 'ビュ', romaji: ['byu'], group: 'yoon', row: 'bya' },
  { hiragana: 'びょ', katakana: 'ビョ', romaji: ['byo'], group: 'yoon', row: 'bya' },

  { hiragana: 'ぴゃ', katakana: 'ピャ', romaji: ['pya'], group: 'yoon', row: 'pya' },
  { hiragana: 'ぴゅ', katakana: 'ピュ', romaji: ['pyu'], group: 'yoon', row: 'pya' },
  { hiragana: 'ぴょ', katakana: 'ピョ', romaji: ['pyo'], group: 'yoon', row: 'pya' }
];
