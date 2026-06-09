import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId, missingUserResponse } from "@/lib/current-user";
import { requireAccessToken } from "@/lib/auth-guard";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAccessToken(request);
  if (denied) return denied;

  let userId: string;
  try { userId = getCurrentUserId(); } catch { return missingUserResponse(); }

  const { data } = await supabase
    .from("book_projects")
    .select("id, title_es, topic_es, status, content_markdown_es, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const denied = requireAccessToken(request);
  if (denied) return denied;

  let userId: string;
  try { userId = getCurrentUserId(); } catch { return missingUserResponse(); }

  const body = await request.json();

  const { data, error } = await supabase
    .from("book_projects")
    .insert({
      user_id: userId,
      title_es: body.title_es || "Libro de Luz",
      topic_es: body.topic_es || "",
      locale: "es",
      status: "completed",
      content_markdown_es: body.content_markdown || "",
      source_material_ids: body.source_material_ids || [],
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
