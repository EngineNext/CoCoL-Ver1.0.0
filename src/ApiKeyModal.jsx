import React, { useState } from 'react';
import { X, KeyRound, ExternalLink } from 'lucide-react';
import { getApiKey, setApiKey, getModel, setModel } from './claude';

// Claude APIキーの登録モーダル（キーは localStorage のみに保存）
export default function ApiKeyModal({ t, onClose, onSaved }) {
  const [key, setKey] = useState(getApiKey());
  const [model, setModelState] = useState(getModel());

  const save = () => {
    setApiKey(key);
    setModel(model);
    onSaved?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <KeyRound size={18} className="text-sky-600" />
            {t.apiKeyTitle}
          </h2>
          <button onClick={onClose} aria-label={t.close} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-slate-500">{t.apiKeyDesc}</p>

        <label className="mb-1 block text-sm font-medium text-slate-700">{t.apiKeyLabel}</label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-ant-..."
          className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">{t.modelLabel}</label>
        <input
          type="text"
          value={model}
          onChange={(e) => setModelState(e.target.value)}
          placeholder="claude-sonnet-5"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
        <p className="mt-1 text-[11px] text-slate-400">{t.modelHint}</p>

        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline"
        >
          {t.getKey}
          <ExternalLink size={12} />
        </a>

        <button
          onClick={save}
          className="mt-4 w-full rounded-xl bg-sky-600 py-3 font-semibold text-white transition hover:bg-sky-700"
        >
          {t.save}
        </button>
      </div>
    </div>
  );
}
