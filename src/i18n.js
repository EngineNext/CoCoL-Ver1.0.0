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

    // 次のアクション
    nextTitle: '次にできること',
    featIntake: '問診票をつくる',
    featIntakeDesc: '日本語＋あなたの言語で自動作成。受付に見せられます。',
    featMap: '近くの病院をさがす',
    featMapDesc: '現在地の近くの医療機関を地図で表示します。',
    featBooking: '予約の準備をする',
    featBookingDesc: '電話スクリプト・予約メール文面を日本語で用意します。',

    // 共通
    copy: 'コピー',
    copied: 'コピーしました',
    print: '印刷 / PDF保存',
    close: '閉じる',
    loading: 'Claudeが作成中…',
    retry: 'もう一度',
    poweredBy: 'Claude API を使用（あなたのAPIキー）',

    // APIキー設定
    settings: 'AI設定',
    apiKeyTitle: 'Claude APIキーの設定',
    apiKeyDesc:
      '問診票の作成・予約準備には Anthropic の APIキーが必要です。キーはこの端末のブラウザにのみ保存され、外部には送信されません（Anthropic API を除く）。',
    apiKeyLabel: 'APIキー（sk-ant-…）',
    modelLabel: 'モデルID（任意）',
    modelHint: '既定: claude-sonnet-5 / 高性能にするなら別のモデルIDを入力',
    getKey: 'APIキーの取得先',
    save: '保存',
    needKey: 'この機能には Claude APIキーが必要です。右上の「AI設定」から登録してください。',

    // 問診票
    intakeTitle: '問診票（自動作成）',
    intakeExtraLabel: '追加情報（任意・不足していれば入力）',
    intakeExtraPh: '例）3日前から、市販の解熱剤を飲んだ、持病はありません',
    intakeGenerate: '問診票を作成',
    intakeRegen: '追加情報を反映して作り直す',
    intakeChief: '主訴',
    intakeDept: '受診をおすすめする科',
    intakeFollowups: '受付で聞かれそう / 追記すると良い項目',
    intakeColItem: '項目',
    intakeColJa: '日本語（受付用）',
    intakeColUser: 'あなたの言語',

    // 病院マップ
    mapTitle: '近くの医療機関',
    mapLocate: '現在地から探す',
    mapLocating: '現在地を取得中…',
    mapSearching: '医療機関を検索中…',
    mapNone: '近くに医療機関が見つかりませんでした。範囲を広げてお試しください。',
    mapGeoDenied: '位置情報の取得が許可されていません。ブラウザの設定をご確認ください。',
    mapRadius: '検索範囲',
    mapDistance: '距離',
    mapDirections: '経路',
    mapVerifyLang: '対応言語を確認',
    mapOfficialTitle: '対応言語の公式情報（要確認）',
    mapLangNote:
      '地図上の医療機関の「対応言語」は保証されません。受診前に必ず公式リスト・電話でご確認ください。',

    // 予約準備
    bookingTitle: '予約の準備',
    bookingGenerate: '電話スクリプト・メール文面を作成',
    bookingPhone: '電話で予約するときのスクリプト',
    bookingEmail: 'メール / Web予約フォーム用の文面',
    bookingBring: '持ち物',
    bookingNote:
      '自動で予約は行いません。ここで用意した文面を電話・メール・Web予約でご自身または同行者がお使いください。',
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

    // Next actions
    nextTitle: 'What you can do next',
    featIntake: 'Create an intake form',
    featIntakeDesc: 'Auto-generated in Japanese + your language, ready to show at reception.',
    featMap: 'Find nearby hospitals',
    featMapDesc: 'Show medical facilities near your current location on a map.',
    featBooking: 'Prepare to book',
    featBookingDesc: 'Get a Japanese phone script and reservation email ready.',

    // Common
    copy: 'Copy',
    copied: 'Copied',
    print: 'Print / Save PDF',
    close: 'Close',
    loading: 'Claude is generating…',
    retry: 'Try again',
    poweredBy: 'Uses the Claude API (your own key)',

    // API key
    settings: 'AI settings',
    apiKeyTitle: 'Set your Claude API key',
    apiKeyDesc:
      'Creating the intake form and booking kit requires an Anthropic API key. Your key is stored only in this browser and is never sent anywhere except the Anthropic API.',
    apiKeyLabel: 'API key (sk-ant-…)',
    modelLabel: 'Model ID (optional)',
    modelHint: 'Default: claude-sonnet-5 / enter another model ID for higher capability',
    getKey: 'Where to get an API key',
    save: 'Save',
    needKey: 'This feature needs a Claude API key. Add it from "AI settings" at the top right.',

    // Intake form
    intakeTitle: 'Medical intake form (auto-generated)',
    intakeExtraLabel: 'Additional info (optional — add anything missing)',
    intakeExtraPh: 'e.g. started 3 days ago, took an OTC fever reducer, no chronic illness',
    intakeGenerate: 'Generate intake form',
    intakeRegen: 'Regenerate with the added info',
    intakeChief: 'Chief complaint',
    intakeDept: 'Suggested department',
    intakeFollowups: 'Likely reception questions / good to add',
    intakeColItem: 'Field',
    intakeColJa: 'Japanese (for reception)',
    intakeColUser: 'Your language',

    // Hospital map
    mapTitle: 'Nearby medical facilities',
    mapLocate: 'Search from my location',
    mapLocating: 'Getting your location…',
    mapSearching: 'Searching for facilities…',
    mapNone: 'No facilities found nearby. Try widening the search radius.',
    mapGeoDenied: 'Location access is not allowed. Please check your browser settings.',
    mapRadius: 'Radius',
    mapDistance: 'Distance',
    mapDirections: 'Directions',
    mapVerifyLang: 'Check languages',
    mapOfficialTitle: 'Official language info (please verify)',
    mapLangNote:
      'Language support shown for map facilities is not guaranteed. Always verify via official lists or by phone before visiting.',

    // Booking prep
    bookingTitle: 'Prepare to book',
    bookingGenerate: 'Generate phone script & email',
    bookingPhone: 'Phone script for booking',
    bookingEmail: 'Text for email / web reservation form',
    bookingBring: 'What to bring',
    bookingNote:
      'This does not book automatically. Use the prepared text yourself (or with a companion) by phone, email, or web reservation.',
  },
};
