"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Activity,
  Bell,
  BookOpen,
  Bot,
  ChevronDown,
  GraduationCap,
  History,
  HomeIcon,
  Library,
  Map as MapIconLucide,
  MessageSquareText,
  NotebookTabs,
  SearchIcon,
  Sparkles,
  Trophy,
  UserCog,
  UserRound,
} from "lucide-react";

// ─── Tipos ──────────────────────────────────────────────────

interface Mensaje {
  id: string;
  role: "user" | "model";
  content: string;
}

type AgenteId = "profesor" | "cuentacuentos";
type TabId = "panel" | "aula" | "biblioteca" | "examenes" | "libro" | "memoria" | "perfil" | "planes";
type ChatModeId = "conversar" | "preguntas" | "plan" | "libro" | "diario" | "presentacion";

interface TextoMetadatos {
  filename: string;
  titulo: string;
  tituloOriginal: string;
  anio: string;
}

interface ContextoClase {
  filename: string;
  titulo: string;
}

// ─── Componente de Markdown Simple ──────────────────────────

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let inList = false;
  let inBlockquote = false;
  let blockquoteLines: string[] = [];

  const flushList = (key: string) => {
    if (currentList.length > 0) {
      nodes.push(<ul key={`ul-${key}`}>{...currentList}</ul>);
      currentList = [];
    }
    inList = false;
  };

  const flushBlockquote = (key: string) => {
    if (blockquoteLines.length > 0) {
      nodes.push(
        <blockquote key={`bq-${key}`}>
          {blockquoteLines.map((line, i) => (
            <p key={`bq-p-${i}`}>{renderInline(line)}</p>
          ))}
        </blockquote>
      );
      blockquoteLines = [];
    }
    inBlockquote = false;
  };

  const renderInline = (str: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let remaining = str;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/^([^\*]*)\*\*([^\*]+)\*\*(.*)$/);
      const italicMatch = remaining.match(/^([^\*_]*)(?:\*|_)([^\*_]+)(?:\*|_)(.*)$/);
      const codeMatch = remaining.match(/^([^`]*)`([^`]+)`(.*)$/);
      const linkMatch = remaining.match(/^([^\[]*)\[([^\]]+)\]\(([^)]+)\)(.*)$/);

      let firstMatch: {
        type: "bold" | "italic" | "code" | "link";
        index: number;
        before: string;
        matched: string;
        extra?: string;
        after: string;
      } | null = null;

      if (boldMatch) {
        firstMatch = {
          type: "bold",
          index: boldMatch[1].length,
          before: boldMatch[1],
          matched: boldMatch[2],
          after: boldMatch[3],
        };
      }
      if (italicMatch) {
        if (firstMatch === null || italicMatch[1].length < firstMatch.index) {
          firstMatch = {
            type: "italic",
            index: italicMatch[1].length,
            before: italicMatch[1],
            matched: italicMatch[2],
            after: italicMatch[3],
          };
        }
      }
      if (codeMatch) {
        if (firstMatch === null || codeMatch[1].length < firstMatch.index) {
          firstMatch = {
            type: "code",
            index: codeMatch[1].length,
            before: codeMatch[1],
            matched: codeMatch[2],
            after: codeMatch[3],
          };
        }
      }
      if (linkMatch) {
        if (firstMatch === null || linkMatch[1].length < firstMatch.index) {
          firstMatch = {
            type: "link",
            index: linkMatch[1].length,
            before: linkMatch[1],
            matched: linkMatch[2],
            extra: linkMatch[3],
            after: linkMatch[4],
          };
        }
      }

      if (firstMatch) {
        if (firstMatch.before) {
          elements.push(firstMatch.before);
        }
        const key = `${keyIdx++}`;
        if (firstMatch.type === "bold") {
          elements.push(<strong key={key}>{firstMatch.matched}</strong>);
        } else if (firstMatch.type === "italic") {
          elements.push(<em key={key}>{firstMatch.matched}</em>);
        } else if (firstMatch.type === "code") {
          elements.push(<code key={key}>{firstMatch.matched}</code>);
        } else if (firstMatch.type === "link") {
          elements.push(
            <a
              key={key}
              href={firstMatch.extra}
              target="_blank"
              rel="noopener noreferrer"
            >
              {firstMatch.matched}
            </a>
          );
        }
        remaining = firstMatch.after;
      } else {
        elements.push(remaining);
        break;
      }
    }

    return elements;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith(">")) {
      if (inList) flushList(String(i));
      inBlockquote = true;
      blockquoteLines.push(trimmed.slice(1).trim());
      continue;
    } else if (inBlockquote && trimmed !== "") {
      blockquoteLines.push(trimmed);
      continue;
    } else if (inBlockquote && trimmed === "") {
      flushBlockquote(String(i));
    }

    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      inList = true;
      currentList.push(
        <li key={`li-${i}`}>{renderInline(trimmed.slice(1).trim())}</li>
      );
      continue;
    } else if (inList && trimmed !== "") {
      currentList.push(<li key={`li-${i}`}>{renderInline(trimmed)}</li>);
      continue;
    } else if (inList && trimmed === "") {
      flushList(String(i));
    }

    if (trimmed === "") {
      continue;
    }

    if (trimmed.startsWith("###")) {
      nodes.push(<h3 key={i}>{renderInline(trimmed.slice(3).trim())}</h3>);
    } else if (trimmed.startsWith("##")) {
      nodes.push(<h2 key={i}>{renderInline(trimmed.slice(2).trim())}</h2>);
    } else if (trimmed.startsWith("#")) {
      nodes.push(<h1 key={i}>{renderInline(trimmed.slice(1).trim())}</h1>);
    } else {
      nodes.push(<p key={i}>{renderInline(trimmed)}</p>);
    }
  }

  if (inList) flushList("end");
  if (inBlockquote) flushBlockquote("end");

  return nodes;
}

// ─── Componente Principal ────────────────────────────────────

export default function Home() {
  // Navegación
  const [currentTab, setCurrentTab] = useState<TabId>("panel");
  const [showApp, setShowApp] = useState(false);

  // Contexto activo para el Aula Virtual (inyección RAG directa)
  const [selectedClassContext, setSelectedClassContext] = useState<ContextoClase | null>(null);

  // Chat
  const [messages, setMessages] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [agent, setAgent] = useState<AgenteId>("profesor");
  const [chatMode, setChatMode] = useState<ChatModeId>("conversar");
  const [useMemory, setUseMemory] = useState(true);
  const [loading, setLoading] = useState(false);
  const [questionsCount, setQuestionsCount] = useState(84);

  // Biblioteca
  const [textos, setTextos] = useState<TextoMetadatos[]>([]);
  const [loadingLib, setLoadingLib] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedText, setSelectedText] = useState<TextoMetadatos | null>(null);
  const [textDetail, setTextDetail] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Exámenes
  const [examStarted, setExamStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [examScore, setExamScore] = useState<number | null>(null);

  // Compilador de Libros
  const [selectedTopic, setSelectedTopic] = useState("La Fe");
  const [compilingStep, setCompilingStep] = useState<number>(-1);
  const [compiledBookTitle, setCompiledBookTitle] = useState<string | null>(null);
  const [compiledBookContent, setCompiledBookContent] = useState<string | null>(null);

  // Sesión persistente
  const [sessionId, setSessionId] = useState<string>("");
  const [restoringSession, setRestoringSession] = useState(true);

  // Memoria
  const [memoriaSessions, setMemoriaSessions] = useState<any[]>([]);
  const [memoriaExams, setMemoriaExams] = useState<any[]>([]);
  const [memoriaBooks, setMemoriaBooks] = useState<any[]>([]);
  const [loadingMemoria, setLoadingMemoria] = useState(false);

  // Planes
  const [planes, setPlanes] = useState<any[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cargar o crear sesión al montar
  useEffect(() => {
    const stored = localStorage.getItem("anima_session_id");
    if (stored) {
      setSessionId(stored);
      fetch(`/api/sessions?id=${stored}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.session?.agent) {
            const agentReverse: Record<string, AgenteId> = {
              instructor: "profesor",
              narrator: "cuentacuentos",
            };
            setAgent(agentReverse[data.session.agent] || "profesor");
          }
          if (data.messages) {
            const restored = data.messages.map((m: any) => ({
              id: `hist-${m.created_at}`,
              role: (m.data?.role === "user" ? "user" : "model") as "user" | "model",
              content: m.body || "",
            }));
            if (restored.length > 0) setMessages(restored);
          }
        })
        .catch(() => {})
        .finally(() => setRestoringSession(false));
    } else {
      fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Mi Universidad", agent }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.id) {
            setSessionId(data.id);
            localStorage.setItem("anima_session_id", data.id);
          }
        })
        .catch(() => {})
        .finally(() => setRestoringSession(false));
    }
  }, []);

  const chatModes: { id: ChatModeId; label: string; desc: string; prompt: string }[] = [
    {
      id: "conversar",
      label: "Charla",
      desc: "Cruzar ideas, textos y memoria.",
      prompt: "Conectá esta idea con mi memoria y el material de estudio:",
    },
    {
      id: "preguntas",
      label: "Prueba",
      desc: "Crear preguntas desde una charla o lectura.",
      prompt: "Generá una prueba breve usando mi memoria y el material trabajado.",
    },
    {
      id: "plan",
      label: "Plan",
      desc: "Diseñar una práctica de 7, 15 o 30 días.",
      prompt: "Diseñá un plan de 7 días a partir de mi objetivo y mi historial.",
    },
    {
      id: "libro",
      label: "Libro",
      desc: "Convertir conversaciones y notas en capítulos.",
      prompt: "Diseñá el índice de mi libro personal con lo trabajado hasta ahora.",
    },
    {
      id: "diario",
      label: "Diario",
      desc: "Registrar intención, estado y avance.",
      prompt: "Ayudame a escribir una entrada de diario sobre mi estado de hoy.",
    },
    {
      id: "presentacion",
      label: "Presentación",
      desc: "Armar slides o una infografía.",
      prompt: "Convertí esta idea en una presentación breve tipo PowerPoint.",
    },
  ];

  // Cargar biblioteca al abrir la pestaña
  useEffect(() => {
    if (currentTab === "biblioteca" && textos.length === 0) {
      cargarListaTextos();
    }
  }, [currentTab]);

  // Auto-scroll del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize de la caja de texto
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        80
      )}px`;
    }
  }, [input]);

  const cargarListaTextos = async () => {
    setLoadingLib(true);
    try {
      const res = await fetch("/api/textos");
      if (res.ok) {
        const data = await res.json();
        setTextos(data);
      }
    } catch (error) {
      console.error("Error al cargar la lista de textos:", error);
    } finally {
      setLoadingLib(false);
    }
  };

  const abrirTexto = async (texto: TextoMetadatos) => {
    setSelectedText(texto);
    setLoadingDetail(true);
    setTextDetail(null);
    try {
      const res = await fetch(`/api/textos/detalle?file=${encodeURIComponent(texto.filename)}`);
      if (res.ok) {
        const data = await res.json();
        setTextDetail(data.content);
      } else {
        setTextDetail("❌ Ocurrió un error al cargar el contenido de este texto.");
      }
    } catch (error) {
      console.error("Error al cargar detalle del texto:", error);
      setTextDetail("❌ Error de red al cargar el texto.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const cerrarTexto = () => {
    setSelectedText(null);
    setTextDetail(null);
  };

  // Acción: Estudiar clase (conecta Biblioteca con el Aula Virtual)
  const handleEstudiarClase = (texto: TextoMetadatos) => {
    setSelectedClassContext({
      filename: texto.filename,
      titulo: texto.titulo,
    });

    // Resetear conversación e inyectar mensaje de bienvenida
    setMessages([
      {
        id: "context-welcome",
        role: "model",
        content: `He cargado el texto **"${texto.titulo}"** como tu lectura de estudio prioritaria. ¿Qué aspecto o concepto de esta enseñanza te gustaría profundizar hoy con ayuda del archivo?`,
      },
    ]);

    cerrarTexto();
    setCurrentTab("aula");
  };

  // Enviar mensaje en el chat
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Mensaje = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const modelMessageId = (Date.now() + 1).toString();
    let responseText = "";

    try {
      const history = messages
        .filter((m) => m.id !== "context-welcome") // omitir la bienvenida para no saturar el formato de rol de Gemini
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          agent,
          history,
          currentSection: currentTab === "examenes" ? "examen" : currentTab,
          contextData: {
            selectedFile: selectedClassContext?.filename || undefined,
            useMemory,
            chatMode,
            memoryScope: useMemory
              ? [
                  "historial de charlas",
                  "material estudiado",
                  "pruebas y respuestas",
                  "planes guiados",
                  "libros en proceso",
                  "diario intimo",
                  "mensajes de Telegram",
                  "presentaciones e infografias",
                ]
              : [],
          },
          selectedFile: selectedClassContext?.filename || undefined,
          sessionId: sessionId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Error en la conexión con el servidor.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No se pudo iniciar la lectura de la respuesta.");
      }

      setMessages((prev) => [
        ...prev,
        { id: modelMessageId, role: "model", content: "" },
      ]);
      setLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        responseText += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelMessageId ? { ...msg, content: responseText } : msg
          )
        );
      }

      setQuestionsCount((c) => Math.min(c + 1, 200));
    } catch (error) {
      console.error(error);
      const errorMsg =
        error instanceof Error ? error.message : "Ocurrió un error inesperado.";

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === modelMessageId);
        if (exists) {
          return prev.map((msg) =>
            msg.id === modelMessageId
              ? { ...msg, content: `❌ Error: ${errorMsg}` }
              : msg
          );
        } else {
          return [
            ...prev,
            { id: modelMessageId, role: "model", content: `❌ Error: ${errorMsg}` },
          ];
        }
      });
      setLoading(false);
    }
  };

  // Cargar memoria (sesiones, exámenes, libros)
  const cargarMemoria = useCallback(async () => {
    setLoadingMemoria(true);
    try {
      const [sessionsRes, examsRes, booksRes] = await Promise.all([
        fetch("/api/sessions"),
        fetch("/api/assessments"),
        fetch("/api/books"),
      ]);
      if (sessionsRes.ok) setMemoriaSessions(await sessionsRes.json());
      if (examsRes.ok) setMemoriaExams(await examsRes.json());
      if (booksRes.ok) setMemoriaBooks(await booksRes.json());
    } catch (err) {
      console.error("Error cargando memoria:", err);
    } finally {
      setLoadingMemoria(false);
    }
  }, []);

  useEffect(() => {
    if (currentTab === "memoria") cargarMemoria();
  }, [currentTab, cargarMemoria]);

  // Cargar planes
  const cargarPlanes = useCallback(async () => {
    setLoadingPlanes(true);
    try {
      const res = await fetch("/api/plans");
      if (res.ok) setPlanes(await res.json());
    } catch (err) {
      console.error("Error cargando planes:", err);
    } finally {
      setLoadingPlanes(false);
    }
  }, []);

  useEffect(() => {
    if (currentTab === "planes" && planes.length === 0) cargarPlanes();
  }, [currentTab, planes.length, cargarPlanes]);

  const cargarSesionHistorial = async (id: string) => {
    const res = await fetch(`/api/sessions?id=${id}`);
    const data = await res.json();
    if (data.messages) {
      const restored = data.messages.map((m: any) => ({
        id: `hist-${m.created_at}`,
        role: (m.data?.role === "user" ? "user" : "model") as "user" | "model",
        content: m.body || "",
      }));
      setMessages(restored);
    }
    if (data.session?.agent) {
      const agentReverse: Record<string, AgenteId> = {
        instructor: "profesor",
        narrator: "cuentacuentos",
      };
      setAgent(agentReverse[data.session.agent] || "profesor");
    }
    localStorage.setItem("anima_session_id", id);
    setSessionId(id);
    setCurrentTab("aula");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Exámenes generados por IA
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [examLoading, setExamLoading] = useState(false);

  const generarExamen = async () => {
    setExamLoading(true);
    setExamStarted(true);
    setAnswers({});
    setExamScore(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Generá un examen de 3 preguntas de opción múltiple sobre el material y doctrina de Neville Goddard. Cada pregunta debe tener 3 opciones (A, B, C). Indicá cuál es la correcta. Respondé SOLO con JSON: [{\"pregunta\":\"...\",\"opciones\":[\"A\",\"B\",\"C\"],\"correcta\":0}]",
          agent: "profesor",
          history: [],
          currentSection: "aula",
          contextData: { useMemory: false, chatMode: "preguntas" },
        }),
      });

      const reader = res.body?.getReader();
      let text = "";
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
        }
      }

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setExamQuestions(parsed.map((q: any, i: number) => ({ ...q, id: i + 1 })));
      }
    } catch (err) {
      console.error("Error generando examen:", err);
    } finally {
      setExamLoading(false);
    }
  };

  const corregirExamen = async () => {
    let score = 0;
    const maxScore = examQuestions.length;
    examQuestions.forEach((p: any) => {
      if (answers[p.id] === p.correcta) {
        score += 1;
      }
    });
    setExamScore(score);

    await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title_es: `Examen - ${new Date().toLocaleDateString("es-AR")}`,
        questions: examQuestions,
        score,
        max_score: maxScore,
      }),
    });
  };

  const resetearExamen = () => {
    setAnswers({});
    setExamScore(null);
    setExamStarted(false);
    setExamQuestions([]);
  };

  // Compilación real de libro
  const handleCompilarLibro = async () => {
    setCompilingStep(0);
    setCompiledBookTitle(null);
    setCompiledBookContent(null);

    const steps = [
      "Recuperando textos del Archivo...",
      "Generando narrativa con IA...",
      "Compilando Libro de Luz...",
      "Finalizando documento..."
    ];

    try {
      setCompilingStep(0);
      let listaTextos = textos;
      if (listaTextos.length === 0) {
        const res = await fetch("/api/textos");
        if (res.ok) listaTextos = await res.json();
      }

      const palabrasClave: Record<string, string[]> = {
        "La Fe": ["fe", "creencia", "creer", "fiel", "faith"],
        "Los Estados de Conciencia": ["estado", "conciencia", "asunción", "asumir", "conciousness"],
        "La Imaginación Creadora": ["imaginacion", "imaginación", "crear", "creador", "imaginar", "imagination"]
      };

      const palabras = palabrasClave[selectedTopic] || [selectedTopic.toLowerCase()];
      const coincidencias = listaTextos.filter((t) => {
        const tituloNorm = t.titulo.toLowerCase();
        const originalNorm = t.tituloOriginal?.toLowerCase() || "";
        return palabras.some((p) => tituloNorm.includes(p) || originalNorm.includes(p));
      }).slice(0, 5);

      const textosParaCompilar = coincidencias.length > 0 ? coincidencias : listaTextos.slice(0, 5);

      setCompilingStep(1);

      let contenidoConsolidado = "";
      for (const t of textosParaCompilar) {
        try {
          const detailRes = await fetch(`/api/textos/detalle?file=${encodeURIComponent(t.filename)}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            contenidoConsolidado += `\n\n## ${t.titulo}\n`;
            if (t.tituloOriginal) {
              contenidoConsolidado += `*Original: ${t.tituloOriginal} | Año: ${t.anio || "Sin año"}*\n\n`;
            }
            contenidoConsolidado += (detailData.content || "").slice(0, 3000) + "\n\n";
          }
        } catch (err) {
          console.error("Error al obtener detalle:", err);
        }
      }

      setCompilingStep(2);

      const fechaHoy = new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });
      const libroCompleto = `# Libro de Luz: ${selectedTopic}

**Compilado por:** Germán Gonzalez
**Fecha de emisión:** ${fechaHoy}
**Universidad de la Imaginación**

---
> "La asunción de que tu deseo ya se ha cumplido le da realidad objetiva a tu asunción." — Neville Goddard

${contenidoConsolidado}
`;

      setCompiledBookContent(libroCompleto);

      setCompilingStep(3);

      await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title_es: `Libro de Luz: ${selectedTopic}`,
          topic_es: selectedTopic,
          content_markdown: libroCompleto,
          source_material_ids: textosParaCompilar.map((t: any) => t.filename),
        }),
      });

      setCompilingStep(-1);
      setCompiledBookTitle(`Libro de Luz: ${selectedTopic}.md`);
    } catch (error) {
      console.error("Error compilando libro:", error);
      setCompilingStep(-1);
      alert("Ocurrió un error al compilar el libro.");
    }
  };

  const handleDescargarLibro = () => {
    if (!compiledBookContent || !compiledBookTitle) return;

    const blob = new Blob([compiledBookContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", compiledBookTitle);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrar biblioteca
  const textosFiltrados = textos.filter((t) =>
    t.titulo.toLowerCase().includes(search.toLowerCase()) ||
    t.tituloOriginal.toLowerCase().includes(search.toLowerCase())
  );

  if (!showApp) {
    return (
      <div className="swiss-landing">
        {/* Header */}
        <header className="swiss-landing-header">
          <div className="swiss-landing-logo" onClick={() => setShowApp(true)}>
            <div className="swiss-logo-square" />
            <span>Uni de la Imaginación</span>
          </div>
          <nav className="swiss-landing-nav">
            <button onClick={() => { setShowApp(true); setCurrentTab("aula"); }}>Aula</button>
            <button onClick={() => { setShowApp(true); setCurrentTab("biblioteca"); }}>Archivo</button>
            <button onClick={() => { setShowApp(true); setCurrentTab("examenes"); }}>Exámenes</button>
            <button onClick={() => { setShowApp(true); setCurrentTab("libro"); }}>Compilador</button>
            <button onClick={() => document.getElementById("blog")?.scrollIntoView({ behavior: "smooth" })}>Blog</button>
          </nav>
          <button className="swiss-landing-cta" onClick={() => setShowApp(true)}>
            Ingresar al Portal
          </button>
        </header>

        {/* Hero Section */}
        <div className="swiss-landing-hero">
          {/* Left Column */}
          <div className="swiss-landing-hero-left">
            <h1 className="swiss-landing-title">
              TRANSFORMA<br />
              LA MANERA<br />
              EN QUE OPERA<br />
              TU REALIDAD
            </h1>
            <div className="swiss-landing-divider-bar" />
            <p className="swiss-landing-description">
              La Universidad de la Imaginación te proporciona las herramientas fundamentales basadas en las enseñanzas de Neville Goddard para reestructurar tu conciencia, comprender la Ley y la Promesa, y manifestar tus objetivos con precisión matemática.
            </p>
            <button className="swiss-landing-enter-btn" onClick={() => setShowApp(true)}>
              Ingresar al Portal →
            </button>
          </div>

          {/* Right Column */}
          <div className="swiss-landing-hero-right swiss-grid-pattern">
            <div className="swiss-bauhaus-composition">
              {/* Black Rectangle */}
              <div className="swiss-bauhaus-rect" />
              
              {/* Red Circle (using SVG to bypass border-radius reset) */}
              <svg className="swiss-bauhaus-circle" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="var(--swiss-accent)" />
              </svg>
              
              {/* Hollow Triangle */}
              <svg className="swiss-bauhaus-triangle" viewBox="0 0 100 100">
                <polygon points="90,15 15,50 90,85" fill="none" stroke="black" strokeWidth="6" />
              </svg>
              
              {/* Lines */}
              <div className="swiss-bauhaus-line-black" />
              <div className="swiss-bauhaus-line-red" />
            </div>
            <div className="swiss-bauhaus-caption">
              <span>Universidad de la Imaginación</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <section className="swiss-stats-section">
          {[
            { num: "621", label: "Textos en el Archivo" },
            { num: "3", label: "Guías de Estudio Activas" },
            { num: "100%", label: "Basado en la Ley y la Promesa" },
            { num: "84", label: "Países Conectados" },
          ].map((stat, i) => (
            <div key={i} className="swiss-stat-card" onClick={() => { setShowApp(true); setCurrentTab("biblioteca"); }}>
              <div className="swiss-stat-number-wrapper">
                <span className="swiss-stat-number">{stat.num}</span>
                <span className="swiss-stat-plus">+</span>
              </div>
              <div className="swiss-stat-label">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* Product Detail Section */}
        <section className="swiss-detail-section">
          <div className="swiss-detail-left">
            <div className="swiss-detail-composition-card swiss-detail-composition-1">
              <div className="swiss-composition-circle" />
            </div>
            <div className="swiss-detail-composition-card swiss-detail-composition-2">
              <div className="swiss-composition-line" />
            </div>
            <div className="swiss-detail-composition-card swiss-detail-composition-3">
              <div className="swiss-composition-text">LEY</div>
            </div>
            <div className="swiss-detail-composition-card swiss-detail-composition-4">
              <div className="swiss-composition-square-red" />
            </div>
          </div>
          <div className="swiss-detail-right">
            <div className="swiss-section-number">01. CONCEPTO CLAVE</div>
            <h2 className="swiss-detail-title">EL PODER DE LA ASUNCIÓN CONSCIENTE</h2>
            <p className="swiss-detail-text">
              La asunción de que tu deseo ya se ha cumplido le da realidad objetiva a tu asunción. En la Universidad de la Imaginación, no enseñamos teoría abstracta; te proporcionamos el método exacto para alterar tu estado de conciencia y manifestar cualquier estado en este plano físico.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="swiss-features-section">
          <div className="swiss-features-left">
            <div className="swiss-features-sticky">
              <div className="swiss-section-number">02. HERRAMIENTAS</div>
              <h2 className="swiss-features-title">EL SISTEMA DE LA IMAGINACIÓN</h2>
            </div>
          </div>
          <div className="swiss-features-right">
            {[
              {
                num: "01",
                name: "AULA INTERACTIVA CON IA",
                desc: "Haz consultas al Profesor o al Cuentacuentos para resolver cualquier duda doctrinal sobre la Ley y la Promesa en tiempo real.",
                tab: "aula" as TabId,
              },
              {
                num: "02",
                name: "ARCHIVO DE TEXTOS",
                desc: "Navega y lee cada uno de los 621 documentos y lecciones recopiladas de Neville Goddard con búsqueda interactiva.",
                tab: "biblioteca" as TabId,
              },
              {
                num: "03",
                name: "EVALUACIÓN Y EXÁMENES",
                desc: "Pon a prueba tu asunción y tu nivel de comprensión conceptual a través de exámenes rápidos autocalificables.",
                tab: "examenes" as TabId,
              },
              {
                num: "04",
                name: "COMPILADOR DE LIBROS",
                desc: "Consolida tus conversaciones y resultados académicos directamente en un Libro de Luz descargable en formato Markdown.",
                tab: "libro" as TabId,
              },
            ].map((feat, i) => (
              <div key={i} className="swiss-feature-card" onClick={() => { setShowApp(true); setCurrentTab(feat.tab); }}>
                <div className="swiss-feature-info">
                  <span className="swiss-feature-num">{feat.num}.</span>
                  <h3 className="swiss-feature-name">{feat.name}</h3>
                  <p className="swiss-feature-desc">{feat.desc}</p>
                </div>
                <div className="swiss-feature-arrow">→</div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="swiss-how-section">
          <div className="swiss-how-header">
            <div className="swiss-section-number">03. MÉTODO</div>
            <h2 className="swiss-how-title">CÓMO OPERAR LA LEY</h2>
          </div>
          <div className="swiss-how-grid">
            {[
              {
                num: "1",
                title: "ASUME EL ESTADO",
                desc: "Define claramente tu deseo. Cierra los ojos y asume el sentimiento de que tu deseo ya se ha cumplido en tu imaginación.",
              },
              {
                num: "2",
                title: "IGNORA LOS SENTIDOS",
                desc: "Mantén tu lealtad radical a la reality invisible asumida, ignorando la evidencia contraria del plano físico tridimensional.",
              },
              {
                num: "3",
                title: "VIVE LA PROMESA",
                desc: "Tu asunción persistente se materializará de manera natural. Despierta al creador divino dentro de ti.",
              },
            ].map((step, i) => (
              <div key={i} className="swiss-how-card">
                <div className="swiss-how-watermark">{step.num}</div>
                <h3 className="swiss-how-card-title">{step.title}</h3>
                <p className="swiss-how-card-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="swiss-benefits-section">
          <div className="swiss-benefits-left">
            <div className="swiss-section-number">04. VENTAJAS</div>
            <h2 className="swiss-benefits-title">BENEFICIOS DE LA PRÁCTICA</h2>
          </div>
          <div className="swiss-benefits-right">
            {[
              {
                num: "I",
                name: "PRECISIÓN MATEMÁTICA",
                desc: "Nuestros métodos eliminan las conjeturas, alineándote directamente con las leyes psicológicas del subconsciente descubiertas por Neville Goddard.",
              },
              {
                num: "II",
                name: "SOPORTE IA PERSONALIZADO",
                desc: "Recibe aclaraciones con referencias específicas a conferencias originales y pasajes del autor de manera inmediata.",
              },
              {
                num: "III",
                name: "CREACIÓN PORTABLE",
                desc: "Genera y descarga tus manuales de estudio directamente en tu dispositivo para estudiar y aplicar la ley en cualquier lugar.",
              },
            ].map((ben, i) => (
              <div key={i} className="swiss-benefit-item" onClick={() => setShowApp(true)}>
                <div className="swiss-benefit-num-box">{ben.num}</div>
                <div className="swiss-benefit-content">
                  <h3 className="swiss-benefit-name">{ben.name}</h3>
                  <p className="swiss-benefit-desc">{ben.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="swiss-testimonials-section">
          <div className="swiss-testimonials-header">
            <div className="swiss-section-number">05. TESTIMONIOS</div>
            <h2 className="swiss-testimonials-title">VOCES DE LA ASUNCIÓN</h2>
          </div>
          <div className="swiss-testimonials-grid">
            {[
              {
                quote: "EL CAMBIO EN MI CONCIENCIA REDISEÑÓ POR COMPLETO MI REALIDAD PROFESIONAL Y PERSONAL. LA LEY FUNCIONA.",
                name: "GERMÁN GONZÁLEZ",
                role: "ALUMNO PRO",
              },
              {
                quote: "LA RESPUESTA DEL PROFESOR IA FUE CLARA E INSTANTÁNEA. LA MEJOR HERRAMIENTA PARA ESTUDIAR A NEVILLE.",
                name: "MARÍA S.",
                role: "ALUMNA DE LA PROMESA",
              },
              {
                quote: "COMPILAR MIS PREGUNTAS Y DIÁLOGOS EN UN LIBRO COMPACTO ME AYUDÓ A INTERIORIZAR EL SENTIMIENTO.",
                name: "ESTEBAN R.",
                role: "INVESTIGADOR INDEPENDIENTE",
              },
            ].map((test, i) => (
              <div key={i} className="swiss-testimonial-card" onClick={() => setShowApp(true)}>
                <div className="swiss-testimonial-quote">“{test.quote}”</div>
                <div className="swiss-testimonial-author">
                  <span className="swiss-testimonial-name">{test.name}</span>
                  <span className="swiss-testimonial-role">{test.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section className="swiss-pricing-section">
          <div className="swiss-pricing-header">
            <div className="swiss-section-number">06. MATRÍCULA</div>
            <h2 className="swiss-pricing-title">PLANES DE ESTUDIO</h2>
          </div>
          <div className="swiss-pricing-grid">
            {[
              {
                tier: "ESTUDIANTE",
                price: "$0",
                period: "gratis para siempre",
                desc: "Ideal para iniciar tu camino y explorar las bases conceptuales de la asunción.",
                features: ["10 consultas de chat al mes", "Archivo de textos básicos", "Exámenes conceptuales", "Compilación básica"],
                highlight: false,
              },
              {
                tier: "PORTAL PRO",
                price: "$19",
                period: "facturado mensualmente",
                desc: "Acceso ilimitado para alumnos comprometidos con la reestructuración de su conciencia.",
                features: ["Consultas ilimitadas con IA", "Acceso a las 621 conferencias", "Compilador de Libros ilimitado", "Soporte prioritario"],
                highlight: true,
              },
              {
                tier: "PATROCINADOR",
                price: "$49",
                period: "donación mensual",
                desc: "Apoya a la comunidad y patrocina becas de estudio para otros miembros en el portal.",
                features: ["Acceso total ilimitado", "Sesiones grupales de estudio", "Insignia de patrocinador", "Financiamiento de becas"],
                highlight: false,
              },
            ].map((plan, i) => (
              <div key={i} className={`swiss-pricing-card ${plan.highlight ? "swiss-pricing-card--highlighted" : ""}`}>
                {plan.highlight && <span className="swiss-pricing-tag">Popular</span>}
                <div>
                  <h3 className="swiss-pricing-tier">{plan.tier}</h3>
                  <div className="swiss-pricing-price">
                    {plan.price}
                    <span className="swiss-pricing-period"> / {plan.period}</span>
                  </div>
                  <p className="swiss-pricing-desc">{plan.desc}</p>
                  <ul className="swiss-pricing-features">
                    {plan.features.map((feat, fi) => (
                      <li key={fi} className="swiss-pricing-feature-item">{feat}</li>
                    ))}
                  </ul>
                </div>
                <button className="swiss-pricing-btn" onClick={() => setShowApp(true)}>
                  Comenzar Ahora →
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="swiss-faq-section">
          <div className="swiss-faq-header">
            <div className="swiss-section-number">07. SOPORTE</div>
            <h2 className="swiss-faq-title">PREGUNTAS FRECUENTES</h2>
          </div>
          <div className="swiss-faq-grid">
            {[
              {
                q: "¿Qué es la ley de la asunción?",
                a: "Es la enseñanza de que asumir el sentimiento del deseo cumplido provoca que la mente subconsciente proyecte y materialice ese estado en tu realidad física externa.",
                num: "01",
              },
              {
                q: "¿Quién fue Neville Goddard?",
                a: "Un conferencista y místico del siglo XX cuyas enseñanzas se enfocan en que la imaginación humana es Dios operando en el hombre, y que creamos nuestra realidad mediante nuestra atención y conciencia.",
                num: "02",
              },
              {
                q: "¿Cómo funciona el compilador de libros?",
                a: "El compilador reúne de forma estructurada tus conversaciones con el Instructor/Narrador y tus resultados de exámenes en la base de datos para generar un archivo Markdown único y descargable.",
                num: "03",
              },
              {
                q: "¿El portal es de acceso inmediato?",
                a: "Sí. Registrarte de forma gratuita te otorga acceso inmediato al Aula Virtual, a las lecturas seleccionadas del Archivo de Luz y a las pruebas conceptuales.",
                num: "04",
              },
            ].map((faq, i) => (
              <div key={i} className="swiss-faq-card">
                <div className="swiss-faq-top">
                  <div className="swiss-faq-question-wrapper">
                    <span className="swiss-faq-num">{faq.num}</span>
                    <h3 className="swiss-faq-question">{faq.q}</h3>
                  </div>
                  <span className="swiss-faq-icon">+</span>
                </div>
                <p className="swiss-faq-answer">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Blog Section */}
        <section id="blog" className="swiss-blog-section">
          <div className="swiss-blog-sidebar">
            <div>
              <div className="swiss-section-number">08. BLOG</div>
              <h2 className="swiss-blog-sidebar-title">Notas de Anima</h2>
              <p className="swiss-blog-sidebar-text">
                Ideas breves sobre imaginación, práctica diaria, planes guiados y diseño de libros personales.
              </p>
            </div>
            <button className="swiss-landing-cta" style={{ width: "100%", marginTop: "32px" }} onClick={() => document.getElementById("blog")?.scrollIntoView({ behavior: "smooth" })}>
              Ver notas
            </button>
          </div>
          <div className="swiss-blog-grid">
            {[
              {
                date: "04 JUN 2026",
                title: "CÓMO DISEÑAR UN PLAN DE IMAGINACIÓN DE 7 DÍAS",
              },
              {
                date: "28 MAY 2026",
                title: "MATERIAL DE ESTUDIO: CÓMO LEER SIN DISPERSARTE",
              },
              {
                date: "15 MAY 2026",
                title: "DE CONVERSACIÓN A LIBRO PERSONAL: EL MÉTODO ANIMA",
              },
            ].map((post, i) => (
              <div key={i} className="swiss-blog-card">
                <div>
                  <span className="swiss-blog-date">{post.date}</span>
                  <h3 className="swiss-blog-title">{post.title}</h3>
                </div>
                <span className="swiss-blog-link">Leer nota →</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="swiss-footer">
          <div className="swiss-footer-grid">
            <div className="swiss-footer-brand">
              <h2 className="swiss-footer-logo-title">Anima</h2>
              <p className="swiss-footer-tagline">
                Tu compañero de imaginación. Un espacio privado para practicar, recibir seguimiento y diseñar tu libro personal.
              </p>
            </div>
            <div>
              <h4 className="swiss-footer-col-title">Portal</h4>
              <ul className="swiss-footer-links">
                <li><button onClick={() => { setShowApp(true); setCurrentTab("aula"); }}>Aula</button></li>
                <li><button onClick={() => { setShowApp(true); setCurrentTab("biblioteca"); }}>Archivo</button></li>
                <li><button onClick={() => { setShowApp(true); setCurrentTab("examenes"); }}>Exámenes</button></li>
                <li><button onClick={() => { setShowApp(true); setCurrentTab("libro"); }}>Compilador</button></li>
              </ul>
            </div>
            <div>
              <h4 className="swiss-footer-col-title">Legal</h4>
              <ul className="swiss-footer-links">
                <li><a href="#terminos" onClick={(e) => { e.preventDefault(); alert("Universidad de la Imaginación - Ley y Promesa"); }}>Términos de Uso</a></li>
                <li><a href="#privacidad" onClick={(e) => { e.preventDefault(); alert("Universidad de la Imaginación - Privacidad Respetada"); }}>Privacidad</a></li>
              </ul>
            </div>
            <div className="swiss-footer-newsletter">
              <h4 className="swiss-footer-col-title">Correspondencia</h4>
              <input
                type="email"
                placeholder="TU-CORREO@DOMINIO.COM"
                className="swiss-footer-email-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    alert("¡Suscrito a la correspondencia!");
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
          </div>
          <div className="swiss-footer-bottom">
            <span className="swiss-footer-copy">
              © {new Date().getFullYear()} UNIVERSIDAD DE LA IMAGINACIÓN. BASADO EN LAS ENSEÑANZAS DE NEVILLE GODDARD.
            </span>
            <div className="swiss-footer-socials">
              <button className="swiss-footer-social-btn" onClick={() => alert("Compartir en Twitter")} aria-label="Twitter">TW</button>
              <button className="swiss-footer-social-btn" onClick={() => alert("Compartir en LinkedIn")} aria-label="LinkedIn">LI</button>
              <button className="swiss-footer-social-btn" onClick={() => alert("Compartir en GitHub")} aria-label="GitHub">GH</button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flux-container">
      
      {/* 1. SIDEBAR (Left panel en oscuro #1E1E1E) */}
      <aside className="flux-sidebar">
        <div>
          {/* Logo */}
          <div className="flux-logo" onClick={() => setShowApp(false)} style={{ cursor: "pointer" }}>
            <div className="flux-logo-icon">
              <GraduationCap aria-hidden="true" />
            </div>
            <span>Uni de la Imaginación</span>
          </div>

          {/* Menú de navegación */}
          <nav className="flux-nav">
            <button
              onClick={() => setCurrentTab("panel")}
              className={`flux-nav__link ${currentTab === "panel" ? "flux-nav__link--active" : ""}`}
            >
              <HomeIcon aria-hidden="true" />
              <span style={{ flex: 1 }}>Inicio</span>
            </button>

            <button
              onClick={() => setCurrentTab("aula")}
              className={`flux-nav__link ${currentTab === "aula" ? "flux-nav__link--active" : ""}`}
            >
              <MessageSquareText aria-hidden="true" />
              <span style={{ flex: 1 }}>Aula</span>
              <span className="flux-nav__badge">3</span>
            </button>

            <button
              onClick={() => setCurrentTab("biblioteca")}
              className={`flux-nav__link ${currentTab === "biblioteca" ? "flux-nav__link--active" : ""}`}
            >
              <Library aria-hidden="true" />
              <span style={{ flex: 1 }}>Archivo</span>
            </button>

            <button
              onClick={() => setCurrentTab("examenes")}
              className={`flux-nav__link ${currentTab === "examenes" ? "flux-nav__link--active" : ""}`}
            >
              <Trophy aria-hidden="true" />
              <span style={{ flex: 1 }}>Sala de Exámenes</span>
              <span className="flux-nav__badge">1</span>
            </button>

            <button
              onClick={() => setCurrentTab("libro")}
              className={`flux-nav__link ${currentTab === "libro" ? "flux-nav__link--active" : ""}`}
            >
              <NotebookTabs aria-hidden="true" />
              <span style={{ flex: 1 }}>Compilación</span>
            </button>

            <button
              onClick={() => setCurrentTab("memoria")}
              className={`flux-nav__link ${currentTab === "memoria" ? "flux-nav__link--active" : ""}`}
            >
              <History aria-hidden="true" />
              <span style={{ flex: 1 }}>Memoria</span>
            </button>

            <button
              onClick={() => setCurrentTab("planes")}
              className={`flux-nav__link ${currentTab === "planes" ? "flux-nav__link--active" : ""}`}
            >
              <MapIconLucide aria-hidden="true" />
              <span style={{ flex: 1 }}>Planes</span>
            </button>

            <button
              onClick={() => setCurrentTab("perfil")}
              className={`flux-nav__link ${currentTab === "perfil" ? "flux-nav__link--active" : ""}`}
            >
              <UserCog aria-hidden="true" />
              <span style={{ flex: 1 }}>Perfil</span>
            </button>
          </nav>
        </div>

        {/* Upgrade to Pro Card */}
        <div className="mt-auto mb-6" style={{ width: "100%" }}>
          <div className="flux-upgrade-card">
            <h3 className="flux-upgrade-card__title">Mejora a Pro</h3>
            <p className="flux-upgrade-card__desc">Mejora tu cuenta para una experiencia más completa.</p>
            <button className="flux-upgrade-card__button">
              Mejorar Ahora
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN PANEL (Right side panel en gris claro #EFEFEF) */}
      <main className="flux-panel">
        
        {/* Header con Perfil de Germán Gonzalez */}
        <header className="flux-header">
          <div className="flux-profile">
            <div className="flux-profile__avatar" style={{ width: "48px", height: "48px", border: "2px solid var(--swiss-border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--swiss-muted)" }}>
              <UserRound aria-hidden="true" />
            </div>
            <div className="flux-profile__info">
              <span className="flux-profile__name" style={{ fontSize: "16px", fontWeight: "bold", color: "#131313", display: "flex", alignItems: "center", gap: "6px" }}>
                Germán Gonzalez
                <ChevronDown aria-hidden="true" style={{ width: "14px", height: "14px" }} />
              </span>
              <span className="flux-profile__email" style={{ fontSize: "13px", color: "var(--flux-text-muted)" }}>alumno@unimaginacion.edu</span>
            </div>
          </div>

          <div className="flux-header-actions">
            {/* Buscador */}
            <div className="flux-search-bar">
              <SearchIcon aria-hidden="true" />
              <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* Stats */}
            <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--flux-text-muted)", marginLeft: "12px", marginRight: "12px" }}>
              {questionsCount} / 200 consultas mes
            </span>

            {/* Notificaciones */}
            <button className="flux-icon-btn" aria-label="Notificaciones">
              <Bell aria-hidden="true" />
              <div className="flux-icon-btn__dot" />
            </button>
          </div>
        </header>

        {/* ──── VISTA DINÁMICA SEGÚN PESTAÑA SELECCIONADA ──── */}

        {/* 1. DASHBOARD / PANEL PRINCIPAL */}
        {currentTab === "panel" && (
          <>
            <section className="flux-title-block">
              <div>
                <h1 className="flux-title">Tu Panel de Estudio</h1>
                <p className="flux-subtitle">Progreso académico, lecturas cruzadas y estados de estudio.</p>
              </div>

              <div className="flux-date-selector">
                <span>12 July, 2024</span>
                <div className="flux-dropdown-pill">
                  <span>Today</span>
                  <ChevronDown aria-hidden="true" />
                </div>
              </div>
            </section>

            <div className="flux-grid">
              
              {/* Tarjeta 1: Uso del Sistema (Doble Alto) */}
              <div className="flux-card flux-card--double">
                <div className="flux-card__header">
                  <span className="flux-card__title">
                    <Activity aria-hidden="true" />
                    Uso del Sistema
                  </span>
                  <span className="flux-card__dots">•••</span>
                </div>

                <div>
                  <div className="flex items-baseline">
                    <span className="flux-card__val">{questionsCount}</span>
                    <span className="flux-card__badge">/ 200 consultas</span>
                  </div>
                </div>

                {/* Icono de actividad limpio y común */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "140px", margin: "12px 0" }}>
                  <Sparkles className="flux-hero-icon" aria-hidden="true" />
                </div>

                {/* Lista de barras de progreso */}
                <div className="flux-progress-list">
                  <div className="flux-progress-item">
                    <span className="flux-progress-item__val">{Math.round((questionsCount / 200) * 100)}%</span>
                    <div className="flux-progress-bar">
                      <div className="flux-progress-bar__fill" style={{ width: `${(questionsCount / 200) * 100}%`, backgroundColor: "var(--flux-lavender)" }} />
                    </div>
                    <span className="flux-progress-item__label">
                      <span className="flux-progress-item__dot" style={{ backgroundColor: "var(--flux-lavender)" }} />
                      Consultas
                    </span>
                  </div>

                  <div className="flux-progress-item">
                    <span className="flux-progress-item__val">{examScore !== null ? "100%" : "0%"}</span>
                    <div className="flux-progress-bar">
                      <div className="flux-progress-bar__fill" style={{ width: examScore !== null ? "100%" : "0%", backgroundColor: "var(--flux-dark-container)" }} />
                    </div>
                    <span className="flux-progress-item__label">
                      <span className="flux-progress-item__dot" style={{ backgroundColor: "var(--flux-dark-container)" }} />
                      Exámenes
                    </span>
                  </div>

                  <div className="flux-progress-item">
                    <span className="flux-progress-item__val">{compiledBookTitle ? "100%" : "0%"}</span>
                    <div className="flux-progress-bar">
                      <div className="flux-progress-bar__fill" style={{ width: compiledBookTitle ? "100%" : "0%", backgroundColor: "var(--flux-lime)" }} />
                    </div>
                    <span className="flux-progress-item__label">
                      <span className="flux-progress-item__dot" style={{ backgroundColor: "var(--flux-lime)" }} />
                      Libros
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Archivo Conectado */}
              <div className="flux-card">
                <div className="flux-card__header">
                  <span className="flux-card__title">
                    <BookOpen aria-hidden="true" />
                    Archivo Conectado
                  </span>
                  <span className="flux-card__dots">•••</span>
                </div>

                <div>
                  <span className="flux-card__val">621</span>{" "}
                  <span className="text-xs font-semibold text-stone-400">Clases</span>
                  <p className="text-[10px] text-stone-500 mt-2 font-medium">✓ Listos para el Narrador</p>
                </div>

                {/* Cuadrícula de bienestar estética */}
                <div className="flux-dots-grid">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flux-dot ${
                        [1, 3, 5, 8, 12, 14, 17, 19, 22, 25, 28, 30, 31, 33, 36, 38].includes(i)
                          ? "flux-dot--active"
                          : ""
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Tarjeta 3: Siguiente Evaluación */}
              <div className="flux-card">
                <div className="flux-card__header">
                  <span className="flux-card__title">
                    <Bot aria-hidden="true" />
                    Siguiente Evaluación
                  </span>
                  <span className="flux-card__dots">•••</span>
                </div>

                <div>
                  <h4 className="text-[13px] font-bold text-[#131313] truncate">Basado en Charla: La Fe (1968)</h4>
                  <p className="text-[10px] text-stone-400 mt-1 font-medium">3 preguntas de opción múltiple</p>
                </div>

                <button
                  onClick={() => setCurrentTab("examenes")}
                  className="flux-btn-primary"
                >
                  Rendir Examen
                </button>
              </div>

              {/* Tarjeta 4: Compilar mi Libro (Oscura) */}
              <div className="flux-card flux-card--dark-horizontal">
                <div className="flux-sleep-left">
                  <span className="flux-card__title">Módulo de Compilación</span>
                  <div>
                    <h3 className="text-base font-bold text-white">Generar Libro de Luz</h3>
                    <p className="text-[10.5px] text-[#A0A0A5] mt-1 leading-relaxed">
                      Compila de forma inteligente tus conversaciones y exámenes en un libro único.
                    </p>
                  </div>

                  <div className="flux-compiler-row">
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="flux-compiler-select"
                    >
                      <option>La Fe</option>
                      <option>Los Estados de Conciencia</option>
                      <option>La Imaginación Creadora</option>
                    </select>
                    <button
                      onClick={() => {
                        setCurrentTab("libro");
                        handleCompilarLibro();
                      }}
                      className="flux-compiler-btn"
                    >
                      Generar
                    </button>
                  </div>
                </div>

                {/* Gráfico estético derecho en la tarjeta oscura */}
                <div className="flux-chart-container">
                  {[
                    { label: "Jun", stripedVal: 35, val: 20 },
                    { label: "Jul", stripedVal: 45, val: 25 },
                    { label: "Aug", stripedVal: 30, val: 15 },
                    { label: "Sept", active: true, limeVal: 80, lavenderVal: 60 },
                    { label: "Oct", stripedVal: 35, val: 18 },
                    { label: "Nov", stripedVal: 40, val: 20 },
                  ].map((col, idx) => (
                    <div
                      key={idx}
                      className={`flux-chart-col ${col.active ? "flux-chart-col--active" : ""}`}
                    >
                      <div className="flux-chart-bars">
                        {col.active ? (
                          <>
                            <div className="flux-bar flux-bar--lime" style={{ height: `${col.limeVal}%` }} />
                            <div className="flux-bar flux-bar--lavender" style={{ height: `${col.lavenderVal}%` }} />
                          </>
                        ) : (
                          <>
                            <div className="flux-bar flux-bar--striped" style={{ height: `${col.stripedVal}%` }} />
                            <div className="flux-bar flux-bar--striped" style={{ height: `${col.val}%` }} />
                          </>
                        )}
                      </div>
                      <span className="flux-chart-label" style={{ color: col.active ? "#FFFFFF" : "#7d7d82" }}>{col.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}

        {/* 2. EL AULA (CHAT RAG INTEGRADO) */}
        {currentTab === "aula" && (
          <div className="flux-chat-container">
            {/* Header del Chat */}
            <div className="flux-chat-header">
              <div>
                <span className="flux-chat-header__eyebrow">Centro de mando</span>
                <h2 className="flux-chat-header__title">Anima</h2>
              </div>

              <div className="flux-chat-agents">
                <button
                  onClick={() => setAgent("profesor")}
                  className={`flux-chat-btn ${agent === "profesor" ? "flux-chat-btn--active" : ""}`}
                >
                  Instructor
                </button>
                <button
                  onClick={() => setAgent("cuentacuentos")}
                  className={`flux-chat-btn ${agent === "cuentacuentos" ? "flux-chat-btn--active" : ""}`}
                >
                  Narrador
                </button>
              </div>
            </div>

            <div className="flux-chat-command-bar">
              <div className="flux-memory-control">
                <span className="flux-command-label">Memoria</span>
                <button
                  type="button"
                  onClick={() => setUseMemory((value) => !value)}
                  className={`flux-memory-switch ${useMemory ? "flux-memory-switch--active" : ""}`}
                  aria-pressed={useMemory}
                >
                  <span />
                </button>
                <strong>{useMemory ? "Activa" : "Solo esta charla"}</strong>
              </div>

              <div className="flux-mode-control">
                <span className="flux-command-label">Modo</span>
                <select
                  value={chatMode}
                  onChange={(event) => setChatMode(event.target.value as ChatModeId)}
                  className="flux-mode-select"
                  aria-label="Modo de trabajo"
                >
                  {chatModes.map((mode) => (
                    <option key={mode.id} value={mode.id}>{mode.label}</option>
                  ))}
                </select>
                <span className="flux-mode-current">
                  {chatModes.find((mode) => mode.id === chatMode)?.desc}
                </span>
              </div>
            </div>

            {/* Banner de Contexto de Lectura Prioritaria */}
            {selectedClassContext && (
              <div className="flux-chat-context-banner">
                <span>📖 Clase prioritaria activa: <strong>{selectedClassContext.titulo}</strong></span>
                <button
                  onClick={() => setSelectedClassContext(null)}
                  className="flux-chat-context-banner__close"
                  title="Limpiar lectura prioritaria"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            {/* Historial de Mensajes */}
            <div className="flux-chat-messages">
              {messages.length === 0 ? (
                <div className="flux-chat-empty">
                  <div className="flux-chat-empty__copy">
                    <span className="flux-chat-empty__label">Tu espacio privado de imaginación</span>
                    <h3>Trabajá desde una sola conversación.</h3>
                    <p>
                      Pedile a Anima que conecte memoria, material de estudio, pruebas, planes, diario, Telegram, libros y presentaciones.
                    </p>
                  </div>

                  <div className="flux-chat-actions-grid">
                    {chatModes.map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setChatMode(mode.id);
                          setInput(mode.prompt);
                          textareaRef.current?.focus();
                        }}
                        className={`flux-chat-action-card ${chatMode === mode.id ? "flux-chat-action-card--active" : ""}`}
                      >
                        <span>{mode.label}</span>
                        <small>{mode.desc}</small>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flux-bubble ${
                      msg.role === "user" ? "flux-bubble--user" : "flux-bubble--agent"
                    }`}
                  >
                    {parseMarkdown(msg.content)}
                  </div>
                ))
              )}

              {/* Indicador de Carga */}
              {loading && (
                <div className="flux-bubble flux-bubble--agent">
                  <div className="flux-typing">
                    <span className="flux-typing-dot" />
                    <span className="flux-typing-dot" />
                    <span className="flux-typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Caja de Entrada de Chat */}
            <div className="flux-chat-input-area">
              <form onSubmit={handleSend} className="flux-chat-input-container">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    chatMode === "conversar"
                      ? "Preguntá algo o pedí que conecte ideas de tu memoria..."
                      : chatModes.find((mode) => mode.id === chatMode)?.prompt
                  }
                  rows={1}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="flux-chat-send-btn"
                  disabled={!input.trim() || loading}
                >
                  ✦
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 3. BIBLIOTECA DE TEXTOS */}
        {currentTab === "biblioteca" && (
          <div className="flex-1 flex flex-col">
            <header className="content-header" style={{ marginBottom: "16px" }}>
              <h2 className="flux-title" style={{ fontSize: "20px" }}>Archivo de Textos</h2>
              <p className="flux-subtitle">Navega y lee cada uno de los 621 documentos recopilados de Neville Goddard.</p>
            </header>

            {/* Buscador de lecciones */}
            <div className="library-search" style={{ marginBottom: "16px" }}>
              <svg className="w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por título de conferencia o título original..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Grid de archivos .md */}
            {loadingLib ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyItems: "center", justifyContent: "center", flex: 1, padding: "40px" }}>
                <CargandoCerebro label="Cargando biblioteca..." />
              </div>
            ) : (
              <div className="flux-lib-grid">
                {textosFiltrados.length === 0 ? (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "12px" }}>
                    No se encontraron conferencias con ese título.
                  </div>
                ) : (
                  textosFiltrados.map((texto, idx) => (
                    <div
                      key={idx}
                      onClick={() => abrirTexto(texto)}
                      className="flux-class-card"
                    >
                      <h4 className="flux-class-title">{texto.titulo}</h4>
                      <div className="flux-class-meta">
                        <span className="flux-class-badge">Año: {texto.anio}</span>
                        {texto.tituloOriginal && (
                          <span className="flux-class-badge" style={{ fontStyle: "italic", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {texto.tituloOriginal}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. SALA DE EXÁMENES */}
        {currentTab === "examenes" && (
          <div>
            <header className="content-header" style={{ marginBottom: "20px" }}>
              <h2 className="flux-title" style={{ fontSize: "20px" }}>Sala de Exámenes</h2>
              <p className="flux-subtitle">Pon a prueba tu asunción y tu comprensión conceptual de la doctrina.</p>
            </header>

            {!examStarted ? (
              <div className="flux-exam-container">
                <h3 className="flux-exam-title">Examen de Doctrina</h3>
                <p className="flux-exam-desc">
                  La IA generará 3 preguntas de opción múltiple basadas en el material de la biblioteca.
                </p>
                <button
                  onClick={generarExamen}
                  className="flux-btn-primary"
                  style={{ width: "100%", padding: "12px" }}
                  disabled={examLoading}
                >
                  {examLoading ? "Generando examen..." : "Comenzar Evaluación"}
                </button>
              </div>
            ) : examLoading ? (
              <div className="flux-exam-container" style={{ textAlign: "center", padding: "40px" }}>
                <CargandoCerebro label="La IA está preparando tu examen..." />
              </div>
            ) : examQuestions.length === 0 ? (
              <div className="flux-exam-container" style={{ textAlign: "center", padding: "40px" }}>
                <p className="text-sm text-stone-500">No se pudieron generar preguntas. Intentá de nuevo.</p>
                <button onClick={resetearExamen} className="flux-btn-primary" style={{ marginTop: 16 }}>
                  Volver
                </button>
              </div>
            ) : (
              <div className="flux-exam-container">
                {examQuestions.map((p: any, idx: number) => (
                  <div key={p.id} style={{ marginBottom: "20px" }}>
                    <h4 className="font-bold text-[13px] mb-3 text-stone-900 leading-snug">
                      {idx + 1}. {p.pregunta}
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {p.opciones.map((opc: string, opcIdx: number) => (
                        <button
                          key={opcIdx}
                          onClick={() => {
                            if (examScore !== null) return;
                            setAnswers((prev) => ({ ...prev, [p.id]: opcIdx }));
                          }}
                          className={`flux-exam-option ${
                            answers[p.id] === opcIdx ? "flux-exam-option--selected" : ""
                          }`}
                          disabled={examScore !== null}
                        >
                          {opc}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flux-card__header" style={{ marginTop: "24px" }}>
                  {examScore === null ? (
                    <>
                      <button onClick={resetearExamen} className="flux-btn-secondary">
                        Cancelar
                      </button>
                      <button
                        onClick={corregirExamen}
                        className="flux-btn-primary"
                        style={{ marginTop: 0 }}
                        disabled={Object.keys(answers).length < examQuestions.length}
                      >
                        Entregar Examen
                      </button>
                    </>
                  ) : (
                    <div style={{ width: "100%", textAlign: "center" }}>
                      <div style={{ padding: "16px", background: "var(--swiss-muted)", border: "2px solid var(--swiss-border)", marginBottom: "16px" }}>
                        <h4 className="text-sm font-bold text-stone-900 mb-1 uppercase tracking-wider">
                          Resultado
                        </h4>
                        <p className="text-xl font-bold mb-2">
                          {examScore} / {examQuestions.length} correctas
                        </p>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          {examScore === examQuestions.length
                            ? "Excelente asunción doctrinal."
                            : "Repasá los textos del Archivo y volvé a intentarlo."}
                        </p>
                      </div>
                      <button onClick={resetearExamen} className="flux-btn-primary" style={{ width: "100%", marginTop: 0 }}>
                        Intentar de Nuevo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. COMPILAR MI LIBRO */}
        {currentTab === "libro" && (
          <div>
            <header className="content-header" style={{ marginBottom: "20px" }}>
              <h2 className="flux-title" style={{ fontSize: "20px" }}>Compilar mi Libro</h2>
              <p className="flux-subtitle">Crea un libro personalizado basado en tus charlas y exámenes aprobados.</p>
            </header>

            <div className="flux-exam-container" style={{ maxWidth: "620px" }}>
              <h3 className="flux-exam-title" style={{ textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>✨</span> Libro de Luz Personalizado
              </h3>
                <p className="flux-exam-desc" style={{ textAlign: "left", fontSize: "12px", marginTop: "6px" }}>
                  El sistema compila hasta 5 textos relacionados con el eje temático y genera un libro Markdown descargable.
                </p>

              {compilingStep === -1 && !compiledBookTitle && (
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", marginTop: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">Eje Temático</label>
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="flux-compiler-select"
                      style={{ width: "100%", boxSizing: "border-box" }}
                    >
                      <option>La Fe</option>
                      <option>Los Estados de Conciencia</option>
                      <option>La Imaginación Creadora</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCompilarLibro}
                    className="flux-compiler-btn"
                    style={{ padding: "10px 20px" }}
                  >
                    Generar Libro
                  </button>
                </div>
              )}

              {/* Animación de carga */}
              {compilingStep !== -1 && (
                <div style={{ padding: "16px 0", textAlign: "center" }}>
                  <CargandoCerebro />
                  <p className="text-xs font-bold text-stone-900 mb-1">Compilando tu Libro de Luz...</p>
                  <p className="text-[11px] text-stone-400 font-medium">
                    {[
                      "Recuperando textos del Archivo...",
                      "Generando narrativa con IA...",
                      "Compilando Libro de Luz...",
                      "Finalizando documento..."
                    ][compilingStep]}
                  </p>
                </div>
              )}

              {/* Resultado del libro generado */}
              {compiledBookTitle && compilingStep === -1 && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ width: "40px", height: "40px", border: "2px solid var(--swiss-border)", background: "var(--swiss-muted)", color: "var(--swiss-accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontWeight: "bold", fontSize: "16px" }}>
                    ✓
                  </div>
                  <h4 className="text-sm font-bold text-stone-950 mb-1 uppercase tracking-wider">¡Libro compilado con éxito!</h4>
                  <p className="text-[11px] text-stone-500 mb-4">{compiledBookTitle}</p>
                  
                  <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                    <button
                      onClick={() => {
                        setCompiledBookTitle(null);
                        setAnswers({});
                      }}
                      className="flux-btn-secondary"
                    >
                      Compilar Otro
                    </button>
                    <button
                      onClick={handleDescargarLibro}
                      className="flux-btn-primary"
                      style={{ marginTop: 0, fontSize: "11px" }}
                    >
                      Descargar Documento
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. MEMORIA */}
        {currentTab === "memoria" && (
          <div>
            <header className="content-header" style={{ marginBottom: "20px" }}>
              <h2 className="flux-title" style={{ fontSize: "20px" }}>Mi Memoria</h2>
              <p className="flux-subtitle">Historial de sesiones, exámenes y libros compilados.</p>
            </header>

            {loadingMemoria ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0" }}>
                <CargandoCerebro label="Cargando memoria..." />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Sesiones recientes */}
                <div className="flux-exam-container">
                  <h3 className="flux-exam-title" style={{ fontSize: "14px", marginBottom: "12px" }}>Conversaciones recientes</h3>
                  {memoriaSessions.length === 0 ? (
                    <p className="text-[11px] text-stone-400">Todavía no hay conversaciones guardadas.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {memoriaSessions.slice(0, 10).map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => cargarSesionHistorial(s.id)}
                          className="flux-chat-option"
                          style={{ textAlign: "left", padding: "10px 12px", fontSize: "12px", cursor: "pointer" }}
                        >
                          <div className="font-bold text-stone-900 text-[12px] truncate">
                            {s.title || "Sin título"}
                          </div>
                          <div className="text-[10px] text-stone-400 mt-1">
                            {s.agent === "cuentacuentos" ? "Narrador" : "Instructor"} · {new Date(s.updated_at).toLocaleDateString("es-AR")}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exámenes */}
                <div className="flux-exam-container">
                  <h3 className="flux-exam-title" style={{ fontSize: "14px", marginBottom: "12px" }}>Exámenes rendidos</h3>
                  {memoriaExams.length === 0 ? (
                    <p className="text-[11px] text-stone-400">Todavía no rendiste ningún examen.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {memoriaExams.map((e: any) => (
                        <div key={e.id} style={{ padding: "10px 12px", fontSize: "12px", borderBottom: "1px solid var(--swiss-border)" }}>
                          <div className="font-bold text-stone-900 text-[12px] truncate">{e.title_es}</div>
                          <div className="text-[10px] text-stone-400 mt-1">
                            {e.score}/{e.max_score} correctas · {new Date(e.completed_at || e.created_at).toLocaleDateString("es-AR")}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Libros compilados */}
                <div className="flux-exam-container">
                  <h3 className="flux-exam-title" style={{ fontSize: "14px", marginBottom: "12px" }}>Libros compilados</h3>
                  {memoriaBooks.length === 0 ? (
                    <p className="text-[11px] text-stone-400">Todavía no compilaste ningún libro.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {memoriaBooks.map((b: any) => (
                        <div key={b.id} style={{ padding: "10px 12px", fontSize: "12px", borderBottom: "1px solid var(--swiss-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div className="font-bold text-stone-900 text-[12px] truncate">{b.title_es}</div>
                            <div className="text-[10px] text-stone-400 mt-1">
                              {b.topic_es} · {new Date(b.created_at).toLocaleDateString("es-AR")}
                            </div>
                          </div>
                          {b.content_markdown_es && (
                            <button
                              onClick={() => {
                                const blob = new Blob([b.content_markdown_es], { type: "text/markdown;charset=utf-8;" });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.setAttribute("download", `${b.title_es}.md`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="flux-btn-primary"
                              style={{ fontSize: "10px", padding: "4px 10px", margin: 0 }}
                            >
                              Descargar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. PLANES */}
        {currentTab === "planes" && (
          <div>
            <header className="content-header" style={{ marginBottom: "20px" }}>
              <h2 className="flux-title" style={{ fontSize: "20px" }}>Planes Personalizados</h2>
              <p className="flux-subtitle">Prácticas guiadas de 7, 15 o 30 días diseñadas para tu crecimiento.</p>
            </header>

            {loadingPlanes ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0" }}>
                <CargandoCerebro label="Cargando planes..." />
              </div>
            ) : planes.length === 0 ? (
              <div className="flux-exam-container" style={{ textAlign: "center", padding: "40px" }}>
                <MapIconLucide size={32} className="text-stone-300 mb-3" style={{ margin: "0 auto 12px" }} />
                <h4 className="text-sm font-bold text-stone-900 mb-2">Todavía no hay planes</h4>
                <p className="text-[11px] text-stone-500 mb-4">Usá el modo <strong>Plan</strong> en el Aula para que la IA diseñe una práctica personalizada.</p>
                <button
                  onClick={() => setCurrentTab("aula")}
                  className="flux-btn-primary"
                >
                  Ir al Aula
                </button>
              </div>
            ) : (
              <div className="flux-lib-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {planes.map((p: any) => (
                  <div key={p.id} className="flux-exam-container" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <h4 className="font-bold text-[13px] text-stone-900 leading-snug">{p.title_es}</h4>
                    {p.description_es && (
                      <p className="text-[11px] text-stone-500 leading-relaxed">{p.description_es}</p>
                    )}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                      <span className="flux-class-badge">{p.duration_days} días</span>
                      <span className="flux-class-badge">{p.level === "intro" ? "Inicial" : p.level === "intermediate" ? "Intermedio" : "Avanzado"}</span>
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--swiss-text-muted)", marginBottom: "4px" }}>
                        <span>Progreso</span>
                        <span>0%</span>
                      </div>
                      <div className="flux-progress-bar" style={{ height: "4px" }}>
                        <div className="flux-progress-bar__fill" style={{ width: "0%", backgroundColor: "var(--swiss-accent)" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. PERFIL */}
        {currentTab === "perfil" && (
          <div>
            <header className="content-header" style={{ marginBottom: "20px" }}>
              <h2 className="flux-title" style={{ fontSize: "20px" }}>Mi Perfil</h2>
              <p className="flux-subtitle">Información personal y estadísticas de estudio.</p>
            </header>

            <div className="flux-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {/* Info personal */}
              <div className="flux-card">
                <div className="flux-card__header">
                  <span className="flux-card__title">
                    <UserRound aria-hidden="true" />
                    Información
                  </span>
                </div>
                <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Nombre</span>
                    <p className="text-[13px] font-bold text-stone-900">Germán Gonzalez</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Email</span>
                    <p className="text-[13px] text-stone-700">german@unimaginacion.edu</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Miembro desde</span>
                    <p className="text-[13px] text-stone-700">Junio 2026</p>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="flux-card">
                <div className="flux-card__header">
                  <span className="flux-card__title">
                    <Activity aria-hidden="true" />
                    Estadísticas
                  </span>
                </div>
                <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Consultas</span>
                    <p className="text-[13px] font-bold text-stone-900">{questionsCount} / 200 este mes</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Exámenes rendidos</span>
                    <p className="text-[13px] font-bold text-stone-900">{memoriaExams.length}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Libros compilados</span>
                    <p className="text-[13px] font-bold text-stone-900">{memoriaBooks.length}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Textos en archivo</span>
                    <p className="text-[13px] font-bold text-stone-900">621</p>
                  </div>
                </div>
              </div>

              {/* Configuración */}
              <div className="flux-card" style={{ gridColumn: "1 / -1" }}>
                <div className="flux-card__header">
                  <span className="flux-card__title">
                    <UserCog aria-hidden="true" />
                    Configuración
                  </span>
                </div>
                <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="text-[12px] font-bold text-stone-900">Agente por defecto</span>
                    <select
                      value={agent}
                      onChange={(e) => setAgent(e.target.value as AgenteId)}
                      className="flux-mode-select"
                      style={{ width: "auto", fontSize: "11px" }}
                    >
                      <option value="profesor">Instructor</option>
                      <option value="cuentacuentos">Narrador</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="text-[12px] font-bold text-stone-900">Memoria activa</span>
                    <button
                      type="button"
                      onClick={() => setUseMemory((v) => !v)}
                      className={`flux-memory-switch ${useMemory ? "flux-memory-switch--active" : ""}`}
                      aria-pressed={useMemory}
                    >
                      <span />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 3. MODAL DE LECTURA (Lector interactivo de Markdown) */}
      {selectedText && (
        <div className="flux-modal-overlay" onClick={cerrarTexto}>
          <div className="flux-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flux-modal-header">
              <div>
                <h3 className="flux-modal-title">{selectedText.titulo}</h3>
                {selectedText.tituloOriginal && (
                  <p className="text-[10px] text-stone-400 font-medium mt-1">
                    Original: {selectedText.tituloOriginal} | Año: {selectedText.anio}
                  </p>
                )}
              </div>
              <button onClick={cerrarTexto} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flux-modal-body">
              {loadingDetail ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0" }}>
                  <CargandoCerebro small label="Cargando contenido..." />
                </div>
              ) : textDetail ? (
                parseMarkdown(textDetail)
              ) : (
                <p>No se pudo cargar el texto.</p>
              )}
            </div>

            <div className="flux-modal-footer">
              <button
                onClick={cerrarTexto}
                className="flux-btn-secondary"
                style={{ padding: "8px 16px", fontSize: "12px", cursor: "pointer", background: "none" }}
              >
                Cerrar lección
              </button>
              <button
                onClick={() => handleEstudiarClase(selectedText)}
                className="flux-btn-primary"
                style={{ marginTop: 0 }}
              >
                Estudiar esta clase
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Bottom Navigation Bar */}
      <nav className="flux-mobile-nav">
        <button
          onClick={() => setCurrentTab("panel")}
          className={`flux-mobile-nav__link ${currentTab === "panel" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Inicio</span>
        </button>

        <button
          onClick={() => setCurrentTab("aula")}
          className={`flux-mobile-nav__link ${currentTab === "aula" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Aula</span>
        </button>

        <button
          onClick={() => setCurrentTab("biblioteca")}
          className={`flux-mobile-nav__link ${currentTab === "biblioteca" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>Archivo</span>
        </button>

        <button
          onClick={() => setCurrentTab("examenes")}
          className={`flux-mobile-nav__link ${currentTab === "examenes" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
          </svg>
          <span>Exámenes</span>
        </button>

        <button
          onClick={() => setCurrentTab("libro")}
          className={`flux-mobile-nav__link ${currentTab === "libro" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span>Compilación</span>
        </button>

        <button
          onClick={() => setCurrentTab("memoria")}
          className={`flux-mobile-nav__link ${currentTab === "memoria" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Memoria</span>
        </button>

        <button
          onClick={() => setCurrentTab("planes")}
          className={`flux-mobile-nav__link ${currentTab === "planes" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>Planes</span>
        </button>

        <button
          onClick={() => setCurrentTab("perfil")}
          className={`flux-mobile-nav__link ${currentTab === "perfil" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Perfil</span>
        </button>
      </nav>
    </div>
  );
}

// ─── Componente CargandoCerebro ──────────────────────────
function CargandoCerebro({ small, label }: { small?: boolean; label?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div className={`cerebrito ${small ? "cerebrito--sm" : ""}`}>
        <svg viewBox="0 0 80 80" fill="none">
          {/* Lóbulo izquierdo */}
          <g className="lobe-left">
            <path d="M30 20C22 20 16 26 16 34C16 38 17.5 41.5 20 44C18 46 17 48.5 17 51C17 56 21 60 26 60C27 60 28 59.5 29 59C28.5 61 28 63 28 65C28 70 32 74 37 74C41 74 44.5 71.5 46 68C46.5 69 47.5 69.5 48.5 69.5C51 69.5 53 67.5 53 65V58"
              stroke="var(--swiss-accent)" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
          {/* Lóbulo derecho */}
          <g className="lobe-right">
            <path d="M53 20C61 20 67 26 67 34C67 38 65.5 41.5 63 44C65 46 66 48.5 66 51C66 56 62 60 57 60C56 60 55 59.5 54 59C54.5 61 55 63 55 65C55 70 51 74 46 74C42 74 38.5 71.5 37 68"
              stroke="var(--swiss-accent)" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
          {/* Tronco encefálico */}
          <g className="brainstem">
            <path d="M37 68C36.5 70 36 72 36 74" stroke="var(--swiss-accent)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M47 68C47.5 70 48 72 48 74" stroke="var(--swiss-accent)" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        </svg>
      </div>
      {label && <span className="cerebrito-label">{label}</span>}
    </div>
  );
}
