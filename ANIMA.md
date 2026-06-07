# Anima — Universidad de la Imaginación

Plataforma de estudio interactiva basada en las enseñanzas de Neville Goddard. Chat con IA multi-agente, biblioteca con 621 textos, exámenes generados por IA, compilador de libros, planes guiados y más.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15.5.19 (App Router) |
| Frontend | React, TypeScript, Lucide React |
| Backend | API Routes (Next.js) |
| Base de datos | Supabase (PostgreSQL) |
| IA Chat | NVIDIA NIM — `meta/llama-3.3-70b-instruct` |
| Embeddings | Gemini — `gemini-embedding-001` (1536 dims) |
| Búsqueda | Vectorial sobre `material_chunks` |

## Estructura del proyecto

```
anima/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # Chat con streaming + RAG
│   │   ├── sessions/route.ts   # Sesiones persistentes
│   │   ├── assessments/route.ts# Exámenes
│   │   ├── books/route.ts      # Libros compilados
│   │   ├── plans/route.ts      # Planes guiados
│   │   └── textos/route.ts     # Biblioteca + tags
│   ├── layout.tsx
│   └── page.tsx                # SPA completa (~2600 líneas)
├── lib/
│   ├── gemini.ts               # Orquestador multi-agente + API NVIDIA
│   ├── biblioteca.ts           # Búsqueda vectorial + contexto RAG
│   └── supabase.ts             # Cliente Supabase
├── scripts/
│   ├── tag_materials.mjs       # Etiquetado automático por keywords
│   ├── extract_artifacts.mjs   # Extracción de artefactos con NVIDIA
│   └── test_extract.mjs        # Prueba de extracción
├── .env.local                  # Keys (NVIDIA, Supabase, Gemini)
└── ANIMA.md                    # Este archivo
```

## 11 Agentes del Orquestador

El system prompt en `lib/gemini.ts` implementa un orquestador que detecta la intención del usuario y responde como el agente adecuado:

1. **Conversacional** — preguntas y conceptos generales
2. **Pruebas y Preguntas** — exámenes, quizzes, preguntas
3. **Narrador** — narraciones, meditaciones, guiones
4. **Constructor de Libros** — índices, capítulos, eBooks
5. **Citas** — citas textuales de la biblioteca
6. **Lecturas Recomendadas** — lecturas por título/año/tipo
7. **Prácticas** — ejercicios internos fieles a Neville
8. **Bíblico / Personajes** — símbolos y personajes bíblicos
9. **Planificador de Estado** — planes de 7/15/30 días
10. **Glosario y Definiciones** — definiciones claras y fieles
11. **Testimonios y Casos** — historias y ejemplos

## Funcionalidades

### Panel principal
Dashboard con estadísticas de uso, acceso rápido a exámenes y compilación.

### Aula Virtual (Chat)
- Chat streaming con IA vía NVIDIA
- Modos: Charla, Prueba, Plan, Libro, Diario, Presentación
- Memoria opcional (conecta historial, materiales, exámenes)
- Contexto RAG con búsqueda vectorial sobre 4829 chunks
- Sesiones persistentes en Supabase

### Biblioteca (Archivo)
- 621 textos con metadatos (título, año, tags)
- Búsqueda por título + filtro por 40 etiquetas
- Vista de detalle con contenido completo
- "Estudiar" inyecta el texto como contexto prioritario en el chat

### Sala de Exámenes
- Exámenes de 3 preguntas generados por IA
- Opción múltiple, autocorrección
- Historial guardado en Supabase

### Compilador de Libros
- Genera "Libros de Luz" en Markdown
- Basado en tema + material de estudio + historial de chat

### Planes Personalizados
- Planes guiados de 7/15/30 días
- Generados por IA según objetivo del usuario

### Memoria
- Historial de sesiones, exámenes y libros compilados
- Persistencia en Supabase

## Scripts

```bash
# Etiquetar materiales con tags por keyword-matching
node scripts/tag_materials.mjs

# Extraer artefactos (resúmenes, citas, definiciones) con NVIDIA
node scripts/extract_artifacts.mjs

# Probar extracción en un solo texto
node scripts/test_extract.mjs
```

## Base de datos (Supabase)

Tablas principales:
- `study_materials` — 621 textos con metadatos
- `material_chunks` — 4829 chunks con embeddings
- `content_artifacts` — resúmenes, citas, definiciones, mensajes
- `chat_sessions` — sesiones de chat persistentes
- `assessments` — exámenes guardados
- `book_projects` — libros compilados
- `guided_plans` — planes personalizados
- `journal_entries` — entradas de diario

## Configuración

Variables de entorno (`.env.local`):

```
NVIDIA_API_KEY=nvapi-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
GEMINI_API_KEY=AIza...
```

## Tags disponibles (40)

Amor, Arrepentimiento, Asunción, Conciencia, Confianza, Conversación Interna,
Cristo, Culpa, Deseo, Dinero, Dios, Duda, El Hombre Interior, El Mundo Externo,
El Sentido, El Subconsciente, El Sábado, Estados, Fe, General, Imaginación,
Imaginación Despierta, La Biblia, La Oración del Sábado, La Palabra, Ley,
Muerte del Viejo Yo, Oración, Perdón, Persistencia, Poder Creador, Promesa,
Relaciones, Responsabilidad, Resurrección, Revisión, Salud, Sentimiento,
Vivir en el Final, Yo Soy

## Desarrollo

```bash
npm run dev    # Servidor en localhost:3000
npx next build # Build de producción
```
