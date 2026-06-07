import fs from "node:fs";

const supabaseUrl = process.env.SUPABASE_URL || "https://qitwckfwmgnmnmtjhfnf.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKeys = (
  process.env.GEMINI_API_KEYS ||
  process.env.GEMINI_API_KEY ||
  readEnvFile(".env.local").GEMINI_API_KEY ||
  ""
)
  .split(",")
  .map((key) => key.trim())
  .filter(Boolean);
let geminiApiKeyIndex = 0;
const batchSize = Number.parseInt(process.env.EMBED_BATCH_SIZE || "8", 10);
const pageSize = Number.parseInt(process.env.PAGE_SIZE || "48", 10);
const delayMs = Number.parseInt(process.env.EMBED_DELAY_MS || "1800", 10);
const rateLimitDelayMs = Number.parseInt(process.env.RATE_LIMIT_DELAY_MS || "70000", 10);
const maxChunks = Number.parseInt(process.env.MAX_CHUNKS || "0", 10);
const embeddingModel = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
const outputDimensionality = Number.parseInt(process.env.OUTPUT_DIMENSIONALITY || "1536", 10);

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (!geminiApiKeys.length) {
  console.error("Missing GEMINI_API_KEY.");
  process.exit(1);
}

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function fetchPendingChunks() {
  return supabaseFetch(
    `/rest/v1/material_chunks?select=id,content&language=eq.es&embedding=is.null&order=created_at.asc&limit=${pageSize}`,
    { method: "GET" }
  );
}

async function embedBatch(chunks) {
  const vectors = [];
  for (const chunk of chunks) {
    vectors.push(await embedOne(chunk.content));
    await sleep(250);
  }
  return vectors;
}

async function embedOne(content) {
  const body = {
    model: `models/${embeddingModel}`,
    content: { parts: [{ text: content }] },
    taskType: "RETRIEVAL_DOCUMENT",
    outputDimensionality,
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${embeddingModel}:embedContent?key=${geminiApiKeys[geminiApiKeyIndex]}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) {
    if (response.status === 429) {
      const error = new Error("rate_limited");
      error.status = 429;
      error.detail = json;
      throw error;
    }
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      const error = new Error("key_unavailable");
      error.status = response.status;
      error.detail = json;
      throw error;
    }
    throw new Error(`Gemini embedContent failed ${response.status}: ${JSON.stringify(json).slice(0, 600)}`);
  }

  return json.embedding.values;
}

function vectorLiteral(values) {
  return `[${values.map((value) => Number(value).toFixed(8)).join(",")}]`;
}

let embedded = 0;

while (true) {
  const page = await fetchPendingChunks();
  if (!page.length) break;

  for (let index = 0; index < page.length; index += batchSize) {
    if (maxChunks > 0 && embedded >= maxChunks) {
      console.log(JSON.stringify({ embedded, stopped_at_max_chunks: maxChunks }, null, 2));
      process.exit(0);
    }

    const chunks = page.slice(index, index + batchSize);
    let vectors;
    while (true) {
      try {
        vectors = await embedBatch(chunks);
        break;
      } catch (error) {
        if (error.status === 429 || error.message === "key_unavailable") {
          if (geminiApiKeys.length > 1) {
            geminiApiKeyIndex = (geminiApiKeyIndex + 1) % geminiApiKeys.length;
            console.log(`Gemini key unavailable/rate limited. Switching to key ${geminiApiKeyIndex + 1}/${geminiApiKeys.length}...`);
            await sleep(1000);
            continue;
          }
          if (error.status === 429) {
            console.log(`Rate limited. Waiting ${Math.round(rateLimitDelayMs / 1000)}s before retrying...`);
            await sleep(rateLimitDelayMs);
            continue;
          }
        }
        throw error;
      }
    }

    for (let vectorIndex = 0; vectorIndex < chunks.length; vectorIndex += 1) {
      await supabaseFetch(`/rest/v1/material_chunks?id=eq.${chunks[vectorIndex].id}`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({ embedding: vectorLiteral(vectors[vectorIndex]) }),
      });
    }

    embedded += chunks.length;
    console.log(`Embedded ${embedded} chunks`);
    await sleep(delayMs);
  }
}

console.log(JSON.stringify({ embedded }, null, 2));
