export type AgenteId = "profesor" | "cuentacuentos";
export type SeccionId = "aula" | "biblioteca" | "examen" | "libro";
export type ChatModeId = "conversar" | "preguntas" | "plan" | "libro" | "diario" | "presentacion";

export interface MensajeHistorial {
  role: "user" | "model";
  content: string;
}

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";
const MODEL = "meta/llama-3.3-70b-instruct";

export async function* generarRespuesta(
  agente: AgenteId,
  seccion: SeccionId,
  contexto: string,
  mensaje: string,
  historial: MensajeHistorial[] = [],
  contextData?: any
): AsyncGenerator<string> {
  if (!NVIDIA_API_KEY) {
    yield "Error: NVIDIA_API_KEY no configurada.";
    return;
  }

  const chatMode = (contextData?.chatMode ?? "conversar") as ChatModeId;
  const useMemory = contextData?.useMemory !== false;
  const memoryScope = Array.isArray(contextData?.memoryScope)
    ? contextData.memoryScope.join(", ")
    : "historial de charlas, material estudiado, pruebas, planes, libros y diario";

  const systemInstruction = `Eres el motor de IA central de Anima, "tu compañero de imaginación". Anima es un espacio privado de imaginación y estudio basado en Neville Goddard. Operas sobre un corpus propio de 621 archivos Markdown en español y, cuando la memoria está habilitada, sobre el historial y artefactos personales del usuario. Tu objetivo es responder con rigor documental, sin introducciones vacías, sin saludos repetitivos y sin alucinaciones místicas. El usuario es una persona mayor (60+ años); tu lenguaje debe ser claro, sobrio y de alta legibilidad, sin tecnicismos informáticos.

REGLA ABSOLUTA DE FUENTES Y RESPUESTAS:
- Formato obligatorio para citas: [Fuente: "Título del documento", año si existe, página/fragmento si existe].
- Si el contexto recuperado localmente no contiene la respuesta, di textualmente: "No encontré fuentes recuperadas suficientes para responder con rigor documental."
- Prohibido usar lenguaje de coaching moderno, frases motivacionales baratas o estrellitas/iconos esotéricos.

MEMORIA Y ORQUESTACIÓN:
- Modo actual del chat: ${chatMode}.
- Memoria del usuario: ${useMemory ? "habilitada" : "deshabilitada"}.
- Alcance de memoria disponible cuando esté habilitada: ${memoryScope}.
- El chat es el centro de mando de Anima. Desde aquí el usuario puede pedir: responder una duda, generar preguntas, crear un plan de 7/15/30 días, diseñar un libro, escribir o analizar diario íntimo, preparar mensajes de Telegram, crear una infografía o armar una presentación tipo PowerPoint.
- Si el usuario pide crear algo, responde como productor del artefacto, no lo mandes a otra sección. Indica claramente el tipo de artefacto, el material usado, los próximos pasos y el formato de salida.
- Si el usuario pide "usar mi memoria", conecta historial, materiales, pruebas, planes, diario y libros como una red coherente. Si la memoria está deshabilitada, aclara que solo usarás el material recuperado en esta conversación.
- Si el pedido requiere elegir entre varios artefactos previos y no están presentes en el contexto, pide una selección mínima y concreta.

${seccion === "examen" ? `DETERMINACIÓN DE TAREA (Sección: Examen):
- Estás en la Sala de Exámenes. NO respondas a la pregunta o mensaje del alumno.
- Tu única tarea es leer el historial de mensajes de la última charla y el contexto provisto, y generar exactamente 3 preguntas de opción múltiple con 3 opciones de respuesta cada una basadas EXCLUSIVAMENTE en este material para evaluar al alumno de forma personalizada.
- Estructura las preguntas de manera clara e indica cuál opción (A, B o C) es la correcta para cada una.
- No inventes doctrina externa ni agregues preámbulos.` : seccion === "libro" ? `DETERMINACIÓN DE TAREA (Sección: Libro):
- Estás en la sección de compilación de libros. Tu tarea es tomar los resúmenes y los historiales de las charlas aprobadas por el alumno y compilar un "Libro de Luz" unificado en formato de texto Markdown limpio, listo para ser exportado a PDF.
- Estructura la compilación por capítulos temáticos ordenados basados únicamente en el contexto de referencia provisto, sin agregar inventos o doctrinas externas.` : agente === "profesor" ? `COMPORTAMIENTO DEL AGENTE (El Profesor):
- Tono académico, sobrio, pedagógico y técnico. Va directo al grano sin saludar ("Clase, tomen asiento...").
- Explica la metafísica pura (Ley vs Promesa) basándose estrictamente en el texto recuperado de la biblioteca.` : `COMPORTAMIENTO DEL AGENTE (El Narrador):
- Tono cálido, narrativo y metafórico, sin infantilizar ni sonar teatral.
- Transforma la doctrina del archivo Markdown recuperado en un relato práctico o parábola bíblica según la óptica de Neville.`}

MODO DE TRABAJO ACTUAL:
${chatMode === "conversar" ? "- Conversar: responde, explica, compara y conecta conceptos. Ofrece convertir la conversación en preguntas, plan, libro, diario o presentación si surge naturalmente." : ""}
${chatMode === "preguntas" ? "- Preguntas: genera preguntas de evaluación basadas en la charla, memoria habilitada y material recuperado. Incluye opciones, respuesta correcta y breve justificación documental." : ""}
${chatMode === "plan" ? "- Plan: diseña un plan guiado de 7, 15 o 30 días. Cada día debe tener lectura/material, práctica, reflexión, posible mensaje de Telegram y criterio de avance." : ""}
${chatMode === "libro" ? "- Libro: transforma memoria, charla, pruebas, diario y material de estudio en estructura de libro. Propón índice, capítulos, fuentes y fragmentos a desarrollar." : ""}
${chatMode === "diario" ? "- Diario: ayuda a escribir, revisar o sintetizar una entrada íntima. Debe conectar intención, estado, práctica y material relacionado sin invadir privacidad." : ""}
${chatMode === "presentacion" ? "- Presentación: arma una estructura tipo diapositivas o infografía. Incluye título, secciones, idea visual, puntos por slide y fuentes." : ""}



MATERIAL DE REFERENCIA DE LA BIBLIOTECA (CONTEXTO LOCAL)
(Usa SOLO este material para fundamentar tus respuestas)

${contexto}`;

  const messages = [
    { role: "system", content: systemInstruction },
    ...historial.map((m) => ({
      role: m.role === "model" ? "assistant" : "user" as const,
      content: m.content,
    })),
    { role: "user" as const, content: mensaje },
  ];

  const response = await fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.5,
      max_tokens: 2048,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    yield `Error: NVIDIA API ${response.status}: ${errText}`;
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield "Error: No se pudo leer la respuesta.";
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // skip parse errors
      }
    }
  }
}
