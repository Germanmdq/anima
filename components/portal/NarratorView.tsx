import React, { useState, useRef, useEffect } from "react";
import { Sparkles, HelpCircle, Calendar, FileText, BookOpen, Send, History } from "lucide-react";
import { QUICK_ACTION_PROMPTS } from "@/lib/prompts";

interface NarratorViewProps {
  sendToSection: (target: string, context: any) => void;
  pendingContext?: any;
  clearPendingContext?: () => void;
}

function parseSimpleMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === "") continue;

    if (trimmed.startsWith("###")) {
      nodes.push(<h3 key={i}>{trimmed.slice(3).trim()}</h3>);
    } else if (trimmed.startsWith("##")) {
      nodes.push(<h2 key={i}>{trimmed.slice(2).trim()}</h2>);
    } else if (trimmed.startsWith("#")) {
      nodes.push(<h1 key={i}>{trimmed.slice(1).trim()}</h1>);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      nodes.push(<p key={i} style={{ paddingLeft: "16px" }}>• {trimmed.slice(2)}</p>);
    } else {
      // Handle bold
      const parts: React.ReactNode[] = [];
      let remaining = trimmed;
      let keyIdx = 0;
      while (remaining.length > 0) {
        const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)$/);
        if (boldMatch) {
          if (boldMatch[1]) parts.push(boldMatch[1]);
          parts.push(<strong key={`b-${keyIdx++}`}>{boldMatch[2]}</strong>);
          remaining = boldMatch[3];
        } else {
          parts.push(remaining);
          break;
        }
      }
      nodes.push(<p key={i}>{parts}</p>);
    }
  }
  return nodes;
}

export default function NarratorView({ sendToSection, pendingContext, clearPendingContext }: NarratorViewProps) {
  const [prompt, setPrompt] = useState("");
  const [submittedText, setSubmittedText] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const resultEndRef = useRef<HTMLDivElement>(null);
  const storageKey = "odiseo_narrator_state_guest";

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      setPrompt(state.prompt || "");
      setSubmittedText(state.submittedText || "");
      setResult(state.result || "");
    } catch (e) {
      console.error("Error loading narrator state", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ prompt, submittedText, result }));
  }, [prompt, submittedText, result]);

  useEffect(() => {
    if (result || loading) {
      setTimeout(() => {
        resultEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 50);
    }
  }, [result, loading]);

  useEffect(() => {
    if (pendingContext?.target === "narrador") {
      setPrompt(pendingContext.content);
      clearPendingContext?.();
    }
  }, [pendingContext, setPrompt, clearPendingContext]);

  const templates = [
    "Explicame vivir desde el final con ejemplos.",
    "Narrame una escena para sentir seguridad.",
    "Convertí esta idea en una meditación.",
    "Explicame esta enseñanza de Neville de forma más humana.",
    "Contame esto como si fuera una historia."
  ];

  const quickActions = [
    { label: "Profundizar", icon: <Sparkles size={14} />, tab: "narrador", content: (text: string) => `Profundizá esta narración o explicación. Volvé más claro el principio, el ejemplo y la aplicación imaginaria.\n\n${text}` },
    { label: "Crear preguntas", icon: <HelpCircle size={14} />, tab: "examenes", content: (text: string) => `${QUICK_ACTION_PROMPTS.questions}\n\n${text}` },
    { label: "Crear plan", icon: <Calendar size={14} />, tab: "planes", content: (text: string) => `${QUICK_ACTION_PROMPTS.plan}\n\n${text}` },
    { label: "Guardar en diario", icon: <FileText size={14} />, tab: "diario", content: (text: string) => text },
    { label: "Agregar a mi libro", icon: <BookOpen size={14} />, tab: "libro", content: (text: string) => text },
    { label: "Crear mensaje Telegram", icon: <Send size={14} />, tab: "telegram", content: (text: string) => `${QUICK_ACTION_PROMPTS.telegram}\n\n${text}` },
    { label: "Guardar en memoria", icon: <History size={14} />, tab: "memoria", content: (text: string) => text },
    { label: "Convertir en escena", icon: <Sparkles size={14} />, tab: "narrador", content: (text: string) => `Convertí este contenido en una escena imaginaria concreta, breve y vivible. Incluí lugar, gesto, diálogo interno y sensación final.\n\n${text}` },
    { label: "Explicar con otro ejemplo", icon: <HelpCircle size={14} />, tab: "narrador", content: (text: string) => `Explicá este mismo principio con otro ejemplo cotidiano, simple y aplicado.\n\n${text}` },
  ];

  const handleNarrar = async () => {
    if (!prompt.trim() || loading) return;

    const input = prompt.trim();
    setPrompt("");
    setSubmittedText(input);
    setResult("");
    setError("");
    setLoading(true);

    let responseText = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          agent: "cuentacuentos",
          history: [],
          currentSection: "narrador",
          contextData: {
            useMemory: true,
            chatMode: "conversar",
          },
        }),
      });

      if (!response.ok) throw new Error("Error en la conexión.");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No se pudo leer la respuesta.");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        responseText += chunk;
        setResult(responseText);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("No pude generar la narración ahora. Probá de nuevo en un momento.");
      setSubmittedText("");
      setResult("");
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNarrar();
    }
  };

  return (
    <section
      style={{
        padding: "12px 18px 16px",
        maxWidth: "1080px",
        margin: "0 auto",
        width: "100%",
        height: "calc(100vh - 116px)",
        flex: "1 1 auto",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <header style={{ marginBottom: "10px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div style={{ backgroundColor: "var(--swiss-accent)", color: "#fff", padding: "9px", borderRadius: "14px" }}>
            <Sparkles size={20} />
          </div>
          <h2 style={{ fontSize: "28px", textTransform: "uppercase", fontWeight: 900, margin: 0, letterSpacing: 0 }}>
            Narrador
          </h2>
        </div>
        <p style={{ fontSize: "16px", color: "var(--swiss-fg)", fontWeight: 800, margin: 0 }}>
          Explicaciones vivas, ejemplos y escenas guiadas.
        </p>
      </header>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          padding: submittedText || result || loading || error ? "8px 8px 16px" : "0",
          scrollbarWidth: "thin",
        }}
      >
        {!submittedText && !result && !loading && !error && (
          <div
            style={{
              flex: 1,
              minHeight: "180px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--swiss-text-muted)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <span>Pedile al Narrador una escena, ejemplo o explicación.</span>
          </div>
        )}

        {submittedText && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{
              backgroundColor: "#131313",
              color: "#fff",
              padding: "12px 15px",
              borderRadius: "20px 20px 6px 20px",
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: 1.55,
              maxWidth: "min(680px, 72%)",
              wordBreak: "break-word",
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)"
            }}>
              {submittedText}
            </div>
          </div>
        )}

        {error && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ maxWidth: "min(900px, 88%)", padding: "12px 16px", borderRadius: "20px 20px 20px 6px", backgroundColor: "#FDECEC", color: "var(--swiss-accent)", fontSize: "13px", fontWeight: 800 }}>
              {error}
            </div>
          </div>
        )}

        {result.trim().length > 0 && !error && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "10px" }}>
            <div style={{
              backgroundColor: "#E9E9EC",
              color: "var(--swiss-fg)",
              padding: "14px 16px",
              borderRadius: "20px 20px 20px 6px",
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: "1.7",
              maxWidth: "min(900px, 88%)",
              wordBreak: "break-word",
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)"
            }}>
              {parseSimpleMarkdown(result)}
            </div>

            <div style={{ marginLeft: "12px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", maxWidth: "min(900px, 88%)" }}>
              <span style={{ fontSize: "11px", fontWeight: 900, color: "var(--swiss-text-muted)" }}>
                Seguir con esto:
              </span>
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    sendToSection(action.tab, {
                      source: "Narrador",
                      title: "Historia Generada",
                      action: action.tab,
                      content: action.content(result)
                    });
                  }}
                  style={{
                    padding: "6px 11px",
                    fontSize: "11px",
                    fontWeight: 800,
                    borderRadius: "999px",
                    border: "1.5px solid #000",
                    cursor: "pointer",
                    backgroundColor: "var(--swiss-bg)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--swiss-fg)",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--swiss-accent)";
                    e.currentTarget.style.color = "var(--swiss-accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#000";
                    e.currentTarget.style.color = "var(--swiss-fg)";
                  }}
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && !error && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              maxWidth: "min(900px, 88%)",
              padding: "12px 16px",
              borderRadius: "20px 20px 20px 6px",
              backgroundColor: "#E9E9EC",
              color: "var(--swiss-fg)",
              fontSize: "13px",
              fontWeight: 800,
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)"
            }}>
              Odiseo está pensando...
            </div>
          </div>
        )}

        <div ref={resultEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          flexShrink: 0,
          position: "sticky",
          bottom: 0,
          zIndex: 10,
          backgroundColor: "var(--flux-grey-bg)",
          paddingTop: "10px",
        }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleNarrar();
          }}
          style={{
            border: "2px solid #000",
            borderRadius: "24px",
            backgroundColor: "var(--swiss-bg)",
            padding: "8px",
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ejemplo: explicame vivir desde el final con una escena cotidiana"
          style={{
            flex: 1,
            minHeight: "48px",
            maxHeight: "120px",
            padding: "12px 14px",
            borderRadius: "20px",
            border: "1.5px solid var(--swiss-border)",
            backgroundColor: "#fff",
            fontSize: "15px",
            fontFamily: "inherit",
            resize: "none",
            minWidth: 0,
            boxSizing: "border-box"
          }}
          rows={1}
        />
          <button
            className="swiss-landing-cta"
            type="submit"
            disabled={!prompt.trim() || loading}
            style={{
              padding: "12px 20px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 900,
              textTransform: "uppercase",
              opacity: !prompt.trim() || loading ? 0.5 : 1,
              cursor: !prompt.trim() || loading ? "not-allowed" : "pointer",
              minHeight: "48px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            {loading ? "Pensando..." : "Narrar"} <Send size={14} />
          </button>
        </form>

        {!result && !loading && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {templates.map((temp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(temp)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "999px",
                  border: "1.5px solid var(--swiss-border)",
                  backgroundColor: "var(--swiss-muted)",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "border-color 0.15s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--swiss-accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--swiss-border)"; }}
              >
                {temp}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
