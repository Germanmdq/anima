import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const SUGGESTED_SYMBOLS = [
  "Cristo",
  "Yo Soy",
  "Moisés",
  "Josué",
  "David",
  "Jacob",
  "Esaú",
  "Judas",
  "Egipto",
  "Jerusalén",
  "Promesa",
  "Resurrección",
  "Sábado",
  "Padre",
  "Hijo",
  "Reino",
  "Éxodo",
  "Pablo",
  "Job",
];

const BIBLE_TAGS = ["La Biblia", "Cristo", "Yo Soy", "Dios"];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildTerms(query: string) {
  return Array.from(
    new Set(
      [query, ...SUGGESTED_SYMBOLS.filter((symbol) => normalize(query).includes(normalize(symbol)))]
        .map((term) => term.trim())
        .filter(Boolean)
    )
  );
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

  return terms.filter((term) => haystack.includes(normalize(term)));
}

function hasBibleTag(item: any) {
  return BIBLE_TAGS.some((tag) => (item.tags || []).includes(tag));
}

function buildPracticalApplication(item: any) {
  const firstSentence = String(item.body || "")
    .split(/(?<=[.!?])\s+/)
    .find((sentence) => sentence.trim().length > 20);

  if (!firstSentence) {
    return "";
  }

  return `Aplicación práctica: observar dónde este símbolo aparece como estado interior y revisar la experiencia desde esta idea: ${firstSentence.trim()}`;
}

async function fetchBiblicalArtifacts() {
  const pageSize = 1000;
  const allRows: any[] = [];

  for (let from = 0; from < 4000; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("content_artifacts")
      .select("id,title,subtitle,body,tags,source_material_id,data,created_at")
      .eq("status", "published")
      .in("data->>artifact_subtype", ["explanation", "definition", "quote", "character"])
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    allRows.push(...(data || []));

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return allRows;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";

    if (!query) {
      return NextResponse.json({ error: "Falta la consulta" }, { status: 400 });
    }

    const terms = buildTerms(query);

    const data = await fetchBiblicalArtifacts();

    const results = (data || [])
      .map((item: any) => ({
        item,
        matchedTerms: getMatchedTerms(item, terms),
        bibleTagged: hasBibleTag(item),
      }))
      .filter(({ matchedTerms, bibleTagged }: any) => matchedTerms.length > 0 || bibleTagged)
      .sort((a: any, b: any) => {
        if (b.matchedTerms.length !== a.matchedTerms.length) {
          return b.matchedTerms.length - a.matchedTerms.length;
        }
        return Number(b.bibleTagged) - Number(a.bibleTagged);
      })
      .slice(0, 20)
      .map(({ item }: any) => ({
        id: item.id,
        subtype: item.data?.artifact_subtype || "",
        title: item.title || "Sin título",
        subtitle: item.subtitle || "",
        body: item.body || "",
        tags: item.tags || [],
        source_title: item.data?.source_title || "",
        source_year: item.data?.source_year || "",
        source_type: item.data?.source_type || "",
        source_material_id: item.source_material_id || null,
        practical_application: buildPracticalApplication(item),
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error en biblia/search:", error);
    return NextResponse.json({ error: "Error procesando búsqueda" }, { status: 500 });
  }
}
