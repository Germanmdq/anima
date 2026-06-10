import React, { useEffect, useState } from "react";
import {
  MessageSquareText,
  Sparkles,
  HelpCircle,
  Calendar,
  BookOpen,
  Search,
  Loader2
} from "lucide-react";
import { QUICK_ACTION_PROMPTS } from "@/lib/prompts";

interface TestimoniosViewProps {
  sendToSection: (target: string, context: any) => void;
}

const tagsWithEmoji = [
  { label: "Dinero",               emoji: "💰" },
  { label: "Amor / relaciones",    emoji: "💕" },
  { label: "Trabajo",              emoji: "💼" },
  { label: "Revisión",             emoji: "🔍" },
  { label: "Objetos recuperados",  emoji: "📦" },
  { label: "Viajes",               emoji: "✈️" },
  { label: "Salud / cuerpo",       emoji: "🌿" },
  { label: "Familia",              emoji: "👨‍👩‍👧" },
  { label: "Estado interior",      emoji: "🧘" },
  { label: "Imposibles resueltos", emoji: "✨" },
];

const suggestedCases = ["Barbados", "trabajo", "relación", "dinero", "deuda", "salud"];

function buildContextPrefix(caso: any) {
  return `Caso:\n${caso.title}\n${caso.subtitle ? `\nSubtítulo:\n${caso.subtitle}\n` : ""}\nFuente:\n${caso.source_title || "Fuente no especificada"} ${caso.source_year || ""}\n\nFragmento:\n${caso.body}`;
}

export default function TestimoniosView({ sendToSection }: TestimoniosViewProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const storageKey = "odiseo_testimonios_state_guest";

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      setQuery(state.query || "");
      setSearchResults(Array.isArray(state.searchResults) ? state.searchResults : []);
      setHasSearched(Boolean(state.hasSearched));
    } catch (e) {
      console.error("Error loading testimonios state", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ query, searchResults, hasSearched }));
  }, [query, searchResults, hasSearched]);

  const handleSearch = async (searchQuery: string, tag?: string) => {
    if (!searchQuery.trim() && !tag) return;
    setIsSearching(true);
    setHasSearched(true);
    setSearchResults([]);
    try {
      const res = await fetch("/api/testimonios/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, tag }),
      });
      const data = await res.json();
      if (data.results) setSearchResults(data.results);
    } catch (e) {
      console.error("Error searching testimonios:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const caseActions = [
    {
      label: "Aplicarlo a mi deseo",
      icon: <MessageSquareText size={13} />,
      tab: "aula",
      prompt: (caso: any, q: string) =>
        `Quiero trabajar mi deseo a partir de este testimonio de Neville.\n\nDeseo o búsqueda:\n${q}\n\n${buildContextPrefix(caso)}\n\nExplicame qué principio de la Ley de Asunción aparece en este caso y cómo aplicarlo a mi deseo.`,
    },
    {
      label: "Enviar al Narrador",
      icon: <Sparkles size={13} />,
      tab: "narrador",
      prompt: (caso: any, q: string) =>
        `${QUICK_ACTION_PROMPTS.narrator}\n\nMostrá cómo este testimonio se relaciona con este deseo.\n\nDeseo:\n${q}\n\n${buildContextPrefix(caso)}`,
    },
    {
      label: "Crear preguntas",
      icon: <HelpCircle size={13} />,
      tab: "examenes",
      prompt: (caso: any, q: string) =>
        `${QUICK_ACTION_PROMPTS.questions}\n\nDeseo:\n${q}\n\n${buildContextPrefix(caso)}`,
    },
    {
      label: "Crear plan",
      icon: <Calendar size={13} />,
      tab: "planes",
      prompt: (caso: any, q: string) =>
        `${QUICK_ACTION_PROMPTS.plan}\n\nDeseo:\n${q}\n\n${buildContextPrefix(caso)}`,
    },
    {
      label: "Guardar en memoria",
      icon: <BookOpen size={13} />,
      tab: "memoria",
      prompt: (caso: any) => buildContextPrefix(caso),
    },
  ];

  return (
    <div className="testi-wrap">
      {/* Header */}
      <header className="testi-header">
        <h2>Testimonios y casos</h2>
        <p>Encontrá historias que Neville usaba para mostrar la imaginación en acción.</p>
      </header>

      <div className="testi-layout">
        {/* ── Columna izquierda: form + categorías ── */}
        <div className="testi-sidebar">
          <div className="testi-search-card">
            <label className="testi-search-label">¿Qué querés ver realizado?</label>
            <textarea
              className="testi-textarea"
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ejemplo: quiero recibir dinero inesperado, recuperar una relación…"
            />
            <button
              className="testi-search-btn"
              onClick={() => handleSearch(query)}
              disabled={isSearching}
            >
              {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {isSearching ? "Buscando casos…" : "Buscar casos relacionados"}
            </button>
          </div>

          {/* Categorías compactas */}
          <div className="testi-section-label">Temas sugeridos</div>
          <div className="testi-category-list">
            {tagsWithEmoji.map((tag, idx) => (
              <button
                key={idx}
                className="category-row category-row--compact"
                onClick={() => {
                  const newQuery = `Quiero encontrar casos sobre ${tag.label.toLowerCase()}.`;
                  setQuery(newQuery);
                  handleSearch(newQuery, tag.label);
                }}
              >
                <span className="cat-emoji">{tag.emoji}</span>
                <span className="cat-text">{tag.label}</span>
                <span className="cat-arrow">›</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Columna derecha: resultados ── */}
        <div className="testi-results-col">
          {isSearching ? (
            <div className="testi-empty">
              <Loader2 size={28} style={{ color: "var(--color-accent)", animation: "spin 1s linear infinite" }} />
              <p>Buscando casos relacionados…</p>
            </div>
          ) : !hasSearched ? (
            <div className="testi-empty testi-empty--initial">
              <MessageSquareText size={40} style={{ color: "var(--color-muted)", opacity: 0.4 }} />
              <h3>Encontrá historias reales</h3>
              <p>Escribí lo que querés ver realizado o elegí un tema.</p>
              <div className="testi-suggestions">
                {suggestedCases.map((sc, i) => (
                  <button key={i} className="testi-suggestion-chip" onClick={() => { setQuery(sc); handleSearch(sc); }}>
                    {sc}
                  </button>
                ))}
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="testi-case-list">
              <h3 className="testi-results-header">
                {searchResults.length} caso{searchResults.length !== 1 ? "s" : ""} encontrado{searchResults.length !== 1 ? "s" : ""}
              </h3>
              {searchResults.map((caso, idx) => (
                <div key={idx} className="testi-case-card">
                  <div className="testi-case-top">
                    <h3 className="testi-case-title">{caso.title}</h3>
                    {(caso.source_title || caso.source_year) && (
                      <span className="testi-case-source">
                        {caso.source_title}{caso.source_year ? ` (${caso.source_year})` : ""}
                      </span>
                    )}
                  </div>

                  {caso.subtitle && <p className="testi-case-subtitle">{caso.subtitle}</p>}
                  <p className="testi-case-body">{caso.body}</p>
                  {caso.match_reason && (
                    <p className="testi-case-reason">Por qué se relaciona: {caso.match_reason}</p>
                  )}
                  {caso.tags && caso.tags.length > 0 && (
                    <div className="testi-case-tags">
                      {caso.tags.map((t: string, i: number) => (
                        <span key={i} className="testi-case-tag">{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="testi-case-actions">
                    <span className="testi-action-label">Seguir con esto:</span>
                    {caseActions.map((action, i) => (
                      <button
                        key={i}
                        className="testi-action-btn"
                        onClick={() =>
                          sendToSection(action.tab, {
                            source: "Testimonios y casos",
                            title: caso.title,
                            action: action.tab === "aula" ? "coach" : action.tab,
                            content: action.prompt(caso, query),
                          })
                        }
                      >
                        {action.icon} {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="testi-noresults">
              <div className="testi-noresults-icon"><HelpCircle size={32} /></div>
              <p>No encontré un testimonio directo para esa búsqueda en las fuentes cargadas.</p>
              <button className="testi-noresults-btn" onClick={() => { setQuery(""); setHasSearched(false); }}>
                Probar otra búsqueda
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
