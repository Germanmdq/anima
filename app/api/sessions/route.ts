import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId, missingUserResponse } from "@/lib/current-user";
import { requireAccessToken } from "@/lib/auth-guard";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAccessToken(request);
  if (denied) return denied;

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

  let userId: string;
  try { userId = getCurrentUserId(); } catch { return missingUserResponse(); }

  const { data } = await supabase
    .from("chat_sessions")
    .select("id, title, agent, created_at, updated_at, metadata")
    .eq("user_id", userId)
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
  const denied = requireAccessToken(request);
  if (denied) return denied;

  let userId: string;
  try { userId = getCurrentUserId(); } catch { return missingUserResponse(); }

  const body = await request.json();

  const agentMap: Record<string, string> = {
    profesor: "instructor",
    cuentacuentos: "narrator",
  };
  const agent = agentMap[body.agent] || body.agent || "instructor";

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
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
