"use client";

import React, { useRef, useEffect } from "react";
import {
  MessageSquareText,
  HelpCircle,
  Calendar,
  FileText,
  BookOpen,
  Send,
  History,
} from "lucide-react";
import { QUICK_ACTION_PROMPTS } from "@/lib/prompts";

interface Mensaje {
  id: string;
  role: "user" | "model";
  content: string;
}

interface CoachViewProps {
  messages: Mensaje[];
  input: string;
  setInput: (val: string) => void;
  loading: boolean;
  onSend: (e?: React.FormEvent) => void;
  onQuickSend?: (message: string, visibleText: string) => void;
  parseMarkdown: (text: string) => React.ReactNode[];
  sendToSection: (target: string, context: any) => void;
  pendingContext?: any;
  clearPendingContext?: () => void;
}

export default function CoachView({
  messages,
  input,
  setInput,
  loading,
  onSend,
  onQuickSend,
  parseMarkdown,
  sendToSection,
  pendingContext,
  clearPendingContext,
}: CoachViewProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 || loading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 50);
    }
  }, [messages, loading]);

  useEffect(() => {
    if (pendingContext?.target === "aula") {
      if (pendingContext.action === "coach" && onQuickSend) {
        onQuickSend(pendingContext.content, pendingContext.title || "Trabajar este contenido");
      } else {
        setInput(pendingContext.content);
      }
      clearPendingContext?.();
    }
  }, [pendingContext, setInput, onQuickSend, clearPendingContext]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const quickActions = [
    { label: "Profundizar", icon: <MessageSquareText size={14} />, tab: "aula", action: "coach", title: "Profundizar esta respuesta", content: (text: string) => `Profundizá esta respuesta sin repetirla mecánicamente. Mostrá el principio central, el estado implicado y una forma práctica de aplicarlo.\n\n${text}` },
    { label: "Crear preguntas", icon: <HelpCircle size={14} />, tab: "examenes", content: (text: string) => `${QUICK_ACTION_PROMPTS.questions}\n\n${text}` },
    { label: "Crear plan", icon: <Calendar size={14} />, tab: "planes", content: (text: string) => `${QUICK_ACTION_PROMPTS.plan}\n\n${text}` },
    { label: "Guardar en diario", icon: <FileText size={14} />, tab: "diario", content: (text: string) => text },
    { label: "Agregar a mi libro", icon: <BookOpen size={14} />, tab: "libro", content: (text: string) => text },
    { label: "Crear mensaje Telegram", icon: <Send size={14} />, tab: "telegram", content: (text: string) => `${QUICK_ACTION_PROMPTS.telegram}\n\n${text}` },
    { label: "Guardar en memoria", icon: <History size={14} />, tab: "memoria", content: (text: string) => text },
  ];

  const visibleMessages = messages.filter((msg) => msg.id !== "context-welcome");

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
        <h1 style={{
          fontSize: "19px",
          fontWeight: 700,
          margin: "0 0 4px",
          fontFamily: "var(--font-base)",
          color: "var(--color-dark)"
        }}>
          Coach
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-muted)", fontWeight: 500, margin: 0, fontFamily: "var(--font-base)" }}>
          Trabajá tu deseo con una guía directa.
        </p>
      </header>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: visibleMessages.length > 0 || loading ? "8px 8px 16px" : "0",
            scrollbarWidth: "thin",
          }}
        >
          {visibleMessages.length === 0 && !loading ? (
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
              <span>Empezá la conversación.</span>
            </div>
          ) : (
            <>
              {visibleMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                    gap: "10px"
                  }}
                >
                  <div
                    style={{
                      maxWidth: msg.role === "user" ? "min(680px, 72%)" : "min(900px, 88%)",
                      padding: msg.role === "user" ? "12px 15px" : "14px 16px",
                      borderRadius: msg.role === "user" ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                      backgroundColor: msg.role === "user" ? "var(--swiss-fg)" : "#E9E9EC",
                      color: msg.role === "user" ? "var(--swiss-bg)" : "var(--swiss-fg)",
                      lineHeight: 1.55,
                      fontSize: "14px",
                      fontWeight: 500,
                      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                      wordBreak: "break-word"
                    }}
                  >
                    {parseMarkdown(msg.content)}
                  </div>

                  {msg.role === "model" && msg.content && (
                    <div style={{ marginLeft: "12px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", maxWidth: "min(900px, 88%)" }}>
                      <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-muted)", fontFamily: "var(--font-base)" }}>
                        Seguir con esto:
                      </span>
                      {quickActions.map((action, i) => (
                        <button
                          key={i}
                          type="button"
                          className="coach-quick-btn"
                          onClick={() => {
                            const content = action.content(msg.content);
                            if (action.action === "coach" && onQuickSend) {
                              onQuickSend(content, action.title || action.label);
                              return;
                            }
                            sendToSection(action.tab, {
                              source: "Coach",
                              title: action.title || "Respuesta",
                              action: action.action || action.tab,
                              content
                            });
                          }}
                        >
                          {action.icon} {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div
                    style={{
                      maxWidth: "min(900px, 88%)",
                      padding: "12px 16px",
                      borderRadius: "20px 20px 20px 6px",
                      backgroundColor: "#E9E9EC",
                      color: "var(--swiss-fg)",
                      fontSize: "13px",
                      fontWeight: 800,
                      boxShadow: "0 6px 18px rgba(0,0,0,0.08)"
                    }}
                  >
                    Odiseo está pensando...
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form at the bottom */}
        <form
          onSubmit={handleSubmit}
          style={{
            border: "0.5px solid var(--color-border)",
            borderRadius: "24px",
            backgroundColor: "var(--color-surface)",
            boxShadow: "var(--shadow-card)",
            padding: "8px",
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            gap: "8px",
            flexShrink: 0,
            position: "sticky",
            bottom: 0,
            zIndex: 10,
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ejemplo: quiero casarme y siento que tarda"
            rows={1}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: "20px",
              border: "0.5px solid var(--color-border)",
              backgroundColor: "var(--color-bg)",
              fontSize: "15px",
              fontFamily: "var(--font-base)",
              resize: "none",
              minWidth: 0,
              minHeight: "48px",
              maxHeight: "120px",
              boxSizing: "border-box",
              outline: "none",
              color: "var(--color-dark)"
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="coach-send-btn"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </section>
  );
}
