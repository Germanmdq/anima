import { NextRequest } from "next/server";
import { buscarTextos, construirContexto } from "@/lib/biblioteca";
import {
  generarRespuesta,
  type AgenteId,
  type MensajeHistorial,
  type SeccionId,
} from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/current-user";
import { requireAccessToken } from "@/lib/auth-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const denied = requireAccessToken(request);
    if (denied) return denied;

    const userId = getCurrentUserId();
    const body = await request.json();

    const mensaje: string = body.message;
    const agente: AgenteId = body.agent ?? "profesor";
    const seccion: SeccionId = body.currentSection ?? "aula";
    const contextData: any = body.contextData ?? {};
    const historial: MensajeHistorial[] = body.history ?? [];
    const sessionId: string | undefined = body.sessionId;

    if (!mensaje || mensaje.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "El mensaje no puede estar vacío." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const selectedFile: string | undefined = body.selectedFile;
    let textosRelevantes: any[] = [];

    if (selectedFile) {
      const slug = selectedFile.replace(/\.md$/, "");
      const { data } = await supabase
        .from("material_chunks")
        .select("id, content, heading, metadata, chunk_index, token_count")
        .eq("language", "es")
        .filter("metadata->>slug", "eq", slug)
        .order("chunk_index")
        .limit(5);

      if (data) {
        textosRelevantes = data.map((c: any) => ({
          filename: c.metadata?.filename || slug + ".md",
          titulo: c.heading || c.metadata?.title_es || "",
          tituloOriginal: c.metadata?.original_title || "",
          anio: c.metadata?.year || "",
          contenido: c.content,
        }));
      }
    }

    const busqueda = await buscarTextos(mensaje, 8);
    for (const t of busqueda) {
      if (!textosRelevantes.some((r) => r.filename === t.filename)) {
        textosRelevantes.push(t);
      }
    }
    textosRelevantes = textosRelevantes.slice(0, 8);
    console.log("RAG query:", mensaje);
    console.log("Chunks recuperados:", textosRelevantes.length);
    console.log("Fuentes:", textosRelevantes.map((t) => t.titulo));
    console.log("NVIDIA model:", "meta/llama-3.3-70b-instruct");

    if (sessionId) {
      const agentMap: Record<string, string> = {
        profesor: "instructor",
        cuentacuentos: "narrator",
      };

      await supabase.from("chat_sessions").upsert(
        {
          id: sessionId,
          user_id: userId,
          title: mensaje.slice(0, 100),
          agent: agentMap[agente] || agente || "instructor",
          locale: "es",
          metadata: {
            last_message: mensaje.slice(0, 200),
            message_count: (historial.length || 0) + 1,
          },
        },
        { onConflict: "id" }
      );
    }

    const { data: userMemories } = await supabase
      .from("memoria")
      .select("title, content, item_type, source")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10);

    let memoriasContext = "";
    if (userMemories && userMemories.length > 0) {
      memoriasContext = "--- MEMORIA RECIENTE DEL USUARIO ---\n";
      memoriasContext += userMemories.map((m: any) => `- [${m.source}] ${m.item_type}: ${typeof m.content === 'object' ? JSON.stringify(m.content) : m.content}`).join("\n");
      memoriasContext += "\n------------------------------------\n\n";
    }

    if (!contextData.userName) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.display_name) {
        contextData.userName = profile.display_name;
      }
    }

    const contexto = memoriasContext + construirContexto(textosRelevantes);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = "";
          for await (const chunk of generarRespuesta(
            agente,
            seccion,
            contexto,
            mensaje,
            historial,
            contextData
          )) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          if (sessionId) {
            await supabase.from("content_artifacts").insert([
              {
                user_id: userId,
                artifact_type: "chat_message",
                language: "es",
                title: mensaje.slice(0, 100),
                body: mensaje,
                data: { agent: agente, role: "user" },
                source_table: "chat_sessions",
                source_id: sessionId,
              },
              {
                user_id: userId,
                artifact_type: "chat_message",
                language: "es",
                title: mensaje.slice(0, 100),
                body: fullResponse,
                data: {
                  agent: agente,
                  role: "model",
                  section: seccion,
                  query: mensaje,
                  context_sources: textosRelevantes.map((t) => t.filename),
                },
                source_table: "chat_sessions",
                source_id: sessionId,
              },
            ]);
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Error desconocido";
          console.error("Error generando respuesta:", errorMsg);
          controller.enqueue(
            encoder.encode(`\n\nError: ${errorMsg}`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
