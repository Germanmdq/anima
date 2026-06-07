import fs from "node:fs";

const supabaseUrl = process.env.SUPABASE_URL || "https://qitwckfwmgnmnmtjhfnf.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const nvidiaApiKey = process.env.NVIDIA_API_KEY;
const BATCH_SIZE = 1;

if (!serviceRoleKey || !nvidiaApiKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NVIDIA_API_KEY.");
  process.exit(1);
}

const ARTIFACT_PROMPT = `Extrae artefactos útiles de este texto de Neville Goddard. Devuelve SOLO un array JSON válido. Sin markdown. Sin explicaciones.

Tipos de artefacto: quote (cita textual exacta), explanation (explicación de concepto), definition (definición breve), practice (instrucción práctica), testimonial (historia/ejemplo), character (personaje bíblico y su significado en Neville), warning (advertencia sobre error común).

Tags disponibles: Imaginación, Ley, Promesa, Fe, Estados, Oración, Revisión, Perdón, Persistencia, Vivir en el Final, Asunción, Yo Soy, Cristo, Deseo, Conciencia, Amor, Dinero, Salud, La Biblia, Resurrección, El Hombre Interior, Poder Creador, Responsabilidad, Duda, Culpa, Arrepentimiento, El Sábado, Sentimiento, Conversación Interna, Muerte del Viejo Yo, Relaciones, La Palabra, Confianza, El Mundo Externo, Dios, El Sentido, El Subconsciente, Imaginación Despierta, La Oración del Sábado, General.

Cada artefacto debe tener: artifact_type, title, content, context, tags (array 1-5), source_title, source_year, source_type, is_direct, extraction_mode, confidence.

Si no hay artefactos, devuelve [].

Texto:
{{TEXT}}`;

async function supFetch(pathname, options = {}) {
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractArtifacts(title, content) {
  const prompt = ARTIFACT_PROMPT.replace("{{TEXT}}", `Título: ${title}\n\n${content.slice(0, 3000)}`);

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${nvidiaApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta/llama-3.3-70b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`NVIDIA API error ${response.status}: ${errText}`);
  }

  const json = await response.json();
  const text = json?.choices?.[0]?.message?.content || "";

  const clean = text.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
  return JSON.parse(clean);
}

async function processAll() {
  let offset = 0;
  let totalArtifacts = 0;
  let processed = 0;

  while (true) {
    const materials = await supFetch(
      `/rest/v1/study_materials?select=id,slug,title_es,content_es,year,material_type&language=eq.es&limit=${BATCH_SIZE}&offset=${offset}&order=slug.asc`
    );
    if (!materials || materials.length === 0) break;

    for (const m of materials) {
      if (!m.content_es || m.content_es.length < 200) {
        processed++;
        console.log(`SKIP ${m.slug}: content too short (${(m.content_es || "").length} chars)`);
        continue;
      }

      let artifacts;
      let retries = 3;
      while (retries > 0) {
        try {
          artifacts = await extractArtifacts(m.title_es, m.content_es);
          break;
        } catch (err) {
          if (err.message === "rate_limited") {
            console.log(`Rate limited. Waiting 60s...`);
            await sleep(60000);
            retries--;
          } else {
            console.error(`ERROR ${m.slug}: ${err.message}`);
            artifacts = [];
            break;
          }
        }
      }

      if (!artifacts || !Array.isArray(artifacts)) {
        processed++;
        console.log(`NOOP ${m.slug}: no valid artifacts returned`);
        continue;
      }

      const sourceType = m.material_type === "book" ? "capítulo de libro" : "conferencia";

      for (const art of artifacts) {
        const record = {
          source_material_id: m.id,
          artifact_type: "summary",
          status: "published",
          language: "es",
          title: art.title || "",
          subtitle: art.context || "",
          body: art.content || "",
          tags: art.tags || [],
          data: {
            artifact_subtype: art.artifact_type,
            neville_principle: art.neville_principle || "",
            use_cases: art.use_cases || [],
            source_title: art.source_title || m.title_es,
            source_year: art.source_year || m.year || "Sin año",
            source_type: art.source_type || sourceType,
            source_book_title: art.source_book_title || null,
            source_chapter_title: art.source_chapter_title || null,
            source_page_start: art.source_page_start || null,
            source_page_end: art.source_page_end || null,
            is_direct: art.is_direct ?? false,
            extraction_mode: art.extraction_mode || "faithful_summary",
            confidence: art.confidence || 0.8,
          },
        };

        await supFetch("/rest/v1/content_artifacts", {
          method: "POST",
          body: JSON.stringify(record),
        });
        totalArtifacts++;
      }

      processed++;
      console.log(`OK ${m.slug}: ${artifacts.length} artifacts (total: ${totalArtifacts})`);
    }

    offset += materials.length;
    console.log(`--- Batch done. Processed ${processed} materials, ${totalArtifacts} artifacts total ---`);
  }

  console.log(`\n✅ Done. ${processed} materials processed, ${totalArtifacts} artifacts extracted.`);
}

processAll().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
