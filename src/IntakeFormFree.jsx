import React, { useState, useEffect } from 'react';
import { Loader2, FileText, Printer } from 'lucide-react';
import { INTAKE_FIELDS } from './intakeSchema';
import { translateToJa } from './translate';
import { CopyButton } from './ui';

// 選択式・キー不要の問診票（自由入力欄のみ無料翻訳で日本語化）
export default function IntakeFormFree({ t, lang, symptomText, departmentJa }) {
  const [answers, setAnswers] = useState({});
  const [building, setBuilding] = useState(false);
  const [form, setForm] = useState(null);

  // 主訴に症状文をプリフィル
  useEffect(() => {
    setAnswers((a) => ({ ...a, chief: a.chief ?? symptomText ?? '' }));
  }, [symptomText]);

  const setField = (id, value) => setAnswers((a) => ({ ...a, [id]: value }));
  const toggleChip = (id, optId) =>
    setAnswers((a) => {
      const cur = a[id] || [];
      return { ...a, [id]: cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId] };
    });

  const L = (obj) => obj[lang] || obj.ja;

  // 回答→問診票アイテムに整形（自由入力欄は翻訳）
  const build = async () => {
    setBuilding(true);
    try {
      const items = [];
      for (const f of INTAKE_FIELDS) {
        const val = answers[f.id];
        let answerJa = t.intakeUnanswered;
        let answerUser = t.intakeUnanswered;

        if (f.type === 'text' || f.type === 'textarea') {
          const text = (val || '').trim();
          if (text) {
            answerUser = text;
            answerJa = await translateToJa(text, lang);
          }
        } else if (f.type === 'choice') {
          const opt = f.options.find((o) => o.id === val);
          if (opt) {
            answerJa = opt.ja;
            answerUser = L(opt);
          }
        } else if (f.type === 'chips') {
          const ids = val || [];
          const opts = f.options.filter((o) => ids.includes(o.id));
          if (opts.length) {
            answerJa = opts.map((o) => o.ja).join('、');
            answerUser = opts.map((o) => L(o)).join(', ');
          }
        } else if (f.type === 'scale') {
          if (val) {
            answerJa = `${val} / 10`;
            answerUser = `${val} / 10`;
          }
        } else if (f.type === 'yesno_detail') {
          const yn = val?.yn;
          if (yn === 'yes') {
            const detail = (val.detail || '').trim();
            const detailJa = detail ? await translateToJa(detail, lang) : '';
            answerJa = detailJa ? `はい：${detailJa}` : 'はい';
            answerUser = detail ? `${t.intakeYes}: ${detail}` : t.intakeYes;
          } else if (yn === 'no') {
            answerJa = 'いいえ';
            answerUser = t.intakeNo;
          }
        }

        items.push({
          label_ja: f.label.ja,
          label_user: L(f.label),
          answer_ja: answerJa,
          answer_user: answerUser,
          known: answerJa !== t.intakeUnanswered,
        });
      }
      setForm({ items, chief: answers.chief || '' });
    } finally {
      setBuilding(false);
    }
  };

  const showUserCol = lang !== 'ja';

  const jaFullText = form
    ? [
        departmentJa ? `受診希望科: ${departmentJa}` : null,
        ...form.items.map((it) => `${it.label_ja}: ${it.answer_ja}`),
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      {/* 入力フォーム */}
      <div className="space-y-4">
        {INTAKE_FIELDS.map((f) => (
          <Field
            key={f.id}
            f={f}
            t={t}
            L={L}
            value={answers[f.id]}
            setField={setField}
            toggleChip={toggleChip}
          />
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{t.intakeFreeNote}</p>

      <button
        onClick={build}
        disabled={building}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
      >
        {building ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
        {building ? t.intakeTranslating : t.intakeGenerate}
      </button>

      {/* 出力（問診票） */}
      {form && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700">
              {departmentJa ? `${t.intakeDept}: ${departmentJa}` : t.intakeTitle}
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

          <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500">
                  <th className="p-2 font-medium">{t.intakeColItem}</th>
                  <th className="p-2 font-medium">{t.intakeColJa}</th>
                  {showUserCol && <th className="p-2 font-medium">{t.intakeColUser}</th>}
                </tr>
              </thead>
              <tbody>
                {form.items.map((it, i) => (
                  <tr key={i} className={it.known ? '' : 'text-slate-400'}>
                    <td className="border-t border-slate-100 p-2 align-top text-xs font-medium text-slate-500">
                      {it.label_user}
                    </td>
                    <td className="border-t border-slate-100 p-2 align-top">{it.answer_ja}</td>
                    {showUserCol && (
                      <td className="border-t border-slate-100 p-2 align-top">{it.answer_user}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// 個別フィールドの入力UI
function Field({ f, t, L, value, setField, toggleChip }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{L(f.label)}</label>

      {f.type === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => setField(f.id, e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      )}

      {f.type === 'textarea' && (
        <textarea
          rows={2}
          value={value || ''}
          onChange={(e) => setField(f.id, e.target.value)}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      )}

      {f.type === 'choice' && (
        <div className="flex flex-wrap gap-2">
          {f.options.map((o) => (
            <button
              key={o.id}
              onClick={() => setField(f.id, value === o.id ? undefined : o.id)}
              className={[
                'rounded-full px-3 py-1.5 text-sm transition',
                value === o.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-sky-100',
              ].join(' ')}
            >
              {L(o)}
            </button>
          ))}
        </div>
      )}

      {f.type === 'chips' && (
        <div className="flex flex-wrap gap-2">
          {f.options.map((o) => {
            const on = (value || []).includes(o.id);
            return (
              <button
                key={o.id}
                onClick={() => toggleChip(f.id, o.id)}
                className={[
                  'rounded-full px-3 py-1.5 text-sm transition',
                  on ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-100',
                ].join(' ')}
              >
                {L(o)}
              </button>
            );
          })}
        </div>
      )}

      {f.type === 'scale' && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setField(f.id, value === n ? undefined : n)}
              className={[
                'h-8 w-8 rounded-lg text-sm font-medium transition',
                value === n ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-100',
              ].join(' ')}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {f.type === 'yesno_detail' && (
        <div>
          <div className="flex gap-2">
            {['yes', 'no'].map((yn) => (
              <button
                key={yn}
                onClick={() =>
                  setField(f.id, { yn, detail: value?.detail || '' })
                }
                className={[
                  'rounded-full px-4 py-1.5 text-sm transition',
                  value?.yn === yn
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-sky-100',
                ].join(' ')}
              >
                {yn === 'yes' ? t.intakeYes : t.intakeNo}
              </button>
            ))}
          </div>
          {value?.yn === 'yes' && (
            <input
              type="text"
              value={value.detail || ''}
              onChange={(e) => setField(f.id, { yn: 'yes', detail: e.target.value })}
              placeholder={f.detailLabel ? L(f.detailLabel) : t.intakeDetailPh}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          )}
        </div>
      )}
    </div>
  );
}
