import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { buscarTextos } from "@/lib/biblioteca";
import { buildTestimonialExtractionPrompt } from "@/lib/prompts";

const CATEGORY_EXPANSIONS: Record<string, string[]> = {
  dinero: ["Dinero", "Deseo", "Conciencia", "Fe", "Asunción", "provisión", "recibió", "trabajo", "ascenso", "deuda", "recursos"],
  relación: ["Relaciones", "Amor", "Perdón", "Revisión", "Matrimonio", "Familia"],
  relacion: ["Relaciones", "Amor", "Perdón", "Revisión", "Matrimonio", "Familia"],
  cuerpo: ["Salud", "Cuerpo", "Fe", "Revisión", "Imaginación"],
};

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function buildExpandedTerms(query: string, tag?: string) {
  const terms = new Set<string>();
  const rawParts = [query, tag].filter(Boolean) as string[];

  rawParts.forEach((part) => {
    part
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        terms.add(item);
        const normalized = normalizeQuery(item);
        Object.entries(CATEGORY_EXPANSIONS).forEach(([key, expansions]) => {
          if (normalized.includes(key)) {
            expansions.forEach((expansion) => terms.add(expansion));
          }
        });
      });
  });

  return Array.from(terms);
}

function getMatchedTerms(item: any, terms: string[]) {
  const haystack = [
    item.title,
    item.subtitle,
    item.body,
    item.data?.source_title,
    ...(item.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return terms.filter((term) => haystack.includes(normalizeQuery(term)));
}

async function searchArtifacts(query: string, tag?: string) {
  const terms = buildExpandedTerms(query, tag);
  const selectClause = `
    id,
    title,
    subtitle,
    body,
    tags,
    source_material_id,
    data,
    created_at
  `;

  const request = supabase
    .from("content_artifacts")
    .select(selectClause)
    .eq("status", "published")
    .eq("data->>artifact_subtype", "testimonial")
    .order("created_at", { ascending: false })
    .limit(terms.length > 0 ? 1000 : 20);

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  const filtered = (data || [])
    .map((item: any) => ({
      item,
      matchedTerms: getMatchedTerms(item, terms),
    }))
    .filter(({ matchedTerms }: any) => terms.length === 0 || matchedTerms.length > 0)
    .sort((a: any, b: any) => b.matchedTerms.length - a.matchedTerms.length);

  return filtered.slice(0, terms.length > 0 ? 10 : 20).map(({ item, matchedTerms }: any) => ({
    id: item.id,
    title: item.title || "Sin título",
    subtitle: item.subtitle || "",
    body: item.body || "",
    tags: item.tags || [],
    source_title: item.data?.source_title || "",
    source_year: item.data?.source_year || "",
    source_type: item.data?.source_type || "",
    source_material_id: item.source_material_id || null,
    match_reason: matchedTerms.length > 0
      ? `Relacionado por coincidencias en: ${matchedTerms.slice(0, 6).join(", ")}.`
      : "",
  }));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const tag = typeof body.tag === "string" ? body.tag.trim() : "";

    if (!query && !tag) {
      return NextResponse.json({ error: "Falta la consulta" }, { status: 400 });
    }

    const searchQuery = query || tag;
    const artifactResults = await searchArtifacts(searchQuery, tag);

    if (artifactResults.length > 0) {
      return NextResponse.json({ results: artifactResults, searchedWith: "content_artifacts" });
    }

    const ragQuery = buildExpandedTerms(searchQuery, tag).join(" ");
    const chunks = await buscarTextos(ragQuery || searchQuery, 10);

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ results: [], searchedWith: "rag" });
    }

    const promptContext = chunks
      .map((chunk, index) => `--- FRAGMENTO ${index + 1} [${chunk.titulo}] ---\n${chunk.contenido}`)
      .join("\n\n");

    const userPrompt = buildTestimonialExtractionPrompt(searchQuery, promptContext);

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.3-70b-instruct",
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API error: ${response.status}`);
    }

    const data = await response.json();
    const llmResult = data.choices?.[0]?.message?.content?.trim() || "[]";

    try {
      const cleanJson = llmResult.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return NextResponse.json({ results: [], searchedWith: "rag_llm" });
      }

      const results = parsed.map((item: any, index: number) => ({
        id: `rag-llm-${index}`,
        title: item.title || "Caso sin título",
        subtitle: item.subtitle || "",
        body: item.body || "",
        source_title: item.source_title || "",
        source_year: item.source_year || "",
        source_type: item.source_type || "",
        tags: Array.isArray(item.tags) ? item.tags : [],
        source_material_id: null,
      }));

      return NextResponse.json({ results, searchedWith: "rag_llm" });
    } catch (error) {
      console.error("Error parsing Llama JSON for testimonios", error, "Raw:", llmResult);
      return NextResponse.json({ results: [], searchedWith: "rag_llm" });
    }
  } catch (error: any) {
    console.error("Error en testimonios/search:", error);
    return NextResponse.json({ error: "Error procesando búsqueda" }, { status: 500 });
  }
}
