import fs from "node:fs";

const supabaseUrl = process.env.SUPABASE_URL || "https://qitwckfwmgnmnmtjhfnf.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 10;

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const TAG_DEFS = [
  { tag: "Imaginación", keywords: ["imagina", "imaginación", "imaginar", "imaginativa", "imaginario", "fantasía"], min: 2 },
  { tag: "Ley", keywords: [" la ley", "ley de", "ley divina", "principio divino"], min: 2 },
  { tag: "Promesa", keywords: ["promesa", "prometido", "la promesa"], min: 2 },
  { tag: "Fe", keywords: [" fe ", " creer ", "creencia", "creyente", "confianza en dios", " fiel "], min: 2 },
  { tag: "Estados", keywords: ["estado de", "estados de", "estado interior", "posición de conciencia", "ocupar el estado", "cambiar de estado", "nuevo estado", "viejo estado", "estado asumido"], min: 3 },
  { tag: "Oración", keywords: ["oración", "orar", "rezar", "reza", "orando"], min: 2 },
  { tag: "Revisión", keywords: ["revisión", "revisar", "revisa", "revisando", "cambiar la escena", "modificar la escena", "reorganizar"], min: 2 },
  { tag: "Perdón", keywords: ["perdón", "perdonar", "perdona", "perdonado", "olvidar el estado", "olvidar completamente"], min: 2 },
  { tag: "Persistencia", keywords: ["persistencia", "persistir", "persiste", "persistiré", "persistiendo", "fiel a", "lealtad a lo invisible", "permanecer fiel", "no abandonar"], min: 2 },
  { tag: "Vivir en el Final", keywords: ["vivir en el final", "vivir desde el final", "el final", "deseo cumplido", "como si ya", "ya soy", "ya está hecho", "ya eres", "ya lo eres"], min: 2 },
  { tag: "Asunción", keywords: ["asunción", "asumir", "asume", "asumido", "asumir que", "asumir el estado", "asume que eres", "aceptar como verdadero", "aceptar como real"], min: 2 },
  { tag: "Yo Soy", keywords: ["yo soy", "yo soy"], min: 3 },
  { tag: "Cristo", keywords: [" cristo", "cristo", "jesucristo", "imaginación despierta"], min: 2 },
  { tag: "Deseo", keywords: ["deseo", "desear", "desea", "anhelo", "anhelar", "anhela", "lo que deseas"], min: 2 },
  { tag: "Conciencia", keywords: ["conciencia", "consciencia", "conciente", "darse cuenta", "en conciencia"], min: 2 },
  { tag: "Amor", keywords: [" amor ", "amar", "amado", "amada", "amoroso"], min: 2 },
  { tag: "Dinero", keywords: ["dinero", "riqueza", "abundancia", "prosperidad", "provisión", "deuda", "pobreza", "financiero"], min: 2 },
  { tag: "Salud", keywords: ["salud", "sanar", "sanación", "sanidad", "cuerpo", "enfermedad", "vitalidad", "síntoma", "médico"], min: 2 },
  { tag: "La Biblia", keywords: ["biblia", "escritura", "evangelio", "salmos", "génesis", "apocalipsis", "mateo", "lucas", "juan", "marcos", "pablo", "pedro", "david", "moisés", "isaias", "jeremias", "josué", "hebreos", "corintios", "efesios", "colosenses", "timoteo"], min: 3 },
  { tag: "El Subconsciente", keywords: ["subconsciente", "subjetivo", "subjetiva", "mente subjetiva", "mente profunda", "inconsciente"], min: 2 },
  { tag: "Resurrección", keywords: ["resurrección", "resucitar", "resucitó", "despertar", "despierta", "despertado", "nacimiento", "nacer de nuevo", "nacer desde"], min: 2 },
  { tag: "El Hombre Interior", keywords: ["hombre interior", "mundo interior", "dentro de ti", "dentro de vos", "interior"], min: 3 },
  { tag: "Poder Creador", keywords: ["poder creador", "poder creativo", "creativo", "creadora", "creatividad", "poder de dios", "poder creador"], min: 2 },
  { tag: "Responsabilidad", keywords: ["responsabilidad", "responsable", "responder por", "toma la responsabilidad"], min: 2 },
  { tag: "Duda", keywords: [" duda", "dudar", "dudas", "incredulidad", "dudando"], min: 2 },
  { tag: "Culpa", keywords: ["culpa", "culpable", "culparse", "condena", "condenar", "condenado"], min: 2 },
  { tag: "Arrepentimiento", keywords: ["arrepentimiento", "arrepentirse", "arrepentido", "cambio de estado", "cambiar de estado"], min: 2 },
  { tag: "El Sábado", keywords: ["sábado", "descanso", "reposo", "descansar", "reposar"], min: 2 },
  { tag: "Sentimiento", keywords: ["sentimiento", "sentir", "sensación", "naturalidad", "sentirse real", "sentirlo real"], min: 2 },
  { tag: "Conversación Interna", keywords: ["conversación interna", "diálogo interior", "hablarse a sí mismo", "hablar interior", "hablas a ti", "conversación"], min: 2 },
  { tag: "Muerte del Viejo Yo", keywords: ["morir", "muerte", "viejo yo", "viejo hombre", "viejo estado", "muere", "murió"], min: 2 },
  { tag: "Relaciones", keywords: ["relación", "relaciones", "vínculo", "matrimonio", "pareja", "amistad", "esposo", "esposa", "marido"], min: 2 },
  { tag: "La Palabra", keywords: ["la palabra", "palabra de dios", "el verbo", "la palabra"], min: 2 },
  { tag: "Imaginación Despierta", keywords: ["imaginación despierta", "conciencia despierta", "despertar de la imaginación"], min: 2 },
  { tag: "Confianza", keywords: ["confianza", "confiar", "confía", "confiado"], min: 2 },
  { tag: "El Mundo Externo", keywords: ["mundo externo", "mundo exterior", "afuera", "circunstancias", "circunstancia", "exterior"], min: 3 },
  { tag: "Dios", keywords: [" dios ", "dios es", "dios dentro", "yo soy dios", "dios mismo"], min: 2 },
  { tag: "El Sentido", keywords: ["los sentidos", "sentidos", "sentido del", "evidencia de los sentidos", "sentidos físicos"], min: 2 },
  { tag: "La Oración del Sábado", keywords: ["oración del sábado", "descanso en dios", "descansar en"], min: 1 },
];

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

function countKeywords(content, keywords) {
  const lower = content.toLowerCase();
  let count = 0;
  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    let idx = 0;
    while ((idx = lower.indexOf(kwLower, idx)) !== -1) {
      count++;
      idx += kwLower.length;
    }
  }
  return count;
}

async function tagAllMaterials() {
  let offset = 0;
  let totalTagged = 0;
  let totalMaterials = 0;

  while (true) {
    const materials = await supFetch(
      `/rest/v1/study_materials?select=slug,content_es&language=eq.es&limit=${BATCH_SIZE}&offset=${offset}&order=slug.asc`
    );
    if (!materials || materials.length === 0) break;

    for (const m of materials) {
      const content = m.content_es || "";
      const assignedTags = [];

      for (const def of TAG_DEFS) {
        const count = countKeywords(content, def.keywords);
        if (count >= def.min) {
          assignedTags.push(def.tag);
        }
      }

      if (assignedTags.length === 0) {
        assignedTags.push("General");
      }

      await supFetch(`/rest/v1/study_materials?slug=eq.${encodeURIComponent(m.slug)}`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({ tags: assignedTags }),
      });

      totalTagged++;
      const pct = ((totalTagged / (offset + materials.length)) * 100).toFixed(1);
      console.log(`${m.slug}: ${assignedTags.length} tags → ${assignedTags.join(", ")}`);
    }

    offset += materials.length;
    totalMaterials = offset;
    console.log(`--- Procesados ${totalMaterials} materiales ---`);
  }

  console.log(`\n✅ Completado. ${totalTagged} materiales etiquetados.`);
}

tagAllMaterials().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
