import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const USER_ID = "b938b4c3-e0a1-4333-b684-91d99bad7108";

export async function GET() {
  const { data } = await supabase
    .from("assessments")
    .select("id, title_es, score, max_score, completed_at, created_at")
    .eq("user_id", USER_ID)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      user_id: USER_ID,
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
