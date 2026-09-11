import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { audioDataUrl?: string };
    const url = body.audioDataUrl ?? "";
    if (!url.startsWith("data:audio/") || url.length < 32) {
      return NextResponse.json({ error: "Invalid audio" }, { status: 400 });
    }
    const text = await transcribeAudio(url);
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed", fallback: true },
      { status: 502 },
    );
  }
}
