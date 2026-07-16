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
  Languages,
  Settings,
  FileText,
  MapPin,
  CalendarClock,
  ChevronRight,
} from 'lucide-react';
import { analyzeSymptoms } from './symptomEngine';
import { LANGUAGES, STRINGS } from './i18n';
import ApiKeyModal from './ApiKeyModal';
import IntakePanel from './IntakePanel';
import HospitalMap from './HospitalMap';
import BookingKit from './BookingKit';

// 音声認識APIの取得（ブラウザ差異を吸収）
const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function App() {
  const [lang, setLang] = useState('ja');
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [analyzedText, setAnalyzedText] = useState('');
  const [activeFeature, setActiveFeature] = useState(null); // 'intake' | 'map' | 'booking'
  const [showApiModal, setShowApiModal] = useState(false);
  const recognitionRef = useRef(null);
  const supported = !!SpeechRecognition;

  const t = STRINGS[lang];
  const speechLang = LANGUAGES.find((l) => l.code === lang)?.speechLang || 'ja-JP';

  // 音声認識の初期化（言語変更で作り直し）
  useEffect(() => {
    if (!supported) return;
    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
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
      if (finalText) {
        // 英語は単語間スペースが必要、日本語は不要
        const joiner = lang === 'ja' ? '' : ' ';
        setTranscript((prev) => (prev ? prev + joiner + finalText : finalText).trim());
      }
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError(t.errorMic);
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setError(`${t.errorGeneric}: ${event.error}`);
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };

    recognitionRef.current = recognition;
    return () => recognition.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, speechLang, lang]);

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
        setError(t.errorEmpty);
        return;
      }
      if (listening) stopListening();
      setError('');
      setResult(analyzeSymptoms(text, lang));
      setAnalyzedText(text);
      setActiveFeature(null);
    },
    [transcript, listening, stopListening, lang, t]
  );

  const handleReset = () => {
    setTranscript('');
    setInterim('');
    setResult(null);
    setError('');
    setAnalyzedText('');
    setActiveFeature(null);
  };

  const applyExample = (text) => {
    setTranscript(text);
    setResult(analyzeSymptoms(text, lang));
    setAnalyzedText(text);
    setActiveFeature(null);
  };

  // 言語切替：認識を止め、結果は言語が変わるためクリア
  const switchLang = (code) => {
    if (code === lang) return;
    if (listening) stopListening();
    setLang(code);
    setResult(null);
    setError('');
    setInterim('');
    setActiveFeature(null);
  };

  // 推奨診療科（日本語名）— 予約準備で使用
  const topDeptJa = result?.departments?.[0]?.meta?.label?.ja || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-sky-100 text-slate-800">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* 上部バー：AI設定 ＋ 言語切替 */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setShowApiModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:text-sky-700"
          >
            <Settings size={15} />
            {t.settings}
          </button>
          <div className="inline-flex items-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <Languages size={16} className="ml-2 text-slate-400" />
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => switchLang(l.code)}
                className={[
                  'rounded-full px-3 py-1 text-sm font-medium transition',
                  lang === l.code
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100',
                ].join(' ')}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* ヘッダー */}
        <header className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-600/10 px-4 py-1.5 text-sm font-medium text-sky-700">
            <Stethoscope size={16} />
            {t.badge}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{t.subtitle}</p>
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
              aria-label={listening ? t.micStop : t.micStart}
            >
              {listening && (
                <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-60" />
              )}
              {listening ? <MicOff size={36} /> : <Mic size={36} />}
            </button>
            <p className="text-center text-sm font-medium text-slate-600">
              {!supported ? t.notSupported : listening ? t.listening : t.micTap}
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
              placeholder={t.placeholder}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

          {/* アクション */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleAnalyze()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 font-semibold text-white transition hover:bg-sky-700"
            >
              <Search size={18} />
              {t.analyze}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 py-3 text-slate-500 transition hover:bg-slate-50"
              aria-label={t.clearAria}
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* 入力例 */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-slate-400">{t.examplesLabel}</p>
            <div className="flex flex-wrap gap-2">
              {t.examples.map((ex) => (
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
        {result && <Results result={result} t={t} lang={lang} />}

        {/* 次のアクション */}
        {result && result.matched && (
          <NextActions t={t} active={activeFeature} onSelect={setActiveFeature} />
        )}

        {/* 選択された機能パネル */}
        {result && activeFeature === 'intake' && (
          <div className="mt-4">
            <IntakePanel
              t={t}
              lang={lang}
              symptomText={analyzedText}
              departmentJa={topDeptJa}
              onNeedKey={() => setShowApiModal(true)}
            />
          </div>
        )}
        {result && activeFeature === 'map' && (
          <div className="mt-4">
            <HospitalMap t={t} lang={lang} />
          </div>
        )}
        {result && activeFeature === 'booking' && (
          <div className="mt-4">
            <BookingKit
              t={t}
              lang={lang}
              symptomText={analyzedText}
              departmentJa={topDeptJa}
              onNeedKey={() => setShowApiModal(true)}
            />
          </div>
        )}

        {/* 免責 */}
        <footer className="mt-6 rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
          <strong>{t.disclaimerStrong}</strong>
          {t.disclaimer}
        </footer>
      </div>

      {showApiModal && <ApiKeyModal t={t} onClose={() => setShowApiModal(false)} />}
    </div>
  );
}

// 次のアクション（問診票・病院マップ・予約準備）
function NextActions({ t, active, onSelect }) {
  const items = [
    { key: 'intake', icon: FileText, title: t.featIntake, desc: t.featIntakeDesc },
    { key: 'map', icon: MapPin, title: t.featMap, desc: t.featMapDesc },
    { key: 'booking', icon: CalendarClock, title: t.featBooking, desc: t.featBookingDesc },
  ];
  return (
    <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
        <Sparkles size={18} className="text-sky-600" />
        {t.nextTitle}
      </h2>
      <div className="grid gap-2">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onSelect(isActive ? null : it.key)}
              className={[
                'flex items-center gap-3 rounded-xl p-3 text-left transition',
                isActive
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-50 text-slate-700 hover:bg-sky-50',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  isActive ? 'bg-white/20' : 'bg-white text-sky-600 ring-1 ring-slate-200',
                ].join(' ')}
              >
                <Icon size={20} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{it.title}</span>
                <span className={['block text-xs', isActive ? 'text-sky-50' : 'text-slate-400'].join(' ')}>
                  {it.desc}
                </span>
              </span>
              <ChevronRight size={18} className={isActive ? 'rotate-90 transition' : 'transition'} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

// 結果表示コンポーネント
function Results({ result, t, lang }) {
  const { emergency, matched, conditions, departments } = result;

  return (
    <section className="mt-6 space-y-4">
      {/* 緊急アラート */}
      {emergency && (
        <div className="flex items-start gap-3 rounded-2xl bg-red-500 p-4 text-white shadow-lg">
          <AlertTriangle className="mt-0.5 shrink-0" size={22} />
          <div>
            <p className="font-bold">{t.emergencyTitle}</p>
            <p className="text-sm text-red-50">{t.emergencyBody}</p>
          </div>
        </div>
      )}

      {!matched && (
        <div className="rounded-2xl bg-white p-5 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
          {t.noMatch}
        </div>
      )}

      {/* 推奨診療科 */}
      {departments.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
            <Sparkles size={18} className="text-sky-600" />
            {t.deptTitle}
          </h2>
          <div className="flex flex-wrap gap-2">
            {departments.map((d, i) => (
              <div
                key={d.department}
                className={[
                  'flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold',
                  i === 0 ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-700',
                ].join(' ')}
              >
                <span className="text-lg">{d.meta?.emoji}</span>
                {d.meta?.label?.[lang] || d.department}
                {i === 0 && (
                  <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {t.firstChoice}
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
            {t.conditionsTitle}
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
                        {t.urgentBadge}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-400">
                    {c.departmentMeta?.label?.[lang] || c.department}
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
                  <span className="w-10 text-right text-xs text-slate-400">{c.confidence}%</span>
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
