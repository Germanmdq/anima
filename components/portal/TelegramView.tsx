import React from "react";
import { Send, MessageSquareText, Calendar, BookOpen, FileText } from "lucide-react";

interface TelegramViewProps {
  sendToSection: (target: string, context: any) => void;
  pendingContext?: any;
  clearPendingContext?: () => void;
}

export default function TelegramView({ sendToSection, pendingContext, clearPendingContext }: TelegramViewProps) {
  return (
    <div style={{ padding: "24px 20px 100px", maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h2 style={{ fontSize: "19px", fontWeight: 700, margin: "0 0 4px", fontFamily: "var(--font-base)", color: "var(--color-dark)" }}>
          Telegram
        </h2>
        <p style={{ fontSize: "14px", color: "var(--color-muted)", margin: 0, fontFamily: "var(--font-base)" }}>
          Mensajes personalizados durante el día.
        </p>
      </header>

      {pendingContext?.target === "telegram" && (
        <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "var(--shadow-card)" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-dark)", margin: 0, fontFamily: "var(--font-base)" }}>
            Mensaje preparado para Telegram
          </p>
          <p style={{ fontSize: "13px", color: "var(--color-muted)", margin: 0, fontStyle: "italic", fontFamily: "var(--font-base)" }}>
            Recordatorio basado en {pendingContext.source}:
          </p>
          <textarea
            readOnly
            value={pendingContext.content}
            style={{ width: "100%", height: "100px", padding: "14px 16px", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--color-border)", background: "var(--color-bg)", fontSize: "13px", fontFamily: "var(--font-base)", resize: "none", boxSizing: "border-box", color: "var(--color-dark)", outline: "none" }}
          />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button disabled style={{ opacity: 0.5, cursor: "not-allowed", padding: "11px 18px", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600, background: "var(--color-dark)", color: "#fff", border: "none", fontFamily: "var(--font-base)" }}>
              Configurar Telegram para enviar
            </button>
            <button onClick={() => clearPendingContext?.()} style={{ padding: "11px 18px", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 500, background: "transparent", color: "var(--color-muted)", border: "0.5px solid var(--color-border)", cursor: "pointer", fontFamily: "var(--font-base)" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", gap: "20px" }}>
        <p style={{ fontSize: "15px", lineHeight: "1.6", fontWeight: 500, color: "var(--color-dark)", margin: 0, fontFamily: "var(--font-base)" }}>
          Telegram estará disponible para usuarios activos. Vas a poder recibir frases de retorno, prácticas y recordatorios según el deseo que estás trabajando.
        </p>

        <div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-dark)", marginBottom: "10px", fontFamily: "var(--font-base)" }}>
            Posibles usos:
          </p>
          <ul style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "20px", fontSize: "14px", fontWeight: 500, color: "var(--color-muted)", fontFamily: "var(--font-base)", margin: 0 }}>
            <li>Frase de retorno diaria</li>
            <li>Recordatorio de escena</li>
            <li>Práctica del plan</li>
            <li>Pregunta de integración</li>
            <li>Mensaje desde Diario</li>
            <li>Cita personal del libro</li>
          </ul>
        </div>

        <button
          disabled
          style={{ opacity: 0.5, cursor: "not-allowed", padding: "13px 20px", borderRadius: "var(--radius-md)", fontWeight: 600, fontSize: "15px", background: "var(--color-dark)", color: "#fff", border: "none", fontFamily: "var(--font-base)", alignSelf: "flex-start" }}
        >
          Configurar Telegram
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-muted)", fontFamily: "var(--font-base)", marginRight: "4px" }}>
          Convertir en…
        </span>
        {[
          { tab: "aula", action: "coach", icon: <MessageSquareText size={13} />, label: "Coach" },
          { tab: "planes", action: "planes", icon: <Calendar size={13} />, label: "Plan" },
          { tab: "libro", action: "libro", icon: <BookOpen size={13} />, label: "Libro" },
          { tab: "diario", action: "diario", icon: <FileText size={13} />, label: "Diario" },
        ].map(({ tab, action, icon, label }) => (
          <button
            key={tab}
            onClick={() => sendToSection(tab, { source: "Telegram", action, content: "Preparado desde Telegram" })}
            className="coach-quick-btn"
          >
            {icon} {label}
          </button>
        ))}
      </div>
    </div>
  );
}
