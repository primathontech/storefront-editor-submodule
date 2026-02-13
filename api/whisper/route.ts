import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY environment variable" },
        { status: 500 }
      );
    }

    const upstreamForm = new FormData();
    upstreamForm.append("file", file, "voice.webm");
    upstreamForm.append("model", "whisper-1");
    // Force transcription language to English to keep behavior predictable
    upstreamForm.append("language", "en");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: upstreamForm,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Whisper error:", errorText);
      return NextResponse.json(
        { error: "Failed to transcribe audio" },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text ?? "" });
  } catch (error) {
    console.error("Unexpected error in /editor/api/whisper:", error);
    return NextResponse.json(
      { error: "Unexpected error while transcribing audio" },
      { status: 500 }
    );
  }
}
