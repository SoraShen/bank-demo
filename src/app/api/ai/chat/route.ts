import { NextRequest, NextResponse } from "next/server";
import { chatComplete, llmConfigured, parseJsonObject } from "@/lib/ai/provider";
import { classifyIntent } from "@/lib/journey/intents";
import { knowledgeProvider } from "@/lib/rag/retrieve";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({ ok: llmConfigured(), fallback: !llmConfigured() });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { message?: string };
  const message = body.message?.trim() ?? "";
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }
  const intent = classifyIntent(message);
  const arts = knowledgeProvider.search(message);
  if (!llmConfigured()) {
    return NextResponse.json({ fallback: true, intent, sources: arts.map((a) => a.id) });
  }
  try {
    const raw = await chatComplete({
      messages: [
        {
          role: "system",
          content: `You are the Standard Bank AI Banking Assistant in a Huawei Cloud demo. Never claim a live Standard Bank core integration. Use only this official public knowledge. Reply JSON: {"intent":"SCAM_DETECTION|LOST_CARD|STOLEN_CARD|CARD_ONLINE_PURCHASE|CARD_PIN|CARD_OVERSEAS|CARD_GENERAL|UNKNOWN_TRANSACTION|GENERAL_FAQ|SECURITY_FAQ","confidence":0.9,"reply":"short customer reply or empty if the local journey should speak","next_action":"NONE|REQUEST_IMAGE|APP_HANDOFF"}
Knowledge:
${arts.map((a) => `${a.id}: ${a.content}`).join("\n")}`,
        },
        { role: "user", content: message },
      ],
    });
    const obj = parseJsonObject(raw);
    return NextResponse.json({
      intent: typeof obj?.intent === "string" ? obj.intent : intent,
      reply: typeof obj?.reply === "string" ? obj.reply : "",
      next_action: obj?.next_action ?? "NONE",
      confidence: obj?.confidence ?? 0.7,
    });
  } catch {
    return NextResponse.json({ fallback: true, intent }, { status: 200 });
  }
}
