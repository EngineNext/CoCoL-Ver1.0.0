// --- 症状解析エンジン（POC / ルールベース） ---
//
// 医療機器・診断ツールではありません。入力された自然文から
// キーワードを抽出し、候補となる疾患・診療科をスコアリングして
// 提示するデモ用の簡易エンジンです。

// 診療科メタ情報
export const DEPARTMENTS = {
  内科: { label: '内科', emoji: '🩺' },
  消化器内科: { label: '消化器内科', emoji: '🫄' },
  循環器内科: { label: '循環器内科', emoji: '❤️' },
  呼吸器内科: { label: '呼吸器内科', emoji: '🫁' },
  脳神経内科: { label: '脳神経内科', emoji: '🧠' },
  耳鼻咽喉科: { label: '耳鼻咽喉科', emoji: '👂' },
  眼科: { label: '眼科', emoji: '👁️' },
  皮膚科: { label: '皮膚科', emoji: '🧴' },
  整形外科: { label: '整形外科', emoji: '🦴' },
  泌尿器科: { label: '泌尿器科', emoji: '🚻' },
  婦人科: { label: '婦人科', emoji: '🌸' },
  心療内科: { label: '心療内科・精神科', emoji: '🧩' },
  歯科: { label: '歯科・口腔外科', emoji: '🦷' },
  アレルギー科: { label: 'アレルギー科', emoji: '🌾' },
};

// 疾患ルール定義。
// keywords: マッチさせる語（症状表現）
// weight: 症状ヒット時の基本スコア
const RULES = [
  // --- 呼吸器・感冒系 ---
  {
    disease: '風邪（かぜ症候群）',
    department: '内科',
    keywords: ['のどが痛い', '喉が痛い', 'せき', '咳', 'くしゃみ', '鼻水', '微熱', 'だるい', '寒気'],
    advice: '水分と休養を。症状が強い/長引く場合は内科を受診しましょう。',
  },
  {
    disease: 'インフルエンザ',
    department: '内科',
    keywords: ['高熱', '38度', '39度', '関節が痛い', '筋肉痛', '急な発熱', '悪寒'],
    advice: '急な高熱と全身の痛みが特徴。早めに内科を受診し検査を。',
  },
  {
    disease: '気管支炎・肺炎',
    department: '呼吸器内科',
    keywords: ['咳が続く', 'たん', '痰', '息苦しい', '呼吸が苦しい', '胸が痛い', '長引く咳'],
    advice: '咳や痰が長引く・呼吸が苦しい場合は呼吸器内科へ。',
  },
  {
    disease: '気管支喘息',
    department: '呼吸器内科',
    keywords: ['ぜーぜー', 'ヒューヒュー', '息苦しい', '発作', '夜に咳', '呼吸がしにくい'],
    advice: '発作性の呼吸困難や喘鳴があれば呼吸器内科を受診しましょう。',
  },
  {
    disease: '花粉症・アレルギー性鼻炎',
    department: 'アレルギー科',
    keywords: ['くしゃみ', '鼻水', '鼻づまり', '目がかゆい', 'かゆい', '季節', '花粉'],
    advice: '季節性・反復性の鼻炎はアレルギー科または耳鼻咽喉科へ。',
  },

  // --- 消化器系 ---
  {
    disease: '胃炎・胃潰瘍',
    department: '消化器内科',
    keywords: ['胃が痛い', '胃痛', 'みぞおち', '胸やけ', 'むかむか', '吐き気', '食欲がない'],
    advice: 'みぞおちの痛みや胸やけが続く場合は消化器内科へ。',
  },
  {
    disease: '胃腸炎',
    department: '消化器内科',
    keywords: ['下痢', '腹痛', 'お腹が痛い', '吐き気', '嘔吐', '吐いた', 'お腹を下した'],
    advice: '下痢・嘔吐は脱水に注意。水分補給し、続く場合は消化器内科へ。',
  },
  {
    disease: '便秘症',
    department: '消化器内科',
    keywords: ['便秘', '便が出ない', 'お腹が張る', '張っている'],
    advice: '生活習慣の改善を。長く続く場合は消化器内科に相談を。',
  },
  {
    disease: '虫垂炎（盲腸）の疑い',
    department: '消化器内科',
    keywords: ['右下腹部', '右下が痛い', '歩くと響く', '押すと痛い'],
    advice: '右下腹部の強い痛みは急を要すことがあります。早めに受診を。',
    urgent: true,
  },

  // --- 循環器系 ---
  {
    disease: '高血圧・循環器の不調',
    department: '循環器内科',
    keywords: ['動悸', 'どきどき', '胸がドキドキ', '血圧が高い', 'のぼせ', '息切れ'],
    advice: '動悸・息切れが続く場合は循環器内科で検査を。',
  },
  {
    disease: '狭心症・心筋梗塞の疑い',
    department: '循環器内科',
    keywords: ['胸が締め付けられる', '胸の痛み', '胸が痛い', '冷や汗', '左肩が痛い', '圧迫感'],
    advice: '締め付けられる胸痛・冷や汗は緊急の可能性。すぐ受診/救急を。',
    urgent: true,
  },

  // --- 脳神経系 ---
  {
    disease: '緊張型頭痛・片頭痛',
    department: '脳神経内科',
    keywords: ['頭痛', '頭が痛い', 'ズキズキ', '締め付けられる', '肩こり', '目の奥が痛い'],
    advice: '繰り返す頭痛は脳神経内科（頭痛外来）で相談を。',
  },
  {
    disease: '脳卒中（脳梗塞・脳出血）の疑い',
    department: '脳神経内科',
    keywords: ['ろれつが回らない', '手が動かない', '半身', 'しびれ', '顔が歪む', '突然の激しい頭痛', 'まっすぐ歩けない'],
    advice: '突然の麻痺・言語障害・激しい頭痛は一刻を争います。すぐ119を。',
    urgent: true,
  },
  {
    disease: 'めまい症',
    department: '脳神経内科',
    keywords: ['めまい', 'ふらつく', 'ぐるぐる', '立ちくらみ'],
    advice: 'めまいは耳鼻科・脳神経内科どちらの場合も。まずは受診を。',
  },

  // --- 耳鼻咽喉科 ---
  {
    disease: '副鼻腔炎（蓄膿症）',
    department: '耳鼻咽喉科',
    keywords: ['鼻づまり', '黄色い鼻水', '頬が痛い', '匂いがしない', '鼻の奥'],
    advice: '鼻づまりや顔面の痛みが続く場合は耳鼻咽喉科へ。',
  },
  {
    disease: '中耳炎・外耳炎',
    department: '耳鼻咽喉科',
    keywords: ['耳が痛い', '耳鳴り', '聞こえにくい', '耳だれ'],
    advice: '耳の痛みや聞こえにくさは耳鼻咽喉科で診てもらいましょう。',
  },
  {
    disease: '扁桃炎',
    department: '耳鼻咽喉科',
    keywords: ['のどが痛い', '喉が痛い', '飲み込むと痛い', '扁桃', '声がかれる'],
    advice: '強いのどの痛みや発熱を伴う場合は耳鼻咽喉科へ。',
  },

  // --- 眼科 ---
  {
    disease: '結膜炎・ものもらい',
    department: '眼科',
    keywords: ['目が赤い', '目やに', '目がかゆい', '目が痛い', 'ゴロゴロする'],
    advice: '目の充血・痛み・目やには眼科を受診しましょう。',
  },
  {
    disease: '視力・眼精疲労の不調',
    department: '眼科',
    keywords: ['見えにくい', 'かすむ', 'ぼやける', '目が疲れる', '視界'],
    advice: '見え方の変化は眼科で検査を。急な視力低下は早急に。',
  },

  // --- 皮膚科 ---
  {
    disease: '湿疹・皮膚炎',
    department: '皮膚科',
    keywords: ['かゆい', '発疹', 'ぶつぶつ', '肌荒れ', '赤み', 'かぶれ', '湿疹'],
    advice: 'かゆみ・発疹が続く/広がる場合は皮膚科へ。',
  },
  {
    disease: 'じんましん',
    department: '皮膚科',
    keywords: ['じんましん', '急にかゆい', 'みみずばれ', '腫れる'],
    advice: '急な広範囲のじんましん、息苦しさを伴う場合は救急も検討を。',
  },

  // --- 整形外科 ---
  {
    disease: '腰痛症・ぎっくり腰',
    department: '整形外科',
    keywords: ['腰が痛い', '腰痛', 'ぎっくり腰', '腰を痛めた'],
    advice: '腰の痛み・足のしびれを伴う場合は整形外科へ。',
  },
  {
    disease: '関節痛・打撲・捻挫',
    department: '整形外科',
    keywords: ['関節が痛い', '膝が痛い', '肩が痛い', '捻挫', 'ひねった', '打った', '腫れて痛い'],
    advice: '関節の痛み・腫れ・受傷後の痛みは整形外科を受診しましょう。',
  },
  {
    disease: '肩こり・首の痛み',
    department: '整形外科',
    keywords: ['肩こり', '首が痛い', '肩が重い', '首が回らない'],
    advice: '慢性の肩こり・首の痛みは整形外科で相談できます。',
  },

  // --- 泌尿器 ---
  {
    disease: '膀胱炎・尿路感染症',
    department: '泌尿器科',
    keywords: ['排尿時に痛い', 'トイレが近い', '頻尿', '残尿感', '尿が濁る', '血尿'],
    advice: '排尿痛・頻尿・血尿は泌尿器科を受診しましょう。',
  },

  // --- 婦人科 ---
  {
    disease: '月経・婦人科系の不調',
    department: '婦人科',
    keywords: ['生理痛', '生理が', '不正出血', 'おりもの', '下腹部が痛い'],
    advice: '生理不順・不正出血・下腹部痛は婦人科へ。',
  },

  // --- 歯科 ---
  {
    disease: '虫歯・歯周病',
    department: '歯科',
    keywords: ['歯が痛い', '歯茎', 'しみる', '噛むと痛い', '口の中'],
    advice: '歯の痛み・しみる・歯茎の腫れは歯科を受診しましょう。',
  },

  // --- 心療内科 ---
  {
    disease: 'ストレス・不眠・自律神経の不調',
    department: '心療内科',
    keywords: ['眠れない', '不眠', '気分が落ち込む', '憂うつ', 'やる気が出ない', '不安', 'イライラ', '疲れがとれない'],
    advice: '気分の落ち込みや不眠が続く場合は心療内科・精神科に相談を。',
  },
];

// 救急を強く示唆するレッドフラグ（複合ワード）
const RED_FLAGS = [
  '意識がない', '意識がもうろう', '息ができない', '呼吸ができない',
  'ろれつが回らない', '半身', '顔が歪む', '突然の激しい頭痛',
  '胸が締め付けられる', '大量の出血', '呼びかけに反応',
];

// 入力文字列を正規化（全角・スペース等の揺れを吸収）
const normalize = (text) =>
  (text || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/。/g, '');

/**
 * 症状テキストを解析し、候補疾患・推奨診療科を返す。
 * @param {string} text
 * @returns {{ emergency: boolean, matched: boolean, conditions: Array, departments: Array }}
 */
export function analyzeSymptoms(text) {
  const norm = normalize(text);

  const emergency = RED_FLAGS.some((flag) => norm.includes(normalize(flag)));

  // 各ルールのスコアリング
  const scored = RULES.map((rule) => {
    const hits = rule.keywords.filter((kw) => norm.includes(normalize(kw)));
    const score = hits.length;
    return { ...rule, hits, score };
  }).filter((r) => r.score > 0);

  // スコア降順、緊急を優先
  scored.sort((a, b) => {
    if (!!b.urgent !== !!a.urgent) return b.urgent ? 1 : -1;
    return b.score - a.score;
  });

  const maxScore = scored.reduce((m, r) => Math.max(m, r.score), 0) || 1;

  const conditions = scored.slice(0, 5).map((r) => ({
    disease: r.disease,
    department: r.department,
    departmentMeta: DEPARTMENTS[r.department],
    advice: r.advice,
    urgent: !!r.urgent,
    matchedKeywords: r.hits,
    confidence: Math.round((r.score / maxScore) * 100),
  }));

  // 診療科ごとに集計（重複排除・スコア合算）
  const deptMap = new Map();
  scored.forEach((r) => {
    const cur = deptMap.get(r.department) || { department: r.department, score: 0, meta: DEPARTMENTS[r.department] };
    cur.score += r.score;
    deptMap.set(r.department, cur);
  });
  const departments = [...deptMap.values()].sort((a, b) => b.score - a.score).slice(0, 4);

  return {
    emergency,
    matched: conditions.length > 0,
    conditions,
    departments,
  };
}
