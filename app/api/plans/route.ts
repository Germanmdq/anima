import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const { data } = await supabase
    .from("guided_plans")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("guided_plans")
    .insert({
      slug: body.slug || `plan-${Date.now()}`,
      title_es: body.title_es || "Plan personalizado",
      description_es: body.description_es || "",
      duration_days: body.duration_days || 7,
      level: body.level || "intro",
      language: "es",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
