import React from "react";
import { Send, MessageSquareText, Calendar, BookOpen, FileText } from "lucide-react";

interface TelegramViewProps {
  sendToSection: (target: string, context: any) => void;
  pendingContext?: any;
  clearPendingContext?: () => void;
}

export default function TelegramView({ sendToSection, pendingContext, clearPendingContext }: TelegramViewProps) {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "800px", margin: "0 auto" }}>
      <header className="content-header" style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ backgroundColor: "var(--swiss-accent)", color: "#fff", padding: "12px", borderRadius: "16px" }}>
            <Send size={24} />
          </div>
          <h2 className="flux-title" style={{ fontSize: "32px", textTransform: "uppercase", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
            Telegram
          </h2>
        </div>
        <p className="flux-subtitle" style={{ fontSize: "18px", color: "var(--swiss-fg)", fontWeight: 500 }}>
          Mensajes personalizados durante el día.
        </p>
      </header>

      {pendingContext?.target === "telegram" && (
        <div style={{ backgroundColor: "var(--swiss-muted)", border: "2px solid #000", borderRadius: "22px", padding: "32px", marginBottom: "40px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", marginBottom: "16px" }}>Mensaje preparado para Telegram</h3>
          <p style={{ fontSize: "13px", color: "var(--swiss-text-muted)", marginBottom: "12px", fontStyle: "italic" }}>
            Recordatorio basado en {pendingContext.source}:
          </p>
          <textarea
            readOnly
            value={pendingContext.content}
            style={{ width: "100%", height: "120px", padding: "16px", borderRadius: "16px", border: "2px solid var(--swiss-border)", backgroundColor: "var(--swiss-bg)", fontSize: "13px", resize: "none", marginBottom: "16px" }}
          />
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button disabled className="swiss-landing-cta" style={{ opacity: 0.5, cursor: "not-allowed", padding: "12px 24px", borderRadius: "22px", fontSize: "12px", fontWeight: 900, textTransform: "uppercase" }}>Configurar Telegram para enviar</button>
            <button onClick={() => clearPendingContext?.()} className="flux-btn-secondary" style={{ padding: "12px 24px", borderRadius: "22px", fontSize: "12px", fontWeight: 900, textTransform: "uppercase" }}>Cancelar</button>
          </div>
        </div>
      )}

      <div 
        style={{ 
          backgroundColor: "var(--swiss-bg)", 
          border: "2px solid #000", 
          borderRadius: "22px", 
          padding: "40px",
          marginBottom: "40px",
          boxShadow: "4px 4px 0px rgba(0,0,0,1)"
        }}
      >
        <p style={{ fontSize: "16px", lineHeight: "1.6", fontWeight: 500, color: "var(--swiss-fg)", marginBottom: "32px" }}>
          Telegram estará disponible para usuarios activos. Vas a poder recibir frases de retorno, prácticas y recordatorios según el deseo que estás trabajando.
        </p>

        <h3 style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", marginBottom: "16px" }}>Posibles usos:</h3>
        <ul style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px", paddingLeft: "20px", fontSize: "14px", fontWeight: 500 }}>
          <li>Frase de retorno diaria</li>
          <li>Recordatorio de escena</li>
          <li>Práctica del plan</li>
          <li>Pregunta de integración</li>
          <li>Mensaje desde Diario</li>
          <li>Cita personal del libro</li>
        </ul>

        <button 
          className="swiss-landing-cta" 
          disabled
          style={{ 
            opacity: 0.5, 
            cursor: "not-allowed",
            padding: "12px 24px", 
            borderRadius: "22px", 
            fontWeight: 900,
            textTransform: "uppercase",
            fontSize: "13px"
          }}
        >
          Configurar Telegram
        </button>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-text-muted)", display: "flex", alignItems: "center", marginRight: "8px" }}>
          Convertir en...
        </span>
        <button 
          onClick={() => sendToSection("aula", { source: "Telegram", action: "coach", content: "Preparado desde Telegram" })}
          className="flux-btn-secondary" 
          style={{ fontSize: "11px", padding: "6px 12px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <MessageSquareText size={14} /> Coach
        </button>
        <button 
          onClick={() => sendToSection("planes", { source: "Telegram", action: "planes", content: "Preparado desde Telegram" })}
          className="flux-btn-secondary" 
          style={{ fontSize: "11px", padding: "6px 12px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Calendar size={14} /> Plan
        </button>
        <button 
          onClick={() => sendToSection("libro", { source: "Telegram", action: "libro", content: "Preparado desde Telegram" })}
          className="flux-btn-secondary" 
          style={{ fontSize: "11px", padding: "6px 12px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <BookOpen size={14} /> Libro
        </button>
        <button 
          onClick={() => sendToSection("diario", { source: "Telegram", action: "diario", content: "Preparado desde Telegram" })}
          className="flux-btn-secondary" 
          style={{ fontSize: "11px", padding: "6px 12px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <FileText size={14} /> Diario
        </button>
      </div>
    </div>
  );
}
