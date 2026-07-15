import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Stethoscope,
  AlertTriangle,
  Search,
  Sparkles,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { analyzeSymptoms } from './symptomEngine';

// 音声認識APIの取得（ブラウザ差異を吸収）
const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// 入力例（タップで試せる）
const EXAMPLES = [
  '朝から喉が痛くて咳が出て、少し熱っぽいです',
  'みぞおちがキリキリ痛くて吐き気があります',
  '昨日から腰が痛くて足がしびれます',
  '目が赤くてかゆくて目やにが出ます',
  '頭がズキズキ痛くて肩こりもひどいです',
];

export default function App() {
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const supported = !!SpeechRecognition;

  // 音声認識の初期化
  useEffect(() => {
    if (!supported) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
        else interimText += chunk;
      }
      if (finalText) setTranscript((prev) => (prev + finalText).trim());
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('マイクの使用が許可されていません。ブラウザの設定を確認してください。');
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setError(`音声認識エラー: ${event.error}`);
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };

    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, [supported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError('');
    setResult(null);
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      // 連続 start() の例外は無視
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const handleAnalyze = useCallback(
    (textArg) => {
      const text = (typeof textArg === 'string' ? textArg : transcript).trim();
      if (!text) {
        setError('症状を入力してください。');
        return;
      }
      if (listening) stopListening();
      setError('');
      setResult(analyzeSymptoms(text));
    },
    [transcript, listening, stopListening]
  );

  const handleReset = () => {
    setTranscript('');
    setInterim('');
    setResult(null);
    setError('');
  };

  const applyExample = (text) => {
    setTranscript(text);
    setResult(analyzeSymptoms(text));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-sky-100 text-slate-800">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* ヘッダー */}
        <header className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-600/10 px-4 py-1.5 text-sm font-medium text-sky-700">
            <Stethoscope size={16} />
            症状ナビ POC
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            話すだけで、受診の目安がわかる
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            気になる症状を話す／入力すると、考えられる疾患と受診をおすすめする診療科を提案します。
          </p>
        </header>

        {/* 入力カード */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col items-center gap-4">
            {/* マイクボタン */}
            <button
              onClick={listening ? stopListening : startListening}
              disabled={!supported}
              className={[
                'relative flex h-24 w-24 items-center justify-center rounded-full text-white transition',
                'disabled:cursor-not-allowed disabled:bg-slate-300',
                listening
                  ? 'bg-red-500 shadow-lg shadow-red-200'
                  : 'bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-200',
              ].join(' ')}
              aria-label={listening ? '録音を停止' : '録音を開始'}
            >
              {listening && (
                <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-60" />
              )}
              {listening ? <MicOff size={36} /> : <Mic size={36} />}
            </button>
            <p className="text-sm font-medium text-slate-600">
              {!supported
                ? '⚠️ このブラウザは音声入力に対応していません（下の入力欄をご利用ください）'
                : listening
                ? '聞き取り中… 話し終えたらもう一度タップ'
                : 'マイクをタップして症状を話してください'}
            </p>
          </div>

          {/* テキスト入力 */}
          <div className="mt-5">
            <textarea
              value={transcript + (interim ? ` ${interim}` : '')}
              onChange={(e) => {
                setTranscript(e.target.value);
                setInterim('');
              }}
              placeholder="例）朝からのどが痛くて、咳と微熱があります"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}

          {/* アクション */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleAnalyze()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 font-semibold text-white transition hover:bg-sky-700"
            >
              <Search size={18} />
              診療科を調べる
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 py-3 text-slate-500 transition hover:bg-slate-50"
              aria-label="クリア"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* 入力例 */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-slate-400">
              こんな風に話してみてください
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => applyExample(ex)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 transition hover:bg-sky-100 hover:text-sky-700"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 結果 */}
        {result && <Results result={result} />}

        {/* 免責 */}
        <footer className="mt-6 rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
          <strong>ご注意：</strong>
          本アプリは技術デモ（POC）であり、医療行為・診断を行うものではありません。
          表示される情報はあくまで受診の目安です。症状が重い・急に悪化した場合は、
          ためらわず医療機関の受診または救急要請（119）を行ってください。
        </footer>
      </div>
    </div>
  );
}

// 結果表示コンポーネント
function Results({ result }) {
  const { emergency, matched, conditions, departments } = result;

  return (
    <section className="mt-6 space-y-4">
      {/* 緊急アラート */}
      {emergency && (
        <div className="flex items-start gap-3 rounded-2xl bg-red-500 p-4 text-white shadow-lg">
          <AlertTriangle className="mt-0.5 shrink-0" size={22} />
          <div>
            <p className="font-bold">緊急の可能性があります</p>
            <p className="text-sm text-red-50">
              重い症状が含まれています。すぐに医療機関を受診するか、
              ためらわず<strong>119番</strong>に連絡してください。
            </p>
          </div>
        </div>
      )}

      {!matched && (
        <div className="rounded-2xl bg-white p-5 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
          該当する症状を特定できませんでした。表現を変えて、もう少し具体的に
          （いつから・どこが・どんな痛みか）話してみてください。
        </div>
      )}

      {/* 推奨診療科 */}
      {departments.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
            <Sparkles size={18} className="text-sky-600" />
            おすすめの診療科
          </h2>
          <div className="flex flex-wrap gap-2">
            {departments.map((d, i) => (
              <div
                key={d.department}
                className={[
                  'flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold',
                  i === 0
                    ? 'bg-sky-600 text-white'
                    : 'bg-sky-50 text-sky-700',
                ].join(' ')}
              >
                <span className="text-lg">{d.meta?.emoji}</span>
                {d.meta?.label || d.department}
                {i === 0 && (
                  <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    第一候補
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 候補疾患 */}
      {conditions.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
            <Stethoscope size={18} className="text-sky-600" />
            考えられる主な疾患
          </h2>
          <ul className="space-y-3">
            {conditions.map((c) => (
              <li
                key={c.disease}
                className={[
                  'rounded-xl border p-4',
                  c.urgent ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.departmentMeta?.emoji}</span>
                    <span className="font-semibold text-slate-900">{c.disease}</span>
                    {c.urgent && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                        要注意
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-400">
                    {c.departmentMeta?.label || c.department}
                  </span>
                </div>

                {/* 一致度バー */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={c.urgent ? 'h-full bg-red-400' : 'h-full bg-sky-500'}
                      style={{ width: `${c.confidence}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-slate-400">
                    {c.confidence}%
                  </span>
                </div>

                <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
                  <Volume2 size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  {c.advice}
                </p>

                {c.matchedKeywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.matchedKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded bg-white px-1.5 py-0.5 text-[11px] text-slate-400 ring-1 ring-slate-200"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
