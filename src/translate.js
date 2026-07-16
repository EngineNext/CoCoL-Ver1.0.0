// --- 無料翻訳（MyMemory API・キー不要） ---
// 自由入力欄を日本語化するために使用。混雑・上限時は原文のまま返す（フォールバック）。
// 参考: https://mymemory.translated.net/doc/spec.php

const ENDPOINT = 'https://api.mymemory.translated.net/get';

/**
 * テキストを日本語に翻訳する。fromLang が 'ja' または空なら原文を返す。
 * 失敗時は原文をそのまま返す（機能を止めない）。
 */
export async function translateToJa(text, fromLang) {
  const s = (text || '').trim();
  if (!s || fromLang === 'ja') return s;
  try {
    const url = `${ENDPOINT}?q=${encodeURIComponent(s)}&langpair=${encodeURIComponent(fromLang)}|ja`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('MYMEMORY_' + res.status);
    const data = await res.json();
    const out = data?.responseData?.translatedText;
    // 上限超過などの警告文が返る場合は原文にフォールバック
    if (out && !/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i.test(out)) {
      return out;
    }
    return s;
  } catch {
    return s;
  }
}

// 複数テキストをまとめて翻訳（順次・控えめに）
export async function translateManyToJa(texts, fromLang) {
  const results = [];
  for (const text of texts) {
    results.push(await translateToJa(text, fromLang));
  }
  return results;
}
