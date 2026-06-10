import React, { useEffect, useState } from "react";
import {
  Cross,
  MessageSquareText,
  Sparkles,
  HelpCircle,
  BookOpen,
  Search,
  Loader2,
} from "lucide-react";
import { QUICK_ACTION_PROMPTS } from "@/lib/prompts";

interface BiblicaViewProps {
  sendToSection: (target: string, context: any) => void;
}

const simbolos = ["Cristo", "Yo Soy", "Moisés", "Josué", "David", "Jacob", "Judas", "Egipto", "Jerusalén", "Promesa", "Resurrección", "Sábado"];

export default function BiblicaView({ sendToSection }: BiblicaViewProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const storageKey = "odiseo_biblia_state_guest";

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      setQuery(state.query || "");
      setResults(Array.isArray(state.results) ? state.results : []);
      setHasSearched(Boolean(state.hasSearched));
    } catch (e) {
      console.error("Error loading biblia state", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ query, results, hasSearched }));
  }, [query, results, hasSearched]);

  const handleSearch = async (value: string) => {
    if (!value.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    setResults([]);
    try {
      const response = await fetch("/api/biblia/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: value }),
      });
      const data = await response.json();
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      console.error("Error searching biblia:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const buildPromptContext = (result: any, originalQuery: string) =>
    `Tema:\n${originalQuery}\n\nResultado:\n${result.title}\n\nFuente:\n${result.source_title || "Fuente no especificada"} ${result.source_year || ""}\n\nExplicación:\n${result.body}`;

  const buildRawContext = (result: any) =>
    `Concepto:\n${result.title}\n\nFuente:\n${result.source_title || "Fuente no especificada"} ${result.source_year || ""}\n\nExplicación:\n${result.body}${result.practical_application ? `\n\nAplicación práctica:\n${result.practical_application}` : ""}`;

  const symbolActions = [
    { label: "Aplicarlo a mi estado", icon: <MessageSquareText size={13} />, tab: "aula",
      prompt: (result: any, q: string) => `Quiero entender este símbolo o explicación bíblica desde Neville.\n\n${buildPromptContext(result, q)}\n\nAplicalo a mi estado actual y a mi práctica de imaginación.` },
    { label: "Explicarlo con ejemplo", icon: <Sparkles size={13} />, tab: "narrador",
      prompt: (result: any, q: string) => `${QUICK_ACTION_PROMPTS.narrator}\n\nExplicalo con un ejemplo cotidiano y concreto.\n\n${buildPromptContext(result, q)}` },
    { label: "Crear preguntas", icon: <HelpCircle size={13} />, tab: "examenes",
      prompt: (result: any, q: string) => `${QUICK_ACTION_PROMPTS.questions}\n\n${buildPromptContext(result, q)}` },
    { label: "Guardar como concepto", icon: <BookOpen size={13} />, tab: "memoria",
      prompt: (result: any) => buildRawContext(result) },
  ];

  return (
    <div style={{ padding: "24px 20px 100px", maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <header>
        <h2 style={{ fontSize: "19px", fontWeight: 700, margin: "0 0 4px", fontFamily: "var(--font-base)", color: "var(--color-dark)" }}>
          Biblia metafísica
        </h2>
        <p style={{ fontSize: "14px", color: "var(--color-muted)", margin: 0, fontFamily: "var(--font-base)" }}>
          ¿Qué símbolo o situación querés entender?
        </p>
      </header>

      {/* Buscador */}
      <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "var(--shadow-card)" }}>
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Ejemplo: Moisés, Egipto, Cristo, Judas, Yo Soy, Resurrección, o "siento que estoy atrapado en lo viejo"...'
          style={{ width: "100%", minHeight: "96px", padding: "14px 16px", borderRadius: "var(--radius-sm)", border: "0.5px solid var(--color-border)", background: "var(--color-bg)", fontSize: "15px", fontFamily: "var(--font-base)", color: "var(--color-dark)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
        />
        <button
          onClick={() => handleSearch(query)}
          disabled={isSearching}
          style={{ background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "14px 16px", fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-base)", cursor: isSearching ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isSearching ? 0.7 : 1 }}
        >
          {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          {isSearching ? "Buscando..." : "Buscar explicación bíblica"}
        </button>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {simbolos.map((symbol) => (
            <button
              key={symbol}
              onClick={() => { setQuery(symbol); handleSearch(symbol); }}
              style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 500, borderRadius: "100px", border: "0.5px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-dark)", cursor: "pointer", fontFamily: "var(--font-base)" }}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados */}
      {hasSearched && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {results.length > 0 ? (
            results.map((result) => (
              <div key={result.id} style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "var(--shadow-card)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
                  <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--color-accent)", margin: 0, fontFamily: "var(--font-base)" }}>
                    {result.title}
                  </h3>
                  <span style={{ fontSize: "11px", fontWeight: 500, background: "var(--color-bg)", padding: "3px 10px", borderRadius: "100px", color: "var(--color-muted)", border: "0.5px solid var(--color-border)", fontFamily: "var(--font-base)", flexShrink: 0 }}>
                    {result.subtype}
                  </span>
                </div>
                {result.subtitle && (
                  <p style={{ fontSize: "13px", color: "var(--color-muted)", margin: 0, fontFamily: "var(--font-base)" }}>{result.subtitle}</p>
                )}
                <p style={{ fontSize: "14px", color: "var(--color-dark)", lineHeight: "1.65", whiteSpace: "pre-wrap", margin: 0, fontFamily: "var(--font-base)" }}>{result.body}</p>
                {result.practical_application && (
                  <p style={{ fontSize: "13px", color: "var(--color-muted)", lineHeight: "1.6", margin: 0, fontFamily: "var(--font-base)" }}>
                    {result.practical_application}
                  </p>
                )}
                {(result.source_title || result.source_year) && (
                  <p style={{ fontSize: "11px", color: "var(--color-muted)", margin: 0, fontFamily: "var(--font-base)" }}>
                    {result.source_title || "Fuente no especificada"} {result.source_year ? `(${result.source_year})` : ""}
                  </p>
                )}
                {Array.isArray(result.tags) && result.tags.length > 0 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {result.tags.map((tag: string) => (
                      <span key={`${result.id}-${tag}`} style={{ fontSize: "11px", fontWeight: 500, background: "var(--color-bg)", color: "var(--color-muted)", padding: "3px 10px", borderRadius: "100px", border: "0.5px solid var(--color-border)", fontFamily: "var(--font-base)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ borderTop: "0.5px solid var(--color-border)", paddingTop: "12px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-muted)", fontFamily: "var(--font-base)" }}>
                    Seguir con esto:
                  </span>
                  {symbolActions.map((action) => (
                    <button
                      key={`${result.id}-${action.label}`}
                      className="coach-quick-btn"
                      onClick={() => sendToSection(action.tab, {
                        source: "Biblia metafísica",
                        title: result.title,
                        action: action.label === "Guardar como concepto" ? "concepto" : action.tab === "aula" ? "coach" : action.tab,
                        content: action.prompt(result, query),
                      })}
                    >
                      {action.icon} {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "32px 24px", textAlign: "center", color: "var(--color-muted)", fontSize: "15px", fontFamily: "var(--font-base)" }}>
              No encontré resultados bíblicos para esa búsqueda en los artifacts publicados.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
