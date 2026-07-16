import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import IntakeFormFree from './IntakeFormFree';
import IntakeForm from './IntakeForm';

// 問診票パネル：選択式（無料・キー不要）と AI自動（Claude）を切り替え
export default function IntakePanel({ t, lang, symptomText, departmentJa, onNeedKey }) {
  const [mode, setMode] = useState('free'); // 'free' | 'ai'

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">
          <FileText size={18} className="text-sky-600" />
          {t.intakeTitle}
          {mode === 'free' && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              {t.intakeFreeBadge}
            </span>
          )}
        </h2>
      </div>

      {/* モード切替 */}
      <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-1 text-sm">
        {[
          { key: 'free', label: t.intakeModeFree },
          { key: 'ai', label: t.intakeModeAI },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={[
              'rounded-lg px-3 py-1.5 font-medium transition',
              mode === m.key ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'free' ? (
        <IntakeFormFree t={t} lang={lang} symptomText={symptomText} departmentJa={departmentJa} />
      ) : (
        <IntakeForm t={t} lang={lang} symptomText={symptomText} onNeedKey={onNeedKey} />
      )}
    </div>
  );
}
