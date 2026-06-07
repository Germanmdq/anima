const geminiApiKey = process.env.GEMINI_API_KEY;

const testPrompt = `Analiza el siguiente texto de Neville Goddard y extrae artefactos útiles.

Debes devolver JSON válido. No expliques. Devuelve solo un array JSON.

Tipos: quote, explanation, definition, practice, testimonial, character, warning.

Etiquetas: Imaginación, Ley, Promesa, Fe, Estados, Oración, Revisión, Perdón, Persistencia, Vivir en el Final, Asunción, Yo Soy, Cristo, Deseo, Conciencia, Amor, Dinero, Salud, La Biblia, Resurrección, El Hombre Interior, Poder Creador, Responsabilidad, Duda, Culpa, Arrepentimiento, El Sábado, Sentimiento, Conversación Interna, Muerte del Viejo Yo, Relaciones, La Palabra, Confianza, El Mundo Externo, Dios, El Sentido, El Subconsciente, Imaginación Despierta, La Oración del Sábado, General.

Cada artefacto debe tener: artifact_type, title, content, context, tags (1-5), neville_principle, use_cases, source_title, source_year, source_type, is_direct, extraction_mode, confidence.

Para quote: content debe ser cita textual exacta, is_direct=true, extraction_mode=literal.
Para otros tipos: resumir fielmente sin agregar ideas externas.

Texto:
Título: La fe es lealtad a la realidad invisible

La fe, en la enseñanza de Neville, no es esperar que algo bueno ocurra desde afuera. Es permanecer leal a una realidad invisible que has aceptado como verdadera, aunque los sentidos aún no la confirmen. La fe es fidelidad interior, no esperanza externa.

Cuando Pablo dice 'la fe es la sustancia de lo que se espera, la evidencia de lo que no se ve', Neville interpreta esto como: lo invisible ya tiene sustancia en el mundo interior. No estás esperando que aparezca; estás siendo fiel a lo que ya existe en tu imaginación.

La práctica de la fe consiste en no abandonar el estado asumido cuando los sentidos muestran lo contrario.`;

async function test() {
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: testPrompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
    })
  });
  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log(text);
}
test().catch(e => console.error(e.message));
