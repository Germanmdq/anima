import React from "react";
import { StickyNote, MessageSquareText, Calendar, HelpCircle, FileText, BookOpen } from "lucide-react";
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
    <div style={{ padding: "40px 24px", maxWidth: "900px", margin: "0 auto" }}>
      <header className="content-header" style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ backgroundColor: "var(--swiss-accent)", color: "#fff", padding: "12px", borderRadius: "16px" }}>
            <StickyNote size={24} />
          </div>
          <h2 className="flux-title" style={{ fontSize: "32px", textTransform: "uppercase", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
            Notas
          </h2>
        </div>
        <p className="flux-subtitle" style={{ fontSize: "18px", color: "var(--swiss-fg)", fontWeight: 500 }}>
          Ideas breves para convertir la lectura en práctica.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {notes.map((note, idx) => (
          <div 
            key={idx}
            style={{ 
              backgroundColor: "var(--swiss-bg)", 
              border: "2px solid #000", 
              borderRadius: "22px", 
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              transition: "transform 0.15s ease",
              cursor: "default"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--swiss-accent)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#000";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "8px", textTransform: "uppercase" }}>{note.title}</h3>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--swiss-fg)", lineHeight: "1.5" }}>{note.excerpt}</p>
            </div>

            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "2px solid var(--swiss-border)", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-text-muted)", marginRight: "4px" }}>
                Convertir en:
              </span>
              <button 
                onClick={() => sendToSection("aula", { source: "Notas", title: note.title, action: "coach", content: `Quiero trabajar sobre esta nota: "${note.title}". ${note.excerpt}` })}
                className="flux-btn-secondary" 
                style={{ fontSize: "11px", padding: "6px 12px", borderRadius: "999px", display: "flex", alignItems: "center", gap: "6px", backgroundColor: "var(--swiss-bg)", border: "1.5px solid #000" }}
              >
                <MessageSquareText size={14} /> Coach
              </button>
              <button 
                onClick={() => sendToSection("planes", { source: "Notas", title: note.title, action: "planes", content: `${QUICK_ACTION_PROMPTS.plan}\n\nNota: "${note.title}". ${note.excerpt}` })}
                className="flux-btn-secondary" 
                style={{ fontSize: "11px", padding: "6px 12px", borderRadius: "999px", display: "flex", alignItems: "center", gap: "6px", backgroundColor: "var(--swiss-bg)", border: "1.5px solid #000" }}
              >
                <Calendar size={14} /> Plan
              </button>
              <button 
                onClick={() => sendToSection("examenes", { source: "Notas", title: note.title, action: "examenes", content: `${QUICK_ACTION_PROMPTS.questions}\n\nNota: "${note.title}". ${note.excerpt}` })}
                className="flux-btn-secondary" 
                style={{ fontSize: "11px", padding: "6px 12px", borderRadius: "999px", display: "flex", alignItems: "center", gap: "6px", backgroundColor: "var(--swiss-bg)", border: "1.5px solid #000" }}
              >
                <HelpCircle size={14} /> Preguntas
              </button>
              <button 
                onClick={() => sendToSection("diario", { source: "Notas", title: note.title, action: "diario", content: `${QUICK_ACTION_PROMPTS.journal}\n\nNota: "${note.title}". ${note.excerpt}` })}
                className="flux-btn-secondary" 
                style={{ fontSize: "11px", padding: "6px 12px", borderRadius: "999px", display: "flex", alignItems: "center", gap: "6px", backgroundColor: "var(--swiss-bg)", border: "1.5px solid #000" }}
              >
                <FileText size={14} /> Diario
              </button>
              <button 
                onClick={() => sendToSection("libro", { source: "Notas", title: note.title, action: "libro", content: `${QUICK_ACTION_PROMPTS.book}\n\nNota: "${note.title}". ${note.excerpt}` })}
                className="flux-btn-secondary" 
                style={{ fontSize: "11px", padding: "6px 12px", borderRadius: "999px", display: "flex", alignItems: "center", gap: "6px", backgroundColor: "var(--swiss-bg)", border: "1.5px solid #000" }}
              >
                <BookOpen size={14} /> Mi libro
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
