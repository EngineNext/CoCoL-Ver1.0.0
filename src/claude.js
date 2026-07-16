// --- Claude API 連携（ブラウザ完結 / ユーザー自身のAPIキー） ---
//
// バックエンドを持たない静的サイトのため、APIキーはユーザーのブラウザの
// localStorage にのみ保存し、Anthropic API を直接呼び出します（BYO key）。
// キーはリポジトリにも外部にも送信されません（Anthropic API を除く）。

import Anthropic from '@anthropic-ai/sdk';

const KEY_STORAGE = 'symptomnavi.apiKey';
const MODEL_STORAGE = 'symptomnavi.model';
// 既定モデル。設定画面から変更可能（より高性能なモデルIDを入力してもよい）。
const DEFAULT_MODEL = 'claude-sonnet-5';

export const getApiKey = () => localStorage.getItem(KEY_STORAGE) || '';
export const setApiKey = (k) => localStorage.setItem(KEY_STORAGE, (k || '').trim());
export const getModel = () => localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL;
export const setModel = (m) => localStorage.setItem(MODEL_STORAGE, (m || '').trim() || DEFAULT_MODEL);
export const hasApiKey = () => !!getApiKey();

const LANG_NAME = { ja: 'Japanese', en: 'English' };

function makeClient() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

// 構造化出力（JSON Schema）で1回のリクエストを実行し、パース結果を返す
async function callJson(system, userText, schema, maxTokens = 4000) {
  const client = makeClient();
  const resp = await client.messages.create({
    model: getModel(),
    max_tokens: maxTokens,
    system,
    output_config: { format: { type: 'json_schema', schema } },
    messages: [{ role: 'user', content: userText }],
  });
  const block = resp.content.find((b) => b.type === 'text');
  if (!block) throw new Error('EMPTY_RESPONSE');
  return JSON.parse(block.text);
}

const bilingual = () => ({
  type: 'object',
  additionalProperties: false,
  properties: { ja: { type: 'string' }, user: { type: 'string' } },
  required: ['ja', 'user'],
});

/**
 * 症状文から問診票（日本語＋利用者言語）を自動生成する。
 */
export async function generateIntakeForm(symptomText, lang, extra = '') {
  const target = LANG_NAME[lang] || 'Japanese';
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      chief_complaint: bilingual(),
      recommended_department_ja: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            label_ja: { type: 'string' },
            label_user: { type: 'string' },
            answer_ja: { type: 'string' },
            answer_user: { type: 'string' },
            known: { type: 'boolean' },
          },
          required: ['label_ja', 'label_user', 'answer_ja', 'answer_user', 'known'],
        },
      },
      follow_up_questions: { type: 'array', items: bilingual() },
    },
    required: ['chief_complaint', 'recommended_department_ja', 'items', 'follow_up_questions'],
  };

  const system = `You are a medical intake assistant for a proof-of-concept app that helps foreign residents in Japan communicate with clinics. From the patient's free-text symptom description, produce a Japanese medical intake sheet (問診票) that clinic reception can read, with every field also translated into the patient's language (${target}).

Rules:
- "ja" fields must be written in Japanese; "user" fields in ${target}.
- Fill the standard 問診票 fields as "items", in this order: 主訴 / いつから / どこが / どんな症状か / 程度（10段階の目安）/ きっかけ・悪化/軽快する要因 / 随伴症状 / 既往歴 / 服用中の薬 / アレルギー / 妊娠の可能性（該当する場合）/ 喫煙・飲酒.
- If the information is present in the description, set known=true and fill the answer. If it is unknown, set known=false and answer to "（未記入）" (ja) / "(not provided)" (user).
- Put the most important unknown items into follow_up_questions so the patient can complete the sheet.
- recommended_department_ja: the single most appropriate Japanese 診療科 name.
- Do NOT invent facts the patient did not state. This is not a diagnosis.`;

  const user = `Patient's symptom description:\n${symptomText}\n\nAdditional info provided by the patient:\n${extra || '(none)'}`;
  return callJson(system, user, schema, 4000);
}

/**
 * 予約『準備』キット（電話スクリプト・予約メール文面・持ち物）を生成する。
 */
export async function generateBookingKit(symptomText, lang, departmentJa, clinicName = '') {
  const target = LANG_NAME[lang] || 'Japanese';
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      phone_script_ja: { type: 'string' },
      phone_script_user: { type: 'string' },
      email_ja: { type: 'string' },
      email_user: { type: 'string' },
      bring_items: { type: 'array', items: bilingual() },
    },
    required: ['phone_script_ja', 'phone_script_user', 'email_ja', 'email_user', 'bring_items'],
  };

  const system = `You help a foreign resident in Japan prepare (not perform) a medical appointment booking. Produce Japanese text the patient can read aloud on the phone or send via email/web form to a clinic, plus a faithful ${target} translation.

- phone_script_ja: a short, polite, speakable Japanese phone script to request a reservation. Include: greeting, that they would like to book an appointment, the department (${departmentJa}), a one-line symptom summary, a request for the earliest availability, and a note that they are a foreign resident whose Japanese may be limited.
- email_ja: a polite Japanese reservation-request message suitable for email or a web form.
- phone_script_user / email_user: faithful ${target} translations.
- bring_items: things to bring to the clinic (健康保険証, 在留カードや身分証, お薬手帳 など), each with ja + ${target}.
- Do NOT invent clinic-specific details such as phone numbers or opening hours. This is preparation help only, not an actual booking.`;

  const user = `Recommended department: ${departmentJa}\nClinic name (optional): ${clinicName || '(unspecified)'}\nSymptoms: ${symptomText}`;
  return callJson(system, user, schema, 3000);
}

// エラーを利用者向けメッセージキーに変換
export function classifyError(err) {
  const msg = String(err?.message || err || '');
  if (msg.includes('NO_API_KEY')) return 'noKey';
  if (err?.status === 401 || msg.includes('401') || /authentication/i.test(msg)) return 'auth';
  if (err?.status === 429 || msg.includes('429')) return 'rate';
  if (/JSON|parse/i.test(msg)) return 'parse';
  return 'generic';
}
