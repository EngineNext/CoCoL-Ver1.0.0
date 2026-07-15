// --- UI文言の多言語定義 ---
// 言語ごとに画面テキスト・入力例・音声認識ロケール・緊急番号をまとめる。

export const LANGUAGES = [
  { code: 'ja', label: '日本語', speechLang: 'ja-JP' },
  { code: 'en', label: 'English', speechLang: 'en-US' },
];

export const STRINGS = {
  ja: {
    badge: '症状ナビ POC',
    title: '話すだけで、受診の目安がわかる',
    subtitle:
      '気になる症状を話す／入力すると、考えられる疾患と受診をおすすめする診療科を提案します。',
    micTap: 'マイクをタップして症状を話してください',
    listening: '聞き取り中… 話し終えたらもう一度タップ',
    notSupported:
      '⚠️ このブラウザは音声入力に対応していません（下の入力欄をご利用ください）',
    placeholder: '例）朝からのどが痛くて、咳と微熱があります',
    analyze: '診療科を調べる',
    clearAria: 'クリア',
    micStart: '録音を開始',
    micStop: '録音を停止',
    examplesLabel: 'こんな風に話してみてください',
    examples: [
      '朝から喉が痛くて咳が出て、少し熱っぽいです',
      'みぞおちがキリキリ痛くて吐き気があります',
      '昨日から腰が痛くて足がしびれます',
      '目が赤くてかゆくて目やにが出ます',
      '頭がズキズキ痛くて肩こりもひどいです',
    ],
    emergencyTitle: '緊急の可能性があります',
    emergencyBody:
      '重い症状が含まれています。すぐに医療機関を受診するか、ためらわず119番に連絡してください。',
    emergencyNumber: '119',
    noMatch:
      '該当する症状を特定できませんでした。表現を変えて、もう少し具体的に（いつから・どこが・どんな痛みか）話してみてください。',
    deptTitle: 'おすすめの診療科',
    firstChoice: '第一候補',
    conditionsTitle: '考えられる主な疾患',
    urgentBadge: '要注意',
    disclaimerStrong: 'ご注意：',
    disclaimer:
      '本アプリは技術デモ（POC）であり、医療行為・診断を行うものではありません。表示される情報はあくまで受診の目安です。症状が重い・急に悪化した場合は、ためらわず医療機関の受診または救急要請（119）を行ってください。',
    errorEmpty: '症状を入力してください。',
    errorMic: 'マイクの使用が許可されていません。ブラウザの設定を確認してください。',
    errorGeneric: '音声認識エラー',
  },
  en: {
    badge: 'Symptom Navi POC',
    title: 'Just speak — get a guide on where to go',
    subtitle:
      'Say or type your symptoms, and get possible conditions and the medical department we suggest visiting.',
    micTap: 'Tap the mic and describe your symptoms',
    listening: 'Listening… tap again when you finish',
    notSupported:
      '⚠️ This browser does not support voice input (please use the text box below)',
    placeholder: 'e.g. My throat has been sore since morning, with a cough and mild fever',
    analyze: 'Find a department',
    clearAria: 'Clear',
    micStart: 'Start recording',
    micStop: 'Stop recording',
    examplesLabel: 'Try describing it like this',
    examples: [
      'My throat is sore, I have a cough, and I feel a bit feverish',
      'I have a sharp pain in my upper abdomen and nausea',
      'My lower back hurts and my leg feels numb',
      'My eyes are red, itchy, and have discharge',
      'I have a throbbing headache and stiff shoulders',
    ],
    emergencyTitle: 'This may be an emergency',
    emergencyBody:
      'Your description includes serious symptoms. Seek medical care immediately or call your local emergency number (e.g. 911) without hesitation.',
    emergencyNumber: '911',
    noMatch:
      'Could not identify a matching condition. Try rephrasing with more detail (when it started, where, what kind of pain).',
    deptTitle: 'Suggested department',
    firstChoice: 'Top match',
    conditionsTitle: 'Possible conditions',
    urgentBadge: 'Caution',
    disclaimerStrong: 'Note:',
    disclaimer:
      'This app is a technical demo (POC) and does not provide medical care or diagnosis. The information shown is only a rough guide. If symptoms are severe or worsen suddenly, seek medical care or call emergency services without hesitation.',
    errorEmpty: 'Please enter your symptoms.',
    errorMic: 'Microphone access is not allowed. Please check your browser settings.',
    errorGeneric: 'Speech recognition error',
  },
};
