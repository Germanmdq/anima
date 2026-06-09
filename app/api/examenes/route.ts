import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { buscarTextos, construirContexto } from "@/lib/biblioteca";
import { buildQuestionsPrompt } from "@/lib/prompts";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, cantidad, dificultad, formato, material } = body;

    if (!user_id || !cantidad || !dificultad || !formato) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Buscar contexto adicional si hay material
    let contextoAdicional = "";
    if (material && material.trim().length > 0) {
      const busqueda = await buscarTextos(material, 5);
      contextoAdicional = construirContexto(busqueda);
    }

    const prompt = buildQuestionsPrompt({
      cantidad,
      dificultad,
      formato,
      material,
      contextoAdicional,
    });

    // Llamar a Llama 3.3
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.3-70b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API error: ${response.status}`);
    }

    const data = await response.json();
    let text = data.choices[0].message.content.trim();
    
    // Limpiar markdown json si viene
    if (text.startsWith("```json")) text = text.substring(7);
    if (text.startsWith("```")) text = text.substring(3);
    if (text.endsWith("```")) text = text.substring(0, text.length - 3);
    
    const preguntasGeneradas = JSON.parse(text.trim());

    // Incrementar uso sin RPC
    const { data: usage } = await supabase
      .from("usage_limits")
      .select("questions_count")
      .eq("user_id", user_id)
      .single();
    
    if (usage) {
      await supabase
        .from("usage_limits")
        .update({ 
          questions_count: usage.questions_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user_id);
    } else {
      await supabase
        .from("usage_limits")
        .insert({
          user_id: user_id,
          questions_count: 1,
          updated_at: new Date().toISOString()
        });
    }

    // Guardar en memoria
    await supabase.from("memoria").insert({
      user_id,
      item_type: "questions",
      source: "Preguntas y respuestas",
      content: {
        cantidad,
        dificultad,
        formato,
        material,
        preguntas_generadas: preguntasGeneradas
      },
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true, preguntas: preguntasGeneradas });
  } catch (error: any) {
    console.error("Error generating exam:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
