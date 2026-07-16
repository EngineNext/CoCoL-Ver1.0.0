// --- 問診票フィールド定義（キー不要・選択式） ---
// 項目名・選択肢を日本語↔各言語で固定登録。利用者の選択はそのまま日本語に
// 対応づくため翻訳APIが不要（自由入力欄のみ無料翻訳で日本語化する）。

// type:
//  'text'         自由入力（1行）— 日本語化に翻訳を使う
//  'textarea'     自由入力（複数行）— 同上
//  'choice'       単一選択
//  'chips'        複数選択
//  'scale'        1〜10段階
//  'yesno_detail' はい/いいえ ＋（はいの場合）詳細自由入力

export const INTAKE_FIELDS = [
  {
    id: 'chief',
    type: 'text',
    label: { ja: '主訴（今日いちばん困っていること）', en: 'Main problem today' },
    prefill: true,
  },
  {
    id: 'onset',
    type: 'choice',
    label: { ja: 'いつから', en: 'Since when' },
    options: [
      { id: 'today', ja: '今日', en: 'Today' },
      { id: 'd2_3', ja: '2〜3日前', en: '2–3 days ago' },
      { id: 'week', ja: '1週間前', en: 'About a week ago' },
      { id: 'weeks', ja: '2週間以上前', en: 'More than 2 weeks ago' },
      { id: 'month', ja: '1か月以上前', en: 'More than a month ago' },
    ],
  },
  {
    id: 'course',
    type: 'choice',
    label: { ja: '症状の経過', en: 'How it is changing' },
    options: [
      { id: 'better', ja: '良くなってきている', en: 'Getting better' },
      { id: 'same', ja: '変わらない', en: 'About the same' },
      { id: 'worse', ja: '悪化してきている', en: 'Getting worse' },
      { id: 'wave', ja: '良くなったり悪くなったり', en: 'Comes and goes' },
    ],
  },
  {
    id: 'severity',
    type: 'scale',
    label: { ja: 'つらさの程度（1=軽い / 10=強い）', en: 'Severity (1 = mild / 10 = severe)' },
  },
  {
    id: 'character',
    type: 'chips',
    label: { ja: 'どんな症状ですか（複数可）', en: 'What kind of symptoms (multiple)' },
    options: [
      { id: 'throb', ja: 'ズキズキする', en: 'Throbbing' },
      { id: 'tight', ja: '締め付けられる', en: 'Tightening' },
      { id: 'dull', ja: '鈍い痛み', en: 'Dull pain' },
      { id: 'burn', ja: '焼けるような', en: 'Burning' },
      { id: 'sting', ja: 'チクチクする', en: 'Stinging' },
      { id: 'itch', ja: 'かゆい', en: 'Itchy' },
      { id: 'numb', ja: 'しびれる', en: 'Numbness' },
      { id: 'fever', ja: '熱っぽい', en: 'Feverish' },
      { id: 'nausea', ja: '吐き気', en: 'Nausea' },
      { id: 'dizzy', ja: 'めまい', en: 'Dizziness' },
      { id: 'cough', ja: 'せき', en: 'Cough' },
      { id: 'rash', ja: '発疹', en: 'Rash' },
    ],
  },
  {
    id: 'fever',
    type: 'choice',
    label: { ja: '発熱', en: 'Fever' },
    options: [
      { id: 'none', ja: 'なし', en: 'None' },
      { id: 'low', ja: '微熱（37℃台）', en: 'Mild (37°C range)' },
      { id: 'high', ja: '38℃以上', en: '38°C or higher' },
      { id: 'unknown', ja: '測っていない', en: "Haven't measured" },
    ],
  },
  {
    id: 'allergy',
    type: 'yesno_detail',
    label: { ja: 'アレルギー（薬・食べ物など）', en: 'Allergies (medicine, food, etc.)' },
    detailLabel: { ja: 'アレルギーの内容', en: 'What are you allergic to' },
  },
  {
    id: 'meds',
    type: 'yesno_detail',
    label: { ja: '現在服用中の薬', en: 'Medications you are currently taking' },
    detailLabel: { ja: '薬の名前', en: 'Name of the medicine' },
  },
  {
    id: 'history',
    type: 'chips',
    label: { ja: '既往歴（かかったことのある病気・複数可）', en: 'Past medical history (multiple)' },
    options: [
      { id: 'htn', ja: '高血圧', en: 'High blood pressure' },
      { id: 'dm', ja: '糖尿病', en: 'Diabetes' },
      { id: 'heart', ja: '心臓の病気', en: 'Heart disease' },
      { id: 'asthma', ja: 'ぜんそく', en: 'Asthma' },
      { id: 'liver', ja: '肝臓の病気', en: 'Liver disease' },
      { id: 'kidney', ja: '腎臓の病気', en: 'Kidney disease' },
      { id: 'surgery', ja: '手術をしたことがある', en: 'Past surgery' },
      { id: 'none', ja: '特になし', en: 'None' },
    ],
  },
  {
    id: 'pregnancy',
    type: 'choice',
    label: { ja: '妊娠・授乳', en: 'Pregnancy / breastfeeding' },
    options: [
      { id: 'na', ja: '該当なし', en: 'Not applicable' },
      { id: 'maybe', ja: '妊娠の可能性あり', en: 'Possibly pregnant' },
      { id: 'pregnant', ja: '妊娠中', en: 'Pregnant' },
      { id: 'nursing', ja: '授乳中', en: 'Breastfeeding' },
    ],
  },
  {
    id: 'habits',
    type: 'chips',
    label: { ja: '生活習慣', en: 'Lifestyle' },
    options: [
      { id: 'smoke', ja: '喫煙する', en: 'I smoke' },
      { id: 'drink', ja: 'お酒を飲む', en: 'I drink alcohol' },
      { id: 'none', ja: 'どちらもしない', en: 'Neither' },
    ],
  },
  {
    id: 'notes',
    type: 'textarea',
    label: { ja: 'その他、伝えたいこと（任意）', en: 'Anything else to tell the doctor (optional)' },
  },
];
