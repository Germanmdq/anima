import React, { useState, useEffect } from "react";
import { History, MessageSquareText, Calendar, BookOpen, Send, HelpCircle, ChevronDown, ChevronUp, Layers } from "lucide-react";

interface MemoryPanelProps {
  sendToSection: (target: string, context: any) => void;
  pendingContext?: any;
  clearPendingContext?: () => void;
  session?: any;
}

const TYPE_LABELS: Record<string, string> = {
  desire: "Deseo",
  state: "Estado",
  scene: "Escena",
  plan: "Plan",
  journal: "Diario",
  book: "Libro",
  telegram: "Telegram",
  conversation: "Conversación",
  concept: "Concepto",
  questions: "Preguntas",
  testimonial: "Testimonio",
  biblical_symbol: "Símbolo",
};

const BLOCKS = [
  { title: "Deseos activos", type: "desire" },
  { title: "Estados observados", type: "state" },
  { title: "Escenas creadas", type: "scene" },
  { title: "Planes activos", type: "plan" },
  { title: "Diario íntimo", type: "journal" },
  { title: "Mi libro", type: "book" },
  { title: "Telegram", type: "telegram" },
  { title: "Conversaciones importantes", type: "conversation" },
  { title: "Conceptos", type: "concept" },
  { title: "Preguntas y Exámenes", type: "questions" },
  { title: "Testimonios", type: "testimonial" },
  { title: "Símbolos bíblicos", type: "biblical_symbol" },
];

export default function MemoryPanel({ sendToSection, pendingContext, clearPendingContext, session }: MemoryPanelProps) {
  const [memorias, setMemorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [usarEnId, setUsarEnId] = useState<string | null>(null);

  const parseContent = (content: any) => {
    if (!content) return {};
    if (typeof content === "string") {
      try { return JSON.parse(content); } catch { return { text: content }; }
    }
    return content;
  };

  const getTitle = (item: any) => {
    if (item.item_type === "questions") return "Preguntas generadas";
    return item.title || "Recuerdo guardado";
  };

  const getBrief = (item: any): string => {
    const c = parseContent(item.content);
    if (item.item_type === "questions") {
      const meta = [
        c.cantidad ? `${c.cantidad} preguntas` : null,
        c.formato || null,
        c.dificultad ? `Dificultad ${String(c.dificultad).toLowerCase()}` : null,
      ].filter(Boolean).join(" · ");
      const material = c.material ? `Material: ${c.material}` : null;
      return [meta, material].filter(Boolean).join("\n") || "Preguntas generadas para trabajar el material indicado.";
    }
    const text = c.text || c.summary || c.resumen || null;
    if (!text) return item.title || "";
    return text.length > 220 ? text.slice(0, 220) + "…" : text;
  };

  const getFull = (item: any): string => {
    const c = parseContent(item.content);
    if (item.item_type === "questions") {
      const parts: string[] = [];
      const meta = [
        c.cantidad ? `${c.cantidad} preguntas` : null,
        c.formato || null,
        c.dificultad ? `Dificultad ${String(c.dificultad).toLowerCase()}` : null,
      ].filter(Boolean).join(" · ");
      if (meta) parts.push(meta);
      if (c.material) parts.push(`Material: ${c.material}`);
      if (c.fuente || item.source) parts.push(`Fuente: ${c.fuente || item.source}`);
      if (c.resumen || c.summary) parts.push(c.resumen || c.summary);
      return parts.join("\n") || "Preguntas generadas para trabajar el material indicado.";
    }
    return c.text || c.summary || c.resumen || item.title || "";
  };

  const sendMemoryAction = (target: string, item: any) => {
    sendToSection(target, {
      source: "Memoria",
      title: getTitle(item),
      action: target === "aula" ? "coach" : target,
      content: `Trabajá este recuerdo desde ${item.source || "Memoria"}.\n\n${getFull(item)}`,
    });
  };

  const getUserId = () => session?.user?.id || null;

  const getAuthHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) h["Authorization"] = `Bearer ${session.access_token}`;
    return h;
  };

  const fetchMemorias = async () => {
    try {
      const uid = getUserId();
      const token = session?.access_token;
      if (!uid || !token) { setMemorias([]); setAuthError(null); setLoading(false); return; }
      const res = await fetch("/api/memoria", { headers: getAuthHeaders() });
      if (res.status === 401) {
        const data = await res.json().catch(() => null);
        setMemorias([]);
        setAuthError(data?.error || "La sesión venció. Volvé a iniciar sesión.");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setMemorias(data.memorias || []);
        setAuthError(null);
      } else {
        console.error("Error cargando memoria:", res.statusText);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMemorias();
  }, [session?.user?.id, session?.access_token]);

  const handleSaveMemory = async (itemType: string) => {
    if (!pendingContext) return;
    const uid = getUserId();
    const token = session?.access_token;
    if (!uid || !token) { setAuthError("Necesitás una sesión válida para guardar recuerdos."); return; }
    try {
      const res = await fetch("/api/memoria", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          item_type: itemType,
          title: pendingContext.title || "Memoria Guardada",
          content: { text: pendingContext.content, created_from: "quick_action" },
          source: pendingContext.source,
          status: "active",
        }),
      });
      if (res.ok) { setAuthError(null); clearPendingContext?.(); fetchMemorias(); }
      else if (res.status === 401) {
        const data = await res.json().catch(() => null);
        setAuthError(data?.error || "La sesión venció. Volvé a iniciar sesión.");
      }
    } catch (e) { console.error(e); }
  };

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="ods-mem-root">
      <header className="ods-mem-header">
        <div className="ods-mem-header__icon"><History size={20} /></div>
        <div>
          <h2 className="ods-mem-header__title">Memoria</h2>
          <p className="ods-mem-header__sub">Todo lo que Odiseo recuerda de tu proceso.</p>
        </div>
      </header>

      {pendingContext?.target === "memoria" && (
        <div className="ods-mem-pending">
          <h3 className="ods-mem-pending__title">Recuerdo preparado</h3>
          <p className="ods-mem-pending__meta">
            Origen: {pendingContext.source}{pendingContext.title ? ` — ${pendingContext.title}` : ""}
          </p>
          <textarea readOnly value={pendingContext.content} className="ods-mem-pending__textarea" />
          <div className="ods-mem-pending__btns">
            {[
              { label: "Deseo activo", type: "desire" },
              { label: "Escena", type: "scene" },
              { label: "Conversación", type: "conversation" },
              { label: "Concepto", type: "concept" },
            ].map(({ label, type }) => (
              <button key={type} onClick={() => handleSaveMemory(type)} className="ods-btn ods-btn--dark ods-btn--sm">
                Guardar como {label}
              </button>
            ))}
            <button onClick={() => clearPendingContext?.()} className="ods-btn ods-btn--ghost ods-btn--sm">Cancelar</button>
          </div>
        </div>
      )}

      {authError && <div className="ods-mem-error">{authError}</div>}

      {loading ? (
        <div className="ods-mem-state">Cargando memorias…</div>
      ) : memorias.length === 0 ? (
        <div className="ods-mem-state ods-mem-state--empty">
          Todavía no hay recuerdos guardados. Cuando empieces a trabajar con Odiseo, tus deseos, escenas, planes y entradas importantes aparecerán acá.
        </div>
      ) : (
        <div className="ods-mem-blocks">
          {BLOCKS.map((block) => {
            const items = memorias.filter(m => m.item_type === block.type);
            if (items.length === 0) return null;
            return (
              <section key={block.type} className="ods-mem-section">
                <div className="ods-mem-section__head">
                  <span className="ods-mem-section__title">{block.title}</span>
                  <span className="ods-mem-section__count">{items.length}</span>
                </div>
                <div className="ods-mem-list">
                  {items.map((item) => {
                    const isOpen = expandedId === item.id;
                    const date = new Date(item.created_at).toLocaleDateString("es-AR", {
                      day: "numeric", month: "short", year: "numeric",
                    });
                    return (
                      <div key={item.id} className={`ods-mem-card${isOpen ? " ods-mem-card--open" : ""}`}>
                        <div className="ods-mem-card__body">
                          <div className="ods-mem-card__meta">
                            <span className="ods-mem-card__badge">
                              {TYPE_LABELS[item.item_type] || item.item_type}
                            </span>
                            <span className="ods-mem-card__date">{date}</span>
                          </div>
                          <div className="ods-mem-card__title">{getTitle(item)}</div>
                          {item.source && (
                            <div className="ods-mem-card__source">{item.source}</div>
                          )}
                          {isOpen ? (
                            <div className="ods-mem-card__full">{getFull(item)}</div>
                          ) : (
                            <div className="ods-mem-card__brief">{getBrief(item)}</div>
                          )}
                          <button
                            className="ods-mem-toggle"
                            onClick={() => toggle(item.id)}
                            aria-expanded={isOpen}
                          >
                            {isOpen
                              ? <><ChevronUp size={12} /> Mostrar menos</>
                              : <><ChevronDown size={12} /> Mostrar más</>
                            }
                          </button>
                        </div>
                        <div className="ods-mem-actions">
                          <button onClick={() => sendMemoryAction("aula", item)} className="ods-mem-action">
                            <MessageSquareText size={11} /> Coach
                          </button>
                          <button onClick={() => sendMemoryAction("planes", item)} className="ods-mem-action">
                            <Calendar size={11} /> Plan
                          </button>
                          <button onClick={() => sendMemoryAction("libro", item)} className="ods-mem-action">
                            <BookOpen size={11} /> Libro
                          </button>
                          <button onClick={() => sendMemoryAction("telegram", item)} className="ods-mem-action">
                            <Send size={11} /> Telegram
                          </button>
                          <button onClick={() => sendMemoryAction("examenes", item)} className="ods-mem-action">
                            <HelpCircle size={11} /> Preguntas
                          </button>
                        </div>
                        {/* Usar en… — solo mobile */}
                        <div className="ods-mem-usaren">
                          <button className="ods-mem-usaren-btn" onClick={() => setUsarEnId(item.id)}>
                            <Layers size={13} /> Usar en…
                          </button>
                        </div>
                        {/* Panel inferior "Usar en…" */}
                        {usarEnId === item.id && (
                          <div className="ods-bottomnav__submenu-overlay" onClick={() => setUsarEnId(null)}>
                            <div className="ods-bottomnav__submenu" onClick={(e) => e.stopPropagation()}>
                              <div className="ods-bottomnav__submenu-title">Usar en…</div>
                              <button onClick={() => { sendMemoryAction("aula", item); setUsarEnId(null); }} className="ods-bottomnav__submenu-item">
                                <MessageSquareText size={20} /> Enviar al Coach
                              </button>
                              <button onClick={() => { sendMemoryAction("planes", item); setUsarEnId(null); }} className="ods-bottomnav__submenu-item">
                                <Calendar size={20} /> Crear plan
                              </button>
                              <button onClick={() => { sendMemoryAction("examenes", item); setUsarEnId(null); }} className="ods-bottomnav__submenu-item">
                                <HelpCircle size={20} /> Crear preguntas
                              </button>
                              <button onClick={() => { sendMemoryAction("libro", item); setUsarEnId(null); }} className="ods-bottomnav__submenu-item">
                                <BookOpen size={20} /> Agregar a mi libro
                              </button>
                              <button onClick={() => { sendMemoryAction("telegram", item); setUsarEnId(null); }} className="ods-bottomnav__submenu-item">
                                <Send size={20} /> Mensaje Telegram
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
