import { NextRequest, NextResponse } from "next/server";
import { chatComplete, llmConfigured, parseJsonObject } from "@/lib/ai/provider";
import { mockExtract } from "@/lib/vision/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { image?: string; kind?: "scam" | "transaction"; hint?: string };
  const kind = body.kind === "transaction" ? "transaction" : "scam";
  const mock = mockExtract(body.hint ?? body.image ?? "", kind);
  if (!llmConfigured() || !body.image?.startsWith("data:image/")) {
    return NextResponse.json({ extracted: mock, fallback: true });
  }
  try {
    const raw = await chatComplete({
      messages: [
        {
          role: "system",
          content:
            'Extract fields from this demo banking screenshot. JSON only: {"sender":"","message":"","url":"","date":"","merchant":"","amount":"","reference":"","type":""}',
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Kind: ${kind}` },
            { type: "image_url", image_url: { url: body.image } },
          ],
        },
      ],
    });
    const obj = parseJsonObject(raw) ?? {};
    const extracted = { ...mock };
    for (const [k, v] of Object.entries(obj)) if (typeof v === "string" && v) extracted[k] = v;
    return NextResponse.json({ extracted });
  } catch {
    return NextResponse.json({ extracted: mock, fallback: true });
  }
}
