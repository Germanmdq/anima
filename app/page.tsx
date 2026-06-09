"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Activity,
  Bell,
  BookOpen,
  BookText,
  Bot,
  ChevronDown,
  Cross,
  GraduationCap,
  History,
  HomeIcon,
  Library,
  Lightbulb,
  Map as MapIconLucide,
  MessageSquareText,
  NotebookTabs,
  Quote,
  ScrollText,
  SearchIcon,
  Sparkles,
  Trophy,
  UserCog,
  UserRound,
  HelpCircle,
  Send,
  FileText,
  StickyNote,
  Calendar,
  LogOut,
  Edit3,
} from "lucide-react";

// ─── Tipos ──────────────────────────────────────────────────

interface Mensaje {
  id: string;
  role: "user" | "model";
  content: string;
}

import { supabaseClient } from "@/lib/supabase-client";

import ImaginaliaPortal from "@/components/portal/ImaginaliaPortal";
import NarratorView from "@/components/portal/NarratorView";
import TelegramView from "@/components/portal/TelegramView";
import CoachView from "@/components/portal/CoachView";
import TestimoniosView from "@/components/portal/TestimoniosView";
import BiblicaView from "@/components/portal/BiblicaView";
import NotesPanel from "@/components/notes/NotesPanel";
import MemoryPanel from "@/components/memory/MemoryPanel";
import JournalPanel from "@/components/journal/JournalPanel";
import { QUICK_ACTION_PROMPTS, buildBookPrompt, buildPlanPrompt } from "@/lib/prompts";
import { BRAND_DESCRIPTION, BRAND_INTERNAL_SPACE, BRAND_NAME, BRAND_NAME_UPPER, BRAND_TAGLINE } from "@/lib/brand";

type AgenteId = "profesor" | "cuentacuentos";
type TabId = "panel" | "aula" | "biblioteca" | "examenes" | "libro" | "memoria" | "perfil" | "planes" | "citas" | "lecturas" | "practicas" | "biblico" | "glosario" | "testimonios" | "telegram" | "narrador" | "notas" | "diario";
type ChatModeId = "conversar" | "preguntas" | "plan" | "libro" | "diario" | "presentacion";

export type PendingContext = {
  source: string;
  target: TabId;
  title?: string;
  content: string;
  action?: string;
} | null;

interface TextoMetadatos {
  filename: string;
  titulo: string;
  tituloOriginal: string;
  anio: string;
  tags?: string[];
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
  // Montaje — evita hydration mismatch causado por extensiones de browser
  const [mounted, setMounted] = useState(false);

  // Navegación
  const [currentTab, setCurrentTab] = useState<TabId>("panel");
  const [showApp, setShowApp] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Auth
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [authorMenuOpen, setAuthorMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Login form
  const [loginMode, setLoginMode] = useState<"login" | "register">("login");
  const [loginForm, setLoginForm] = useState({ name: "", email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Puente de contexto interno
  const [pendingContext, setPendingContext] = useState<PendingContext>(null);

  const sendToSection = (target: string, context: Omit<NonNullable<PendingContext>, "target">) => {
    setPendingContext({
      target: target as TabId,
      ...context
    });
    setCurrentTab(target as TabId);
  };

  // Contexto activo para el Aula Virtual (inyección RAG directa)
  const [selectedClassContext, setSelectedClassContext] = useState<ContextoClase | null>(null);

  // Chat
  const [messages, setMessages] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [agent, setAgent] = useState<AgenteId>("profesor");
  const [chatMode, setChatMode] = useState<ChatModeId>("conversar");
  const [useMemory, setUseMemory] = useState(true);
  const [loading, setLoading] = useState(false);
  const [questionsCount, setQuestionsCount] = useState(0);

  // Biblioteca
  const [textos, setTextos] = useState<TextoMetadatos[]>([]);
  const [loadingLib, setLoadingLib] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedText, setSelectedText] = useState<TextoMetadatos | null>(null);
  const [textDetail, setTextDetail] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Exámenes (Preguntas y Respuestas)
  const [examStarted, setExamStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number | string | boolean>>({});
  const [examScore, setExamScore] = useState<number | null>(null);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [examLoading, setExamLoading] = useState(false);
  const [examQuantity, setExamQuantity] = useState("5");
  const [examDifficulty, setExamDifficulty] = useState("Media");
  const [examFormat, setExamFormat] = useState("Mixto");
  const [examMaterial, setExamMaterial] = useState("");

  // Compilador de Libros
  const [selectedTopic, setSelectedTopic] = useState("La Fe");
  const [compilingStep, setCompilingStep] = useState<number>(-1);
  const [compiledBookTitle, setCompiledBookTitle] = useState<string | null>(null);
  const [compiledBookContent, setCompiledBookContent] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState({
    title: "",
    theme: "",
    include: "",
    tone: "Práctico",
  });
  const [bookDraft, setBookDraft] = useState<string | null>(null);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState("");
  const [bookSavingMemory, setBookSavingMemory] = useState(false);
  const [bookSavedMessage, setBookSavedMessage] = useState("");

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

  // Autenticación con Supabase (también activa `mounted` para resolver hydration mismatch)
  useEffect(() => {
    setMounted(true);
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      if (session) {
        if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
        }
        syncProfile(session);
        setShowLoginModal(false);
        setShowApp(true);
      } else {
        setCurrentProfile(null);
      }
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      if (session) {
        if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
        }
        syncProfile(session);
        setShowLoginModal(false);
        setShowApp(true);
      } else {
        setCurrentProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncProfile = async (sess: any) => {
    if (!sess?.access_token || !sess?.user?.email) {
      console.warn("No hay sesión válida todavía. No se crea perfil.");
      return;
    }
    
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.access_token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentProfile(data.profile ?? null);
      }
    } catch (e) {
      console.error("Error syncing profile", e);
    }
  };

  const handleEmailLogin = async () => {
    setLoginError("");
    setLoginLoading(true);
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });
      if (error) {
        setLoginError(error.message);
      }
    } catch (e: any) {
      setLoginError(e.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    setLoginError("");
    if (!loginForm.name.trim()) {
      setLoginError("Ingresá tu nombre.");
      return;
    }
    setLoginLoading(true);
    try {
      const { error } = await supabaseClient.auth.signUp({
        email: loginForm.email,
        password: loginForm.password,
        options: {
          data: {
            full_name: loginForm.name,
            display_name: loginForm.name,
          },
        },
      });
      if (error) {
        setLoginError(error.message);
      } else {
        setLoginMode("login");
      }
    } catch (e: any) {
      setLoginError(e.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleIngresar = () => {
    if (session) {
      setShowApp(true);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleGoogleLogin = async () => {
    await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}`
      }
    });
  };

  const isAdminUser = currentUser?.email === "germangonzalezmdq@gmail.com";
  const hasFounderAccess = isAdminUser || currentProfile?.plan === "founder" || currentProfile?.plan_tier === "founder";
  const planLabel = hasFounderAccess ? "Plan fundador" : "Plan gratuito";
  const subscriptionStatus = isAdminUser ? "Administrador" : (currentProfile?.status === "active" ? "Activa" : "Sin suscripción activa");
  const displayName = currentProfile?.display_name || currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email || "Usuario";
  const bookStorageKey = `odiseo_book_draft_${currentUser?.id || "guest"}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(bookStorageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.form) setBookForm({ title: "", theme: "", include: "", tone: "Práctico", ...parsed.form });
      if (typeof parsed.draft === "string") setBookDraft(parsed.draft);
    } catch (error) {
      console.error("Error loading book draft", error);
    }
  }, [bookStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(bookStorageKey, JSON.stringify({ form: bookForm, draft: bookDraft }));
  }, [bookStorageKey, bookForm, bookDraft]);

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    setSession(null);
    setCurrentUser(null);
    setCurrentProfile(null);
    setShowApp(false);
  };

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
      prompt: QUICK_ACTION_PROMPTS.questions,
    },
    {
      id: "plan",
      label: "Plan",
      desc: "Diseñar una práctica de 7, 15 o 30 días.",
      prompt: buildPlanPrompt("7", "mi objetivo y mi historial"),
    },
    {
      id: "libro",
      label: "Libro",
      desc: "Convertir conversaciones y notas en capítulos.",
      prompt: buildBookPrompt({
        bookTitle: "Mi libro personal",
        theme: "lo trabajado hasta ahora",
        material: "conversaciones, notas, memoria y practicas recientes",
        tone: "claro, sobrio y personal",
      }),
    },
    {
      id: "diario",
      label: "Diario",
      desc: "Registrar intención, estado y avance.",
      prompt: QUICK_ACTION_PROMPTS.journal,
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
  const sendChatMessage = async (messageText: string, visibleText?: string) => {
    if (!messageText.trim() || loading) return;

    const userMessage: Mensaje = {
      id: Date.now().toString(),
      role: "user",
      content: visibleText?.trim() || messageText.trim(),
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
          message: messageText.trim(),
          agent,
          history,
          currentSection: currentTab === "examenes" ? "examen" : currentTab,
          contextData: {
            selectedFile: selectedClassContext?.filename || undefined,
            userName: currentProfile?.display_name || currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email || "Usuario",
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

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await sendChatMessage(input);
  };

  // Cargar memoria (sesiones, exámenes, libros)
  const cargarMemoria = useCallback(async () => {
    setLoadingMemoria(true);
    const fetchSafe = async (url: string) => {
      try {
        const res = await fetch(url);
        if (res.ok) return await res.json();
      } catch (_) {}
      return null;
    };
    const [sessions, exams, books] = await Promise.all([
      fetchSafe("/api/sessions"),
      fetchSafe("/api/assessments"),
      fetchSafe("/api/books"),
    ]);
    if (sessions) setMemoriaSessions(sessions);
    if (exams) setMemoriaExams(exams);
    if (books) setMemoriaBooks(books);
    setLoadingMemoria(false);
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
  const generarExamen = async () => {
    setExamLoading(true);
    setExamStarted(true);
    setAnswers({});
    setExamScore(null);
    setExamQuestions([]);

    try {
      const uid = session?.user?.id || null;
      if (!uid) {
        throw new Error("No hay usuario autenticado para generar examen.");
      }
      const material = pendingContext?.target === "examenes" ? pendingContext.content : examMaterial;

      const res = await fetch("/api/examenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: uid,
          cantidad: examQuantity,
          dificultad: examDifficulty,
          formato: examFormat,
          material: material
        }),
      });

      const data = await res.json();
      if (data.success && data.preguntas) {
        setExamQuestions(data.preguntas.map((q: any, i: number) => ({ ...q, id: i + 1 })));
        setPendingContext(null);
      }
    } catch (err) {
      console.error("Error generando examen:", err);
    } finally {
      setExamLoading(false);
    }
  };

  const corregirExamen = async () => {
    let score = 0;
    let maxScore = 0;
    
    examQuestions.forEach((p: any) => {
      // Solo sumamos puntaje automático en múltiple choice o V/F
      if (p.tipo === "opcion_multiple" || p.tipo === "verdadero_falso") {
        maxScore += 1;
        if (answers[p.id] === p.correcta) {
          score += 1;
        }
      }
    });

    setExamScore(maxScore > 0 ? (score / maxScore) * 100 : 100);
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

**Compilado por:** ${currentProfile?.display_name || currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email || "Usuario"}
**Fecha de emisión:** ${fechaHoy}
**${BRAND_INTERNAL_SPACE}**

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

  const updateBookForm = (field: keyof typeof bookForm, value: string) => {
    setBookForm((prev) => ({ ...prev, [field]: value }));
    setBookError("");
    setBookSavedMessage("");
  };

  const handleCrearLibro = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const payload = {
      title: bookForm.title.trim(),
      theme: bookForm.theme.trim(),
      include: bookForm.include.trim(),
      tone: bookForm.tone,
    };

    if (!payload.title || !payload.theme || !payload.include) {
      setBookError("Completá título, tema central y qué querés incluir.");
      return;
    }

    setBookLoading(true);
    setBookError("");
    setBookSavedMessage("");

    try {
      const response = await fetch("/api/libro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear el libro.");
      }
      setBookDraft(data.draft);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo crear el libro.";
      setBookError(message);
    } finally {
      setBookLoading(false);
    }
  };

  const handleGuardarLibroEnMemoria = async () => {
    if (!bookDraft) return;
    if (!session?.access_token) {
      setBookError("Necesitás una sesión activa para guardar en memoria.");
      return;
    }

    setBookSavingMemory(true);
    setBookError("");
    setBookSavedMessage("");

    try {
      const response = await fetch("/api/memoria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          item_type: "book",
          title: bookForm.title.trim() || "Borrador de libro",
          source: "Mi libro",
          status: "active",
          content: {
            title: bookForm.title.trim(),
            theme: bookForm.theme.trim(),
            tone: bookForm.tone,
            draft: bookDraft,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo guardar en memoria.");
      }
      setBookSavedMessage("Guardado en memoria.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar en memoria.";
      setBookError(message);
    } finally {
      setBookSavingMemory(false);
    }
  };

  const resetBookDraft = () => {
    setBookDraft(null);
    setBookError("");
    setBookSavedMessage("");
    setBookForm({ title: "", theme: "", include: "", tone: "Práctico" });
  };

  // Filtrar biblioteca
  const allTags = [...new Set(textos.flatMap((t) => t.tags || []))].sort();
  const textosFiltrados = textos.filter((t) => {
    if (selectedTags.length > 0) {
      const tTags = t.tags || [];
      if (!selectedTags.some((st) => tTags.includes(st))) return false;
    }
    if (search) {
      return (
        t.titulo.toLowerCase().includes(search.toLowerCase()) ||
        t.tituloOriginal.toLowerCase().includes(search.toLowerCase())
      );
    }
    return true;
  });

  if (!showApp) {
    // ── AUTH SCREEN ──────────────────────────────────────────────
    if (showLoginModal) {
      return (
        <div className="ods-auth">
          {/* Brand panel */}
          <aside className="ods-auth__brand">
            <Image
              src="/odiseo/odiseo-mark.png"
              alt=""
              width={480}
              height={480}
              className="ods-auth__brand-mark"
            />
            <div className="ods-auth__brand-head">
              <button
                className="odiseo-pill"
                style={{ background: "transparent", borderColor: "rgba(255,255,255,.3)", color: "#fff" }}
                onClick={() => setShowLoginModal(false)}
              >
                ← Volver
              </button>
            </div>
            <div className="ods-auth__brand-copy">
              <span style={{ fontFamily: "var(--ods-font)", fontWeight: 600, fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--ods-accent)", display: "block", marginBottom: 8 }}>
                Universidad de la Imaginación
              </span>
              <h2>Recordá quién estás eligiendo ser</h2>
              <p>Conversá, estudiá, practicá y guardá memoria de tu proceso. Tu primera consulta al Coach es gratis.</p>
            </div>
            <div className="ods-auth__brand-foot" style={{ display: "flex", gap: 20 }}>
              <span style={{ fontFamily: "var(--ods-mono)", fontSize: 12.5 }}>odiseo.online</span>
              <span>Basado en las enseñanzas de Neville Goddard</span>
            </div>
          </aside>

          {/* Form panel */}
          <main className="ods-auth__form-side">
            <div className="ods-auth__form-card">
              <h1>
                {loginMode === "login" ? "Bienvenido de vuelta" : "Entrá gratuitamente con Google o tu mail"}
              </h1>
              <p className="ods-auth__form-sub">
                {loginMode === "login" ? "Ingresá para continuar tu práctica." : "Creá tu cuenta en segundos. Sin verificación por correo."}
              </p>

              {/* Tabs */}
              <div className="ods-auth__tabs">
                <button
                  className={`ods-auth__tab${loginMode === "register" ? " ods-auth__tab--on" : ""}`}
                  onClick={() => { setLoginMode("register"); setLoginError(""); }}
                >
                  Crear cuenta
                </button>
                <button
                  className={`ods-auth__tab${loginMode === "login" ? " ods-auth__tab--on" : ""}`}
                  onClick={() => { setLoginMode("login"); setLoginError(""); }}
                >
                  Ingresar
                </button>
              </div>

              {/* Google */}
              <button className="ods-auth__google" onClick={handleGoogleLogin}>
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M17.64 9.2c0-.637-.057-1.25-.164-1.84H9v3.48h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                {loginMode === "register" ? "Entrar con Google" : "Ingresar con Google"}
              </button>

              <div className="ods-auth__divider">o con tu email</div>

              <form
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
                onSubmit={(e) => { e.preventDefault(); loginMode === "register" ? handleEmailRegister() : handleEmailLogin(); }}
              >
                {loginMode === "register" && (
                  <div className="ods-auth__field">
                    <label className="ods-auth__label">Nombre</label>
                    <input
                      className="ods-auth__input"
                      type="text"
                      placeholder="Tu nombre"
                      value={loginForm.name}
                      onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                      autoComplete="name"
                    />
                  </div>
                )}
                <div className="ods-auth__field">
                  <label className="ods-auth__label">Email</label>
                  <input
                    className="ods-auth__input"
                    type="email"
                    placeholder="tu@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    autoComplete="email"
                  />
                </div>
                <div className="ods-auth__field">
                  <label className="ods-auth__label">Contraseña</label>
                  <input
                    className="ods-auth__input"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    autoComplete={loginMode === "login" ? "current-password" : "new-password"}
                  />
                </div>
                {loginError && (
                  <p style={{ color: "var(--ods-accent)", fontSize: 13, fontWeight: 600, margin: 0 }}>{loginError}</p>
                )}
                <button type="submit" className="ods-auth__submit" disabled={loginLoading}>
                  {loginLoading ? "Cargando..." : loginMode === "register" ? "Crear cuenta gratis" : "Ingresar"}
                </button>
              </form>

              <p style={{ fontSize: 12.5, color: "var(--ods-g-500)", marginTop: 16, textAlign: "center", lineHeight: 1.5 }}>
                Al entrar aceptás los{" "}
                <a href="#" style={{ color: "var(--ods-ink)", textDecoration: "underline" }}>términos</a>
                {" "}y la{" "}
                <a href="#" style={{ color: "var(--ods-ink)", textDecoration: "underline" }}>política de privacidad</a>.
              </p>

              <div className="ods-auth__switch">
                <span style={{ color: "var(--ods-g-700)", fontSize: 14 }}>
                  {loginMode === "register" ? "¿Ya tenés cuenta? " : "¿Todavía no tenés cuenta? "}
                </span>
                <button
                  type="button"
                  style={{ border: 0, background: "none", fontWeight: 700, color: "var(--ods-accent)", fontSize: 14, cursor: "pointer" }}
                  onClick={() => { setLoginMode(loginMode === "register" ? "login" : "register"); setLoginError(""); }}
                >
                  {loginMode === "register" ? "Ingresar" : "Crear cuenta gratis"}
                </button>
              </div>
            </div>
          </main>
        </div>
      );
    }

    // ── HOME / LANDING ───────────────────────────────────────────
    // Placeholder pre-mount: server y cliente renderizan lo mismo → hydration OK.
    // La extensión no tiene nada que modificar en el placeholder.
    // Después del mount el update es reconcile normal, no hydration.
    if (!mounted) {
      return <div style={{ background: "var(--ods-paper)", minHeight: "100dvh" }} />;
    }

    const goToLogin = () => { setLoginMode("register"); setShowLoginModal(true); };
    const landingTools = [
      { icon: <MessageSquareText size={22} />, title: "Coach", desc: "Trabajá tu deseo con una guía directa." },
      { icon: <Sparkles size={22} />, title: "Narrador", desc: "Recibí explicaciones vivas, ejemplos y escenas guiadas." },
      { icon: <ScrollText size={22} />, title: "Testimonios y casos", desc: "Buscá historias reales de Neville relacionadas con lo que querés vivir." },
      { icon: <Cross size={22} />, title: "Biblia metafísica", desc: "Entendé símbolos bíblicos como estados y movimientos de la conciencia." },
      { icon: <HelpCircle size={22} />, title: "Preguntas y respuestas", desc: "Generá preguntas para integrar una enseñanza, una escena o una conversación." },
      { icon: <Calendar size={22} />, title: "Planes", desc: "Creá prácticas de 7, 15 o 30 días." },
      { icon: <FileText size={22} />, title: "Diario íntimo", desc: "Registrá estados, avances, dudas y cambios internos." },
      { icon: <BookOpen size={22} />, title: "Mi libro", desc: "Convertí tu proceso en capítulos, escenas y reflexiones." },
      { icon: <History size={22} />, title: "Memoria", desc: "Odiseo recuerda deseos, estados, conversaciones y materiales importantes." },
      { icon: <Library size={22} />, title: "Fuentes de Neville", desc: "Conferencias, libros y fragmentos que alimentan respuestas y prácticas." },
    ];

    return (
      <div style={{ background: "var(--ods-paper)", overflowX: "hidden" }} suppressHydrationWarning>

        {/* ── NAV ── */}
        <header className="ods-pub-nav">
          <div className="ods-pub-nav__inner">
            <a className="ods-logo" href="#">
              <Image src="/odiseo/odiseo-badge.png" alt="Odiseo" width={36} height={36} className="ods-logo__mark" />
              <span className="ods-logo__wordmark">
                <span className="ods-logo__name">Odiseo</span>
                <span className="ods-logo__tagline">Tu compañero de imaginación</span>
              </span>
            </a>
            <nav className="ods-pub-nav__links">
              <a href="#que-es">Qué es</a>
              <a href="#herramientas">Herramientas</a>
              <a href="#como">Cómo funciona</a>
              <a href="#precios">Precios</a>
              <button onClick={() => { setLoginMode("login"); setShowLoginModal(true); }}>Ingresar</button>
            </nav>
            <div className="ods-pub-nav__cta">
              <button className="ods-btn ods-btn--ghost ods-btn--sm" style={{ display: "none" } /* hidden on mobile */} onClick={() => { setLoginMode("login"); setShowLoginModal(true); }}>
                Ingresar
              </button>
              <button className="ods-btn ods-btn--accent ods-btn--sm" onClick={goToLogin}>
                Empezar gratis
              </button>
            </div>
          </div>
        </header>

        {/* ── HERO ── */}
        <section className="ods-pub-hero" id="que-es">
          <div className="ods-pub-hero__grid">
            <div>
              <span className="ods-pub-kicker">Estudio · Práctica · Memoria</span>
              <h1 className="ods-pub-hero__title" style={{ marginTop: 18 }}>Odiseo</h1>
              <p className="ods-pub-hero__slogan">Tu <b>compañero</b> de imaginación</p>
              <p className="ods-pub-hero__lead">
                Un espacio para conversar, estudiar, practicar y recordar quién estás eligiendo ser.
              </p>
              <p className="ods-pub-hero__support">
                Odiseo te ayuda a trabajar tu deseo, comprender las enseñanzas de Neville, guardar memoria de tu proceso y convertir tus conversaciones en planes, preguntas, escenas y libros propios.
              </p>
              <div className="ods-pub-ask">
                <input
                  type="text"
                  placeholder="¿Qué querés trabajar hoy? Ej: vivir desde el final, sostener mi deseo…"
                  onKeyDown={(e) => { if (e.key === "Enter") goToLogin(); }}
                />
                <button className="ods-btn ods-btn--dark ods-btn--sm" onClick={goToLogin}>
                  Empezar →
                </button>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16, alignItems: "center" }}>
                <a href="#como" className="ods-btn ods-btn--ghost ods-btn--sm">Ver cómo funciona</a>
                <span style={{ fontSize: 13, color: "var(--ods-g-500)" }}>Gratis para empezar · sin tarjeta</span>
              </div>
            </div>
            {/* Demo chat card */}
            <div style={{ position: "relative" }}>
              <div className="ods-pub-hero__demo">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="ods-badge ods-badge--accent">EN VIVO</span>
                  <span style={{ fontFamily: "var(--ods-mono)", fontSize: 11, color: "var(--ods-g-500)", letterSpacing: ".06em" }}>COACH</span>
                </div>
                <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ alignSelf: "flex-end", background: "var(--ods-ink)", color: "#fff", padding: "12px 16px", borderRadius: "18px 18px 4px 18px", fontSize: 14.5, maxWidth: "85%" }}>
                    Quiero casarme y siento que tarda.
                  </div>
                  <div style={{ alignSelf: "flex-start", background: "var(--ods-paper)", border: "1.5px solid var(--ods-g-300)", padding: "12px 16px", borderRadius: "18px 18px 18px 4px", fontSize: 14.5, maxWidth: "92%" }}>
                    La tardanza no vive en el hecho, vive en la posición desde la que estás mirando. Ocupá el estado del deseo cumplido.
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
                    {["Profundizar", "Crear plan", "Guardar en diario"].map((c) => (
                      <span key={c} style={{ display: "inline-flex", alignItems: "center", fontWeight: 500, fontSize: 11.5, border: "1.5px solid var(--ods-ink)", borderRadius: 999, padding: "6px 11px", background: "var(--ods-paper)" }}>{c}</span>
                    ))}
                  </div>
                </div>
              </div>
              <Image
                src="/odiseo/odiseo-mark.png"
                alt=""
                width={92}
                height={92}
                style={{ position: "absolute", right: -14, top: -30, filter: "drop-shadow(0 6px 14px rgba(0,0,0,.15))" }}
              />
            </div>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div className="ods-pub-marquee" aria-hidden="true">
          <div className="ods-pub-marquee__track">
            {(["Coach","Narrador","Testimonios","Biblia metafísica","Preguntas","Planes","Diario íntimo","Mi libro","Memoria","Fuentes de Neville"] as string[]).flatMap((item) => [item, item]).map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        </div>

        {/* ── CÓMO FUNCIONA ── */}
        <div className="ods-pub-shell">
          <section className="ods-pub-sec" id="como" style={{ borderBottom: "none" }}>
            <div className="ods-pub-sec__head">
              <div>
                <span className="ods-pub-kicker">01 — Cómo funciona</span>
                <h2>Tres pasos para entrar en tu práctica</h2>
              </div>
              <p>Odiseo no solo responde. Recuerda, ordena, pregunta, narra y transforma tu proceso en práctica.</p>
            </div>
            <div className="ods-pub-steps">
              {[
                { n: "1", title: "Escribís lo que querés trabajar", desc: "Un deseo, una duda, una escena, una lectura o una situación interna." },
                { n: "2", title: "Odiseo te acompaña", desc: "Recibí guía directa, explicación narrativa, preguntas, planes, testimonios o símbolos bíblicos relacionados." },
                { n: "3", title: "Guardás tu proceso", desc: "Todo puede convertirse en memoria, diario, plan, mensaje o capítulo de tu propio libro." },
              ].map((step) => (
                <div key={step.n} className="ods-pub-step">
                  <div className="ods-pub-step__n">{step.n}</div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── HERRAMIENTAS ── */}
        <div style={{ background: "var(--ods-g-100)", borderTop: "2px solid var(--ods-ink)", borderBottom: "2px solid var(--ods-ink)" }}>
          <div className="ods-pub-shell">
            <section className="ods-pub-sec" id="herramientas" style={{ borderBottom: "none" }}>
              <div className="ods-pub-sec__head">
                <div>
                  <span className="ods-pub-kicker">02 — Herramientas</span>
                  <h2>Un sistema completo de imaginación</h2>
                </div>
                <p>Diez herramientas que trabajan juntas y comparten una misma memoria de tu proceso.</p>
              </div>
              <div className="ods-pub-tools">
                {landingTools.map((t) => (
                  <div key={t.title} className="ods-pub-tool" onClick={goToLogin}>
                    <div className="ods-pub-tool__ico">{t.icon}</div>
                    <h3>{t.title}</h3>
                    <p>{t.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ── UNIVERSIDAD ── */}
        <section className="ods-pub-uni">
          <div className="ods-pub-uni__inner">
            <div>
              <span className="ods-pub-kicker" style={{ color: "rgba(255,255,255,.5)" }}>Dentro de Odiseo</span>
              <h2 style={{ marginTop: 16 }}>Universidad de la Imaginación</h2>
              <p>Dentro de Odiseo vive la Universidad de la Imaginación: un espacio privado para estudiar, practicar, crear memoria, leer fuentes, responder preguntas y construir tu propio camino de imaginación.</p>
              <button className="ods-btn ods-btn--accent ods-btn--lg" style={{ marginTop: 30 }} onClick={goToLogin}>
                Entrar al espacio de estudio
              </button>
            </div>
            <div className="ods-pub-uni__mark">
              <Image src="/odiseo/odiseo-mark.png" alt="" width={360} height={360} style={{ width: "min(80%, 360px)", height: "auto" }} />
            </div>
          </div>
        </section>

        {/* ── AUTORES ── */}
        <div className="ods-pub-shell">
          <section className="ods-pub-sec" style={{ borderBottom: "none" }}>
            <div className="ods-pub-sec__head">
              <div>
                <span className="ods-pub-kicker">03 — Autores</span>
                <h2>Comenzamos con Neville</h2>
              </div>
              <p>Odiseo comienza con Neville Goddard. Próximamente se sumarán otros autores y líneas de estudio.</p>
            </div>
            <div className="ods-pub-authors">
              <div className="ods-pub-author ods-pub-author--active">
                <div className="ods-pub-author__ph">N</div>
                <h3>Neville Goddard</h3>
                <span className="ods-pub-author__status">● Autor activo</span>
              </div>
              {(["Joseph Murphy", "Emmet Fox", "Florence S. Shinn"] as string[]).map((name) => (
                <div key={name} className="ods-pub-author ods-pub-author--soon">
                  <div className="ods-pub-author__ph">{name[0]}</div>
                  <h3>{name}</h3>
                  <span className="ods-pub-author__status">Próximamente</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── PRECIOS ── */}
        <div className="ods-pub-shell">
          <section className="ods-pub-sec" id="precios" style={{ borderBottom: "none" }}>
            <div className="ods-pub-sec__head">
              <div>
                <span className="ods-pub-kicker">04 — Precios</span>
                <h2>Elegí cómo querés caminar</h2>
              </div>
              <p>Desde una primera consulta gratis hasta acceso de por vida. Sin vueltas.</p>
            </div>
            <div className="ods-pub-plans">
              {([
                { name: "Prueba inicial", price: "USD 0", desc: "Para entrar, probar Odiseo y hacer tu primera consulta.", items: ["Acceso al dashboard", "1 consulta inicial al Coach", "Vista limitada de herramientas", "Memoria básica visual", "Acceso preview a fuentes"], cta: "Empezar gratis", v: "ghost", feat: false },
                { name: "Práctica 72 hs", price: "USD 5", desc: "Para probar Odiseo durante tres días con una práctica completa.", items: ["Coach limitado", "Narrador", "Diario íntimo", "1 plan corto · preguntas", "Memoria · preview Telegram"], cta: "Activar 72 horas", v: "dark", feat: false },
                { name: "Camino Anual", price: "USD 30", unit: "/ año", badge: "Recomendado", desc: "Un año para estudiar, practicar y volver al estado elegido con continuidad.", items: ["Coach · Narrador · Preguntas", "Planes · Diario · Memoria", "Mi libro · Testimonios", "Biblia metafísica · Fuentes", "Universidad de la Imaginación"], cta: "Entrar al Camino Anual", v: "accent", feat: true },
                { name: "Fundador", price: "USD 97", unit: "/ vida", desc: "Acceso de por vida para quienes quieren apoyar el nacimiento de Odiseo.", items: ["Acceso de por vida", "Límite superior de uso", "Mejoras principales futuras", "Prioridad en nuevas funciones", "Autores futuros incluidos"], cta: "Ser fundador", v: "dark", feat: false },
              ] as { name: string; price: string; unit?: string; badge?: string; desc: string; items: string[]; cta: string; v: string; feat: boolean }[]).map((plan) => (
                <div key={plan.name} className={`ods-pub-plan${plan.feat ? " ods-pub-plan--feat" : ""}`}>
                  {plan.badge && <span className="ods-badge ods-badge--accent" style={{ alignSelf: "flex-start", marginBottom: 4 }}>{plan.badge}</span>}
                  <div className="ods-pub-plan__name">{plan.name}</div>
                  <div className="ods-pub-plan__price">
                    {plan.price}
                    {plan.unit && <small> {plan.unit}</small>}
                  </div>
                  <p className="ods-pub-plan__desc">{plan.desc}</p>
                  <ul className="ods-pub-plan__list">
                    {plan.items.map((item) => (
                      <li key={item} className="ods-pub-plan__li">
                        <span className="ods-pub-plan__check">✓</span>{item}
                      </li>
                    ))}
                  </ul>
                  <button className={`ods-btn ods-btn--block ods-btn--${plan.v}`} style={{ marginTop: "auto" }} onClick={goToLogin}>
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── FAQ ── */}
        <div style={{ background: "var(--ods-g-100)", borderTop: "2px solid var(--ods-ink)" }}>
          <div className="ods-pub-shell">
            <section className="ods-pub-sec" style={{ borderBottom: "none" }}>
              <div className="ods-pub-sec__head">
                <div>
                  <span className="ods-pub-kicker">05 — Preguntas</span>
                  <h2>Antes de empezar</h2>
                </div>
              </div>
              <div className="ods-pub-faq">
                {([
                  { q: "¿Qué es Odiseo?", a: "Odiseo es tu compañero de imaginación: un espacio para conversar, estudiar, practicar, guardar memoria y convertir tu proceso en planes, preguntas, escenas y libros propios." },
                  { q: "¿Está basado solo en Neville Goddard?", a: "Odiseo comienza con Neville Goddard como autor activo. Más adelante podrá sumar otros autores y líneas de estudio." },
                  { q: "¿Qué significa vivir desde el final?", a: "Es practicar desde el estado del deseo cumplido, no como fantasía vacía, sino como una nueva posición interior desde la cual pensar, sentir y actuar." },
                  { q: "¿Las fuentes están incluidas?", a: "Las conferencias, libros y fragmentos de Neville estarán disponibles dentro del dashboard según el plan del usuario." },
                  { q: "¿Puedo crear mi propio libro?", a: "Sí. Odiseo puede ayudarte a ordenar conversaciones, notas, planes y escenas en un libro personal." },
                  { q: "¿Telegram está activo?", a: "Telegram está pensado para mensajes personalizados durante el día. Puede aparecer como función incluida o próximamente según el estado del producto." },
                ] as { q: string; a: string }[]).map((item, i) => (
                  <details key={i} className="ods-pub-faq-item">
                    <summary className="ods-pub-faq-q">
                      {item.q}
                      <span className="ods-pub-faq-q__pm">+</span>
                    </summary>
                    <div className="ods-pub-faq-a">{item.a}</div>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ── CTA BAND ── */}
        <section className="ods-pub-ctaband">
          <h2>Recordá quién estás eligiendo ser</h2>
          <p>Tu primera consulta al Coach es gratis. Entrá y empezá tu práctica hoy.</p>
          <button className="ods-btn ods-btn--lg ods-btn--white" onClick={goToLogin}>
            Empezar gratis
          </button>
        </section>

        {/* ── FOOTER ── */}
        <footer className="ods-pub-foot">
          <div className="ods-pub-foot__inner">
            <div className="ods-pub-foot__top">
              <a className="ods-logo" href="#">
                <Image src="/odiseo/odiseo-badge.png" alt="Odiseo" width={36} height={36} className="ods-logo__mark" />
                <span className="ods-logo__wordmark">
                  <span className="ods-logo__name ods-logo__name--white">Odiseo</span>
                  <span className="ods-logo__tagline" style={{ color: "#999" }}>Tu compañero de imaginación</span>
                </span>
              </a>
              <div className="ods-pub-foot__links">
                <a href="#">Términos</a>
                <a href="#">Privacidad</a>
                <a href="#">Contacto</a>
                <button onClick={() => { setLoginMode("login"); setShowLoginModal(true); }}>Ingresar</button>
              </div>
            </div>
            <div className="ods-pub-foot__bottom">
              <span>© 2026 Odiseo. Basado inicialmente en las enseñanzas de Neville Goddard.</span>
              <span style={{ fontFamily: "var(--ods-mono)" }}>odiseo.online</span>
            </div>
          </div>
        </footer>

      </div>
    );
  }

  return (
    <div className="odiseo-app" suppressHydrationWarning>
      
      {/* 1. SIDEBAR */}
      <aside className="odiseo-sidebar">
        <div className="odiseo-sb-logo" onClick={() => setShowApp(false)}>
          <Image src="/odiseo/odiseo-badge.png" alt="Odiseo" width={36} height={36} />
          <div className="odiseo-sb-logo-text">
            <span className="odiseo-sb-logo-name">{BRAND_NAME_UPPER}</span>
            <span className="odiseo-sb-logo-tagline">{BRAND_TAGLINE}</span>
          </div>
        </div>

        <nav className="odiseo-sb-nav">
          <div className="odiseo-nav-group">
            <span className="odiseo-nav-group__label">Principal</span>
            <button onClick={() => setCurrentTab("panel")} className={`odiseo-nav-item${currentTab === "panel" ? " odiseo-nav-item--active" : ""}`}>
              <HomeIcon aria-hidden="true" />
              Inicio
            </button>
          </div>

          <div className="odiseo-nav-group">
            <span className="odiseo-nav-group__label">Conversar</span>
            <button onClick={() => { setCurrentTab("aula"); setAgent("profesor"); setChatMode("conversar"); }} className={`odiseo-nav-item${currentTab === "aula" ? " odiseo-nav-item--active" : ""}`}>
              <MessageSquareText aria-hidden="true" />
              Coach
            </button>
            <button onClick={() => setCurrentTab("narrador")} className={`odiseo-nav-item${currentTab === "narrador" ? " odiseo-nav-item--active" : ""}`}>
              <Sparkles aria-hidden="true" />
              Narrador
            </button>
          </div>

          <div className="odiseo-nav-group">
            <span className="odiseo-nav-group__label">Estudio</span>
            <button onClick={() => setCurrentTab("testimonios")} className={`odiseo-nav-item${currentTab === "testimonios" ? " odiseo-nav-item--active" : ""}`}>
              <ScrollText aria-hidden="true" />
              Testimonios y casos
            </button>
            <button onClick={() => setCurrentTab("biblico")} className={`odiseo-nav-item${currentTab === "biblico" ? " odiseo-nav-item--active" : ""}`}>
              <Cross aria-hidden="true" />
              Biblia metafísica
            </button>
            <button onClick={() => setCurrentTab("examenes")} className={`odiseo-nav-item${currentTab === "examenes" ? " odiseo-nav-item--active" : ""}`}>
              <HelpCircle aria-hidden="true" />
              Preguntas y respuestas
            </button>
            <button onClick={() => setCurrentTab("biblioteca")} className={`odiseo-nav-item${currentTab === "biblioteca" ? " odiseo-nav-item--active" : ""}`}>
              <Library aria-hidden="true" />
              Fuentes / Conferencias
            </button>
          </div>

          <div className="odiseo-nav-group">
            <span className="odiseo-nav-group__label">Crear</span>
            <button onClick={() => setCurrentTab("libro")} className={`odiseo-nav-item${currentTab === "libro" ? " odiseo-nav-item--active" : ""}`}>
              <BookOpen aria-hidden="true" />
              Mi libro
            </button>
            <button onClick={() => setCurrentTab("planes")} className={`odiseo-nav-item${currentTab === "planes" ? " odiseo-nav-item--active" : ""}`}>
              <Calendar aria-hidden="true" />
              Planes
            </button>
            <button onClick={() => setCurrentTab("telegram")} className={`odiseo-nav-item${currentTab === "telegram" ? " odiseo-nav-item--active" : ""}`}>
              <Send aria-hidden="true" />
              Telegram
            </button>
          </div>

          <div className="odiseo-nav-group">
            <span className="odiseo-nav-group__label">Personal</span>
            <button onClick={() => setCurrentTab("diario")} className={`odiseo-nav-item${currentTab === "diario" ? " odiseo-nav-item--active" : ""}`}>
              <FileText aria-hidden="true" />
              Diario íntimo
            </button>
            <button onClick={() => setCurrentTab("notas")} className={`odiseo-nav-item${currentTab === "notas" ? " odiseo-nav-item--active" : ""}`}>
              <StickyNote aria-hidden="true" />
              Notas
            </button>
          </div>
        </nav>

        <div className="odiseo-sb-footer">
          <button
            className={`odiseo-nav-item${currentTab === "perfil" ? " odiseo-nav-item--active" : ""}`}
            onClick={() => setCurrentTab("perfil")}
          >
            <Trophy size={15} aria-hidden="true" />
            Mejorar plan
          </button>
        </div>
      </aside>

      {/* 2. MAIN */}
      <div className="odiseo-main">
        <header className="odiseo-topbar">
          {/* Left: user name + email */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ fontFamily: "var(--ods-font)", fontWeight: 700, fontSize: 14, color: "var(--ods-ink)" }}>
                {displayName}
              </span>
              <span style={{ fontFamily: "var(--ods-mono)", fontSize: 11, color: "var(--ods-g-500)" }}>
                {currentUser?.email || ""}
              </span>
            </div>
          </div>

          {/* Right: controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Author selector */}
            <div className="odiseo-author-selector">
              <button
                type="button"
                onClick={() => setAuthorMenuOpen((open) => !open)}
                className="odiseo-author-btn"
              >
                <span style={{ fontFamily: "var(--ods-mono)", fontSize: 9.5, color: "var(--ods-g-500)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                  Autor
                </span>
                <span style={{ fontWeight: 700 }}>Neville Goddard</span>
                <ChevronDown size={12} />
              </button>
              {authorMenuOpen && (
                <div className="odiseo-author-menu">
                  {[
                    ["Neville Goddard", "activo"],
                    ["Joseph Murphy", "próximamente"],
                    ["Emmet Fox", "próximamente"],
                    ["Florence Scovel Shinn", "próximamente"],
                  ].map(([name, status]) => (
                    <button
                      key={name}
                      type="button"
                      disabled={status !== "activo"}
                      onClick={() => setAuthorMenuOpen(false)}
                      className={`odiseo-author-item${status === "activo" ? " odiseo-author-item--active" : ""}`}
                    >
                      <span style={{ fontWeight: status === "activo" ? 700 : 500 }}>{name}</span>
                      <span style={{ fontSize: 11, color: status === "activo" ? "var(--ods-accent)" : "var(--ods-g-500)" }}>
                        {status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search */}
            <div className="odiseo-search">
              <SearchIcon size={15} aria-hidden="true" />
              <input type="text" placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* Query counter */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid var(--ods-g-300)", borderRadius: 999, padding: "6px 13px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontFamily: "var(--ods-mono)", fontSize: 10, color: "var(--ods-g-500)", letterSpacing: ".06em" }}>
                  {questionsCount} / 200
                </span>
                <div style={{ width: 60, height: 5, borderRadius: 999, background: "var(--ods-g-200)", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "var(--ods-accent)", borderRadius: 999, width: `${Math.min(100, (questionsCount / 200) * 100)}%`, transition: "width 0.3s" }} />
                </div>
              </div>
            </div>

            {/* Memoria activa */}
            <button className="odiseo-memoria-pill" onClick={() => setCurrentTab("memoria")}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--ods-accent)", display: "inline-block", flexShrink: 0 }} />
              Memoria activa
            </button>

            {/* Bell */}
            <button className="odiseo-pill odiseo-pill--ghost" style={{ borderColor: "var(--ods-g-300)", padding: "8px 10px" }} aria-label="Notificaciones">
              <Bell size={15} />
            </button>

            {/* Avatar + profile popup */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                style={{ border: 0, background: "none", cursor: "pointer", padding: 0, display: "flex" }}
                onClick={() => setProfileOpen((o) => !o)}
                aria-label="Perfil"
              >
                <div className="odiseo-avatar">{displayName.charAt(0).toUpperCase()}</div>
              </button>
              {profileOpen && (
                <div className="odiseo-profile-popup">
                  <div className="odiseo-profile-popup__head">
                    <div className="odiseo-profile-popup__name">{displayName}</div>
                    <div className="odiseo-profile-popup__email">{currentUser?.email || ""}</div>
                  </div>
                  <hr />
                  <button className="odiseo-menu-item" onClick={() => { setCurrentTab("perfil"); setProfileOpen(false); }}>
                    Tu cuenta <UserCog size={15} />
                  </button>
                  <button className="odiseo-menu-item" onClick={() => { setCurrentTab("perfil"); setProfileOpen(false); }}>
                    Mejorar plan <Trophy size={15} />
                  </button>
                  <button className="odiseo-menu-item odiseo-menu-item--danger" onClick={async () => { try { await supabaseClient.auth.signOut(); } catch (_) {} setProfileOpen(false); }}>
                    Cerrar sesión <LogOut size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={`odiseo-viewport${currentTab === "aula" || currentTab === "narrador" ? " odiseo-viewport--chat" : ""}`}>
        {/* ──── VISTA DINÁMICA SEGÚN PESTAÑA SELECCIONADA ──── */}

        {/* 1. DASHBOARD / PANEL PRINCIPAL */}
        {currentTab === "panel" && (
          <div style={{ maxWidth: 1180, width: "100%" }}>
            {/* Tool head */}
            <div className="ods-tool-head">
              <h1>Mi espacio en {BRAND_NAME}</h1>
              <p className="ods-tool-head__sub">Elegí cómo querés trabajar tu imaginación hoy.</p>
            </div>

            {/* Active plan strip */}
            <div className="ods-plan-strip">
              <div className="ods-plan-strip__inner">
                <span className="ods-plan-strip__dot" />
                <div>
                  <div className="ods-plan-strip__title">Sostener el deseo — Día 3 de 7</div>
                  <div className="ods-plan-strip__sub">Plan activo · intensidad media</div>
                </div>
              </div>
              <button className="ods-plan-btn" onClick={() => setCurrentTab("planes")}>
                Continuar plan →
              </button>
            </div>

            {/* Tools grid */}
            <div className="ods-tool-grid">
              {(
                [
                  { tab: "aula", icon: <MessageSquareText size={20} />, title: "Coach", desc: "Trabajá tu deseo con una guía directa.", featured: true },
                  { tab: "narrador", icon: <Sparkles size={20} />, title: "Narrador", desc: "Recibí explicaciones vivas, ejemplos y escenas guiadas." },
                  { tab: "testimonios", icon: <ScrollText size={20} />, title: "Testimonios y casos", desc: "Encontrá historias reales relacionadas con lo que querés vivir." },
                  { tab: "biblico", icon: <Cross size={20} />, title: "Biblia metafísica", desc: "Comprendé símbolos bíblicos como estados de conciencia." },
                  { tab: "examenes", icon: <HelpCircle size={20} />, title: "Preguntas y respuestas", desc: "Integrá conceptos con preguntas configurables." },
                  { tab: "biblioteca", icon: <Library size={20} />, title: "Fuentes / Conferencias", desc: "Explorá el material base de Neville." },
                  { tab: "libro", icon: <BookOpen size={20} />, title: "Mi libro", desc: "Convertí tu proceso en un libro propio." },
                  { tab: "planes", icon: <Calendar size={20} />, title: "Planes", desc: "Creá prácticas de 7, 15 o 30 días." },
                  { tab: "telegram", icon: <Send size={20} />, title: "Telegram", desc: "Mensajes personalizados para volver al estado." },
                  { tab: "diario", icon: <FileText size={20} />, title: "Diario íntimo", desc: "Registrá estados, avances y observaciones." },
                  { tab: "notas", icon: <StickyNote size={20} />, title: "Notas", desc: "Ideas breves para estudiar y practicar." },
                ] as { tab: TabId; icon: React.ReactNode; title: string; desc: string; featured?: boolean }[]
              ).map((tool) => (
                <div
                  key={tool.tab}
                  className={`ods-tcard${tool.featured ? " ods-tcard--featured" : ""}`}
                  onClick={() => {
                    setCurrentTab(tool.tab);
                    if (tool.tab === "aula") { setAgent("profesor"); setChatMode("conversar"); }
                  }}
                >
                  <div className="ods-tcard__ico">{tool.icon}</div>
                  <h3 className="ods-tcard__title">{tool.title}</h3>
                  <p className="ods-tcard__desc">{tool.desc}</p>
                </div>
              ))}

              {/* Memoria — dark tile */}
              <div className="ods-tcard ods-tcard--dark" onClick={() => setCurrentTab("memoria")}>
                <div className="ods-tcard__ico"><History size={20} /></div>
                <h3 className="ods-tcard__title" style={{ color: "#fff" }}>Memoria</h3>
                <p className="ods-tcard__desc" style={{ color: "rgba(255,255,255,.65)" }}>
                  Todo lo que Odiseo recuerda de tu proceso.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. COACH — Vista limpia con chat real */}
        {currentTab === "aula" && (
          <CoachView
            messages={messages}
            input={input}
            setInput={setInput}
            loading={loading}
            onSend={handleSend}
            onQuickSend={sendChatMessage}
            parseMarkdown={parseMarkdown}
            sendToSection={sendToSection}
            pendingContext={pendingContext}
            clearPendingContext={() => setPendingContext(null)}
          />
        )}

        {/* TESTIMONIOS — Vista propia */}
        {currentTab === "testimonios" && (
          <TestimoniosView sendToSection={sendToSection} />
        )}

        {/* BIBLIA METAFÍSICA — Vista propia */}
        {currentTab === "biblico" && (
          <BiblicaView sendToSection={sendToSection} />
        )}

        {/* TABS FANTASMA — Fallback limpio */}
        {(["citas", "lecturas", "practicas", "glosario"] as TabId[]).includes(currentTab) && (
          <div style={{ padding: "60px 24px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
            <div style={{
              backgroundColor: "var(--swiss-muted)",
              border: "2px dashed var(--swiss-border)",
              borderRadius: "22px",
              padding: "40px 32px"
            }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--swiss-text-muted)", marginBottom: "16px" }}>
                Esta sección fue integrada dentro de Coach, Fuentes de Neville o Preguntas y respuestas.
              </p>
              <button
                onClick={() => setCurrentTab("panel")}
                className="swiss-landing-cta"
                style={{ padding: "10px 24px", borderRadius: "22px", fontSize: "12px", fontWeight: 900, textTransform: "uppercase" }}
              >
                Volver al inicio
              </button>
            </div>
          </div>
        )}

        {/* 3. BIBLIOTECA DE TEXTOS */}
        {currentTab === "biblioteca" && (
          <div className="flex-1 flex flex-col">
            <header className="content-header" style={{ marginBottom: "16px" }}>
              <h2 className="flux-title" style={{ fontSize: "20px" }}>Fuentes de Neville</h2>
              <p className="flux-subtitle">Conferencias, libros y fragmentos que alimentan las respuestas, prácticas y búsquedas dentro de {BRAND_NAME}.</p>
            </header>

            {!hasFounderAccess && (
              <div style={{ backgroundColor: "var(--swiss-bg)", border: "2px solid #000", borderRadius: "18px", padding: "18px 20px", marginBottom: "16px", display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 900, textTransform: "uppercase", marginBottom: "4px" }}>Fuentes de Neville</h3>
                  <p style={{ fontSize: "13px", color: "var(--swiss-text-muted)", margin: 0 }}>Las conferencias completas forman parte de la suscripción de {BRAND_NAME}.</p>
                </div>
                <button className="swiss-landing-cta" style={{ borderRadius: "999px", padding: "10px 18px", fontSize: "12px", fontWeight: 900 }}>
                  Activar acceso
                </button>
              </div>
            )}

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

            {/* Filtro por etiquetas */}
            {allTags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="flux-class-badge"
                    style={{ background: "var(--swiss-accent)", color: "white", border: "none", cursor: "pointer", fontSize: "10px" }}
                  >
                    Limpiar filtros
                  </button>
                )}
                {allTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() =>
                        setSelectedTags((prev) =>
                          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                        )
                      }
                      className="flux-class-badge"
                      style={{
                        background: active ? "var(--swiss-accent)" : "var(--swiss-muted)",
                        color: active ? "white" : "inherit",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "10px",
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}

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
                      onClick={() => {
                        if (hasFounderAccess) abrirTexto(texto);
                      }}
                      className="flux-class-card"
                      style={{ opacity: hasFounderAccess ? 1 : 0.82, cursor: hasFounderAccess ? "pointer" : "default" }}
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
                      {texto.tags && texto.tags.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginTop: "6px" }}>
                          {texto.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="flux-class-badge" style={{ fontSize: "9px", background: "var(--swiss-muted)", opacity: 0.8 }}>
                              {tag}
                            </span>
                          ))}
                          {texto.tags.length > 4 && (
                            <span className="flux-class-badge" style={{ fontSize: "9px", background: "var(--swiss-muted)", opacity: 0.6 }}>
                              +{texto.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. PREGUNTAS Y RESPUESTAS */}
        {currentTab === "examenes" && (
          <div style={{ padding: "40px 24px", maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <header className="content-header" style={{ marginBottom: "32px", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <h2 className="flux-title" style={{ fontSize: "32px", textTransform: "uppercase", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>Preguntas y respuestas</h2>
              </div>
              <p className="flux-subtitle" style={{ fontSize: "18px", color: "var(--swiss-fg)", fontWeight: 500 }}>Integrá conceptos y descubrí qué entendiste realmente.</p>
            </header>

            {!examStarted ? (
              <div className="flux-exam-container">
                <h3 className="flux-exam-title">Preguntas para integrar</h3>
                <p className="flux-exam-desc">
                  Generá preguntas sobre una charla, una lectura, una escena, una entrada del diario, un plan o una enseñanza.
                </p>

                {pendingContext?.target === "examenes" ? (
                  <div style={{ backgroundColor: "var(--swiss-muted)", border: "2px solid #000", borderRadius: "16px", padding: "20px", marginTop: "16px", marginBottom: "16px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", marginBottom: "8px" }}>Material para trabajar</h4>
                    <p style={{ fontSize: "13px", color: "var(--swiss-text-muted)", marginBottom: "12px", fontStyle: "italic" }}>Origen: {pendingContext.source} {pendingContext.title ? `- ${pendingContext.title}` : ""}</p>
                    <textarea
                      readOnly
                      value={pendingContext.content}
                      style={{ width: "100%", height: "80px", padding: "12px", borderRadius: "12px", border: "1.5px solid var(--swiss-border)", backgroundColor: "var(--swiss-bg)", fontSize: "12px", resize: "none", marginBottom: "12px" }}
                    />
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button onClick={generarExamen} className="swiss-landing-cta" style={{ padding: "10px 20px", borderRadius: "22px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase" }}>Generar preguntas desde este material</button>
                      <button onClick={() => setPendingContext(null)} className="flux-btn-secondary" style={{ padding: "10px 20px", borderRadius: "22px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase" }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px", textAlign: "left", width: "100%", maxWidth: "600px", margin: "24px auto 0" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", marginBottom: "8px" }}>Cantidad de preguntas</label>
                      <select value={examQuantity} onChange={(e) => setExamQuantity(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "2px solid var(--swiss-border)", backgroundColor: "var(--swiss-bg)", fontSize: "14px" }}>
                        <option value="3">3 preguntas</option>
                        <option value="5">5 preguntas</option>
                        <option value="10">10 preguntas</option>
                        <option value="15">15 preguntas</option>
                        <option value="20">20 preguntas</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", marginBottom: "8px" }}>Dificultad</label>
                      <select value={examDifficulty} onChange={(e) => setExamDifficulty(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "2px solid var(--swiss-border)", backgroundColor: "var(--swiss-bg)", fontSize: "14px" }}>
                        <option value="Inicial">Inicial</option>
                        <option value="Media">Media</option>
                        <option value="Profunda">Profunda</option>
                        <option value="Avanzada">Avanzada</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", marginBottom: "8px" }}>Formato</label>
                      <select value={examFormat} onChange={(e) => setExamFormat(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "2px solid var(--swiss-border)", backgroundColor: "var(--swiss-bg)", fontSize: "14px" }}>
                        <option value="Texto abierto">Texto abierto</option>
                        <option value="Opción múltiple">Opción múltiple</option>
                        <option value="Verdadero o falso">Verdadero o falso</option>
                        <option value="Mixto">Mixto</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", marginBottom: "8px" }}>Material o Tema</label>
                      <textarea 
                        value={examMaterial} 
                        onChange={(e) => setExamMaterial(e.target.value)}
                        placeholder="Ejemplo: vivir desde el final, revisión, dinero, Moisés, una entrada del diario..."
                        style={{ width: "100%", height: "100px", padding: "12px", borderRadius: "8px", border: "2px solid var(--swiss-border)", backgroundColor: "var(--swiss-bg)", fontSize: "14px", resize: "none" }}
                      />
                    </div>
                    <button
                      onClick={generarExamen}
                      className="swiss-landing-cta"
                      style={{ width: "100%", padding: "16px", marginTop: "16px", borderRadius: "22px", fontSize: "14px", fontWeight: 900, textTransform: "uppercase" }}
                      disabled={examLoading}
                    >
                      {examLoading ? "Generando preguntas..." : "Generar preguntas"}
                    </button>
                  </div>
                )}
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
                  <div key={p.id} style={{ marginBottom: "24px", textAlign: "left", backgroundColor: "var(--swiss-muted)", padding: "24px", borderRadius: "16px", border: "1px solid var(--swiss-border)" }}>
                    <h4 className="font-bold text-[15px] mb-4 text-stone-900 leading-snug">
                      {idx + 1}. {p.pregunta}
                    </h4>
                    {p.tipo === "opcion_multiple" && p.opciones && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {p.opciones.map((opc: string, opcIdx: number) => (
                          <button
                            key={opcIdx}
                            onClick={() => {
                              if (examScore !== null) return;
                              setAnswers((prev) => ({ ...prev, [p.id]: opcIdx }));
                            }}
                            style={{
                              padding: "12px 16px",
                              textAlign: "left",
                              borderRadius: "8px",
                              border: "2px solid",
                              borderColor: examScore !== null
                                ? (opcIdx === p.correcta
                                    ? "#10b981"
                                    : answers[p.id] === opcIdx
                                    ? "var(--swiss-accent)"
                                    : "transparent")
                                : answers[p.id] === opcIdx
                                ? "var(--swiss-fg)"
                                : "transparent",
                              backgroundColor: answers[p.id] === opcIdx ? "var(--swiss-bg)" : "var(--swiss-bg)",
                              color: "var(--swiss-fg)",
                              fontWeight: 500,
                              cursor: examScore !== null ? "default" : "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            {["A", "B", "C", "D"][opcIdx] || opcIdx + 1}. {opc}
                          </button>
                        ))}
                      </div>
                    )}

                    {p.tipo === "verdadero_falso" && (
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          onClick={() => { if (examScore === null) setAnswers(prev => ({...prev, [p.id]: true})) }}
                          style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "2px solid", borderColor: examScore !== null ? (p.correcta === true ? "#10b981" : answers[p.id] === true ? "var(--swiss-accent)" : "transparent") : answers[p.id] === true ? "var(--swiss-fg)" : "transparent", backgroundColor: "var(--swiss-bg)", cursor: examScore !== null ? "default" : "pointer" }}
                        >Verdadero</button>
                        <button
                          onClick={() => { if (examScore === null) setAnswers(prev => ({...prev, [p.id]: false})) }}
                          style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "2px solid", borderColor: examScore !== null ? (p.correcta === false ? "#10b981" : answers[p.id] === false ? "var(--swiss-accent)" : "transparent") : answers[p.id] === false ? "var(--swiss-fg)" : "transparent", backgroundColor: "var(--swiss-bg)", cursor: examScore !== null ? "default" : "pointer" }}
                        >Falso</button>
                      </div>
                    )}

                    {p.tipo === "texto_abierto" && (
                      <textarea
                        disabled={examScore !== null}
                        value={answers[p.id] as string || ""}
                        onChange={(e) => setAnswers(prev => ({...prev, [p.id]: e.target.value}))}
                        style={{ width: "100%", height: "100px", padding: "12px", borderRadius: "8px", border: "2px solid var(--swiss-border)", backgroundColor: "var(--swiss-bg)", fontSize: "14px", resize: "none" }}
                        placeholder="Escribí tu reflexión acá..."
                      />
                    )}

                    {examScore !== null && p.explicacion && (
                      <div style={{ marginTop: "16px", padding: "16px", backgroundColor: "var(--swiss-bg)", borderRadius: "8px", borderLeft: "4px solid var(--swiss-accent)", fontSize: "13px" }}>
                        <strong>Explicación:</strong> {p.explicacion}
                      </div>
                    )}
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

        {/* 5. MI LIBRO */}
        {currentTab === "libro" && (
          <div style={{ padding: "32px 24px", maxWidth: "980px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
            <header className="content-header" style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ backgroundColor: "var(--swiss-accent)", color: "#fff", padding: "12px", borderRadius: "16px" }}>
                  <BookOpen size={24} />
                </div>
                <h2 className="flux-title" style={{ fontSize: "32px", textTransform: "uppercase", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                  Mi libro
                </h2>
              </div>
              <p className="flux-subtitle" style={{ fontSize: "18px", color: "var(--swiss-fg)", fontWeight: 500, marginBottom: "4px" }}>
                Convertí tu proceso en capítulos, escenas, planes y reflexiones.
              </p>
              <p style={{ fontSize: "14px", color: "var(--swiss-text-muted)", fontWeight: 500, lineHeight: "1.6" }}>
                Todo lo que trabajás puede ordenarse como capítulos, prácticas, escenas, preguntas y reflexiones en tu libro propio.
              </p>
            </header>

            {!bookDraft && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {pendingContext?.target === "libro" && (
                  <div style={{ backgroundColor: "var(--swiss-muted)", border: "2px solid #000", borderRadius: "16px", padding: "24px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", marginBottom: "8px" }}>Material recibido</h3>
                    <p style={{ fontSize: "13px", color: "var(--swiss-text-muted)", marginBottom: "16px", fontStyle: "italic" }}>Origen: {pendingContext.source} {pendingContext.title ? `- ${pendingContext.title}` : ""}</p>
                    <textarea
                      readOnly
                      value={pendingContext.content}
                      style={{ width: "100%", height: "120px", padding: "16px", borderRadius: "16px", border: "1.5px solid var(--swiss-border)", backgroundColor: "var(--swiss-bg)", fontSize: "13px", resize: "none", marginBottom: "16px" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateBookForm("include", `${bookForm.include}${bookForm.include ? "\n\n" : ""}${pendingContext.content}`);
                        setPendingContext(null);
                      }}
                      className="swiss-landing-cta"
                      style={{ padding: "10px 20px", borderRadius: "22px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase" }}
                    >
                      Usar este material
                    </button>
                  </div>
                )}

                <form
                  onSubmit={handleCrearLibro}
                  style={{
                  backgroundColor: "var(--swiss-bg)",
                  border: "2px solid #000",
                  borderRadius: "22px",
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px"
                  }}
                >
                  <h3 style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase" }}>Crear libro nuevo</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-text-muted)", display: "block", marginBottom: "6px" }}>Título del libro</label>
                      <input
                        type="text"
                        value={bookForm.title}
                        onChange={(event) => updateBookForm("title", event.target.value)}
                        placeholder="Ejemplo: Mi práctica de imaginación"
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "16px",
                          border: "2px solid var(--swiss-border)",
                          fontSize: "14px",
                          fontFamily: "inherit",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-text-muted)", display: "block", marginBottom: "6px" }}>Tema central</label>
                      <input
                        type="text"
                        value={bookForm.theme}
                        onChange={(event) => updateBookForm("theme", event.target.value)}
                        placeholder="Ejemplo: vivir desde el final, dinero, amor, fe, revisión, identidad..."
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "16px",
                          border: "2px solid var(--swiss-border)",
                          fontSize: "14px",
                          fontFamily: "inherit",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-text-muted)", display: "block", marginBottom: "6px" }}>¿Qué querés que incluya?</label>
                      <textarea
                        value={bookForm.include}
                        onChange={(event) => updateBookForm("include", event.target.value)}
                        placeholder="Ejemplo: mis conversaciones, escenas, planes, entradas del diario, testimonios relacionados o explicaciones bíblicas."
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "16px",
                          border: "2px solid var(--swiss-border)",
                          fontSize: "14px",
                          fontFamily: "inherit",
                          resize: "vertical",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-text-muted)", display: "block", marginBottom: "6px" }}>Tono</label>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {["Práctico", "Narrativo", "Estudio", "Íntimo"].map((tono) => (
                          <button
                            key={tono}
                            type="button"
                            onClick={() => updateBookForm("tone", tono)}
                            style={{
                              padding: "8px 16px",
                              borderRadius: "22px",
                              border: bookForm.tone === tono ? "2px solid #000" : "2px solid var(--swiss-border)",
                              backgroundColor: bookForm.tone === tono ? "var(--swiss-fg)" : "var(--swiss-muted)",
                              color: bookForm.tone === tono ? "#fff" : "var(--swiss-fg)",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "border-color 0.15s ease"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--swiss-accent)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--swiss-border)"; }}
                          >
                            {tono}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {bookError && (
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "var(--swiss-accent)" }}>
                      {bookError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={bookLoading}
                    className="swiss-landing-cta"
                    style={{ padding: "14px 20px", borderRadius: "999px", fontSize: "13px", fontWeight: 900, textTransform: "uppercase", alignSelf: "flex-start", opacity: bookLoading ? 0.65 : 1, cursor: bookLoading ? "not-allowed" : "pointer" }}
                  >
                    {bookLoading ? "Creando libro..." : "Crear libro"}
                  </button>
                </form>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => resetBookDraft()}
                    style={{ padding: "14px 16px", borderRadius: "22px", border: "2px solid #000", backgroundColor: "var(--swiss-bg)", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", cursor: "pointer", textAlign: "left" }}
                  >
                    Crear libro desde cero
                  </button>
                  {[
                    "Desde mi deseo — próximamente",
                    "Desde mis conversaciones — próximamente",
                    "Desde mi diario — próximamente",
                    "Desde un plan — próximamente"
                  ].map((label) => (
                    <button
                      key={label}
                      type="button"
                      disabled
                      style={{ padding: "14px 16px", borderRadius: "22px", border: "2px solid var(--swiss-border)", backgroundColor: "var(--swiss-muted)", color: "var(--swiss-text-muted)", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", cursor: "not-allowed", textAlign: "left", opacity: 0.72 }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bookDraft && (
              <div style={{
                backgroundColor: "var(--swiss-bg)",
                border: "2px solid #000",
                borderRadius: "22px",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "18px"
              }}>
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-text-muted)" }}>Borrador de libro</p>
                  <h3 style={{ margin: 0, fontSize: "24px", fontWeight: 900, textTransform: "uppercase" }}>{bookForm.title}</h3>
                  <p style={{ margin: "8px 0 0", fontSize: "13px", fontWeight: 700, color: "var(--swiss-text-muted)" }}>
                    Tema: {bookForm.theme} · Tono: {bookForm.tone}
                  </p>
                </div>

                <div style={{ backgroundColor: "var(--swiss-muted)", borderRadius: "16px", padding: "20px", fontSize: "14px", lineHeight: 1.7, whiteSpace: "normal" }}>
                  {parseMarkdown(bookDraft)}
                </div>

                {bookError && (
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "var(--swiss-accent)" }}>{bookError}</p>
                )}
                {bookSavedMessage && (
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "var(--swiss-fg)" }}>{bookSavedMessage}</p>
                )}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleGuardarLibroEnMemoria}
                    disabled={bookSavingMemory}
                    className="swiss-landing-cta"
                    style={{ borderRadius: "999px", padding: "10px 16px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", opacity: bookSavingMemory ? 0.65 : 1 }}
                  >
                    {bookSavingMemory ? "Guardando..." : "Guardar en memoria"}
                  </button>
                  <button
                    type="button"
                    disabled
                    style={{ borderRadius: "999px", padding: "10px 16px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", border: "1.5px solid var(--swiss-border)", backgroundColor: "var(--swiss-muted)", color: "var(--swiss-text-muted)", cursor: "not-allowed" }}
                  >
                    Agregar material del diario — próximamente
                  </button>
                  <button
                    type="button"
                    disabled
                    style={{ borderRadius: "999px", padding: "10px 16px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", border: "1.5px solid var(--swiss-border)", backgroundColor: "var(--swiss-muted)", color: "var(--swiss-text-muted)", cursor: "not-allowed" }}
                  >
                    Agregar conversaciones — próximamente
                  </button>
                  <button
                    type="button"
                    onClick={() => sendToSection("examenes", { source: "Mi libro", title: bookForm.title, action: "examenes", content: bookDraft })}
                    style={{ borderRadius: "999px", padding: "10px 16px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", border: "1.5px solid #000", backgroundColor: "var(--swiss-bg)", color: "var(--swiss-fg)", cursor: "pointer" }}
                  >
                    Crear preguntas sobre este libro
                  </button>
                  <button
                    type="button"
                    onClick={() => sendToSection("planes", { source: "Mi libro", title: bookForm.title, action: "planes", content: bookDraft })}
                    style={{ borderRadius: "999px", padding: "10px 16px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", border: "1.5px solid #000", backgroundColor: "var(--swiss-bg)", color: "var(--swiss-fg)", cursor: "pointer" }}
                  >
                    Convertir en plan
                  </button>
                  <button
                    type="button"
                    onClick={resetBookDraft}
                    className="flux-btn-secondary"
                    style={{ borderRadius: "999px", padding: "10px 16px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase" }}
                  >
                    Crear otro libro
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. MEMORIA */}
        {currentTab === "memoria" && (
          <MemoryPanel sendToSection={sendToSection} pendingContext={pendingContext} clearPendingContext={() => setPendingContext(null)} session={session} />
        )}

        {currentTab === "telegram" && (
          <TelegramView sendToSection={sendToSection} pendingContext={pendingContext} clearPendingContext={() => setPendingContext(null)} />
        )}

        {currentTab === "narrador" && (
          <NarratorView sendToSection={sendToSection} pendingContext={pendingContext} clearPendingContext={() => setPendingContext(null)} />
        )}

        {currentTab === "notas" && (
          <NotesPanel sendToSection={sendToSection} />
        )}

        {currentTab === "diario" && (
          <JournalPanel sendToSection={sendToSection} pendingContext={pendingContext} clearPendingContext={() => setPendingContext(null)} />
        )}

        {/* 7. PLANES */}
        {currentTab === "planes" && (
          <div>
            <header className="content-header" style={{ marginBottom: "20px" }}>
              <h2 className="flux-title" style={{ fontSize: "20px" }}>Planes Personalizados</h2>
              <p className="flux-subtitle">Prácticas guiadas de 7, 15 o 30 días diseñadas para tu crecimiento.</p>
            </header>

            {pendingContext?.target === "planes" && (
              <div style={{ backgroundColor: "var(--swiss-bg)", border: "2px solid #000", borderRadius: "22px", padding: "32px", marginBottom: "32px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", marginBottom: "16px" }}>
                  Crear plan desde: {pendingContext.source} {pendingContext.title ? `- ${pendingContext.title}` : ""}
                </h3>
                <textarea
                  readOnly
                  value={pendingContext.content}
                  style={{ width: "100%", height: "120px", padding: "16px", borderRadius: "16px", border: "2px solid var(--swiss-border)", backgroundColor: "var(--swiss-muted)", fontSize: "13px", resize: "none", marginBottom: "16px" }}
                />
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button onClick={() => setPendingContext(null)} className="swiss-landing-cta" style={{ padding: "12px 24px", borderRadius: "22px", fontSize: "12px", fontWeight: 900, textTransform: "uppercase" }}>Plan de 7 días</button>
                  <button onClick={() => setPendingContext(null)} className="swiss-landing-cta" style={{ padding: "12px 24px", borderRadius: "22px", fontSize: "12px", fontWeight: 900, textTransform: "uppercase" }}>Plan de 15 días</button>
                  <button onClick={() => setPendingContext(null)} className="swiss-landing-cta" style={{ padding: "12px 24px", borderRadius: "22px", fontSize: "12px", fontWeight: 900, textTransform: "uppercase" }}>Plan de 30 días</button>
                  <button onClick={() => setPendingContext(null)} className="flux-btn-secondary" style={{ padding: "12px 24px", borderRadius: "22px", fontSize: "12px", fontWeight: 900, textTransform: "uppercase" }}>Cancelar</button>
                </div>
              </div>
            )}

            {loadingPlanes ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0" }}>
                <CargandoCerebro label="Cargando planes..." />
              </div>
            ) : planes.length === 0 ? (
              <div className="flux-exam-container" style={{ textAlign: "center", padding: "40px" }}>
                <MapIconLucide size={32} className="text-stone-300 mb-3" style={{ margin: "0 auto 12px" }} />
                <h4 className="text-sm font-bold text-stone-900 mb-2">Todavía no hay planes</h4>
                <p className="text-[11px] text-stone-500 mb-4">Podés crear uno desde un deseo, una charla, una entrada del diario o una escena.</p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                  <button onClick={() => setCurrentTab("aula")} className="flux-btn-primary" style={{ marginTop: 0 }}>Crear plan de 7 días</button>
                  <button onClick={() => setCurrentTab("aula")} className="flux-btn-primary" style={{ marginTop: 0 }}>Crear plan de 15 días</button>
                  <button onClick={() => setCurrentTab("aula")} className="flux-btn-primary" style={{ marginTop: 0 }}>Crear plan de 30 días</button>
                  <button onClick={() => setCurrentTab("aula")} className="flux-btn-secondary" style={{ marginTop: 0 }}>Crear plan desde Coach</button>
                </div>
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
              <h2 className="flux-title" style={{ fontSize: "20px" }}>Perfil / Cuenta</h2>
              <p className="flux-subtitle">Tu cuenta en {BRAND_NAME}.</p>
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
                    <p className="text-[13px] font-bold text-stone-900">
                      {displayName}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Email</span>
                    <p className="text-[13px] text-stone-700">{currentUser?.email || "Sin sesión"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Plan actual</span>
                    <p className="text-[13px] font-bold text-stone-900">{planLabel}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Estado de suscripción</span>
                    <p className="text-[13px] text-stone-700">{subscriptionStatus}</p>
                  </div>
                  {isAdminUser && (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span className="flux-class-badge" style={{ backgroundColor: "#000", color: "#fff" }}>Administrador</span>
                      <span className="flux-class-badge" style={{ backgroundColor: "var(--swiss-accent)", color: "#fff" }}>Plan fundador</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Miembro desde</span>
                    <p className="text-[13px] text-stone-700">Junio 2026</p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", paddingTop: "8px" }}>
                    <button className="flux-btn-secondary" style={{ borderRadius: "999px", padding: "8px 14px", fontSize: "11px", fontWeight: 900, display: "flex", alignItems: "center", gap: "6px", border: "2px solid #000" }}>
                      <Edit3 size={14} /> Editar nombre
                    </button>
                    <button onClick={handleSignOut} className="flux-btn-secondary" style={{ borderRadius: "999px", padding: "8px 14px", fontSize: "11px", fontWeight: 900, display: "flex", alignItems: "center", gap: "6px", border: "2px solid #000" }}>
                      <LogOut size={14} /> Cerrar sesión
                    </button>
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
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Consultas usadas / límite</span>
                    <p className="text-[13px] font-bold text-stone-900">{questionsCount} usadas · límite 200</p>
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
                      <option value="profesor">Coach</option>
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

        </div>{/* /odiseo-viewport */}
      </div>{/* /odiseo-main */}

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
                Trabajar este texto
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Bottom Navigation Bar */}
      <nav className="flux-mobile-nav" style={{ overflowX: "auto", flexWrap: "nowrap" }}>
        <button
          onClick={() => setCurrentTab("panel")}
          className={`flux-mobile-nav__link ${currentTab === "panel" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <HomeIcon aria-hidden="true" size={20} />
          <span>Inicio</span>
        </button>

        <button
          onClick={() => { setCurrentTab("aula"); setAgent("profesor"); setChatMode("conversar"); }}
          className={`flux-mobile-nav__link ${currentTab === "aula" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <MessageSquareText aria-hidden="true" size={20} />
          <span>Coach</span>
        </button>

        <button
          onClick={() => setCurrentTab("narrador")}
          className={`flux-mobile-nav__link ${currentTab === "narrador" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <Sparkles aria-hidden="true" size={20} />
          <span>Narrador</span>
        </button>

        <button
          onClick={() => setCurrentTab("testimonios")}
          className={`flux-mobile-nav__link ${currentTab === "testimonios" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <ScrollText aria-hidden="true" size={20} />
          <span>Testimonios</span>
        </button>

        <button
          onClick={() => setCurrentTab("biblico")}
          className={`flux-mobile-nav__link ${currentTab === "biblico" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <Cross aria-hidden="true" size={20} />
          <span>Bíblico</span>
        </button>

        <button
          onClick={() => setCurrentTab("examenes")}
          className={`flux-mobile-nav__link ${currentTab === "examenes" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <HelpCircle aria-hidden="true" size={20} />
          <span>Preguntas</span>
        </button>

        <button
          onClick={() => setCurrentTab("libro")}
          className={`flux-mobile-nav__link ${currentTab === "libro" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <BookOpen aria-hidden="true" size={20} />
          <span>Libro</span>
        </button>

        <button
          onClick={() => setCurrentTab("planes")}
          className={`flux-mobile-nav__link ${currentTab === "planes" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <Calendar aria-hidden="true" size={20} />
          <span>Planes</span>
        </button>

        <button
          onClick={() => setCurrentTab("telegram")}
          className={`flux-mobile-nav__link ${currentTab === "telegram" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <Send aria-hidden="true" size={20} />
          <span>Telegram</span>
        </button>

        <button
          onClick={() => setCurrentTab("diario")}
          className={`flux-mobile-nav__link ${currentTab === "diario" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <FileText aria-hidden="true" size={20} />
          <span>Diario</span>
        </button>

        <button
          onClick={() => setCurrentTab("memoria")}
          className={`flux-mobile-nav__link ${currentTab === "memoria" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <History aria-hidden="true" size={20} />
          <span>Memoria</span>
        </button>

        <button
          onClick={() => setCurrentTab("notas")}
          className={`flux-mobile-nav__link ${currentTab === "notas" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <StickyNote aria-hidden="true" size={20} />
          <span>Notas</span>
        </button>

        <button
          onClick={() => setCurrentTab("biblioteca")}
          className={`flux-mobile-nav__link ${currentTab === "biblioteca" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <Library aria-hidden="true" size={20} />
          <span>Fuentes</span>
        </button>

        <button
          onClick={() => setCurrentTab("perfil")}
          className={`flux-mobile-nav__link ${currentTab === "perfil" ? "flux-mobile-nav__link--active" : ""}`}
        >
          <UserCog aria-hidden="true" size={20} />
          <span>Cuenta</span>
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
