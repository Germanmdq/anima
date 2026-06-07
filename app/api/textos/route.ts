import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("study_materials")
      .select("slug, source_filename, title_es, original_title, year, tags")
      .eq("language", "es")
      .eq("is_published", true)
      .order("slug");

    if (error) throw error;

    const metadatos = (data || []).map((m: any) => ({
      filename: m.source_filename || m.slug + ".md",
      titulo: m.title_es || m.slug,
      tituloOriginal: m.original_title || "",
      anio: m.year || "Sin año",
      tags: m.tags || [],
    }));

    return NextResponse.json(metadatos);
  } catch (error) {
    console.error("Error en GET /api/textos:", error);
    return NextResponse.json(
      { error: "Error al cargar la lista de textos." },
      { status: 500 }
    );
  }
}
