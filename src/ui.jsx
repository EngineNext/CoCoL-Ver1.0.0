import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

// クリップボードにコピーするボタン
export function CopyButton({ text, label, copiedLabel, className = '' }) {
  const [done, setDone] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      // クリップボード非対応時は何もしない
    }
  };
  return (
    <button
      onClick={onClick}
      className={
        'inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 ' +
        className
      }
    >
      {done ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
      {done ? copiedLabel : label}
    </button>
  );
}
