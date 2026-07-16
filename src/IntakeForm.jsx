import React, { useState } from 'react';
import { Loader2, FileText, Printer, AlertTriangle, RefreshCw } from 'lucide-react';
import { generateIntakeForm, classifyError, hasApiKey } from './claude';
import { CopyButton } from './ui';

export default function IntakeForm({ t, lang, symptomText, onNeedKey }) {
  const [extra, setExtra] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);

  const run = async () => {
    if (!hasApiKey()) {
      onNeedKey();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await generateIntakeForm(symptomText, lang, extra);
      setForm(result);
    } catch (err) {
      const kind = classifyError(err);
      setError(kind === 'noKey' ? t.needKey : `${t.errorGeneric || 'Error'} (${kind})`);
    } finally {
      setLoading(false);
    }
  };

  // 受付に渡す日本語テキスト全文（コピー用）
  const jaFullText = form
    ? [
        `主訴: ${form.chief_complaint.ja}`,
        `受診希望科: ${form.recommended_department_ja}`,
        ...form.items.map((it) => `${it.label_ja}: ${it.answer_ja}`),
      ].join('\n')
    : '';

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="mb-3 text-xs text-slate-400">{t.poweredBy}</p>

      <label className="mb-1 block text-sm font-medium text-slate-700">{t.intakeExtraLabel}</label>
      <textarea
        value={extra}
        onChange={(e) => setExtra(e.target.value)}
        placeholder={t.intakeExtraPh}
        rows={2}
        className="mb-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />

      <button
        onClick={run}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : form ? <RefreshCw size={18} /> : <FileText size={18} />}
        {loading ? t.loading : form ? t.intakeRegen : t.intakeGenerate}
      </button>

      {error && (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-red-500">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {form && (
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              <span className="font-semibold text-slate-900">{t.intakeChief}:</span>{' '}
              {form.chief_complaint.user}
            </div>
            <div className="flex gap-2">
              <CopyButton text={jaFullText} label={t.copy} copiedLabel={t.copied} />
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <Printer size={13} />
                {t.print}
              </button>
            </div>
          </div>

          <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700">
            {t.intakeDept}: {form.recommended_department_ja}
          </div>

          <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500">
                  <th className="p-2 font-medium">{t.intakeColItem}</th>
                  <th className="p-2 font-medium">{t.intakeColJa}</th>
                  <th className="p-2 font-medium">{t.intakeColUser}</th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((it, i) => (
                  <tr key={i} className={it.known ? '' : 'text-slate-400'}>
                    <td className="border-t border-slate-100 p-2 align-top text-xs font-medium text-slate-500">
                      {it.label_user}
                    </td>
                    <td className="border-t border-slate-100 p-2 align-top">{it.answer_ja}</td>
                    <td className="border-t border-slate-100 p-2 align-top">{it.answer_user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {form.follow_up_questions?.length > 0 && (
            <div className="mt-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
              <p className="mb-1.5 text-xs font-semibold text-amber-800">{t.intakeFollowups}</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-amber-900">
                {form.follow_up_questions.map((q, i) => (
                  <li key={i}>{q.user}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
