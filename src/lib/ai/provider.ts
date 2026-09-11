export type ChatTurn = { role: "system" | "user" | "assistant"; content: string | ContentPart[] };
export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "input_audio"; input_audio: { data: string } };

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function config() {
  const apiKey = env("AI_LLM_API_KEY") || env("DASHSCOPE_API_KEY") || env("AI_ASR_API_KEY");
  const baseUrl = (
    env("AI_LLM_BASE_URL") ||
    env("DASHSCOPE_BASE_URL") ||
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
  ).replace(/\/$/, "");
  const chatModel = env("AI_LLM_MODEL") || env("DASHSCOPE_LLM_MODEL_FLASH") || env("DASHSCOPE_LLM_MODEL") || "qwen3.6-flash";
  const asrKey = env("AI_ASR_API_KEY") || apiKey;
  const asrBase = (env("AI_ASR_BASE_URL") || baseUrl).replace(/\/$/, "");
  const asrModel = env("AI_ASR_MODEL") || env("DASHSCOPE_ASR_MODEL") || "qwen3-asr-flash";
  return { apiKey, baseUrl, chatModel, asrKey, asrBase, asrModel };
}

export function llmConfigured() {
  return Boolean(config().apiKey && config().baseUrl);
}

export function asrConfigured() {
  const c = config();
  return Boolean(c.asrKey && c.asrBase);
}

type CompResp = {
  choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
  error?: { message?: string };
};

function extractText(data: CompResp) {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.map((c) => c.text ?? "").join("").trim();
  return "";
}

async function complete(input: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatTurn[];
  extra?: Record<string, unknown>;
}) {
  const res = await fetch(`${input.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${input.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      temperature: 0.2,
      stream: false,
      enable_thinking: false,
      ...input.extra,
    }),
  });
  const data = (await res.json()) as CompResp;
  if (!res.ok) throw new Error(data.error?.message ?? `AI HTTP ${res.status}`);
  const text = extractText(data);
  if (!text) throw new Error("Empty model response");
  return text;
}

export async function chatComplete(input: { messages: ChatTurn[]; model?: string; extra?: Record<string, unknown> }) {
  const c = config();
  if (!c.apiKey) throw new Error("LLM not configured");
  return complete({
    baseUrl: c.baseUrl,
    apiKey: c.apiKey,
    model: input.model || c.chatModel,
    messages: input.messages,
    extra: input.extra,
  });
}

export async function transcribeAudio(audioDataUrl: string, language?: string) {
  const c = config();
  if (!c.asrKey) throw new Error("ASR not configured");
  const asrOptions: Record<string, unknown> = { enable_itn: true };
  if (language) asrOptions.language = language;
  return complete({
    baseUrl: c.asrBase,
    apiKey: c.asrKey,
    model: c.asrModel,
    messages: [{ role: "user", content: [{ type: "input_audio", input_audio: { data: audioDataUrl } }] }],
    extra: { asr_options: asrOptions },
  });
}

export function parseJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence?.[1]?.trim() ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
