import React from "react";
import { MessageSquareText, Calendar, HelpCircle, FileText, BookOpen } from "lucide-react";
import { QUICK_ACTION_PROMPTS } from "@/lib/prompts";

interface NotesPanelProps {
  sendToSection: (target: string, context: any) => void;
}

export default function NotesPanel({ sendToSection }: NotesPanelProps) {
  const notes = [
    { title: "Cómo trabajar un deseo durante 7 días", excerpt: "Un plan sistemático para sostener el sentimiento del deseo cumplido sin interrupciones." },
    { title: "Cómo leer a Neville sin dispersarte", excerpt: "Estrategias para convertir la lectura teórica en una práctica activa de asunción." },
    { title: "De conversación a libro personal", excerpt: "El proceso para estructurar tus diálogos y epifanías en un manual de vida." },
    { title: "Cómo usar Telegram para volver al estado", excerpt: "Creando recordatorios y frases de retorno que te rescaten durante el día." },
    { title: "Qué hacer cuando mirás demasiado la realidad actual", excerpt: "Tácticas de revisión inmediata cuando la evidencia de los sentidos te abruma." }
  ];

  return (
    <div style={{ padding: "24px 20px 100px", maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
      <header>
        <h2 style={{ fontSize: "19px", fontWeight: 700, margin: "0 0 4px", fontFamily: "var(--font-base)", color: "var(--color-dark)" }}>
          Notas
        </h2>
        <p style={{ fontSize: "14px", color: "var(--color-muted)", margin: 0, fontFamily: "var(--font-base)" }}>
          Ideas breves para convertir la lectura en práctica.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {notes.map((note, idx) => (
          <div
            key={idx}
            style={{
              background: "var(--color-surface)",
              border: "0.5px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "var(--shadow-card)"
            }}
          >
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px", color: "var(--color-dark)", fontFamily: "var(--font-base)" }}>
                {note.title}
              </h3>
              <p style={{ fontSize: "14px", fontWeight: 400, color: "var(--color-muted)", lineHeight: "1.5", fontFamily: "var(--font-base)", margin: 0 }}>
                {note.excerpt}
              </p>
            </div>

            <div style={{ paddingTop: "12px", borderTop: "0.5px solid var(--color-border)", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-muted)", fontFamily: "var(--font-base)", marginRight: "2px" }}>
                Convertir en:
              </span>
              {[
                { tab: "aula", action: "coach", icon: <MessageSquareText size={13} />, label: "Coach",
                  content: `Quiero trabajar sobre esta nota: "${note.title}". ${note.excerpt}` },
                { tab: "planes", action: "planes", icon: <Calendar size={13} />, label: "Plan",
                  content: `${QUICK_ACTION_PROMPTS.plan}\n\nNota: "${note.title}". ${note.excerpt}` },
                { tab: "examenes", action: "examenes", icon: <HelpCircle size={13} />, label: "Preguntas",
                  content: `${QUICK_ACTION_PROMPTS.questions}\n\nNota: "${note.title}". ${note.excerpt}` },
                { tab: "diario", action: "diario", icon: <FileText size={13} />, label: "Diario",
                  content: `${QUICK_ACTION_PROMPTS.journal}\n\nNota: "${note.title}". ${note.excerpt}` },
                { tab: "libro", action: "libro", icon: <BookOpen size={13} />, label: "Mi libro",
                  content: `${QUICK_ACTION_PROMPTS.book}\n\nNota: "${note.title}". ${note.excerpt}` },
              ].map(({ tab, action, icon, label, content }) => (
                <button
                  key={tab}
                  onClick={() => sendToSection(tab, { source: "Notas", title: note.title, action, content })}
                  className="coach-quick-btn"
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
