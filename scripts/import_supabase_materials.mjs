import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bibliotecaDir = process.env.BIBLIOTECA_DIR || path.join(root, "biblioteca");
const supabaseUrl = process.env.SUPABASE_URL || "https://qitwckfwmgnmnmtjhfnf.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const batchSize = Number.parseInt(process.env.BATCH_SIZE || "8", 10);
const chunkWords = Number.parseInt(process.env.CHUNK_WORDS || "850", 10);
const overlapWords = Number.parseInt(process.env.OVERLAP_WORDS || "80", 10);

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY. Add it to the command environment and run again.");
  process.exit(1);
}

function parseMarkdown(raw, filename) {
  const lines = raw.split("\n");
  const heading = lines[0]?.match(/^#\s+(.+)/);
  const title = heading
    ? heading[1].trim()
    : filename.replace(/\.md$/, "").replace(/^\d{3}-/, "").replace(/-/g, " ");

  let originalTitle = "";
  let year = "";
  for (const line of lines.slice(1, 8)) {
    const originalMatch = line.match(/\*\*Original:\*\*\s*(.+?)(?:\s*\||$)/);
    const yearMatch = line.match(/\*\*Año:\*\*\s*(\S+)/);
    if (originalMatch) originalTitle = originalMatch[1].trim();
    if (yearMatch) year = yearMatch[1].trim();
  }

  let contentStart = 1;
  for (let index = 1; index < Math.min(lines.length, 12); index += 1) {
    if (lines[index]?.trim() === "---") {
      contentStart = index + 1;
      break;
    }
  }

  const content = lines.slice(contentStart).join("\n").trim();
  const summary = content.replace(/\s+/g, " ").slice(0, 360).trim();

  return {
    slug: filename.replace(/\.md$/, ""),
    source_filename: filename,
    title_es: title,
    title_en: null,
    original_title: originalTitle || null,
    year: year || null,
    volume: null,
    material_type: "lecture",
    language: "es",
    summary_es: summary || null,
    summary_en: null,
    content_es: content,
    content_en: null,
    topics: ["Neville Goddard"],
    tags: ["Ley de Asuncion", "Imaginacion", "Conciencia"],
    difficulty: "foundational",
    access_level: "member",
    is_published: true,
  };
}

function makeChunks(material) {
  const words = material.content_es.split(/\s+/).filter(Boolean);
  const slices = [];

  if (words.length <= chunkWords) {
    slices.push(words.join(" "));
  } else {
    const step = Math.max(1, chunkWords - overlapWords);
    for (let start = 0; start < words.length; start += step) {
      slices.push(words.slice(start, start + chunkWords).join(" "));
      if (start + chunkWords >= words.length) break;
    }
  }

  return slices.map((content, index) => ({
    chunk_index: index,
    heading: material.title_es,
    content,
    language: "es",
    token_count: content.split(/\s+/).filter(Boolean).length,
    metadata: {
      slug: material.slug,
      filename: material.source_filename,
      title_es: material.title_es,
      original_title: material.original_title,
      year: material.year,
    },
  }));
}

async function supabaseFetch(pathname, options = {}) {
  const response = await fetch(`${supabaseUrl}${pathname}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${options.method || "GET"} ${pathname} failed ${response.status}: ${text}`);
  }

  const text = await response.text();
  if (!text.trim()) return null;
  return JSON.parse(text);
}

function batch(items, size) {
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

const filenames = fs
  .readdirSync(bibliotecaDir)
  .filter((file) => file.endsWith(".md") && file !== "INDICE.md")
  .sort();

const materials = filenames.map((filename) => {
  const raw = fs.readFileSync(path.join(bibliotecaDir, filename), "utf8");
  return parseMarkdown(raw, filename);
});

let importedMaterials = 0;
let importedChunks = 0;

for (const group of batch(materials, batchSize)) {
  const returnedMaterials = await supabaseFetch(
    "/rest/v1/study_materials?on_conflict=slug",
    {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: JSON.stringify(group),
    }
  );

  const idsBySlug = new Map(returnedMaterials.map((material) => [material.slug, material.id]));
  const chunkRows = group.flatMap((material) => {
    const materialId = idsBySlug.get(material.slug);
    return makeChunks(material).map((chunk) => ({ ...chunk, material_id: materialId }));
  });

  for (const chunkGroup of batch(chunkRows, Math.max(20, batchSize * 8))) {
    await supabaseFetch(
      "/rest/v1/material_chunks?on_conflict=material_id,chunk_index,language",
      {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=minimal",
        body: JSON.stringify(chunkGroup),
      }
    );
  }

  importedMaterials += group.length;
  importedChunks += chunkRows.length;
  console.log(`Imported ${importedMaterials}/${materials.length} materials, ${importedChunks} chunks`);
}

console.log(JSON.stringify({ materials: importedMaterials, chunks: importedChunks }, null, 2));
