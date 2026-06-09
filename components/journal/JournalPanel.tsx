import React, { useState, useEffect } from "react";
import { BookOpen, Sparkles, HelpCircle, FileText, Send, Calendar, Trash2, Plus } from "lucide-react";
import { QUICK_ACTION_PROMPTS, SECTION_PROMPTS } from "@/lib/prompts";

interface JournalEntry {
  id: string;
  date: string;
  content: string;
}

interface JournalPanelProps {
  sendToSection: (target: string, context: any) => void;
  pendingContext?: any;
  clearPendingContext?: () => void;
}

export default function JournalPanel({ sendToSection, pendingContext, clearPendingContext }: JournalPanelProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newText, setNewText] = useState("");
  const entriesKey = "odiseo_journal_entries_guest";
  const draftKey = "odiseo_journal_draft_guest";

  // Load entries on mount
  useEffect(() => {
    const saved = localStorage.getItem(entriesKey) || localStorage.getItem("imaginalia_journal_entries");
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading journal entries", e);
      }
    }
    const draft = localStorage.getItem(draftKey);
    if (draft) setNewText(draft);
  }, []);

  useEffect(() => {
    localStorage.setItem(draftKey, newText);
  }, [newText]);

  useEffect(() => {
    if (pendingContext?.target === "diario") {
      const today = new Date().toLocaleDateString("es-AR", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
      });
      setNewText(`${today}\nMaterial enviado desde ${pendingContext.source}:\n\n${pendingContext.content}`);
      clearPendingContext?.();
    }
  }, [pendingContext, clearPendingContext]);

  // Save entries to localStorage
  const saveEntries = (updated: JournalEntry[]) => {
    setEntries(updated);
    localStorage.setItem(entriesKey, JSON.stringify(updated));
  };

  const handleSaveEntry = () => {
    if (!newText.trim()) return;

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      content: newText.trim()
    };

    const updated = [newEntry, ...entries];
    saveEntries(updated);
    setNewText("");
    localStorage.removeItem(draftKey);
    alert("Entrada guardada en tu diario íntimo.");
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm("¿Seguro que querés eliminar esta entrada?")) {
      const updated = entries.filter(e => e.id !== id);
      saveEntries(updated);
    }
  };

  const handleAction = (action: string, entry: JournalEntry) => {
    const contextMap: Record<string, string> = {
      aula: `${SECTION_PROMPTS.journal}\n\nEntrada:\n${entry.content}`,
      narrador: `${QUICK_ACTION_PROMPTS.narrator}\n\nEntrada:\n${entry.content}`,
      libro: `${QUICK_ACTION_PROMPTS.book}\n\nEntrada:\n${entry.content}`,
      examenes: `${QUICK_ACTION_PROMPTS.questions}\n\nEntrada:\n${entry.content}`,
      planes: `${QUICK_ACTION_PROMPTS.plan}\n\nEntrada:\n${entry.content}`,
      telegram: `${QUICK_ACTION_PROMPTS.telegram}\n\nEntrada:\n${entry.content}`,
      memoria: `${QUICK_ACTION_PROMPTS.memory}\n\nEntrada:\n${entry.content}`,
    };

    sendToSection(action, {
      source: "Diario íntimo",
      title: entry.date,
      action: action,
      content: contextMap[action]
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      {/* Header block */}
      <section className="flux-title-block">
        <div>
          <h1 className="flux-title" style={{ fontSize: "28px", fontWeight: 900 }}>Diario íntimo</h1>
          <p className="flux-subtitle">Un espacio privado para registrar estados, escenas, reacciones y cambios internos.</p>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px" }}>
        {/* Left column: Write new entry */}
        <div 
          style={{
            backgroundColor: "var(--swiss-bg)",
            border: "4px solid var(--swiss-border)",
            borderRadius: "22px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            height: "fit-content"
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-fg)" }}>
            Nueva entrada
          </h2>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Escribí qué estado observaste hoy..."
            className="swiss-landing-textarea"
            style={{
              width: "100%",
              height: "200px",
              borderRadius: "22px",
              padding: "16px",
              fontSize: "13.5px",
              lineHeight: "1.6",
              backgroundColor: "var(--swiss-muted)",
              border: "2px solid var(--swiss-border)",
              resize: "none"
            }}
          />
          <button
            onClick={handleSaveEntry}
            className="swiss-landing-cta"
            style={{
              width: "100%",
              borderRadius: "22px",
              padding: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: 900
            }}
          >
            <Plus size={16} />
            Guardar entrada
          </button>
        </div>

        {/* Right column: Chronological list of entries */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-fg)", marginBottom: "4px" }}>
            Historial de Estados ({entries.length})
          </h2>
          
          {entries.length === 0 ? (
            <div 
              style={{
                backgroundColor: "var(--swiss-bg)",
                border: "2px dashed var(--swiss-border)",
                borderRadius: "22px",
                padding: "40px 24px",
                textAlign: "center",
                color: "var(--swiss-text-muted)",
                fontSize: "13px",
                fontWeight: 500
              }}
            >
              No hay entradas guardadas todavía. Tu diario íntimo está vacío.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "60vh", overflowY: "auto", paddingRight: "4px" }}>
              {entries.map(entry => (
                <div 
                  key={entry.id}
                  style={{
                    backgroundColor: "var(--swiss-bg)",
                    border: "3px solid var(--swiss-border)",
                    borderRadius: "22px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--swiss-border)", paddingBottom: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 900, color: "var(--swiss-accent)", textTransform: "uppercase" }}>
                      {entry.date}
                    </span>
                    <button 
                      onClick={() => handleDeleteEntry(entry.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                      aria-label="Eliminar entrada"
                    >
                      <Trash2 size={14} style={{ color: "var(--swiss-text-muted)" }} />
                    </button>
                  </div>

                  <p style={{ fontSize: "13.5px", lineHeight: "1.6", color: "var(--swiss-fg)", fontWeight: 500, whiteSpace: "pre-line" }}>
                    {entry.content}
                  </p>

                  {/* Interoperability actions */}
                  <div style={{ borderTop: "2px solid var(--swiss-border)", paddingTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <button 
                      onClick={() => handleAction("aula", entry)}
                      style={{ padding: "4px 8px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", borderRadius: "999px", border: "1.5px solid #000", cursor: "pointer", backgroundColor: "var(--swiss-muted)" }}
                    >
                      Trabajar con Coach
                    </button>
                    <button 
                      onClick={() => handleAction("libro", entry)}
                      style={{ padding: "4px 8px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", borderRadius: "999px", border: "1.5px solid #000", cursor: "pointer", backgroundColor: "var(--swiss-muted)" }}
                    >
                      Convertir en capítulo
                    </button>
                    <button 
                      onClick={() => handleAction("examenes", entry)}
                      style={{ padding: "4px 8px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", borderRadius: "999px", border: "1.5px solid #000", cursor: "pointer", backgroundColor: "var(--swiss-muted)" }}
                    >
                      Generar preguntas
                    </button>
                    <button 
                      onClick={() => handleAction("planes", entry)}
                      style={{ padding: "4px 8px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", borderRadius: "999px", border: "1.5px solid #000", cursor: "pointer", backgroundColor: "var(--swiss-muted)" }}
                    >
                      Crear plan
                    </button>
                    <button 
                      onClick={() => handleAction("telegram", entry)}
                      style={{ padding: "4px 8px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", borderRadius: "999px", border: "1.5px solid #000", cursor: "pointer", backgroundColor: "var(--swiss-muted)" }}
                    >
                      Enviar a Telegram
                    </button>
                    <button 
                      onClick={() => handleAction("memoria", entry)}
                      style={{ padding: "4px 8px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", borderRadius: "999px", border: "1.5px solid #000", cursor: "pointer", backgroundColor: "var(--swiss-muted)" }}
                    >
                      Guardar en Memoria
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
