import "dotenv/config";
import { buscarTextos } from "../lib/biblioteca";
import { generarRespuesta } from "../lib/gemini";

async function test() {
  console.log("Searching texts...");
  const busqueda = await buscarTextos("¿Qué decía Neville sobre vivir desde el final?", 8);
  console.log("RAG Retrieved Chunks:", busqueda.length);
  console.log("Titles:", busqueda.map(b => b.titulo).join(", "));
  
  const contexto = busqueda.map(b => `[${b.titulo}] ${b.contenido}`).join("\n\n");
  console.log("\nGenerating response with NVIDIA NIM...");
  
  const generator = generarRespuesta("profesor", "aula", contexto, "¿Qué decía Neville sobre vivir desde el final?", []);
  
  let result = "";
  for await (const chunk of generator) {
    result += chunk;
  }
  
  console.log("\nFinal Answer:\n", result);
}

test().catch(console.error);
