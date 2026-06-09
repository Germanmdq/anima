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
    .from("assessments")
    .select("id, title_es, score, max_score, completed_at, created_at")
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
    .from("assessments")
    .insert({
      user_id: userId,
      title_es: body.title_es || "Examen",
      locale: "es",
      material_id: body.material_id || null,
      questions: body.questions || [],
      score: body.score || 0,
      max_score: body.max_score || 0,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
