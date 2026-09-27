import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/apiAuth";

export const runtime = "nodejs";

/**
 * Mints an ephemeral session token for OpenAI Realtime API.
 * The client connects directly to OpenAI WebRTC with this short-lived token,
 * keeping the primary OPENAI_API_KEY secure on the server.
 */
export async function POST(req: Request) {
  const auth = await requireApiUser(req);
  if (auth.response) return auth.response;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        voice: "verse",
        modalities: ["audio", "text"],
        instructions: "You are an ambient clinical scribe assistant. Accurately transcribe medical speech.",
        input_audio_transcription: {
          model: "whisper-1",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Realtime API] Failed to create session:", response.status, errorText);
      return NextResponse.json(
        { error: `OpenAI Realtime session error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Realtime API] Internal error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to initiate Realtime session" },
      { status: 500 }
    );
  }
}
