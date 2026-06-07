import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const USER_ID = "b938b4c3-e0a1-4333-b684-91d99bad7108";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const { data: artifacts } = await supabase
      .from("content_artifacts")
      .select("title, body, created_at, data")
      .eq("source_table", "chat_sessions")
      .eq("source_id", id)
      .eq("artifact_type", "chat_message")
      .order("created_at");

    return NextResponse.json({ session: data, messages: artifacts || [] });
  }

  const { data } = await supabase
    .from("chat_sessions")
    .select("id, title, agent, created_at, updated_at, metadata")
    .eq("user_id", USER_ID)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (data) {
    const agentReverse: Record<string, string> = {
      instructor: "profesor",
      narrator: "cuentacuentos",
    };
    for (const s of data) {
      s.agent = agentReverse[s.agent] || s.agent;
    }
  }

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const agentMap: Record<string, string> = {
    profesor: "instructor",
    cuentacuentos: "narrator",
  };
  const agent = agentMap[body.agent] || body.agent || "instructor";

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: USER_ID,
      title: body.title || "Nueva conversación",
      agent,
      locale: "es",
      metadata: body.metadata || {},
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
