// Testimonios Semantic Search Component
import React, { useEffect, useState } from "react";
import {
  ScrollText,
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

const tags = [
  "Dinero",
  "Amor / relaciones",
  "Trabajo",
  "Revisión",
  "Objetos recuperados",
  "Viajes",
  "Salud / cuerpo",
  "Familia",
  "Estado interior",
  "Imposibles resueltos"
];

const suggestedCases = [
  "Barbados",
  "trabajo",
  "relación",
  "dinero",
  "deuda",
  "salud"
];

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
        body: JSON.stringify({ query: searchQuery, tag })
      });
      
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch (e) {
      console.error("Error searching testimonios:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const caseActions = [
    { 
      label: "Aplicarlo a mi deseo", 
      icon: <MessageSquareText size={14} />, 
      tab: "aula", 
      prompt: (caso: any, originalQuery: string) => `Quiero trabajar mi deseo a partir de este testimonio de Neville.\n\nDeseo o búsqueda:\n${originalQuery}\n\n${buildContextPrefix(caso)}\n\nExplicame qué principio de la Ley de Asunción aparece en este caso y cómo aplicarlo a mi deseo.`
    },
    { 
      label: "Enviar al Narrador", 
      icon: <Sparkles size={14} />, 
      tab: "narrador", 
      prompt: (caso: any, originalQuery: string) => `${QUICK_ACTION_PROMPTS.narrator}\n\nMostrá cómo este testimonio se relaciona con este deseo.\n\nDeseo:\n${originalQuery}\n\n${buildContextPrefix(caso)}`
    },
    { label: "Crear preguntas", icon: <HelpCircle size={14} />, tab: "examenes", prompt: (caso: any, originalQuery: string) => `${QUICK_ACTION_PROMPTS.questions}\n\nDeseo:\n${originalQuery}\n\n${buildContextPrefix(caso)}` },
    { label: "Crear plan", icon: <Calendar size={14} />, tab: "planes", prompt: (caso: any, originalQuery: string) => `${QUICK_ACTION_PROMPTS.plan}\n\nDeseo:\n${originalQuery}\n\n${buildContextPrefix(caso)}` },
    { label: "Guardar en memoria", icon: <BookOpen size={14} />, tab: "memoria", prompt: (caso: any) => buildContextPrefix(caso) },
  ];

  return (
    <div style={{ padding: "40px 24px", maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px" }}>
      <header className="content-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ backgroundColor: "var(--swiss-accent)", color: "#fff", padding: "12px", borderRadius: "16px" }}>
            <ScrollText size={24} />
          </div>
          <h2 className="flux-title" style={{ fontSize: "32px", textTransform: "uppercase", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
            Testimonios y casos
          </h2>
        </div>
        <p className="flux-subtitle" style={{ fontSize: "18px", color: "var(--swiss-fg)", fontWeight: 500, marginBottom: "4px" }}>
          Encontrá historias que Neville usaba para mostrar la imaginación en acción.
        </p>
        <p style={{ fontSize: "14px", color: "var(--swiss-text-muted)", fontWeight: 500, lineHeight: "1.6" }}>
          Escribí lo que querés ver realizado y buscá un caso cercano en las fuentes de Neville.
        </p>
      </header>

      {/* Buscador Principal */}
      <div style={{
        backgroundColor: "var(--swiss-bg)",
        border: "2px solid #000",
        borderRadius: "22px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        <label style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-fg)" }}>
          ¿Qué querés ver realizado?
        </label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ejemplo: quiero recibir dinero inesperado, recuperar una relación, resolver una deuda, conseguir trabajo, mudarme, sentir seguridad en mi cuerpo..."
          style={{
            width: "100%",
            minHeight: "100px",
            padding: "16px",
            borderRadius: "16px",
            border: "2px solid var(--swiss-border)",
            backgroundColor: "var(--swiss-muted)",
            fontSize: "15px",
            color: "var(--swiss-fg)",
            resize: "vertical"
          }}
        />
        <button
          onClick={() => handleSearch(query)}
          disabled={isSearching}
          style={{
            backgroundColor: "var(--swiss-accent)",
            color: "#fff",
            border: "none",
            borderRadius: "16px",
            padding: "16px",
            fontSize: "16px",
            fontWeight: 900,
            textTransform: "uppercase",
            cursor: isSearching ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            opacity: isSearching ? 0.7 : 1
          }}
        >
          {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
          {isSearching ? "Buscando casos..." : "Buscar casos relacionados"}
        </button>

        {/* Etiquetas de acceso rápido */}
        <div style={{ borderTop: "2px solid var(--swiss-border)", paddingTop: "16px", marginTop: "8px" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--swiss-text-muted)", marginBottom: "12px" }}>Etiquetas sugeridas:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {tags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const newQuery = `Quiero encontrar casos sobre ${tag.toLowerCase()}.`;
                  setQuery(newQuery);
                  handleSearch(newQuery, tag);
                }}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "16px",
                  border: "1.5px solid var(--swiss-border)",
                  backgroundColor: "var(--swiss-bg)",
                  color: "var(--swiss-fg)",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--swiss-accent)"; e.currentTarget.style.color = "var(--swiss-accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--swiss-border)"; e.currentTarget.style.color = "var(--swiss-fg)"; }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resultados o Estado Inicial */}
      {!hasSearched ? (
        <div style={{
          backgroundColor: "var(--swiss-muted)",
          border: "2px dashed var(--swiss-border)",
          borderRadius: "22px",
          padding: "32px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--swiss-fg)" }}>
            Elegí una búsqueda sugerida o escribí tu propio deseo.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
            {suggestedCases.map((sc, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(sc);
                  handleSearch(sc);
                }}
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  borderRadius: "16px",
                  border: "2px solid #000",
                  backgroundColor: "var(--swiss-bg)",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>
      ) : searchResults.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <h3 style={{ fontSize: "20px", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>Resultados Encontrados</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {searchResults.map((caso, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "var(--swiss-bg)",
                  border: "2px solid #000",
                  borderRadius: "22px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-accent)", margin: 0 }}>
                    {caso.title}
                  </h3>
                  {(caso.source_title || caso.source_year) && (
                    <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", backgroundColor: "var(--swiss-muted)", padding: "4px 8px", borderRadius: "8px", color: "var(--swiss-text-muted)" }}>
                      {caso.source_title} {caso.source_year ? `(${caso.source_year})` : ""}
                    </span>
                  )}
                </div>
                
                {caso.subtitle && (
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--swiss-text-muted)", margin: 0 }}>
                    {caso.subtitle}
                  </p>
                )}

                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--swiss-fg)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  {caso.body}
                </p>

                {caso.match_reason && (
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--swiss-text-muted)", margin: 0 }}>
                    Por qué se relaciona: {caso.match_reason}
                  </p>
                )}

                {caso.tags && caso.tags.length > 0 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {caso.tags.map((t: string, i: number) => (
                      <span key={i} style={{ fontSize: "10px", fontWeight: 800, backgroundColor: "#000", color: "#fff", padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase" }}>{t}</span>
                    ))}
                  </div>
                )}

                <div style={{
                  borderTop: "2px solid var(--swiss-border)",
                  paddingTop: "16px",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span style={{ fontSize: "11px", fontWeight: 900, color: "var(--swiss-text-muted)" }}>
                    Seguir con esto:
                  </span>
                  {caseActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => sendToSection(action.tab, {
                        source: "Testimonios y casos",
                        title: caso.title,
                        action: action.tab === "aula" ? "coach" : action.tab,
                        content: action.prompt(caso, query)
                      })}
                      style={{
                        padding: "7px 12px",
                        fontSize: "11px",
                        fontWeight: 900,
                        borderRadius: "999px",
                        border: "1.5px solid #000",
                        backgroundColor: "var(--swiss-bg)",
                        color: "var(--swiss-fg)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      {action.icon} {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: "var(--swiss-muted)",
          border: "2px dashed var(--swiss-border)",
          borderRadius: "22px",
          padding: "40px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px"
        }}>
          <div style={{ backgroundColor: "#000", color: "#fff", padding: "16px", borderRadius: "50%" }}>
            <HelpCircle size={32} />
          </div>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "var(--swiss-fg)", maxWidth: "400px" }}>
            No encontré todavía un testimonio directo para esa búsqueda en las fuentes cargadas.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => { setQuery(""); setHasSearched(false); }}
              style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 900, textTransform: "uppercase", backgroundColor: "var(--swiss-bg)", color: "var(--swiss-fg)", border: "2px solid #000", borderRadius: "16px", cursor: "pointer" }}
            >
              Probar otra búsqueda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
