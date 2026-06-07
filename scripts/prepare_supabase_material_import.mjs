import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bibliotecaDir = path.join(root, "biblioteca");
const outDir = process.env.OUT_DIR || path.join("/tmp", "anima-supabase-import");

const BATCH_SIZE = Number.parseInt(process.env.BATCH_SIZE || "20", 10);
const CHUNK_WORDS = Number.parseInt(process.env.CHUNK_WORDS || "850", 10);
const OVERLAP_WORDS = Number.parseInt(process.env.OVERLAP_WORDS || "80", 10);

function parseMarkdown(raw, filename) {
  const lines = raw.split("\n");
  const heading = lines[0]?.match(/^#\s+(.+)/);
  const fallbackTitle = filename.replace(/\.md$/, "").replace(/^\d{3}-/, "").replace(/-/g, " ");
  const title = heading ? heading[1].trim() : fallbackTitle;

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
  const summary = content
    .replace(/\s+/g, " ")
    .slice(0, 360)
    .trim();

  return {
    filename,
    slug: filename.replace(/\.md$/, ""),
    title,
    originalTitle,
    year,
    content,
    summary,
  };
}

function chunkContent(content) {
  const words = content.split(/\s+/).filter(Boolean);
  if (words.length <= CHUNK_WORDS) return [content];

  const chunks = [];
  const step = Math.max(1, CHUNK_WORDS - OVERLAP_WORDS);
  for (let start = 0; start < words.length; start += step) {
    chunks.push(words.slice(start, start + CHUNK_WORDS).join(" "));
    if (start + CHUNK_WORDS >= words.length) break;
  }
  return chunks;
}

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function jsonSql(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function arraySql(values) {
  if (!values.length) return "array[]::text[]";
  return `array[${values.map(sqlString).join(", ")}]::text[]`;
}

function materialInsertSql(items) {
  const values = items.map((item) => `(
    ${sqlString(item.slug)},
    ${sqlString(item.filename)},
    ${sqlString(item.title)},
    ${sqlString(item.originalTitle)},
    ${sqlString(item.year || null)},
    'lecture',
    'es',
    ${sqlString(item.summary)},
    ${sqlString(item.content)},
    ${arraySql(["Neville Goddard"])},
    ${arraySql(["Ley de Asuncion", "Imaginacion", "Conciencia"])},
    'foundational',
    'member',
    true,
    to_tsvector('spanish', unaccent(${sqlString(`${item.title} ${item.originalTitle} ${item.content}`)}))
  )`);

  return `
insert into public.study_materials (
  slug,
  source_filename,
  title_es,
  original_title,
  year,
  material_type,
  language,
  summary_es,
  content_es,
  topics,
  tags,
  difficulty,
  access_level,
  is_published,
  search_vector_es
)
values
${values.join(",\n")}
on conflict (slug) do update set
  source_filename = excluded.source_filename,
  title_es = excluded.title_es,
  original_title = excluded.original_title,
  year = excluded.year,
  summary_es = excluded.summary_es,
  content_es = excluded.content_es,
  topics = excluded.topics,
  tags = excluded.tags,
  search_vector_es = excluded.search_vector_es,
  updated_at = now();
`;
}

function chunkInsertSql(items) {
  const rows = [];

  for (const item of items) {
    const chunks = chunkContent(item.content);
    chunks.forEach((chunk, index) => {
      rows.push(`(
        (select id from public.study_materials where slug = ${sqlString(item.slug)}),
        ${index},
        ${sqlString(item.title)},
        ${sqlString(chunk)},
        'es',
        ${chunk.split(/\s+/).filter(Boolean).length},
        ${jsonSql({ slug: item.slug, filename: item.filename, title_es: item.title, original_title: item.originalTitle, year: item.year })},
        to_tsvector('spanish', unaccent(${sqlString(`${item.title} ${chunk}`)}))
      )`);
    });
  }

  return `
insert into public.material_chunks (
  material_id,
  chunk_index,
  heading,
  content,
  language,
  token_count,
  metadata,
  search_vector
)
values
${rows.join(",\n")}
on conflict (material_id, chunk_index, language) do update set
  heading = excluded.heading,
  content = excluded.content,
  token_count = excluded.token_count,
  metadata = excluded.metadata,
  search_vector = excluded.search_vector;
`;
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const files = fs
  .readdirSync(bibliotecaDir)
  .filter((file) => file.endsWith(".md") && file !== "INDICE.md")
  .sort();

const materials = files.map((filename) => {
  const raw = fs.readFileSync(path.join(bibliotecaDir, filename), "utf8");
  return parseMarkdown(raw, filename);
});

const batches = [];
for (let index = 0; index < materials.length; index += BATCH_SIZE) {
  const batch = materials.slice(index, index + BATCH_SIZE);
  const sql = [
    "begin;",
    materialInsertSql(batch),
    chunkInsertSql(batch),
    "commit;",
  ].join("\n");
  const batchName = `batch_${String(batches.length + 1).padStart(3, "0")}.sql`;
  const batchPath = path.join(outDir, batchName);
  fs.writeFileSync(batchPath, sql);
  batches.push({ path: batchPath, materials: batch.length, bytes: Buffer.byteLength(sql), chunks: batch.reduce((total, item) => total + chunkContent(item.content).length, 0) });
}

const manifest = {
  generated_at: new Date().toISOString(),
  source: bibliotecaDir,
  batch_size: BATCH_SIZE,
  materials: materials.length,
  chunks: materials.reduce((total, item) => total + chunkContent(item.content).length, 0),
  total_sql_bytes: batches.reduce((total, batch) => total + batch.bytes, 0),
  batches,
};

fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
