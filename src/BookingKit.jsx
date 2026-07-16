import React, { useState } from 'react';
import { Loader2, CalendarClock, Phone, Mail, ShoppingBag, AlertTriangle } from 'lucide-react';
import { generateBookingKit, classifyError, hasApiKey } from './claude';
import { CopyButton } from './ui';

export default function BookingKit({ t, lang, symptomText, departmentJa, onNeedKey }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [kit, setKit] = useState(null);

  const run = async () => {
    if (!hasApiKey()) {
      onNeedKey();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await generateBookingKit(symptomText, lang, departmentJa || '', '');
      setKit(result);
    } catch (err) {
      const kind = classifyError(err);
      setError(kind === 'noKey' ? t.needKey : `${t.errorGeneric || 'Error'} (${kind})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-1 flex items-center gap-2 font-bold text-slate-900">
        <CalendarClock size={18} className="text-sky-600" />
        {t.bookingTitle}
      </h2>
      <p className="mb-3 text-xs text-slate-400">{t.poweredBy}</p>

      <button
        onClick={run}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <CalendarClock size={18} />}
        {loading ? t.loading : t.bookingGenerate}
      </button>

      {error && (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-red-500">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {kit && (
        <div className="mt-4 space-y-4">
          <Block
            icon={<Phone size={15} className="text-sky-600" />}
            title={t.bookingPhone}
            ja={kit.phone_script_ja}
            user={kit.phone_script_user}
            t={t}
          />
          <Block
            icon={<Mail size={15} className="text-sky-600" />}
            title={t.bookingEmail}
            ja={kit.email_ja}
            user={kit.email_user}
            t={t}
          />

          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <ShoppingBag size={15} className="text-sky-600" />
              {t.bookingBring}
            </p>
            <ul className="space-y-1 text-sm">
              {kit.bring_items.map((b, i) => (
                <li key={i} className="flex flex-wrap gap-x-2 text-slate-700">
                  <span className="font-medium">{b.ja}</span>
                  <span className="text-slate-400">/ {b.user}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="rounded-lg bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-800 ring-1 ring-amber-200">
            {t.bookingNote}
          </p>
        </div>
      )}
    </div>
  );
}

function Block({ icon, title, ja, user, t }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          {icon}
          {title}
        </p>
        <CopyButton text={ja} label={t.copy} copiedLabel={t.copied} />
      </div>
      <p className="whitespace-pre-wrap rounded-lg bg-white p-2.5 text-sm text-slate-800 ring-1 ring-slate-200">
        {ja}
      </p>
      <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-500">{user}</p>
    </div>
  );
}
