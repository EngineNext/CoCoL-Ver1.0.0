// --- 症状解析エンジン（POC / ルールベース・多言語対応） ---
//
// 医療機器・診断ツールではありません。入力された自然文から
// キーワードを抽出し、候補となる疾患・診療科をスコアリングして
// 提示するデモ用の簡易エンジンです。
//
// 各定義は { ja, en } のロケール別フィールドを持ち、解析時に
// 指定言語（'ja' | 'en'）のキーワード・表示文言を使用します。

// 診療科メタ情報（id → emoji・ロケール別ラベル）
export const DEPARTMENTS = {
  internal: { emoji: '🩺', label: { ja: '内科', en: 'Internal Medicine' } },
  gastro: { emoji: '🫄', label: { ja: '消化器内科', en: 'Gastroenterology' } },
  cardio: { emoji: '❤️', label: { ja: '循環器内科', en: 'Cardiology' } },
  pulmo: { emoji: '🫁', label: { ja: '呼吸器内科', en: 'Pulmonology' } },
  neuro: { emoji: '🧠', label: { ja: '脳神経内科', en: 'Neurology' } },
  ent: { emoji: '👂', label: { ja: '耳鼻咽喉科', en: 'ENT (Otolaryngology)' } },
  ophtha: { emoji: '👁️', label: { ja: '眼科', en: 'Ophthalmology' } },
  derma: { emoji: '🧴', label: { ja: '皮膚科', en: 'Dermatology' } },
  ortho: { emoji: '🦴', label: { ja: '整形外科', en: 'Orthopedics' } },
  uro: { emoji: '🚻', label: { ja: '泌尿器科', en: 'Urology' } },
  gyne: { emoji: '🌸', label: { ja: '婦人科', en: 'Gynecology' } },
  psych: { emoji: '🧩', label: { ja: '心療内科・精神科', en: 'Psychosomatic / Psychiatry' } },
  dental: { emoji: '🦷', label: { ja: '歯科・口腔外科', en: 'Dentistry / Oral Surgery' } },
  allergy: { emoji: '🌾', label: { ja: 'アレルギー科', en: 'Allergy' } },
  endo: { emoji: '🩸', label: { ja: '内分泌代謝内科', en: 'Endocrinology / Metabolism' } },
  pediatrics: { emoji: '🧒', label: { ja: '小児科', en: 'Pediatrics' } },
  hematology: { emoji: '🩸', label: { ja: '血液内科', en: 'Hematology' } },
  proctology: { emoji: '🚽', label: { ja: '肛門科', en: 'Proctology' } },
  nephrology: { emoji: '🫘', label: { ja: '腎臓内科', en: 'Nephrology' } },
};

// 疾患ルール定義。
// department: DEPARTMENTS のキー
// keywords: ロケール別のマッチ対象語（症状表現）
// disease / advice: ロケール別の表示文言
const RULES = [
  // --- 呼吸器・感冒系 ---
  {
    department: 'internal',
    disease: { ja: '風邪（かぜ症候群）', en: 'Common cold' },
    keywords: {
      ja: ['のどが痛い', '喉が痛い', 'せき', '咳', 'くしゃみ', '鼻水', '微熱', 'だるい', '寒気'],
      en: ['sore throat', 'throat hurts', 'throat is sore', 'cough', 'sneeze', 'sneezing', 'runny nose', 'mild fever', 'tired', 'chills'],
    },
    advice: {
      ja: '水分と休養を。症状が強い/長引く場合は内科を受診しましょう。',
      en: 'Rest and stay hydrated. See internal medicine if symptoms are severe or persist.',
    },
  },
  {
    department: 'internal',
    disease: { ja: 'インフルエンザ', en: 'Influenza (flu)' },
    keywords: {
      ja: ['高熱', '38度', '39度', '関節が痛い', '筋肉痛', '急な発熱', '悪寒'],
      en: ['high fever', 'joint pain', 'body aches', 'muscle pain', 'sudden fever', 'shivering'],
    },
    advice: {
      ja: '急な高熱と全身の痛みが特徴。早めに内科を受診し検査を。',
      en: 'Sudden high fever with body aches. See internal medicine early for testing.',
    },
  },
  {
    department: 'pulmo',
    disease: { ja: '気管支炎・肺炎', en: 'Bronchitis / Pneumonia' },
    keywords: {
      ja: ['咳が続く', 'たん', '痰', '息苦しい', '呼吸が苦しい', '胸が痛い', '長引く咳'],
      en: ['persistent cough', 'phlegm', 'mucus', 'short of breath', 'hard to breathe', 'chest hurts', 'lingering cough'],
    },
    advice: {
      ja: '咳や痰が長引く・呼吸が苦しい場合は呼吸器内科へ。',
      en: 'See pulmonology if cough/phlegm persist or breathing is difficult.',
    },
  },
  {
    department: 'pulmo',
    disease: { ja: '気管支喘息', en: 'Asthma' },
    keywords: {
      ja: ['ぜーぜー', 'ヒューヒュー', '息苦しい', '発作', '夜に咳', '呼吸がしにくい'],
      en: ['wheezing', 'wheeze', 'short of breath', 'attack', 'cough at night', 'trouble breathing'],
    },
    advice: {
      ja: '発作性の呼吸困難や喘鳴があれば呼吸器内科を受診しましょう。',
      en: 'See pulmonology for episodes of breathlessness or wheezing.',
    },
  },
  {
    department: 'allergy',
    disease: { ja: '花粉症・アレルギー性鼻炎', en: 'Hay fever / Allergic rhinitis' },
    keywords: {
      ja: ['くしゃみ', '鼻水', '鼻づまり', '目がかゆい', 'かゆい', '季節', '花粉'],
      en: ['sneezing', 'runny nose', 'stuffy nose', 'itchy eyes', 'itchy', 'seasonal', 'pollen'],
    },
    advice: {
      ja: '季節性・反復性の鼻炎はアレルギー科または耳鼻咽喉科へ。',
      en: 'Seasonal or recurrent rhinitis: see allergy or ENT.',
    },
  },

  // --- 消化器系 ---
  {
    department: 'gastro',
    disease: { ja: '胃炎・胃潰瘍', en: 'Gastritis / Peptic ulcer' },
    keywords: {
      ja: ['胃が痛い', '胃痛', 'みぞおち', '胸やけ', 'むかむか', '吐き気', '食欲がない'],
      en: ['stomach ache', 'stomach pain', 'stomach hurts', 'upper abdomen', 'heartburn', 'nausea', 'no appetite'],
    },
    advice: {
      ja: 'みぞおちの痛みや胸やけが続く場合は消化器内科へ。',
      en: 'See gastroenterology for persistent upper-abdominal pain or heartburn.',
    },
  },
  {
    department: 'gastro',
    disease: { ja: '胃腸炎', en: 'Gastroenteritis' },
    keywords: {
      ja: ['下痢', '腹痛', 'お腹が痛い', '吐き気', '嘔吐', '吐いた', 'お腹を下した'],
      en: ['diarrhea', 'abdominal pain', 'stomach hurts', 'nausea', 'vomiting', 'threw up', 'upset stomach'],
    },
    advice: {
      ja: '下痢・嘔吐は脱水に注意。水分補給し、続く場合は消化器内科へ。',
      en: 'Watch for dehydration. Hydrate; see gastroenterology if it persists.',
    },
  },
  {
    department: 'gastro',
    disease: { ja: '便秘症', en: 'Constipation' },
    keywords: {
      ja: ['便秘', '便が出ない', 'お腹が張る', '張っている'],
      en: ['constipation', 'constipated', 'cannot poop', 'bloated', 'bloating'],
    },
    advice: {
      ja: '生活習慣の改善を。長く続く場合は消化器内科に相談を。',
      en: 'Improve daily habits; see gastroenterology if it lasts a long time.',
    },
  },
  {
    department: 'gastro',
    disease: { ja: '虫垂炎（盲腸）の疑い', en: 'Possible appendicitis' },
    keywords: {
      ja: ['右下腹部', '右下が痛い', '歩くと響く', '押すと痛い'],
      en: ['lower right abdomen', 'right lower abdomen', 'pain when walking', 'tender when pressed'],
    },
    advice: {
      ja: '右下腹部の強い痛みは急を要すことがあります。早めに受診を。',
      en: 'Severe lower-right pain can be urgent. Seek care promptly.',
    },
    urgent: true,
  },

  // --- 循環器系 ---
  {
    department: 'cardio',
    disease: { ja: '高血圧・循環器の不調', en: 'Hypertension / Circulatory issues' },
    keywords: {
      ja: ['動悸', 'どきどき', '胸がドキドキ', '血圧が高い', 'のぼせ', '息切れ'],
      en: ['palpitations', 'heart pounding', 'racing heart', 'high blood pressure', 'flushing', 'shortness of breath'],
    },
    advice: {
      ja: '動悸・息切れが続く場合は循環器内科で検査を。',
      en: 'See cardiology for ongoing palpitations or breathlessness.',
    },
  },
  {
    department: 'cardio',
    disease: { ja: '狭心症・心筋梗塞の疑い', en: 'Possible angina / heart attack' },
    keywords: {
      ja: ['胸が締め付けられる', '胸の痛み', '胸が痛い', '冷や汗', '左肩が痛い', '圧迫感'],
      en: ['chest tightness', 'crushing chest', 'chest pain', 'cold sweat', 'left arm pain', 'left shoulder pain', 'pressure in chest'],
    },
    advice: {
      ja: '締め付けられる胸痛・冷や汗は緊急の可能性。すぐ受診/救急を。',
      en: 'Crushing chest pain with cold sweat may be an emergency. Seek care / call emergency now.',
    },
    urgent: true,
  },

  // --- 脳神経系 ---
  {
    department: 'neuro',
    disease: { ja: '緊張型頭痛・片頭痛', en: 'Tension headache / Migraine' },
    keywords: {
      ja: ['頭痛', '頭が痛い', 'ズキズキ', '締め付けられる', '肩こり', '目の奥が痛い'],
      en: ['headache', 'head hurts', 'throbbing', 'tight band', 'stiff shoulders', 'pain behind eyes'],
    },
    advice: {
      ja: '繰り返す頭痛は脳神経内科（頭痛外来）で相談を。',
      en: 'For recurring headaches, consult neurology (headache clinic).',
    },
  },
  {
    department: 'neuro',
    disease: { ja: '脳卒中（脳梗塞・脳出血）の疑い', en: 'Possible stroke' },
    keywords: {
      ja: ['ろれつが回らない', '手が動かない', '半身', 'しびれ', '顔が歪む', '突然の激しい頭痛', 'まっすぐ歩けない'],
      en: ['slurred speech', 'cannot move arm', 'one side of body', 'numbness', 'face drooping', 'sudden severe headache', 'cannot walk straight'],
    },
    advice: {
      ja: '突然の麻痺・言語障害・激しい頭痛は一刻を争います。すぐ119を。',
      en: 'Sudden weakness, speech trouble, or severe headache is time-critical. Call emergency now.',
    },
    urgent: true,
  },
  {
    department: 'neuro',
    disease: { ja: 'めまい症', en: 'Dizziness / Vertigo' },
    keywords: {
      ja: ['めまい', 'ふらつく', 'ぐるぐる', '立ちくらみ'],
      en: ['dizzy', 'dizziness', 'lightheaded', 'spinning', 'vertigo'],
    },
    advice: {
      ja: 'めまいは耳鼻科・脳神経内科どちらの場合も。まずは受診を。',
      en: 'Dizziness may be ENT- or neurology-related. Get it checked.',
    },
  },

  // --- 耳鼻咽喉科 ---
  {
    department: 'ent',
    disease: { ja: '副鼻腔炎（蓄膿症）', en: 'Sinusitis' },
    keywords: {
      ja: ['鼻づまり', '黄色い鼻水', '頬が痛い', '匂いがしない', '鼻の奥'],
      en: ['stuffy nose', 'yellow mucus', 'cheek pain', 'cannot smell', 'loss of smell', 'behind the nose'],
    },
    advice: {
      ja: '鼻づまりや顔面の痛みが続く場合は耳鼻咽喉科へ。',
      en: 'See ENT for persistent congestion or facial pain.',
    },
  },
  {
    department: 'ent',
    disease: { ja: '中耳炎・外耳炎', en: 'Otitis (ear infection)' },
    keywords: {
      ja: ['耳が痛い', '耳鳴り', '聞こえにくい', '耳だれ'],
      en: ['ear pain', 'ear hurts', 'ringing in ears', 'hard to hear', 'ear discharge'],
    },
    advice: {
      ja: '耳の痛みや聞こえにくさは耳鼻咽喉科で診てもらいましょう。',
      en: 'See ENT for ear pain or hearing difficulty.',
    },
  },
  {
    department: 'ent',
    disease: { ja: '扁桃炎', en: 'Tonsillitis' },
    keywords: {
      ja: ['のどが痛い', '喉が痛い', '飲み込むと痛い', '扁桃', '声がかれる'],
      en: ['sore throat', 'throat hurts', 'painful to swallow', 'tonsils', 'hoarse voice'],
    },
    advice: {
      ja: '強いのどの痛みや発熱を伴う場合は耳鼻咽喉科へ。',
      en: 'See ENT for severe throat pain, especially with fever.',
    },
  },

  // --- 眼科 ---
  {
    department: 'ophtha',
    disease: { ja: '結膜炎・ものもらい', en: 'Conjunctivitis / Stye' },
    keywords: {
      ja: ['目が赤い', '目やに', '目がかゆい', '目が痛い', 'ゴロゴロする'],
      en: ['red eye', 'eye discharge', 'itchy eyes', 'eye pain', 'gritty eye'],
    },
    advice: {
      ja: '目の充血・痛み・目やには眼科を受診しましょう。',
      en: 'See ophthalmology for red, painful, or discharging eyes.',
    },
  },
  {
    department: 'ophtha',
    disease: { ja: '視力・眼精疲労の不調', en: 'Vision problems / Eye strain' },
    keywords: {
      ja: ['見えにくい', 'かすむ', 'ぼやける', '目が疲れる', '視界'],
      en: ['hard to see', 'blurry', 'blurred vision', 'tired eyes', 'eye strain'],
    },
    advice: {
      ja: '見え方の変化は眼科で検査を。急な視力低下は早急に。',
      en: 'Have vision changes checked by ophthalmology; sudden loss is urgent.',
    },
  },

  // --- 皮膚科 ---
  {
    department: 'derma',
    disease: { ja: '湿疹・皮膚炎', en: 'Eczema / Dermatitis' },
    keywords: {
      ja: ['かゆい', '発疹', 'ぶつぶつ', '肌荒れ', '赤み', 'かぶれ', '湿疹'],
      en: ['itchy', 'rash', 'bumps', 'irritated skin', 'redness', 'skin irritation', 'eczema'],
    },
    advice: {
      ja: 'かゆみ・発疹が続く/広がる場合は皮膚科へ。',
      en: 'See dermatology if itching or rash persists or spreads.',
    },
  },
  {
    department: 'derma',
    disease: { ja: 'じんましん', en: 'Hives (urticaria)' },
    keywords: {
      ja: ['じんましん', '急にかゆい', 'みみずばれ', '腫れる'],
      en: ['hives', 'suddenly itchy', 'welts', 'swelling'],
    },
    advice: {
      ja: '急な広範囲のじんましん、息苦しさを伴う場合は救急も検討を。',
      en: 'Widespread sudden hives with breathing trouble may need emergency care.',
    },
  },

  // --- 整形外科 ---
  {
    department: 'ortho',
    disease: { ja: '腰痛症・ぎっくり腰', en: 'Low back pain / Strain' },
    keywords: {
      ja: ['腰が痛い', '腰痛', 'ぎっくり腰', '腰を痛めた'],
      en: ['back pain', 'lower back pain', 'back hurts', 'threw out my back', 'hurt my back'],
    },
    advice: {
      ja: '腰の痛み・足のしびれを伴う場合は整形外科へ。',
      en: 'See orthopedics for back pain, especially with leg numbness.',
    },
  },
  {
    department: 'ortho',
    disease: { ja: '関節痛・打撲・捻挫', en: 'Joint pain / Sprain / Bruise' },
    keywords: {
      ja: ['関節が痛い', '膝が痛い', '肩が痛い', '捻挫', 'ひねった', '打った', '腫れて痛い'],
      en: ['joint pain', 'knee pain', 'shoulder pain', 'sprain', 'twisted', 'hit it', 'swollen and painful'],
    },
    advice: {
      ja: '関節の痛み・腫れ・受傷後の痛みは整形外科を受診しましょう。',
      en: 'See orthopedics for joint pain, swelling, or injury.',
    },
  },
  {
    department: 'ortho',
    disease: { ja: '肩こり・首の痛み', en: 'Stiff shoulders / Neck pain' },
    keywords: {
      ja: ['肩こり', '首が痛い', '肩が重い', '首が回らない'],
      en: ['stiff shoulders', 'neck pain', 'heavy shoulders', 'cannot turn neck'],
    },
    advice: {
      ja: '慢性の肩こり・首の痛みは整形外科で相談できます。',
      en: 'Chronic stiff shoulders or neck pain can be seen at orthopedics.',
    },
  },

  // --- 泌尿器 ---
  {
    department: 'uro',
    disease: { ja: '膀胱炎・尿路感染症', en: 'Cystitis / Urinary tract infection' },
    keywords: {
      ja: ['排尿時に痛い', 'トイレが近い', '頻尿', '残尿感', '尿が濁る', '血尿'],
      en: ['pain when urinating', 'frequent urination', 'need to pee often', 'incomplete emptying', 'cloudy urine', 'blood in urine'],
    },
    advice: {
      ja: '排尿痛・頻尿・血尿は泌尿器科を受診しましょう。',
      en: 'See urology for painful/frequent urination or blood in urine.',
    },
  },

  // --- 婦人科 ---
  {
    department: 'gyne',
    disease: { ja: '月経・婦人科系の不調', en: 'Menstrual / Gynecological issues' },
    keywords: {
      ja: ['生理痛', '生理が', '不正出血', 'おりもの', '下腹部が痛い'],
      en: ['period pain', 'menstrual pain', 'irregular bleeding', 'discharge', 'lower abdominal pain'],
    },
    advice: {
      ja: '生理不順・不正出血・下腹部痛は婦人科へ。',
      en: 'See gynecology for irregular periods, abnormal bleeding, or lower-abdominal pain.',
    },
  },

  // --- 歯科 ---
  {
    department: 'dental',
    disease: { ja: '虫歯・歯周病', en: 'Cavity / Gum disease' },
    keywords: {
      ja: ['歯が痛い', '歯茎', 'しみる', '噛むと痛い', '口の中'],
      en: ['toothache', 'tooth pain', 'gums', 'sensitive teeth', 'pain when biting', 'inside the mouth'],
    },
    advice: {
      ja: '歯の痛み・しみる・歯茎の腫れは歯科を受診しましょう。',
      en: 'See a dentist for tooth pain, sensitivity, or swollen gums.',
    },
  },

  // --- 心療内科 ---
  {
    department: 'psych',
    disease: { ja: 'ストレス・不眠・自律神経の不調', en: 'Stress / Insomnia / Autonomic issues' },
    keywords: {
      ja: ['眠れない', '不眠', '気分が落ち込む', '憂うつ', 'やる気が出ない', '不安', 'イライラ', '疲れがとれない'],
      en: ['cannot sleep', 'insomnia', 'feeling down', 'depressed', 'no motivation', 'anxious', 'anxiety', 'irritable', 'always tired'],
    },
    advice: {
      ja: '気分の落ち込みや不眠が続く場合は心療内科・精神科に相談を。',
      en: 'For lasting low mood or insomnia, consult psychosomatic medicine / psychiatry.',
    },
  },
];

// 救急を強く示唆するレッドフラグ（複合ワード・ロケール別）
const RED_FLAGS = {
  ja: [
    '意識がない', '意識がもうろう', '息ができない', '呼吸ができない',
    'ろれつが回らない', '半身', '顔が歪む', '突然の激しい頭痛',
    '胸が締め付けられる', '大量の出血', '呼びかけに反応',
  ],
  en: [
    'unconscious', 'losing consciousness', 'cannot breathe', 'can not breathe',
    'slurred speech', 'one side of body', 'face drooping', 'sudden severe headache',
    'chest tightness', 'crushing chest', 'heavy bleeding', 'unresponsive',
  ],
};

// 入力文字列を正規化（ロケール別に空白・記号の揺れを吸収）
const normalize = (text, lang) => {
  let t = (text || '').toLowerCase().replace(/[.,!?;:。、！？]/g, ' ');
  if (lang === 'ja') {
    // 日本語は空白を除去して部分一致させる
    t = t.replace(/\s+/g, '');
  } else {
    // 英語などは空白を1つに畳んで語順つきフレーズを一致させる
    t = t.replace(/\s+/g, ' ').trim();
  }
  return t;
};

/**
 * 症状テキストを解析し、候補疾患・推奨診療科を返す。
 * @param {string} text 入力された症状文
 * @param {'ja'|'en'} lang 解析に使用する言語
 * @returns {{ emergency: boolean, matched: boolean, conditions: Array, departments: Array }}
 */
export function analyzeSymptoms(text, lang = 'ja') {
  const norm = normalize(text, lang);
  const flags = RED_FLAGS[lang] || RED_FLAGS.ja;

  const emergency = flags.some((flag) => norm.includes(normalize(flag, lang)));

  // 各ルールのスコアリング（該当言語のキーワードで判定）
  const scored = RULES.map((rule) => {
    const kws = rule.keywords[lang] || rule.keywords.ja;
    const hits = kws.filter((kw) => norm.includes(normalize(kw, lang)));
    return { rule, hits, score: hits.length };
  }).filter((r) => r.score > 0);

  // スコア降順、緊急を優先
  scored.sort((a, b) => {
    if (!!b.rule.urgent !== !!a.rule.urgent) return b.rule.urgent ? 1 : -1;
    return b.score - a.score;
  });

  const maxScore = scored.reduce((m, r) => Math.max(m, r.score), 0) || 1;

  const conditions = scored.slice(0, 5).map(({ rule, hits, score }) => ({
    disease: rule.disease[lang] || rule.disease.ja,
    department: rule.department,
    departmentMeta: DEPARTMENTS[rule.department],
    advice: rule.advice[lang] || rule.advice.ja,
    urgent: !!rule.urgent,
    matchedKeywords: hits,
    confidence: Math.round((score / maxScore) * 100),
  }));

  // 診療科ごとに集計（重複排除・スコア合算）
  const deptMap = new Map();
  scored.forEach(({ rule, score }) => {
    const cur = deptMap.get(rule.department) || {
      department: rule.department,
      score: 0,
      meta: DEPARTMENTS[rule.department],
    };
    cur.score += score;
    deptMap.set(rule.department, cur);
  });
  const departments = [...deptMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return {
    emergency,
    matched: conditions.length > 0,
    conditions,
    departments,
  };
}
