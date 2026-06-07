import { supabase } from "./supabase";

export interface Texto {
  filename: string;
  titulo: string;
  tituloOriginal: string;
  anio: string;
  contenido: string;
}

export interface ChunkResult {
  id: string;
  material_id: string;
  chunk_index: number;
  heading: string;
  content: string;
  language: string;
  token_count: number;
  metadata: {
    slug: string;
    filename: string;
    title_es: string;
    original_title: string;
    year: string;
  };
  similarity?: number;
}

const API_KEY = process.env.GEMINI_API_KEY;

async function embedQuery(text: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: 1536,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Embedding API error ${response.status}: ${errText}`);
  }

  const json = await response.json();
  return json.embedding.values;
}

export async function buscarTextos(
  query: string,
  limit: number = 8
): Promise<Texto[]> {
  try {
    const embedding = await embedQuery(query);

    const { data, error } = await supabase.rpc("search_material_chunks", {
      query_embedding: embedding,
      match_count: limit,
      match_language: "es",
      query_text: query,
    });

    if (error) {
      console.error("Supabase search error:", error);

      const { data: fallback, error: fbError } = await supabase
        .from("material_chunks")
        .select("id, material_id, chunk_index, heading, content, language, token_count, metadata")
        .eq("language", "es")
        .textSearch("search_vector", query, { config: "spanish" })
        .limit(limit);

      if (fbError || !fallback?.length) {
        const { data: recent } = await supabase
          .from("material_chunks")
          .select("id, material_id, chunk_index, heading, content, language, token_count, metadata")
          .eq("language", "es")
          .limit(limit);

        return (recent || []).map(toTexto);
      }

      return (fallback || []).map(toTexto);
    }

    const results = (data as ChunkResult[]) || [];
    if (results.length === 0) {
      const { data: recent } = await supabase
        .from("material_chunks")
        .select("id, material_id, chunk_index, heading, content, language, token_count, metadata")
        .eq("language", "es")
        .limit(limit);

      return (recent || []).map(toTexto);
    }

    return results.map(toTexto);
  } catch (err) {
    console.error("Error en buscarTextos (fallback a textSearch):", err);
    const { data: fallback, error: fbError } = await supabase
      .from("material_chunks")
      .select("id, material_id, chunk_index, heading, content, language, token_count, metadata")
      .eq("language", "es")
      .textSearch("search_vector", query, { config: "spanish" })
      .limit(limit);

    if (fbError || !fallback?.length) {
      const { data: recent } = await supabase
        .from("material_chunks")
        .select("id, material_id, chunk_index, heading, content, language, token_count, metadata")
        .eq("language", "es")
        .limit(limit);
      return (recent || []).map(toTexto);
    }

    return (fallback || []).map(toTexto);
  }
}

function toTexto(chunk: ChunkResult): Texto {
  const meta = chunk.metadata || {};
  return {
    filename: meta.filename || "",
    titulo: chunk.heading || meta.title_es || "",
    tituloOriginal: meta.original_title || "",
    anio: meta.year || "",
    contenido: chunk.content || "",
  };
}

export async function cargarBiblioteca(): Promise<Texto[]> {
  const { data, error } = await supabase
    .from("study_materials")
    .select("slug, source_filename, title_es, original_title, year")
    .eq("language", "es")
    .order("slug")
    .limit(1000);

  if (error || !data) return [];

  return data.map((m: any) => ({
    filename: m.source_filename || m.slug + ".md",
    titulo: m.title_es || "",
    tituloOriginal: m.original_title || "",
    anio: m.year || "",
    contenido: "",
  }));
}

export async function cargarTextoDetalle(filename: string): Promise<string | null> {
  const slug = filename.replace(/\.md$/, "");

  const { data, error } = await supabase
    .from("study_materials")
    .select("content_es")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data.content_es;
}

export function construirContexto(textos: Texto[]): string {
  if (textos.length === 0) {
    return "No se encontraron textos relevantes en la biblioteca.";
  }

  const bloques = textos.map((t, i) => {
    const meta: string[] = [];
    if (t.tituloOriginal) meta.push(`Original: ${t.tituloOriginal}`);
    if (t.anio && t.anio !== "Sin año") meta.push(`Año: ${t.anio}`);

    return [
      `══ TEXTO ${i + 1}: ${t.titulo} ══`,
      meta.length > 0 ? `[${meta.join(" | ")}]` : "",
      "",
      t.contenido,
      "",
    ]
      .filter(Boolean)
      .join("\n");
  });

  return bloques.join("\n\n");
}
