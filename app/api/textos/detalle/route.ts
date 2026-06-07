import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "El parámetro 'file' es obligatorio." },
        { status: 400 }
      );
    }

    const slug = file.replace(/\.md$/, "");

    const { data, error } = await supabase
      .from("study_materials")
      .select("content_es, title_es, original_title, year")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      const { data: fallback } = await supabase
        .from("material_chunks")
        .select("content, heading, metadata, chunk_index")
        .eq("language", "es")
        .filter("metadata->>slug", "eq", slug)
        .order("chunk_index");

      if (fallback && fallback.length > 0) {
        const contenido = fallback
          .map((c: any) => c.content)
          .join("\n\n");
        return NextResponse.json({ content: contenido });
      }

      return NextResponse.json(
        { error: "El texto solicitado no existe." },
        { status: 404 }
      );
    }

    const markdown = `# ${data.title_es || slug}

${data.original_title ? `**Original:** ${data.original_title} | **Año:** ${data.year || "Sin año"}` : ""}

---

${data.content_es || ""}`;

    return NextResponse.json({ content: markdown });
  } catch (error) {
    console.error("Error en GET /api/textos/detalle:", error);
    return NextResponse.json(
      { error: "Error al leer el detalle del texto." },
      { status: 500 }
    );
  }
}
