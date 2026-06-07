/**
 * ═══════════════════════════════════════════════════════════════════
 *  Biblioteca de la Universidad de la Imaginación
 *  Script de Extracción, Limpieza y Exportación a Markdown
 *  ─── Versión 2: Calibrado para los 8 Tomos de Neville Goddard ───
 * ═══════════════════════════════════════════════════════════════════
 *
 *  FORMATOS DETECTADOS:
 *    Tomos 1-6:  "N. Título" + "Original: English Title | Año: XXXX"
 *    Tomo 7:     "N. Título" + "Título original: English Title · Año: XXXX"
 *    Tomo 8:     "N. Título" + "Libro / lección. Año: XXXX" ó
 *                "N. Título" + "Conferencia de radio. Año: XXXX"
 *
 *  USO:
 *    npx tsx src/extract.ts <carpeta-con-pdfs> [carpeta-salida]
 */

import fs from "node:fs";
import path from "node:path";
import pdfParse from "pdf-parse";

// ─── Configuración ──────────────────────────────────────────────────

const INPUT_DIR = process.argv[2] ?? "./pdfs";
const OUTPUT_DIR = process.argv[3] ?? "./biblioteca";

// ─── Tipos ──────────────────────────────────────────────────────────

interface TextoExtraido {
  titulo: string;
  tituloOriginal: string;
  anio: string;
  contenido: string;
  archivoPdf: string;
  indiceEnPdf: number;
}

interface MarcadorTitulo {
  lineaIndice: number;
  titulo: string;
  tituloOriginal: string;
  anio: string;
}

// ─── Detección de Títulos ───────────────────────────────────────────

/**
 * Patrón para la línea de título numerado: "N. Título de la conferencia"
 * Captura: grupo 1 = número, grupo 2 = título
 */
const PATRON_TITULO_NUMERADO = /^(\d{1,3})\.\s+(.+)$/;

/**
 * Patrones para la línea que sigue al título (identifica el formato).
 * Cada uno captura: tituloOriginal, año
 */
const PATRONES_SUBTITULO: {
  nombre: string;
  regex: RegExp;
  extraer: (match: RegExpMatchArray) => { tituloOriginal: string; anio: string };
}[] = [
  {
    // Tomos 1-6: "Original: English Title | Año: 1968"
    nombre: "tomos_1_6",
    regex: /^Original:\s*(.+?)\s*\|\s*Año:\s*(.+)$/i,
    extraer: (m) => ({ tituloOriginal: m[1].trim(), anio: m[2].trim() }),
  },
  {
    // Tomo 7: "Título original: English Title · Año: 1969"
    nombre: "tomo_7",
    regex: /^Título original:\s*(.+?)\s*·\s*Año:\s*(.+)$/i,
    extraer: (m) => ({ tituloOriginal: m[1].trim(), anio: m[2].trim() }),
  },
  {
    // Tomo 8 libros: "Libro / lección. Año: 1939. Fuente: ..."
    nombre: "tomo_8_libro",
    regex: /^Libro\s*\/\s*lecci[oó]n\.\s*Año:\s*([^.]+)\./i,
    extraer: (m) => ({ tituloOriginal: "", anio: m[1].trim() }),
  },
  {
    // Tomo 8 radio: "Conferencia de radio. Año: 1951. Fuente: ..."
    nombre: "tomo_8_radio",
    regex: /^Conferencia de radio\.\s*Año:\s*([^.]+)\./i,
    extraer: (m) => ({ tituloOriginal: "", anio: m[1].trim() }),
  },
];

/**
 * Escanea el texto completo de un PDF y devuelve todos los
 * marcadores de título con su posición (índice de línea).
 */
function detectarMarcadores(lineas: string[]): MarcadorTitulo[] {
  const marcadores: MarcadorTitulo[] = [];

  for (let i = 0; i < lineas.length - 1; i++) {
    const lineaActual = lineas[i].trim();
    const lineaSiguiente = lineas[i + 1]?.trim() ?? "";

    // ¿La línea actual es un título numerado?
    const matchTitulo = lineaActual.match(PATRON_TITULO_NUMERADO);
    if (!matchTitulo) continue;

    const titulo = matchTitulo[2].trim();

    // ¿La siguiente línea es un subtítulo reconocido?
    for (const patron of PATRONES_SUBTITULO) {
      const matchSub = lineaSiguiente.match(patron.regex);
      if (matchSub) {
        const { tituloOriginal, anio } = patron.extraer(matchSub);
        marcadores.push({
          lineaIndice: i,
          titulo,
          tituloOriginal,
          anio,
        });
        break;
      }
    }
  }

  return marcadores;
}

// ─── Limpieza de Ruido ──────────────────────────────────────────────

/**
 * Patrones de ruido específicos para este corpus de Neville Goddard.
 */
const PATRONES_RUIDO: RegExp[] = [
  // Watermarks de elclubdelaimaginacion
  /^Documento exclusivo de www\.elclubdelaimaginacion\.com.*$/gm,
  /^Prohibida su distribución.*$/gm,

  // Encabezados de "Biblioteca Neville Goddard" con variantes
  /^Biblioteca Neville Goddard\s*[-–—]?\s*Tomo\s*(?:1|2|3|4|5|6|7|8|I{1,3}|IV|V|VI{0,3}|VII{0,1}|VIII).*$/gm,
  /^Biblioteca Neville Goddard en Español\s*[-–—]?\s*Tomo\s*(?:VII|VIII).*$/gm,
  /^Biblioteca Neville Goddard\s*[-–—]?\s*Tomo\s*VIII\s*\|\s*Página\s*\d+$/gm,

  // Números de página sueltos
  /^Página\s*\d+\s*$/gm,
  /^\s*\d{1,4}\s*$/gm,

  // Saltos de página
  /\f/g,

  // Líneas decorativas
  /^\s*[-_=*~·•]{3,}\s*$/gm,

  // Líneas de referencia a tomos
  /^\s*Tomo\s+(?:\d+|[IVXLCDM]+)\s*[:.]?\s*.*$/gim,
];

/**
 * Limpia el ruido del texto extraído de un fragmento.
 */
function limpiarTexto(texto: string): string {
  let limpio = texto;

  for (const regex of PATRONES_RUIDO) {
    // Resetear lastIndex para regex con flag 'g'
    regex.lastIndex = 0;
    limpio = limpio.replace(regex, "");
  }

  // Colapsar líneas vacías múltiples (3+) en doble salto
  limpio = limpio.replace(/\n{3,}/g, "\n\n");

  // Eliminar espacios finales en cada línea
  limpio = limpio.replace(/[ \t]+$/gm, "");

  return limpio.trim();
}

/**
 * Reconstruye párrafos cortados por el PDF:
 * une líneas que terminan sin puntuación y cuya siguiente
 * comienza en minúscula.
 */
function reconstruirParrafos(texto: string): string {
  const lineas = texto.split("\n");
  const resultado: string[] = [];

  for (let i = 0; i < lineas.length; i++) {
    const actual = lineas[i];
    const siguiente = lineas[i + 1];

    if (
      siguiente &&
      actual.trim().length > 0 &&
      siguiente.trim().length > 0 &&
      // No termina en puntuación de cierre
      !/[.!?:;»")\]]\s*$/.test(actual.trim()) &&
      // La siguiente empieza en minúscula
      /^[a-záéíóúñü]/.test(siguiente.trim())
    ) {
      resultado.push(actual.trimEnd() + " ");
    } else {
      resultado.push(actual);
    }
  }

  return resultado.join("\n");
}

// ─── Separación de Textos ───────────────────────────────────────────

/**
 * Extrae los textos individuales del PDF usando los marcadores detectados.
 */
function extraerTextos(
  lineas: string[],
  marcadores: MarcadorTitulo[],
  archivoPdf: string
): TextoExtraido[] {
  const textos: TextoExtraido[] = [];

  for (let m = 0; m < marcadores.length; m++) {
    const marcador = marcadores[m];
    const siguiente = marcadores[m + 1];

    // El contenido empieza 2 líneas después del marcador (saltear título + subtítulo)
    const inicioContenido = marcador.lineaIndice + 2;

    // Termina en la línea anterior al siguiente marcador, o al final del documento
    const finContenido = siguiente
      ? siguiente.lineaIndice
      : lineas.length;

    // Extraer contenido crudo
    const contenidoCrudo = lineas.slice(inicioContenido, finContenido).join("\n");

    // Limpiar y reconstruir
    let contenidoLimpio = limpiarTexto(contenidoCrudo);
    contenidoLimpio = reconstruirParrafos(contenidoLimpio);

    // Solo incluir si tiene suficiente contenido
    if (contenidoLimpio.length > 100) {
      textos.push({
        titulo: marcador.titulo,
        tituloOriginal: marcador.tituloOriginal,
        anio: marcador.anio,
        contenido: contenidoLimpio,
        archivoPdf,
        indiceEnPdf: m + 1,
      });
    }
  }

  return textos;
}

// ─── Generación de Markdown ─────────────────────────────────────────

function tituloANombreArchivo(titulo: string, indiceGlobal: number): string {
  const limpio = titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/[^a-z0-9\s-]/g, "")    // solo alfanuméricos
    .replace(/\s+/g, "-")            // espacios a guiones
    .replace(/-+/g, "-")             // colapsar guiones
    .replace(/^-|-$/g, "")           // trim guiones
    .slice(0, 80);

  const prefijo = String(indiceGlobal).padStart(3, "0");
  return `${prefijo}-${limpio || "sin-titulo"}.md`;
}

function generarMarkdown(texto: TextoExtraido): string {
  const partes: string[] = [`# ${texto.titulo}`, ""];

  // Metadata opcional
  if (texto.tituloOriginal || texto.anio !== "Sin año") {
    const meta: string[] = [];
    if (texto.tituloOriginal) meta.push(`**Original:** ${texto.tituloOriginal}`);
    if (texto.anio && texto.anio !== "Sin año") meta.push(`**Año:** ${texto.anio}`);
    partes.push(meta.join(" | "));
    partes.push("");
    partes.push("---");
    partes.push("");
  }

  partes.push(texto.contenido);
  partes.push("");

  return partes.join("\n");
}

// ─── Pipeline Principal ─────────────────────────────────────────────

async function procesarPdf(rutaPdf: string): Promise<TextoExtraido[]> {
  const nombreArchivo = path.basename(rutaPdf);
  console.log(`\n📄 Procesando: ${nombreArchivo}`);

  const buffer = fs.readFileSync(rutaPdf);
  const data = await pdfParse(buffer);

  console.log(`   → ${data.numpages} páginas, ${data.text.length.toLocaleString()} caracteres`);

  const lineas = data.text.split("\n");

  // Detectar marcadores de título
  const marcadores = detectarMarcadores(lineas);
  console.log(`   → ${marcadores.length} texto(s) detectado(s)`);

  if (marcadores.length === 0) {
    console.warn(`   ⚠️  No se detectaron textos en ${nombreArchivo}`);
    return [];
  }

  // Mostrar primeros 3 títulos como muestra
  for (let i = 0; i < Math.min(3, marcadores.length); i++) {
    const m = marcadores[i];
    console.log(`      ${i + 1}. ${m.titulo}`);
  }
  if (marcadores.length > 3) {
    console.log(`      ... y ${marcadores.length - 3} más`);
  }

  // Extraer y limpiar textos
  const textos = extraerTextos(lineas, marcadores, nombreArchivo);
  console.log(`   → ${textos.length} texto(s) con contenido válido`);

  return textos;
}

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  📚 Biblioteca de la Universidad de la Imaginación");
  console.log("     Extractor v2 — Calibrado para Neville Goddard");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Validar carpeta de entrada
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ La carpeta de entrada no existe: ${INPUT_DIR}`);
    console.error(`\n   Uso: npx tsx src/extract.ts <carpeta-con-pdfs> [carpeta-salida]\n`);
    process.exit(1);
  }

  // Buscar PDFs
  const archivosPdf = fs
    .readdirSync(INPUT_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort()
    .map((f) => path.join(INPUT_DIR, f));

  if (archivosPdf.length === 0) {
    console.error(`❌ No se encontraron archivos PDF en: ${INPUT_DIR}`);
    process.exit(1);
  }

  console.log(`📂 Entrada:  ${path.resolve(INPUT_DIR)}`);
  console.log(`📁 Salida:   ${path.resolve(OUTPUT_DIR)}`);
  console.log(`📄 PDFs:     ${archivosPdf.length}\n`);

  // Limpiar carpeta de salida anterior
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Procesar cada PDF
  let contadorGlobal = 1;
  const indice: {
    archivo: string;
    titulo: string;
    tituloOriginal: string;
    anio: string;
    pdf: string;
  }[] = [];

  for (const rutaPdf of archivosPdf) {
    try {
      const textos = await procesarPdf(rutaPdf);

      for (const texto of textos) {
        const nombreMd = tituloANombreArchivo(texto.titulo, contadorGlobal);
        const rutaSalida = path.join(OUTPUT_DIR, nombreMd);
        const markdown = generarMarkdown(texto);

        fs.writeFileSync(rutaSalida, markdown, "utf-8");

        indice.push({
          archivo: nombreMd,
          titulo: texto.titulo,
          tituloOriginal: texto.tituloOriginal,
          anio: texto.anio,
          pdf: texto.archivoPdf,
        });

        contadorGlobal++;
      }
    } catch (error) {
      console.error(`\n❌ Error en ${path.basename(rutaPdf)}:`);
      console.error(`   ${(error as Error).message}`);
    }
  }

  // Generar índice
  generarIndice(indice);

  // Resumen final
  const totalTextos = contadorGlobal - 1;
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`  ✅ Extracción completada`);
  console.log(`     → ${totalTextos} textos extraídos de ${archivosPdf.length} PDFs`);
  console.log(`     → Guardados en: ${path.resolve(OUTPUT_DIR)}`);
  console.log(`     → Índice: ${path.resolve(OUTPUT_DIR, "INDICE.md")}`);
  console.log("═══════════════════════════════════════════════════════════\n");
}

/**
 * Genera INDICE.md con la tabla completa de textos.
 */
function generarIndice(
  entradas: {
    archivo: string;
    titulo: string;
    tituloOriginal: string;
    anio: string;
    pdf: string;
  }[]
): void {
  const lineas: string[] = [
    "# 📚 Biblioteca de la Universidad de la Imaginación",
    "",
    `> Índice generado automáticamente — ${new Date().toLocaleDateString("es-AR")}`,
    "",
    `**Total de textos:** ${entradas.length}`,
    "",
    "---",
    "",
    "| # | Título | Original | Año | PDF Fuente |",
    "|---|--------|----------|-----|------------|",
  ];

  for (let i = 0; i < entradas.length; i++) {
    const e = entradas[i];
    const original = e.tituloOriginal || "—";
    const anio = e.anio || "—";
    lineas.push(
      `| ${i + 1} | [${e.titulo}](./${e.archivo}) | ${original} | ${anio} | ${e.pdf} |`
    );
  }

  lineas.push("");

  const ruta = path.join(OUTPUT_DIR, "INDICE.md");
  fs.writeFileSync(ruta, lineas.join("\n"), "utf-8");
  console.log(`\n📋 Índice generado: ${ruta}`);
}

// ─── Ejecutar ───────────────────────────────────────────────────────

main().catch((err) => {
  console.error("\n💥 Error fatal:", err);
  process.exit(1);
});
