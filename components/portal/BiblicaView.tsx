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
    { label: "Aplicarlo a mi estado", icon: <MessageSquareText size={14} />, tab: "aula", prompt: (result: any, originalQuery: string) => `Quiero entender este símbolo o explicación bíblica desde Neville.\n\n${buildPromptContext(result, originalQuery)}\n\nAplicalo a mi estado actual y a mi práctica de imaginación.` },
    { label: "Explicarlo con ejemplo", icon: <Sparkles size={14} />, tab: "narrador", prompt: (result: any, originalQuery: string) => `${QUICK_ACTION_PROMPTS.narrator}\n\nExplicalo con un ejemplo cotidiano y concreto.\n\n${buildPromptContext(result, originalQuery)}` },
    { label: "Crear preguntas", icon: <HelpCircle size={14} />, tab: "examenes", prompt: (result: any, originalQuery: string) => `${QUICK_ACTION_PROMPTS.questions}\n\n${buildPromptContext(result, originalQuery)}` },
    { label: "Guardar como concepto", icon: <BookOpen size={14} />, tab: "memoria", prompt: (result: any) => buildRawContext(result) },
  ];

  return (
    <div style={{ padding: "40px 24px", maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <header className="content-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ backgroundColor: "var(--swiss-accent)", color: "#fff", padding: "12px", borderRadius: "16px" }}>
            <Cross size={24} />
          </div>
          <h2 className="flux-title" style={{ fontSize: "32px", textTransform: "uppercase", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
            Biblia metafísica
          </h2>
        </div>
        <p className="flux-subtitle" style={{ fontSize: "18px", color: "var(--swiss-fg)", fontWeight: 500, marginBottom: "4px" }}>
          ¿Qué símbolo o situación querés entender?
        </p>
      </header>

      <div style={{ backgroundColor: "var(--swiss-bg)", border: "2px solid #000", borderRadius: "22px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Ejemplo: Moisés, Egipto, Cristo, Judas, Yo Soy, Resurrección, o "siento que estoy atrapado en lo viejo"...'
          style={{ width: "100%", minHeight: "100px", padding: "16px", borderRadius: "16px", border: "2px solid var(--swiss-border)", backgroundColor: "var(--swiss-muted)", fontSize: "15px", color: "var(--swiss-fg)", resize: "vertical" }}
        />
        <button
          onClick={() => handleSearch(query)}
          disabled={isSearching}
          style={{ backgroundColor: "var(--swiss-accent)", color: "#fff", border: "none", borderRadius: "16px", padding: "16px", fontSize: "16px", fontWeight: 900, textTransform: "uppercase", cursor: isSearching ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: isSearching ? 0.7 : 1 }}
        >
          {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
          {isSearching ? "Buscando..." : "Buscar explicación bíblica"}
        </button>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {simbolos.map((symbol) => (
            <button
              key={symbol}
              onClick={() => {
                setQuery(symbol);
                handleSearch(symbol);
              }}
              style={{ padding: "6px 12px", fontSize: "12px", fontWeight: 600, borderRadius: "16px", border: "1.5px solid var(--swiss-border)", backgroundColor: "var(--swiss-bg)", color: "var(--swiss-fg)", cursor: "pointer" }}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {hasSearched && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {results.length > 0 ? (
            results.map((result) => (
              <div key={result.id} style={{ backgroundColor: "var(--swiss-bg)", border: "2px solid #000", borderRadius: "22px", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "20px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-fg)", margin: 0 }}>{result.title}</h3>
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", backgroundColor: "var(--swiss-muted)", padding: "4px 8px", borderRadius: "8px", color: "var(--swiss-text-muted)" }}>
                    {result.subtype}
                  </span>
                </div>
                {result.subtitle && <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--swiss-text-muted)", margin: 0 }}>{result.subtitle}</p>}
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--swiss-fg)", lineHeight: "1.6", whiteSpace: "pre-wrap", margin: 0 }}>{result.body}</p>
                {result.practical_application && (
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--swiss-text-muted)", lineHeight: "1.6", margin: 0 }}>
                    {result.practical_application}
                  </p>
                )}
                {(result.source_title || result.source_year) && (
                  <p style={{ fontSize: "12px", color: "var(--swiss-text-muted)", margin: 0 }}>
                    {result.source_title || "Fuente no especificada"} {result.source_year ? `(${result.source_year})` : ""}
                  </p>
                )}
                {Array.isArray(result.tags) && result.tags.length > 0 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {result.tags.map((tag: string) => (
                      <span key={`${result.id}-${tag}`} style={{ fontSize: "10px", fontWeight: 800, backgroundColor: "#000", color: "#fff", padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ borderTop: "2px solid var(--swiss-border)", paddingTop: "12px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 900, color: "var(--swiss-text-muted)" }}>
                    Seguir con esto:
                  </span>
                  {symbolActions.map((action) => (
                    <button
                      key={`${result.id}-${action.label}`}
                      onClick={() => sendToSection(action.tab, {
                        source: "Biblia metafísica",
                        title: result.title,
                        action: action.label === "Guardar como concepto" ? "concepto" : action.tab === "aula" ? "coach" : action.tab,
                        content: action.prompt(result, query),
                      })}
                      style={{ padding: "7px 12px", fontSize: "11px", fontWeight: 900, borderRadius: "999px", border: "1.5px solid #000", backgroundColor: "var(--swiss-bg)", color: "var(--swiss-fg)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      {action.icon} {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={{ backgroundColor: "var(--swiss-muted)", border: "2px dashed var(--swiss-border)", borderRadius: "22px", padding: "32px 24px", textAlign: "center" }}>
              No encontré resultados bíblicos para esa búsqueda en los artifacts publicados.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
