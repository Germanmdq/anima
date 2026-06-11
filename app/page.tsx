"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Activity,
  Bell,
  BookOpen,
  BookText,
  Bot,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  Cross,
  Menu,
  GraduationCap,
  History,
  HomeIcon,
  Library,
  Lightbulb,
  Map as MapIconLucide,
  MessageCircle,
  MessageSquareText,
  NotebookPen,
  NotebookTabs,
  PenLine,
  Quote,
  Save,
  ScrollText,
  SearchIcon,
  Sparkles,
  Star,
  StickyNote,
  Sun,
  Trophy,
  UserCog,
  UserRound,
  HelpCircle,
  Send,
  FileText,
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
  const [mobileNavGroup, setMobileNavGroup] = useState<string | null>(null);

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
  const [openAlphaLetters, setOpenAlphaLetters] = useState<Set<string>>(new Set());

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
  const [bookOpen, setBookOpen] = useState(false);
  const [openChapters, setOpenChapters] = useState<Set<number>>(new Set());

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
    const scrollToBento = () => { document.getElementById("pub-herramientas")?.scrollIntoView({ behavior: "smooth" }); };
    // legacy landingTools kept for reference — no longer rendered
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
      <div style={{ background: "#fff", overflowX: "hidden" }} suppressHydrationWarning>

        {/* ── 1. NAV ── */}
        <header className="pub-nav">
          <div className="pub-nav__inner">
            <a className="pub-logo" href="#">
              <div className="pub-logo__icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="5" stroke="#fff" strokeWidth="2"/>
                  <circle cx="7" cy="7" r="2" fill="#fff"/>
                </svg>
              </div>
              <div className="pub-logo__text">
                <span className="pub-logo__name">Odiseo</span>
                <span className="pub-logo__sub">Tu compañero de imaginación</span>
              </div>
            </a>
            <div className="pub-nav__cta">
              <button className="pub-nav-btn pub-nav-btn--ghost" onClick={() => { setLoginMode("login"); setShowLoginModal(true); }}>
                Ingresar
              </button>
              <button className="pub-nav-btn pub-nav-btn--solid" onClick={goToLogin}>
                Empezar gratis
              </button>
            </div>
          </div>
        </header>

        {/* ── 2. HERO ── */}
        <section className="pub-hero">
          <div className="pub-hero__top">
            <h1 className="pub-hero__h1">
              <span className="pub-hero__h1-brand">Odiseo</span>
              <span className="pub-hero__h1-tagline">donde la razón no existe.</span>
            </h1>
          </div>

          {/* ── Desktop orbital — 1100×460, centro 550,230 ── */}
          <div className="pub-orbital-wrap pub-orbital-wrap--desktop">
            <svg viewBox="0 0 1100 460" className="pub-orbital-svg" preserveAspectRatio="none" aria-hidden="true">
              <circle cx="550" cy="230" r="110" fill="none" stroke="white" strokeWidth="1" opacity="0.06"/>
              <circle cx="550" cy="230" r="200" fill="none" stroke="white" strokeWidth="1" opacity="0.045"/>
              <circle cx="550" cy="230" r="290" fill="none" stroke="white" strokeWidth="1" opacity="0.03"/>
              {/* fp1 Coach */}
              <circle r="6" fill="#E8401A" opacity="0.3"><animateMotion dur="2.8s" repeatCount="indefinite" begin="0s"    path="M 110 50  Q 330 140 550 230"/></circle>
              <circle r="3.5" fill="#E8401A">              <animateMotion dur="2.8s" repeatCount="indefinite" begin="0s"    path="M 110 50  Q 330 140 550 230"/></circle>
              {/* fp2 Narrador */}
              <circle r="6" fill="#E8401A" opacity="0.3"><animateMotion dur="2.6s" repeatCount="indefinite" begin="0.3s"  path="M 50 230  L 550 230"/></circle>
              <circle r="3.5" fill="#E8401A">              <animateMotion dur="2.6s" repeatCount="indefinite" begin="0.3s"  path="M 50 230  L 550 230"/></circle>
              {/* fp3 Testimonios */}
              <circle r="6" fill="#E8401A" opacity="0.3"><animateMotion dur="3.0s" repeatCount="indefinite" begin="0.7s"  path="M 110 410 Q 330 320 550 230"/></circle>
              <circle r="3.5" fill="#E8401A">              <animateMotion dur="3.0s" repeatCount="indefinite" begin="0.7s"  path="M 110 410 Q 330 320 550 230"/></circle>
              {/* fp4 Biblia */}
              <circle r="6" fill="#E8401A" opacity="0.3"><animateMotion dur="2.7s" repeatCount="indefinite" begin="0.5s"  path="M 990 50  Q 770 140 550 230"/></circle>
              <circle r="3.5" fill="#E8401A">              <animateMotion dur="2.7s" repeatCount="indefinite" begin="0.5s"  path="M 990 50  Q 770 140 550 230"/></circle>
              {/* fp5 Memoria */}
              <circle r="6" fill="#E8401A" opacity="0.3"><animateMotion dur="3.2s" repeatCount="indefinite" begin="1.0s"  path="M 1050 230 L 550 230"/></circle>
              <circle r="3.5" fill="#E8401A">              <animateMotion dur="3.2s" repeatCount="indefinite" begin="1.0s"  path="M 1050 230 L 550 230"/></circle>
              {/* fp6 Mi libro */}
              <circle r="6" fill="#E8401A" opacity="0.3"><animateMotion dur="2.9s" repeatCount="indefinite" begin="1.4s"  path="M 990 410 Q 770 320 550 230"/></circle>
              <circle r="3.5" fill="#E8401A">              <animateMotion dur="2.9s" repeatCount="indefinite" begin="1.4s"  path="M 990 410 Q 770 320 550 230"/></circle>
            </svg>
            <div className="pub-orbital-nodes">
              <div className="pub-orbital-center-wrap">
                <div className="pub-orbital-center">
                  <svg width="44" height="44" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="5" stroke="#fff" strokeWidth="2.6"/>
                    <circle cx="7" cy="7" r="2" fill="#fff"/>
                  </svg>
                </div>
                <span className="pub-orbital-center-label">Odiseo</span>
              </div>
              <div className="pub-orbital-node" style={{ left: "80px", top: "20px" }}>
                <div className="pub-orbital-node__circle"><MessageCircle size={24} stroke="#ff8a66" strokeWidth={2.2} fill="none"/></div>
                <span className="pub-orbital-node__label">Coach</span>
              </div>
              <div className="pub-orbital-node" style={{ left: "20px", top: "200px" }}>
                <div className="pub-orbital-node__circle"><BookOpen size={24} stroke="#ff8a66" strokeWidth={2.2}/></div>
                <span className="pub-orbital-node__label">Narrador</span>
              </div>
              <div className="pub-orbital-node" style={{ left: "80px", top: "380px" }}>
                <div className="pub-orbital-node__circle"><Star size={24} stroke="#ff8a66" strokeWidth={2.2}/></div>
                <span className="pub-orbital-node__label">Testimonios</span>
              </div>
              <div className="pub-orbital-node" style={{ right: "80px", top: "20px" }}>
                <div className="pub-orbital-node__circle"><Sun size={24} stroke="#ff8a66" strokeWidth={2.2}/></div>
                <span className="pub-orbital-node__label">Biblia</span>
              </div>
              <div className="pub-orbital-node" style={{ right: "20px", top: "200px" }}>
                <div className="pub-orbital-node__circle"><Save size={24} stroke="#ff8a66" strokeWidth={2.2}/></div>
                <span className="pub-orbital-node__label">Memoria</span>
              </div>
              <div className="pub-orbital-node" style={{ right: "80px", top: "380px" }}>
                <div className="pub-orbital-node__circle"><PenLine size={24} stroke="#ff8a66" strokeWidth={2.2}/></div>
                <span className="pub-orbital-node__label">Mi libro</span>
              </div>
            </div>
          </div>

          {/* ── Mobile orbital — 360×440, centro 180,220 ── */}
          <div className="pub-orbital-wrap pub-orbital-wrap--mobile">
            <svg viewBox="0 0 360 440" className="pub-orbital-svg" preserveAspectRatio="none" aria-hidden="true">
              <circle cx="180" cy="220" r="95"  fill="none" stroke="white" strokeWidth="1" opacity="0.07"/>
              <circle cx="180" cy="220" r="160" fill="none" stroke="white" strokeWidth="1" opacity="0.05"/>
              {/* mp1 Coach */}
              <circle r="5" fill="#E8401A" opacity="0.3"><animateMotion dur="2.8s" repeatCount="indefinite" begin="0s"    path="M 42 34  Q 115 130 180 220"/></circle>
              <circle r="3" fill="#E8401A">              <animateMotion dur="2.8s" repeatCount="indefinite" begin="0s"    path="M 42 34  Q 115 130 180 220"/></circle>
              {/* mp2 Narrador */}
              <circle r="5" fill="#E8401A" opacity="0.3"><animateMotion dur="2.6s" repeatCount="indefinite" begin="0.3s"  path="M 16 220 L 180 220"/></circle>
              <circle r="3" fill="#E8401A">              <animateMotion dur="2.6s" repeatCount="indefinite" begin="0.3s"  path="M 16 220 L 180 220"/></circle>
              {/* mp3 Testimonios */}
              <circle r="5" fill="#E8401A" opacity="0.3"><animateMotion dur="3.0s" repeatCount="indefinite" begin="0.7s"  path="M 42 406 Q 115 310 180 220"/></circle>
              <circle r="3" fill="#E8401A">              <animateMotion dur="3.0s" repeatCount="indefinite" begin="0.7s"  path="M 42 406 Q 115 310 180 220"/></circle>
              {/* mp4 Biblia */}
              <circle r="5" fill="#E8401A" opacity="0.3"><animateMotion dur="2.7s" repeatCount="indefinite" begin="0.5s"  path="M 318 34  Q 245 130 180 220"/></circle>
              <circle r="3" fill="#E8401A">              <animateMotion dur="2.7s" repeatCount="indefinite" begin="0.5s"  path="M 318 34  Q 245 130 180 220"/></circle>
              {/* mp5 Memoria */}
              <circle r="5" fill="#E8401A" opacity="0.3"><animateMotion dur="3.2s" repeatCount="indefinite" begin="1.0s"  path="M 344 220 L 180 220"/></circle>
              <circle r="3" fill="#E8401A">              <animateMotion dur="3.2s" repeatCount="indefinite" begin="1.0s"  path="M 344 220 L 180 220"/></circle>
              {/* mp6 Mi libro */}
              <circle r="5" fill="#E8401A" opacity="0.3"><animateMotion dur="2.9s" repeatCount="indefinite" begin="1.4s"  path="M 318 406 Q 245 310 180 220"/></circle>
              <circle r="3" fill="#E8401A">              <animateMotion dur="2.9s" repeatCount="indefinite" begin="1.4s"  path="M 318 406 Q 245 310 180 220"/></circle>
            </svg>
            <div className="pub-orbital-nodes">
              <div className="pub-orbital-center-wrap pub-orbital-center-wrap--sm">
                <div className="pub-orbital-center pub-orbital-center--sm">
                  <svg width="34" height="34" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="5" stroke="#fff" strokeWidth="2"/>
                    <circle cx="7" cy="7" r="2" fill="#fff"/>
                  </svg>
                </div>
                <span className="pub-orbital-center-label pub-orbital-center-label--sm">Odiseo</span>
              </div>
              <div className="pub-orbital-node pub-orbital-node--sm" style={{ left: "28px", top: "5px" }}>
                <div className="pub-orbital-node__circle"><MessageCircle size={22} stroke="#ff8a66" strokeWidth={2.2} fill="none"/></div>
                <span className="pub-orbital-node__label">Coach</span>
              </div>
              <div className="pub-orbital-node pub-orbital-node--sm" style={{ left: "12px", top: "194px" }}>
                <div className="pub-orbital-node__circle"><BookOpen size={22} stroke="#ff8a66" strokeWidth={2.2}/></div>
                <span className="pub-orbital-node__label">Narrador</span>
              </div>
              <div className="pub-orbital-node pub-orbital-node--sm" style={{ left: "28px", bottom: "0px" }}>
                <div className="pub-orbital-node__circle"><Star size={22} stroke="#ff8a66" strokeWidth={2.2}/></div>
                <span className="pub-orbital-node__label">Testimonios</span>
              </div>
              <div className="pub-orbital-node pub-orbital-node--sm" style={{ right: "28px", top: "5px" }}>
                <div className="pub-orbital-node__circle"><Sun size={22} stroke="#ff8a66" strokeWidth={2.2}/></div>
                <span className="pub-orbital-node__label">Biblia</span>
              </div>
              <div className="pub-orbital-node pub-orbital-node--sm" style={{ right: "12px", top: "194px" }}>
                <div className="pub-orbital-node__circle"><Save size={22} stroke="#ff8a66" strokeWidth={2.2}/></div>
                <span className="pub-orbital-node__label">Memoria</span>
              </div>
              <div className="pub-orbital-node pub-orbital-node--sm" style={{ right: "28px", bottom: "0px" }}>
                <div className="pub-orbital-node__circle"><PenLine size={22} stroke="#ff8a66" strokeWidth={2.2}/></div>
                <span className="pub-orbital-node__label">Mi libro</span>
              </div>
            </div>
          </div>

          <div className="pub-hero__bottom">
            <div className="pub-hero__cta-row">
              <button className="pub-hero-btn pub-hero-btn--solid" onClick={goToLogin}>Entrá gratis</button>
              <button className="pub-hero-btn pub-hero-btn--ghost" onClick={scrollToBento}>Ver cómo funciona</button>
            </div>
            <p className="pub-hero__note">Sin tarjeta. Sin configuración.</p>
          </div>
        </section>

        {/* ── 3. BENTO GRID ── */}
        <section className="pub-bento" id="pub-herramientas">
          <div className="pub-bento__inner">
            <div className="pub-bento-header">
              <span className="pub-bento-eyebrow">Herramientas</span>
              <h2 className="pub-bento-h2">Todo lo que necesitás en un solo lugar</h2>
              <p className="pub-bento-desc">Cada herramienta conectada con las demás. Con memoria.</p>
            </div>

            <div className="pub-bento-grid">

              {/* Coach — span 2 — animated chat */}
              <div className="pub-card pub-card--wide" id="pub-coach">
                <div className="pub-card__body">
                  <div className="pub-card__icon" style={{ background: "rgba(232,64,26,0.1)" }}>
                    <MessageCircle size={22} stroke="#E8401A" strokeWidth={1.8} fill="none"/>
                  </div>
                  <h3 className="pub-card__h3">Coach</h3>
                  <p className="pub-card__p">Trabajá tu deseo con una guía directa. Volvé al estado que elegís, paso a paso. El Coach recuerda tu deseo, tu escena y tu avance — cada conversación continúa donde dejaste la anterior.</p>
                  <div className="pub-card__chips" style={{ marginTop: "auto" }}>
                    <span className="pub-card__chip pub-card__chip--accent">Estado elegido</span>
                    <span className="pub-card__chip pub-card__chip--accent">Deseo</span>
                    <span className="pub-card__chip pub-card__chip--accent">Práctica</span>
                  </div>
                </div>
                <div className="pub-chat-preview pub-chat-preview--anim">
                  <div className="pub-chat-bubble pub-chat-bubble--gray pub-chat-msg--1">¿Qué escena confirmaría que tu deseo ya se cumplió?</div>
                  <div className="pub-chat-bubble pub-chat-bubble--dark pub-chat-msg--2">Mi hermana abrazándome: ¡al final lo lograste!</div>
                  <div className="pub-chat-typing"><span/><span/><span/></div>
                  <div className="pub-chat-bubble pub-chat-bubble--gray pub-chat-msg--3">Perfecto. Esta noche dormí desde esa escena.</div>
                </div>
              </div>

              {/* Narrador */}
              <div className="pub-card" id="pub-estudio">
                <div className="pub-card__icon" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <BookOpen size={22} stroke="#fff" strokeWidth={1.8}/>
                </div>
                <h3 className="pub-card__h3">Narrador</h3>
                <p className="pub-card__p">Explicaciones vivas, ejemplos y escenas guiadas para entender de verdad.</p>
                <div className="pub-narr-box">
                  <div className="pub-narr-label">
                    <div className="pub-narr-dot"/>
                    <span>NARRANDO ESCENA</span>
                  </div>
                  <div className="pub-narr-lines">
                    <p className="pub-narr-line pub-narr-line--1">"Cerrá los ojos. Estás en la cocina de tu casa nueva…"</p>
                    <p className="pub-narr-line pub-narr-line--2">"El olor a café recién hecho llena el aire…"</p>
                    <p className="pub-narr-line pub-narr-line--3">"Y sentís, sin dudarlo: esto ya es mío."</p>
                  </div>
                </div>
              </div>

              {/* Biblia — dark background, animated chips */}
              <div className="pub-card pub-card--dark">
                <div className="pub-card__icon" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <Sun size={22} stroke="#fff" strokeWidth={1.8}/>
                </div>
                <h3 className="pub-card__h3" style={{ color: "#fff" }}>Biblia metafísica</h3>
                <p className="pub-card__p" style={{ color: "rgba(255,255,255,0.55)" }}>Entendé los símbolos bíblicos como estados de conciencia.</p>
                <div className="pub-card__chips">
                  <span className="pub-card__chip pub-biblia-chip pub-biblia-chip--1">Yo Soy</span>
                  <span className="pub-card__chip pub-biblia-chip pub-biblia-chip--2">Moisés</span>
                  <span className="pub-card__chip pub-biblia-chip pub-biblia-chip--3">Egipto</span>
                </div>
              </div>

              {/* Testimonios — accent red, rotating quotes */}
              <div className="pub-card pub-card--red">
                <div className="pub-card__icon" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <Star size={22} stroke="#fff" strokeWidth={1.8}/>
                </div>
                <h3 className="pub-card__h3" style={{ color: "#fff" }}>Testimonios</h3>
                <p className="pub-card__p" style={{ color: "rgba(255,255,255,0.8)" }}>Casos reales de personas que aplicaron la ley de imaginación.</p>
                <div className="pub-quotes">
                  <p className="pub-quote pub-quote--1">"Recuperé mi anillo después de 2 años."</p>
                  <p className="pub-quote pub-quote--2">"El trabajo llegó en 3 semanas."</p>
                  <p className="pub-quote pub-quote--3">"Volvimos a hablarnos con mi hijo."</p>
                </div>
              </div>

              {/* Planes — animated day strip */}
              <div className="pub-card">
                <div className="pub-card__icon" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <CalendarDays size={22} stroke="#fff" strokeWidth={1.8}/>
                </div>
                <h3 className="pub-card__h3">Planes guiados</h3>
                <p className="pub-card__p">Prácticas de 7, 15 o 30 días para sostener tu deseo.</p>
                <div className="pub-days-wrap">
                  <span className="pub-days-label">Sostener el deseo — 7 días</span>
                  <div className="pub-days-row">
                    {([1,2,3,4,5,6,7] as const).map(n => (
                      <div key={n} className="pub-day">
                        <span className="pub-day__num">{n}</span>
                        {n <= 4 && <div className={`pub-day__check pub-day__check--${n}`}>✓</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Memoria — span 2 — animated items */}
              <div className="pub-card pub-card--wide" id="pub-memoria">
                <div className="pub-card__body">
                  <div className="pub-card__icon" style={{ background: "rgba(232,64,26,0.1)" }}>
                    <Save size={22} stroke="#E8401A" strokeWidth={1.8}/>
                  </div>
                  <h3 className="pub-card__h3">Memoria</h3>
                  <p className="pub-card__p">Guardá lo importante y retomá fácil. No empieces de cero cada vez.</p>
                </div>
                <div className="pub-memoria-list">
                  <div className="pub-memoria-item pub-mem-anim--1">
                    <span className="pub-memoria-dot" style={{ background: "#E8401A" }}/>
                    <span className="pub-memoria-text">Visión del departamento en Palermo</span>
                    <span className="pub-memoria-tag">deseo</span>
                  </div>
                  <div className="pub-memoria-item pub-mem-anim--2">
                    <span className="pub-memoria-dot" style={{ background: "#1d1d1f" }}/>
                    <span className="pub-memoria-text">Escena del ascensor — 14 jun</span>
                    <span className="pub-memoria-tag">escena</span>
                  </div>
                  <div className="pub-memoria-item pub-mem-anim--3">
                    <span className="pub-memoria-dot" style={{ background: "#8e8e93" }}/>
                    <span className="pub-memoria-text">At Your Command — conferencia</span>
                    <span className="pub-memoria-tag">estudio</span>
                  </div>
                </div>
              </div>

              {/* Telegram — animated notification */}
              <div className="pub-card pub-card--telegram">
                <div className="pub-card__icon" style={{ background: "rgba(232,64,26,0.1)" }}>
                  <Send size={22} stroke="#E8401A" strokeWidth={1.8}/>
                </div>
                <h3 className="pub-card__h3">Telegram</h3>
                <p className="pub-card__p">Afirmaciones en el momento justo.</p>
                <div className="pub-notif">
                  <div className="pub-notif__header">
                    <div className="pub-notif__dot"/>
                    <span className="pub-notif__title">ODISEO · TELEGRAM</span>
                    <span className="pub-notif__time">ahora</span>
                  </div>
                  <div className="pub-notif__msg">Recordá: ya sos quien deseás ser. Viví desde ahí. ✦</div>
                </div>
              </div>

              {/* Todo conectado — span 2 — mini orbit */}
              <div className="pub-card pub-card--wide" id="pub-todo-conectado">
                <div className="pub-card__body">
                  <div className="pub-card__icon" style={{ background: "rgba(232,64,26,0.08)" }}>
                    <MessageCircle size={22} stroke="#E8401A" strokeWidth={1.8} fill="none"/>
                  </div>
                  <h3 className="pub-card__h3">Todo conectado</h3>
                  <p className="pub-card__p">Cada herramienta alimenta tu memoria.</p>
                </div>
                <div className="pub-mini-orbit-wrap">
                  <svg viewBox="0 0 200 180" className="pub-mini-orbit-svg" aria-hidden="true">
                    <circle cx="100" cy="90" r="55" fill="none" stroke="rgba(232,64,26,0.12)" strokeWidth="1.5"/>
                    <circle r="2.5" fill="#E8401A"><animateMotion dur="1.9s" repeatCount="indefinite" begin="0s"    path="M 54 44 L 100 90"/></circle>
                    <circle r="2.5" fill="#E8401A"><animateMotion dur="2.1s" repeatCount="indefinite" begin="0.5s"  path="M 146 44 L 100 90"/></circle>
                    <circle r="2.5" fill="#E8401A"><animateMotion dur="2.3s" repeatCount="indefinite" begin="1.0s"  path="M 54 136 L 100 90"/></circle>
                    <circle r="2.5" fill="#E8401A"><animateMotion dur="2.0s" repeatCount="indefinite" begin="0.35s" path="M 146 136 L 100 90"/></circle>
                  </svg>
                  <div className="pub-mini-orbit-nodes">
                    <div className="pub-mini-orbit-center">
                      <svg width="20" height="20" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <circle cx="7" cy="7" r="5" stroke="#fff" strokeWidth="2"/>
                        <circle cx="7" cy="7" r="2" fill="#fff"/>
                      </svg>
                    </div>
                    <div className="pub-mini-orbit-node" style={{ left: "27%", top: "24.4%" }}><MessageCircle size={15} stroke="#E8401A" strokeWidth={1.7} fill="none"/></div>
                    <div className="pub-mini-orbit-node" style={{ left: "73%", top: "24.4%" }}><BookOpen size={15} stroke="#E8401A" strokeWidth={1.7}/></div>
                    <div className="pub-mini-orbit-node" style={{ left: "27%", top: "75.6%" }}><Star size={15} stroke="#E8401A" strokeWidth={1.7}/></div>
                    <div className="pub-mini-orbit-node" style={{ left: "73%", top: "75.6%" }}><PenLine size={15} stroke="#E8401A" strokeWidth={1.7}/></div>
                  </div>
                </div>
              </div>

              {/* Mi libro */}
              <div className="pub-card">
                <div className="pub-card__icon" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <PenLine size={22} stroke="#fff" strokeWidth={1.8}/>
                </div>
                <h3 className="pub-card__h3">Mi libro</h3>
                <p className="pub-card__p">Convertí tus ideas y aprendizajes en capítulos de un libro propio.</p>
              </div>

            </div>
          </div>
        </section>

        {/* ── 4. CTA FINAL ── */}
        <section className="pub-cta-section">
          <div className="pub-cta-inner">
            <div className="pub-cta-box">
              <div>
                <h2 className="pub-cta-h2">Empezá tu práctica hoy.</h2>
                <p className="pub-cta-p">Gratis. Sin tarjeta. Sin complicaciones.</p>
              </div>
              <div className="pub-cta-side">
                <button className="pub-btn pub-btn--white pub-btn--lg" onClick={goToLogin}>
                  Entrá con Google →
                </button>
                <p className="pub-cta-sub">También podés registrarte con tu email</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. FOOTER ── */}
        <footer className="pub-footer">
          <p>© 2025 Odiseo · odiseo.online · Tu compañero de imaginación</p>
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
            {/* Search */}
            <div className="odiseo-search">
              <SearchIcon size={15} aria-hidden="true" />
              <input type="text" placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* Query counter */}
            <div className="ods-counter-pill" style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid var(--ods-g-300)", borderRadius: 999, padding: "6px 13px" }}>
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
          <div className="dash-wrap">

            {/* Greeting + plan badge */}
            <div className="dash-header">
              <div>
                <h2 className="dash-greeting">
                  Buen día{displayName && displayName !== "Usuario" ? `, ${displayName.split(" ")[0]}` : ""}.
                </h2>
                <p className="dash-greeting-sub">¿Qué querés trabajar hoy?</p>
              </div>
              <button className="plan-badge" onClick={() => setCurrentTab("planes")}>
                <span className="plan-badge-dot" />
                Sostener el deseo · Día 3 de 7
                <span className="plan-badge-arrow">→</span>
              </button>
            </div>

            {/* Tool grid */}
            <div className="dash-section-label">Herramientas</div>
            <div className="dash-tool-grid">
              {([
                { tab: "aula",        icon: <MessageCircle size={22} strokeWidth={1.8} stroke="#E8401A"/>, title: "Coach",                  desc: "Trabajá tu deseo con guía directa." },
                { tab: "narrador",    icon: <BookOpen      size={22} strokeWidth={1.8} stroke="#E8401A"/>, title: "Narrador",               desc: "Escenas guiadas y explicaciones vivas." },
                { tab: "testimonios", icon: <Star          size={22} strokeWidth={1.8} stroke="#E8401A"/>, title: "Testimonios",            desc: "Historias reales relacionadas con tu deseo." },
                { tab: "biblico",     icon: <Sun           size={22} strokeWidth={1.8} stroke="#E8401A"/>, title: "Biblia metafísica",      desc: "Símbolos bíblicos como estados de conciencia." },
                { tab: "examenes",    icon: <HelpCircle    size={22} strokeWidth={1.8} stroke="#E8401A"/>, title: "Preguntas",              desc: "Integrá conceptos con preguntas." },
                { tab: "biblioteca",  icon: <Library       size={22} strokeWidth={1.8} stroke="#E8401A"/>, title: "Fuentes",                desc: "Conferencias y libros de Neville." },
                { tab: "libro",       icon: <PenLine       size={22} strokeWidth={1.8} stroke="#E8401A"/>, title: "Mi libro",               desc: "Convertí tu proceso en capítulos propios." },
                { tab: "planes",      icon: <CalendarDays  size={22} strokeWidth={1.8} stroke="#E8401A"/>, title: "Planes",                 desc: "Prácticas de 7, 15 o 30 días." },
                { tab: "telegram",    icon: <Send          size={22} strokeWidth={1.8} stroke="#E8401A"/>, title: "Telegram",               desc: "Mensajes para volver al estado elegido." },
              ] as { tab: TabId; icon: React.ReactNode; title: string; desc: string }[]).map(({ tab, icon, title, desc }) => (
                <div
                  key={tab}
                  className="dash-tool-card"
                  onClick={() => {
                    setCurrentTab(tab);
                    if (tab === "aula") { setAgent("profesor"); setChatMode("conversar"); }
                  }}
                >
                  <div className="dash-tool-icon-wrap">{icon}</div>
                  <h4 className="dash-tool-h4">{title}</h4>
                  <p className="dash-tool-p">{desc}</p>
                  <span className="dash-tool-go">Abrir →</span>
                </div>
              ))}
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
          <div className="alpha-wrap">
            <header style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 4px", fontFamily: "var(--font-base)", color: "var(--color-dark)" }}>Fuentes de Neville</h2>
              <p style={{ fontSize: "14px", color: "var(--color-muted)", margin: 0, fontFamily: "var(--font-base)" }}>Conferencias y libros que alimentan las respuestas y prácticas de {BRAND_NAME}.</p>
            </header>

            {!hasFounderAccess && (
              <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "16px 20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", flexWrap: "wrap", boxShadow: "var(--shadow-card)" }}>
                <p style={{ fontSize: "13px", color: "var(--color-muted)", margin: 0, fontFamily: "var(--font-base)" }}>Las conferencias completas forman parte de la suscripción de {BRAND_NAME}.</p>
                <button className="swiss-landing-cta" style={{ borderRadius: "999px", padding: "9px 16px", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>Activar acceso</button>
              </div>
            )}

            {loadingLib ? (
              <SkeletonList rows={5} />
            ) : textosFiltrados.length === 0 ? (
              <p style={{ textAlign: "center", padding: "40px 0", color: "var(--color-muted)", fontSize: "14px", fontFamily: "var(--font-base)" }}>No se encontraron fuentes.</p>
            ) : (
              <div className="alpha-list">
                {(() => {
                  const groups: Record<string, TextoMetadatos[]> = {};
                  textosFiltrados.forEach((t) => {
                    const letter = (t.titulo[0] || "#").toUpperCase();
                    if (!groups[letter]) groups[letter] = [];
                    groups[letter].push(t);
                  });
                  return Object.keys(groups).sort().map((letter) => {
                    const items = groups[letter];
                    const isOpen = openAlphaLetters.has(letter);
                    const toggle = () => setOpenAlphaLetters((prev) => {
                      const next = new Set(prev);
                      if (next.has(letter)) next.delete(letter); else next.add(letter);
                      return next;
                    });
                    return (
                      <div key={letter} className={`alpha-section${isOpen ? " open" : ""}`}>
                        <button className="alpha-header" onClick={toggle} aria-expanded={isOpen}>
                          <span className="alpha-letter">{letter}</span>
                          <span className="alpha-count">{items.length} {items.length === 1 ? "fuente" : "fuentes"}</span>
                          <span className="alpha-chevron">▾</span>
                        </button>
                        <div className="alpha-items">
                          {items.map((texto, idx) => (
                            <button
                              key={idx}
                              className="alpha-item"
                              onClick={() => { if (hasFounderAccess) abrirTexto(texto); }}
                              style={{ opacity: hasFounderAccess ? 1 : 0.75, cursor: hasFounderAccess ? "pointer" : "default" }}
                            >
                              <span className="alpha-title">{texto.titulo}</span>
                              <span className="alpha-meta">
                                {texto.tituloOriginal ? `${texto.tituloOriginal} · ` : ""}
                                {texto.anio ? `${texto.anio}` : ""}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}

        {/* 4. PREGUNTAS Y RESPUESTAS */}
        {currentTab === "examenes" && (
          <div className="exam-wrap">
            <header style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 4px", fontFamily: "var(--font-base)", color: "var(--color-dark)" }}>Preguntas y respuestas</h2>
              <p style={{ fontSize: "14px", color: "var(--color-muted)", margin: 0, fontFamily: "var(--font-base)" }}>Integrá conceptos y descubrí qué entendiste realmente.</p>
            </header>

            <div className="exam-layout">
              {/* ── Columna izquierda: form ── */}
              <div className="exam-sidebar">
                <div className="exam-form-card">
                  {pendingContext?.target === "examenes" ? (
                    <>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", fontFamily: "var(--font-base)", color: "var(--color-muted)" }}>Material recibido</label>
                      <p style={{ fontSize: "12px", color: "var(--color-muted)", marginBottom: "8px", fontStyle: "italic", fontFamily: "var(--font-base)" }}>De: {pendingContext.source}</p>
                      <textarea readOnly value={pendingContext.content} style={{ width: "100%", height: "80px", padding: "10px 12px", borderRadius: "10px", border: "0.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", fontSize: "12px", resize: "none", marginBottom: "10px", fontFamily: "var(--font-base)", boxSizing: "border-box" }} />
                      <button onClick={generarExamen} className="swiss-landing-cta" style={{ width: "100%", padding: "12px", borderRadius: "10px", fontSize: "13px", fontWeight: 600 }}>Generar preguntas</button>
                      <button onClick={() => setPendingContext(null)} className="flux-btn-secondary" style={{ width: "100%", padding: "10px", borderRadius: "10px", fontSize: "12px", marginTop: "8px" }}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", fontFamily: "var(--font-base)", color: "var(--color-muted)" }}>Cantidad</label>
                        <select value={examQuantity} onChange={(e) => setExamQuantity(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "0.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", fontSize: "14px", fontFamily: "var(--font-base)" }}>
                          <option value="3">3 preguntas</option>
                          <option value="5">5 preguntas</option>
                          <option value="10">10 preguntas</option>
                          <option value="15">15 preguntas</option>
                          <option value="20">20 preguntas</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", fontFamily: "var(--font-base)", color: "var(--color-muted)" }}>Dificultad</label>
                        <select value={examDifficulty} onChange={(e) => setExamDifficulty(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "0.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", fontSize: "14px", fontFamily: "var(--font-base)" }}>
                          <option value="Inicial">Inicial</option>
                          <option value="Media">Media</option>
                          <option value="Profunda">Profunda</option>
                          <option value="Avanzada">Avanzada</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", fontFamily: "var(--font-base)", color: "var(--color-muted)" }}>Formato</label>
                        <select value={examFormat} onChange={(e) => setExamFormat(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "0.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", fontSize: "14px", fontFamily: "var(--font-base)" }}>
                          <option value="Texto abierto">Texto abierto</option>
                          <option value="Opción múltiple">Opción múltiple</option>
                          <option value="Verdadero o falso">Verdadero o falso</option>
                          <option value="Mixto">Mixto</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", fontFamily: "var(--font-base)", color: "var(--color-muted)" }}>Material o tema</label>
                        <textarea
                          value={examMaterial}
                          onChange={(e) => setExamMaterial(e.target.value)}
                          placeholder="vivir desde el final, revisión, dinero, Moisés..."
                          rows={3}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "0.5px solid var(--color-border)", background: "var(--color-bg)", fontSize: "14px", fontFamily: "var(--font-base)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                      <button onClick={generarExamen} className="swiss-landing-cta" style={{ width: "100%", padding: "13px", borderRadius: "10px", fontSize: "14px", fontWeight: 600 }} disabled={examLoading}>
                        {examLoading ? "Generando..." : "Generar preguntas"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ── Columna derecha: resultados ── */}
              <div className="exam-results-col">
                {!examStarted ? (
                  <div className="exam-empty">
                    <HelpCircle size={36} style={{ color: "var(--color-muted)", opacity: 0.35 }} />
                    <h3>Las preguntas aparecerán acá</h3>
                    <p>Completá el formulario y generá tu set de preguntas.</p>
                  </div>
                ) : examLoading ? (
                  <SkeletonList rows={4} />
                ) : examQuestions.length === 0 ? (
                  <div className="exam-empty">
                    <p style={{ color: "var(--color-muted)", fontSize: "14px" }}>No se pudieron generar preguntas. Intentá de nuevo.</p>
                    <button onClick={resetearExamen} className="flux-btn-primary" style={{ marginTop: 12 }}>Volver</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {examQuestions.map((p: any, idx: number) => (
                      <div key={p.id} style={{ backgroundColor: "var(--color-surface)", padding: "20px 22px", borderRadius: "14px", border: "0.5px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}>
                        <h4 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px", color: "var(--color-dark)", lineHeight: 1.4, fontFamily: "var(--font-base)" }}>
                          {idx + 1}. {p.pregunta}
                        </h4>
                        {p.tipo === "opcion_multiple" && p.opciones && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {p.opciones.map((opc: string, opcIdx: number) => (
                              <button key={opcIdx} onClick={() => { if (examScore !== null) return; setAnswers((prev) => ({ ...prev, [p.id]: opcIdx })); }} style={{ padding: "10px 14px", textAlign: "left", borderRadius: "8px", border: "2px solid", borderColor: examScore !== null ? (opcIdx === p.correcta ? "#10b981" : answers[p.id] === opcIdx ? "var(--swiss-accent)" : "transparent") : answers[p.id] === opcIdx ? "var(--swiss-fg)" : "transparent", backgroundColor: "var(--color-bg)", color: "var(--color-dark)", fontWeight: 500, cursor: examScore !== null ? "default" : "pointer", fontSize: "14px", fontFamily: "var(--font-base)", transition: "border-color 0.15s" }}>
                                {["A", "B", "C", "D"][opcIdx] || opcIdx + 1}. {opc}
                              </button>
                            ))}
                          </div>
                        )}
                        {p.tipo === "verdadero_falso" && (
                          <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={() => { if (examScore === null) setAnswers(prev => ({...prev, [p.id]: true})) }} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "2px solid", borderColor: examScore !== null ? (p.correcta === true ? "#10b981" : answers[p.id] === true ? "var(--swiss-accent)" : "transparent") : answers[p.id] === true ? "var(--swiss-fg)" : "transparent", backgroundColor: "var(--color-bg)", cursor: examScore !== null ? "default" : "pointer", fontFamily: "var(--font-base)", fontSize: "14px" }}>Verdadero</button>
                            <button onClick={() => { if (examScore === null) setAnswers(prev => ({...prev, [p.id]: false})) }} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "2px solid", borderColor: examScore !== null ? (p.correcta === false ? "#10b981" : answers[p.id] === false ? "var(--swiss-accent)" : "transparent") : answers[p.id] === false ? "var(--swiss-fg)" : "transparent", backgroundColor: "var(--color-bg)", cursor: examScore !== null ? "default" : "pointer", fontFamily: "var(--font-base)", fontSize: "14px" }}>Falso</button>
                          </div>
                        )}
                        {p.tipo === "texto_abierto" && (
                          <textarea disabled={examScore !== null} value={answers[p.id] as string || ""} onChange={(e) => setAnswers(prev => ({...prev, [p.id]: e.target.value}))} style={{ width: "100%", height: "90px", padding: "10px 12px", borderRadius: "8px", border: "0.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", fontSize: "14px", fontFamily: "var(--font-base)", resize: "none", outline: "none", boxSizing: "border-box" }} placeholder="Escribí tu reflexión acá..." />
                        )}
                        {examScore !== null && p.explicacion && (
                          <div style={{ marginTop: "14px", padding: "12px 14px", backgroundColor: "var(--color-bg)", borderRadius: "8px", borderLeft: "3px solid var(--color-accent)", fontSize: "13px", fontFamily: "var(--font-base)" }}>
                            <strong>Explicación:</strong> {p.explicacion}
                          </div>
                        )}
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                      {examScore === null ? (
                        <>
                          <button onClick={resetearExamen} className="flux-btn-secondary">Cancelar</button>
                          <button onClick={corregirExamen} className="flux-btn-primary" style={{ marginTop: 0 }} disabled={Object.keys(answers).length < examQuestions.length}>Entregar Examen</button>
                        </>
                      ) : (
                        <div style={{ width: "100%" }}>
                          <div style={{ padding: "16px 20px", background: "var(--color-surface)", border: "0.5px solid var(--color-border)", borderRadius: "12px", marginBottom: "12px", textAlign: "center" }}>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-muted)", margin: "0 0 4px", fontFamily: "var(--font-base)" }}>Resultado</p>
                            <p style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 4px", fontFamily: "var(--font-base)", color: "var(--color-dark)" }}>{examScore} / {examQuestions.length}</p>
                            <p style={{ fontSize: "12px", color: "var(--color-muted)", margin: 0, fontFamily: "var(--font-base)" }}>{examScore === examQuestions.length ? "Excelente asunción doctrinal." : "Repasá los textos y volvé a intentarlo."}</p>
                          </div>
                          <button onClick={resetearExamen} className="flux-btn-primary" style={{ width: "100%", marginTop: 0 }}>Intentar de nuevo</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                <h2 style={{ fontSize: "22px", fontWeight: 700, margin: 0, fontFamily: "var(--font-base)", color: "var(--color-dark)" }}>
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
                  <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "20px", boxShadow: "var(--shadow-card)" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "8px", fontFamily: "var(--font-base)", color: "var(--color-dark)" }}>Material recibido</h3>
                    <p style={{ fontSize: "13px", color: "var(--swiss-text-muted)", marginBottom: "16px", fontStyle: "italic" }}>Origen: {pendingContext.source} {pendingContext.title ? `- ${pendingContext.title}` : ""}</p>
                    <textarea
                      readOnly
                      value={pendingContext.content}
                      style={{ width: "100%", height: "100px", padding: "14px 16px", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--color-border)", background: "var(--color-bg)", fontSize: "13px", fontFamily: "var(--font-base)", resize: "none", marginBottom: "14px", outline: "none", boxSizing: "border-box" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateBookForm("include", `${bookForm.include}${bookForm.include ? "\n\n" : ""}${pendingContext.content}`);
                        setPendingContext(null);
                      }}
                      className="swiss-landing-cta"
                      style={{ padding: "10px 20px", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600 }}
                    >
                      Usar este material
                    </button>
                  </div>
                )}

                <form
                  onSubmit={handleCrearLibro}
                  style={{
                  background: "var(--color-surface)",
                  border: "0.5px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  boxShadow: "var(--shadow-card)"
                  }}
                >
                  <h3 style={{ fontSize: "17px", fontWeight: 600, fontFamily: "var(--font-base)", color: "var(--color-dark)", margin: 0 }}>Crear libro nuevo</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: "6px", fontFamily: "var(--font-base)" }}>Título del libro</label>
                      <input
                        type="text"
                        value={bookForm.title}
                        onChange={(event) => updateBookForm("title", event.target.value)}
                        placeholder="Ejemplo: Mi práctica de imaginación"
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "16px",
                          border: "0.5px solid var(--color-border)",
                          fontSize: "14px",
                          fontFamily: "var(--font-base)",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: "6px", fontFamily: "var(--font-base)" }}>Tema central</label>
                      <input
                        type="text"
                        value={bookForm.theme}
                        onChange={(event) => updateBookForm("theme", event.target.value)}
                        placeholder="Ejemplo: vivir desde el final, dinero, amor, fe, revisión, identidad..."
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "16px",
                          border: "0.5px solid var(--color-border)",
                          fontSize: "14px",
                          fontFamily: "var(--font-base)",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: "6px", fontFamily: "var(--font-base)" }}>¿Qué querés que incluya?</label>
                      <textarea
                        value={bookForm.include}
                        onChange={(event) => updateBookForm("include", event.target.value)}
                        placeholder="Ejemplo: mis conversaciones, escenas, planes, entradas del diario, testimonios relacionados o explicaciones bíblicas."
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "16px",
                          border: "0.5px solid var(--color-border)",
                          fontSize: "14px",
                          fontFamily: "var(--font-base)",
                          resize: "vertical",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-muted)", display: "block", marginBottom: "6px", fontFamily: "var(--font-base)" }}>Tono</label>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {["Práctico", "Narrativo", "Estudio", "Íntimo"].map((tono) => (
                          <button
                            key={tono}
                            type="button"
                            onClick={() => updateBookForm("tone", tono)}
                            style={{
                              padding: "8px 16px",
                              borderRadius: "22px",
                              border: bookForm.tone === tono ? "1.5px solid var(--color-dark)" : "0.5px solid var(--color-border)",
                              backgroundColor: bookForm.tone === tono ? "var(--color-dark)" : "var(--color-bg)",
                              color: bookForm.tone === tono ? "#fff" : "var(--color-dark)",
                              fontSize: "13px",
                              fontWeight: 600,
                              fontFamily: "var(--font-base)",
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
                    style={{ padding: "14px 20px", borderRadius: "var(--radius-pill)", fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-base)", alignSelf: "flex-start", opacity: bookLoading ? 0.65 : 1, cursor: bookLoading ? "not-allowed" : "pointer" }}
                  >
                    {bookLoading ? "Creando libro..." : "Crear libro"}
                  </button>
                </form>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => resetBookDraft()}
                    style={{ padding: "14px 16px", borderRadius: "var(--radius-lg)", border: "0.5px solid var(--color-border)", backgroundColor: "var(--color-surface)", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-base)", cursor: "pointer", textAlign: "left", color: "var(--color-dark)" }}
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
                      style={{ padding: "14px 16px", borderRadius: "var(--radius-lg)", border: "0.5px solid var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-muted)", fontSize: "13px", fontWeight: 500, fontFamily: "var(--font-base)", cursor: "not-allowed", textAlign: "left", opacity: 0.65 }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bookDraft && (() => {
              const rawChapters = bookDraft.split(/\n(?=## )/).filter(Boolean);
              const chapters = rawChapters.map((chunk, i) => {
                const lines = chunk.split("\n");
                const heading = lines[0].replace(/^##\s*/, "").trim();
                const body = lines.slice(1).join("\n").trim();
                return { num: i + 1, title: heading || `Capítulo ${i + 1}`, body };
              });
              return (
                <article className={`book-card${bookOpen ? " open" : ""}`}>
                  <header className="book-card-head">
                    <div className="book-info">
                      <h3>{bookForm.title || "Borrador"}</h3>
                      <p className="book-meta">{bookForm.tone} · {chapters.length} capítulo{chapters.length !== 1 ? "s" : ""} · {bookForm.theme}</p>
                    </div>
                    <button className="book-toggle" onClick={() => setBookOpen(v => !v)}>
                      {bookOpen ? "Cerrar" : "Abrir libro →"}
                    </button>
                  </header>
                  <div className="book-body">
                    {chapters.map((ch) => {
                      const isOpen = openChapters.has(ch.num);
                      return (
                        <div key={ch.num} className={`book-chapter${isOpen ? " open" : ""}`}>
                          <button className="chapter-head" onClick={() => setOpenChapters(prev => { const next = new Set(prev); if (next.has(ch.num)) next.delete(ch.num); else next.add(ch.num); return next; })}>
                            <span className="chapter-num">{ch.num}</span>
                            <span className="chapter-title">{ch.title}</span>
                            <span className="chapter-chevron">▾</span>
                          </button>
                          <div className="chapter-content">{parseMarkdown(ch.body)}</div>
                        </div>
                      );
                    })}
                    {bookError && <p style={{ margin: "12px 0 0", fontSize: "13px", fontWeight: 700, color: "var(--color-accent)", fontFamily: "var(--font-base)" }}>{bookError}</p>}
                    {bookSavedMessage && <p style={{ margin: "12px 0 0", fontSize: "13px", fontWeight: 700, color: "var(--color-dark)", fontFamily: "var(--font-base)" }}>{bookSavedMessage}</p>}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "20px", borderTop: "0.5px solid var(--color-border)", paddingTop: "16px" }}>
                      <button type="button" onClick={handleGuardarLibroEnMemoria} disabled={bookSavingMemory} className="swiss-landing-cta" style={{ borderRadius: "100px", padding: "10px 18px", fontSize: "13px", fontWeight: 600, opacity: bookSavingMemory ? 0.65 : 1 }}>
                        {bookSavingMemory ? "Guardando..." : "Guardar en memoria"}
                      </button>
                      <button type="button" onClick={() => sendToSection("examenes", { source: "Mi libro", title: bookForm.title, action: "examenes", content: bookDraft })} className="coach-quick-btn">
                        Crear preguntas
                      </button>
                      <button type="button" onClick={() => sendToSection("planes", { source: "Mi libro", title: bookForm.title, action: "planes", content: bookDraft })} className="coach-quick-btn">
                        Convertir en plan
                      </button>
                      <button type="button" onClick={resetBookDraft} className="flux-btn-secondary" style={{ borderRadius: "100px", padding: "10px 18px", fontSize: "13px" }}>
                        Crear otro libro
                      </button>
                    </div>
                  </div>
                </article>
              );
            })()}
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
          <div className="planes-wrap">

            {/* Pending context desde otra pantalla */}
            {pendingContext?.target === "planes" && (
              <div className="planes-pending-card">
                <p className="planes-pending-title">
                  Crear plan desde: {pendingContext.source}{pendingContext.title ? ` — ${pendingContext.title}` : ""}
                </p>
                <textarea
                  readOnly
                  value={pendingContext.content}
                  className="planes-pending-textarea"
                />
                <div className="planes-pending-btns">
                  <button onClick={() => setPendingContext(null)} className="planes-pending-btn">Plan de 7 días</button>
                  <button onClick={() => setPendingContext(null)} className="planes-pending-btn">Plan de 15 días</button>
                  <button onClick={() => setPendingContext(null)} className="planes-pending-btn">Plan de 30 días</button>
                  <button onClick={() => setPendingContext(null)} className="planes-pending-cancel">Cancelar</button>
                </div>
              </div>
            )}

            {/* Plan activo — demo (día 3 de 7) */}
            <div className="planes-active-card">
              <span className="planes-active-tag">Plan activo · Día 3 de 7</span>
              <h2 className="planes-active-name">Sostener el deseo</h2>
              <p className="planes-active-meta">Intensidad media · 4 días restantes</p>
              <div className="planes-active-progress">
                <div className="planes-active-progress-fill" style={{ width: "43%" }} />
              </div>
              <button className="planes-active-btn" onClick={() => setCurrentTab("aula")}>
                Continuar →
              </button>
            </div>

            {/* Título sección */}
            <span className="planes-section-label">Comenzar un nuevo plan</span>

            {/* Lista de planes disponibles */}
            {loadingPlanes ? (
              <SkeletonList rows={3} />
            ) : planes.length === 0 ? (
              <div className="planes-empty">
                <MapIconLucide size={32} style={{ color: "var(--color-muted)" }} />
                <p>Todavía no hay planes publicados. Podés pedirle al Coach que te arme uno.</p>
                <button onClick={() => setCurrentTab("aula")} className="planes-empty-btn">
                  Ir al Coach
                </button>
              </div>
            ) : (
              <div className="planes-list">
                {planes.map((p: any) => (
                  <div key={p.id} className="planes-card">
                    <h3 className="planes-card-name">{p.title_es}</h3>
                    {p.description_es && (
                      <p className="planes-card-desc">{p.description_es}</p>
                    )}
                    <div className="planes-card-badges">
                      <span className="planes-badge-dur">{p.duration_days} días</span>
                      <span className="planes-badge-lvl">
                        {p.level === "intro" ? "Inicial" : p.level === "intermediate" ? "Intermedio" : "Avanzado"}
                      </span>
                    </div>
                    <button
                      className="planes-start-btn"
                      onClick={() => setCurrentTab("aula")}
                    >
                      Empezar este plan
                    </button>
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
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Autor activo</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                      {[
                        { name: "Neville Goddard", status: "activo" },
                        { name: "Joseph Murphy", status: "próximamente" },
                        { name: "Emmet Fox", status: "próximamente" },
                        { name: "Florence Scovel Shinn", status: "próximamente" },
                      ].map(({ name, status }) => (
                        <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "13px", fontWeight: status === "activo" ? 600 : 400, color: status === "activo" ? "var(--color-dark)" : "var(--color-muted)", fontFamily: "var(--font-base)" }}>{name}</span>
                          <span style={{ fontSize: "11px", color: status === "activo" ? "var(--color-accent)" : "var(--color-muted)", fontFamily: "var(--font-base)" }}>{status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", paddingTop: "8px" }}>
                    <button className="flux-btn-secondary" style={{ borderRadius: "999px", padding: "8px 14px", fontSize: "11px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", border: "0.5px solid var(--color-border)" }}>
                      <Edit3 size={14} /> Editar nombre
                    </button>
                    <button onClick={handleSignOut} className="flux-btn-secondary" style={{ borderRadius: "999px", padding: "8px 14px", fontSize: "11px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", border: "0.5px solid var(--color-border)" }}>
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
      {/* ── BOTTOM NAV — 5 grupos ── */}
      {mobileNavGroup && (
        <div className="nav-submenu-overlay" onClick={() => setMobileNavGroup(null)}>
          <div className="nav-submenu" onClick={(e) => e.stopPropagation()}>
            {mobileNavGroup === "conversar" && (<>
              <div className="nav-submenu-title">Conversar</div>
              <button onClick={() => { setCurrentTab("aula"); setAgent("profesor"); setChatMode("conversar"); setMobileNavGroup(null); }} className="nav-submenu-item">
                💬 Coach
              </button>
              <button onClick={() => { setCurrentTab("narrador"); setMobileNavGroup(null); }} className="nav-submenu-item">
                ✨ Narrador
              </button>
            </>)}
            {mobileNavGroup === "estudio" && (<>
              <div className="nav-submenu-title">Estudio</div>
              <button onClick={() => { setCurrentTab("testimonios"); setMobileNavGroup(null); }} className="nav-submenu-item">
                📖 Testimonios y casos
              </button>
              <button onClick={() => { setCurrentTab("biblico"); setMobileNavGroup(null); }} className="nav-submenu-item">
                ✝️ Biblia metafísica
              </button>
              <button onClick={() => { setCurrentTab("examenes"); setMobileNavGroup(null); }} className="nav-submenu-item">
                ❓ Preguntas y respuestas
              </button>
              <button onClick={() => { setCurrentTab("biblioteca"); setMobileNavGroup(null); }} className="nav-submenu-item">
                📚 Fuentes de Neville
              </button>
            </>)}
            {mobileNavGroup === "crear" && (<>
              <div className="nav-submenu-title">Crear</div>
              <button onClick={() => { setCurrentTab("libro"); setMobileNavGroup(null); }} className="nav-submenu-item">
                📕 Mi libro
              </button>
              <button onClick={() => { setCurrentTab("planes"); setMobileNavGroup(null); }} className="nav-submenu-item">
                🗓️ Planes
              </button>
              <button onClick={() => { setCurrentTab("telegram"); setMobileNavGroup(null); }} className="nav-submenu-item">
                ✈️ Telegram
              </button>
            </>)}
            {mobileNavGroup === "mas" && (<>
              <div className="nav-submenu-title">Personal</div>
              <button onClick={() => { setCurrentTab("diario"); setMobileNavGroup(null); }} className="nav-submenu-item">
                📝 Diario íntimo
              </button>
              <button onClick={() => { setCurrentTab("notas"); setMobileNavGroup(null); }} className="nav-submenu-item">
                🗒️ Notas
              </button>
              <button onClick={() => { setCurrentTab("memoria"); setMobileNavGroup(null); }} className="nav-submenu-item">
                🧠 Memoria
              </button>
              <button onClick={() => { setCurrentTab("perfil"); setMobileNavGroup(null); }} className="nav-submenu-item">
                👤 Perfil
              </button>
              <button onClick={() => { setCurrentTab("perfil"); setMobileNavGroup(null); }} className="nav-submenu-item nav-submenu-item--accent">
                ⭐ Mejorar plan
              </button>
            </>)}
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        <button
          onClick={() => { setCurrentTab("panel"); setMobileNavGroup(null); }}
          className={`nav-item${currentTab === "panel" ? " active" : ""}`}
        >
          <HomeIcon size={22} className="nav-icon-svg"/>
          <span className="nav-label">Inicio</span>
        </button>

        <button
          onClick={() => setMobileNavGroup(mobileNavGroup === "conversar" ? null : "conversar")}
          className={`nav-item${["aula","narrador"].includes(currentTab) ? " active" : ""}${mobileNavGroup === "conversar" ? " open" : ""}`}
        >
          <MessageCircle size={22} className="nav-icon-svg"/>
          <span className="nav-label">Conversar</span>
        </button>

        <button
          onClick={() => setMobileNavGroup(mobileNavGroup === "estudio" ? null : "estudio")}
          className={`nav-item${["testimonios","biblico","examenes","biblioteca"].includes(currentTab) ? " active" : ""}${mobileNavGroup === "estudio" ? " open" : ""}`}
        >
          <BookOpen size={22} className="nav-icon-svg"/>
          <span className="nav-label">Estudio</span>
        </button>

        <button
          onClick={() => setMobileNavGroup(mobileNavGroup === "crear" ? null : "crear")}
          className={`nav-item${["libro","planes","telegram"].includes(currentTab) ? " active" : ""}${mobileNavGroup === "crear" ? " open" : ""}`}
        >
          <PenLine size={22} className="nav-icon-svg"/>
          <span className="nav-label">Crear</span>
        </button>

        <button
          onClick={() => setMobileNavGroup(mobileNavGroup === "mas" ? null : "mas")}
          className={`nav-item${["diario","notas","memoria","perfil"].includes(currentTab) ? " active" : ""}${mobileNavGroup === "mas" ? " open" : ""}`}
        >
          <Menu size={22} className="nav-icon-svg"/>
          <span className="nav-label">Más</span>
        </button>
      </nav>
    </div>
  );
}

// ─── Skeleton list (reemplaza spinners en listas) ────────
function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line" style={{ width: `${55 + (i % 3) * 15}%`, height: 16 }} />
          <div className="skeleton-line" style={{ width: `${75 + (i % 2) * 10}%`, height: 13 }} />
          <div className="skeleton-line" style={{ width: "50%", height: 13 }} />
        </div>
      ))}
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
