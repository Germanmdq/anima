import { NextRequest, NextResponse } from "next/server";
import { buildPersonalBookDraftPrompt } from "@/lib/prompts";
import { requireAccessToken } from "@/lib/auth-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const denied = requireAccessToken(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const theme = String(body.theme || "").trim();
    const include = String(body.include || "").trim();
    const tone = String(body.tone || "").trim();

    if (!title || !theme || !include || !tone) {
      return NextResponse.json(
        { error: "Completá título, tema central, material a incluir y tono." },
        { status: 400 }
      );
    }

    if (!process.env.NVIDIA_API_KEY) {
      return NextResponse.json(
        { error: "NVIDIA_API_KEY no configurada." },
        { status: 500 }
      );
    }

    const prompt = buildPersonalBookDraftPrompt({ title, theme, include, tone });
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.3-70b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.25,
        top_p: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`NVIDIA API error: ${response.status} ${details}`);
    }

    const data = await response.json();
    const draft = data.choices?.[0]?.message?.content?.trim() || "";

    if (!draft) {
      return NextResponse.json(
        { error: "No se pudo generar el borrador." },
        { status: 500 }
      );
    }

    return NextResponse.json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno.";
    console.error("Error en /api/libro:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
