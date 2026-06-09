import React, { useState } from "react";
import { X, ArrowLeft, BookOpen, Sparkles, HelpCircle, FileText, Send, Calendar } from "lucide-react";

interface Note {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  ctas: { label: string; action: string; icon: React.ReactNode }[];
}

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTo: (tab: string, agent?: string) => void;
}

export default function NotesModal({ isOpen, onClose, onNavigateTo }: NotesModalProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);

  if (!isOpen) return null;

  const notes: Note[] = [
    {
      id: 1,
      title: "Cómo trabajar un deseo durante 7 días",
      excerpt: "Un deseo no se trabaja desde la ansiedad o la carencia, sino desde la asunción consciente del estado cumplido.",
      content: `Trabajar un deseo no consiste en repetir palabras de forma mecánica o forzar visualizaciones con esfuerzo mental. Consiste en una reestructuración radical de tu dieta mental. 

Durante 7 días, tu única tarea es habitar psicológicamente el final:
1. **Definí la escena**: Una acción simple y breve que implique que tu deseo ya se cumplió (un saludo, un apretón de manos, una frase de felicitación).
2. **Habitá el sentimiento**: Antes de dormir, recreá la escena mentalmente hasta que adquiera la naturalidad de un hecho consumado. Sentí el relieve, la temperatura y la emoción del alivio.
3. **Custodiá tu diálogo interno**: Durante el día, cuando la urgencia o la duda aparezcan en tu mente, no te dejes arrastrar por la vieja conversación. Volvé conscientemente a la sensación de que ya es una realidad.
4. **Ignorá las sombras**: La realidad física es solo una proyección de tu conciencia pasada. No te dejes guiar por lo que ves afuera; mantené tu lealtad al estado interior.`,
      ctas: [
        { label: "Crear plan", action: "planes", icon: <Calendar size={14} /> },
        { label: "Trabajar con Coach", action: "coach", icon: <Sparkles size={14} /> },
        { label: "Agregar al Diario", action: "diario", icon: <FileText size={14} /> },
        { label: "Enviar a Mi libro", action: "libro", icon: <BookOpen size={14} /> }
      ]
    },
    {
      id: 2,
      title: "Cómo leer a Neville sin dispersarte",
      excerpt: "Evitá acumular teoría seca. Leé cada conferencia con una intención viva y transformá las palabras en asunción práctica.",
      content: `Leer a Neville Goddard es una delicia intelectual, pero el peligro radica en convertir la ley en mera especulación teórica. La verdad no se encuentra en acumular conocimiento, sino en su aplicación inmediata.

Para leer sin dispersión mental:
1. **Iniciá con una pregunta**: Antes de abrir una conferencia o libro, definí con claridad qué bloqueo o duda estás enfrentando. Leé buscando la respuesta específica.
2. **Subrayá para practicar**: No guardes frases hermosas solo por su estética. Elegí una sola idea y definí cómo la vas a aplicar hoy mismo en tu asunción.
3. **Evitá leer en exceso**: Es preferible asimilar y practicar una sola página de 'El Poder de la Conciencia' durante una semana entera, que devorarse tres libros de corrido sin haber habitado un solo estado en la imaginación.`,
      ctas: [
        { label: "Fuentes de Neville", action: "biblioteca", icon: <BookOpen size={14} /> },
        { label: "Preguntas para integrar", action: "examenes", icon: <HelpCircle size={14} /> },
        { label: "Trabajar con Coach", action: "coach", icon: <Sparkles size={14} /> }
      ]
    },
    {
      id: 3,
      title: "De conversación a libro personal",
      excerpt: "Tus diálogos con el Coach, tus reflexiones del diario y tus planes pueden estructurarse en tu propia guía de vida.",
      content: `Cada palabra que intercambiás con tu compañero de imaginación, cada análisis de tus asunciones y cada escena que detallás en tu diario representan el mapa de tu conciencia. 

No dejes que estos valiosos aprendizajes queden dispersos o se pierdan en el olvido:
1. **Estructurá tus capítulos**: Podés organizar tus conversaciones por temas (finanzas, relaciones, autoconcepto).
2. **Revisá tu evolución**: Tu libro te permite ver el momento exacto en que soltaste la vieja historia y asumiste el nuevo final.
3. **Descargá tu manual**: Compilá esta documentación y tenela a mano como tu propio libro de práctica y estudio.`,
      ctas: [
        { label: "Mi libro", action: "libro", icon: <BookOpen size={14} /> },
        { label: "Agregar al Diario", action: "diario", icon: <FileText size={14} /> },
        { label: "Preguntas y respuestas", action: "examenes", icon: <HelpCircle size={14} /> }
      ]
    },
    {
      id: 4,
      title: "Cómo usar Telegram para volver al estado",
      excerpt: "Recibí la frase justa en tu teléfono para desactivar la duda antes de caer otra vez en la vieja conversación.",
      content: `No siempre es posible o cómodo abrir la plataforma a mitad del día cuando la mente se desvía. Ahí es donde Telegram actúa como tu guardián mental:
1. **Recordatorios de dieta mental**: Telegram te envía pequeñas notificaciones y preguntas en momentos estratégicos del día para recordarte desde dónde estás viviendo.
2. **Frases de retorno**: Pequeñas aserciones basadas en tu deseo actual para reprogramar el diálogo interno de forma inmediata.
3. **Prácticas cortas**: Ejercicios de 1 minuto para aquietar la mente y reclamar el estado deseado en medio de tus actividades cotidianas.`,
      ctas: [
        { label: "Telegram", action: "telegram", icon: <Send size={14} /> },
        { label: "Crear plan", action: "planes", icon: <Calendar size={14} /> },
        { label: "Trabajar con Coach", action: "coach", icon: <Sparkles size={14} /> }
      ]
    },
    {
      id: 5,
      title: "Qué hacer cuando mirás demasiado la realidad actual",
      excerpt: "Observar el entorno físico no es el error; obedecerlo como causa final de tu vida sí lo es.",
      content: `Es completamente natural que tus ojos físicos vean la escasez, el distanciamiento o la incomodidad del presente. El error no es ver la realidad física, sino asignarle autoridad creadora.

Cuando te descubras abrumado por la evidencia externa:
1. **Retirá tu atención**: Reconocé que lo que ves es solo el eco de tus asunciones pasadas. No intentes luchar contra ello ni modificar el reflejo.
2. **Cambiá de autoridad**: Recordá que la imaginación es la única causa final de tu realidad. Volvé al silencio interno.
3. **Habitá el final**: Decí en tu interior: 'Esto es una apariencia. Mi realidad verdadera es la asunción que sostengo ahora mismo'.`,
      ctas: [
        { label: "Trabajar con Coach", action: "coach", icon: <Sparkles size={14} /> },
        { label: "Crear escena", action: "practicas", icon: <Sparkles size={14} /> },
        { label: "Agregar al Diario", action: "diario", icon: <FileText size={14} /> },
        { label: "Crear plan", action: "planes", icon: <Calendar size={14} /> }
      ]
    }
  ];

  const handleCtaClick = (action: string) => {
    onClose();
    if (action === "coach") {
      onNavigateTo("aula", "profesor");
    } else if (action === "narrador") {
      onNavigateTo("aula", "cuentacuentos");
    } else if (action === "examenes" || action === "preguntas") {
      onNavigateTo("examenes");
    } else if (action === "libro") {
      onNavigateTo("libro");
    } else if (action === "planes") {
      onNavigateTo("planes");
    } else if (action === "telegram") {
      onNavigateTo("telegram");
    } else if (action === "diario") {
      onNavigateTo("diario");
    } else if (action === "biblioteca") {
      onNavigateTo("biblioteca");
    } else if (action === "practicas") {
      // Practicas shares page tab examenes or aula
      onNavigateTo("examenes");
    }
  };

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return (
    <div className="flux-modal-overlay" style={{ zIndex: 1100 }}>
      <div 
        className="flux-modal-content" 
        style={{ 
          maxWidth: "800px", 
          border: "4px solid var(--swiss-border)", 
          borderRadius: "22px",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div className="flux-modal-header" style={{ borderBottom: "4px solid var(--swiss-border)", padding: "20px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {selectedNoteId !== null && (
              <button 
                onClick={() => setSelectedNoteId(null)}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
              >
                <ArrowLeft size={20} style={{ color: "var(--swiss-fg)" }} />
              </button>
            )}
            <div>
              <span className="flux-chat-header__eyebrow" style={{ color: "var(--swiss-accent)" }}>
                {selectedNoteId === null ? "Notas de Imaginalia" : "Lectura Aplicada"}
              </span>
              <h2 className="flux-modal-title" style={{ fontSize: "22px", fontWeight: 900, textTransform: "uppercase" }}>
                {selectedNoteId === null ? "Notas y Dieta Mental" : selectedNote?.title}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
            aria-label="Cerrar"
          >
            <X size={24} style={{ color: "var(--swiss-fg)" }} />
          </button>
        </div>

        {/* Body */}
        <div className="flux-modal-body" style={{ padding: "32px", backgroundColor: "var(--swiss-muted)", maxHeight: "70vh", overflowY: "auto" }}>
          
          {selectedNoteId === null ? (
            /* List of notes */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--swiss-fg)", marginBottom: "8px" }}>
                Ideas breves sobre imaginación, estados, conversación interna, planes guiados y práctica diaria.
              </p>
              {notes.map(note => (
                <div 
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  style={{
                    backgroundColor: "var(--swiss-bg)",
                    border: "3px solid var(--swiss-border)",
                    borderRadius: "22px",
                    padding: "20px",
                    cursor: "pointer",
                    transition: "transform 0.15s ease, border-color 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--swiss-accent)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--swiss-border)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <h3 style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", marginBottom: "8px", color: "var(--swiss-fg)" }}>
                    {note.title}
                  </h3>
                  <p style={{ fontSize: "12.5px", lineHeight: "1.5", color: "var(--swiss-text-muted)", fontWeight: 500 }}>
                    {note.excerpt}
                  </p>
                  <span style={{ fontSize: "11px", fontWeight: 900, color: "var(--swiss-accent)", marginTop: "12px", display: "inline-block", textTransform: "uppercase" }}>
                    Leer nota →
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* Selected note content */
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div 
                style={{ 
                  fontSize: "14.5px", 
                  lineHeight: "1.7", 
                  color: "var(--swiss-fg)", 
                  fontWeight: 500, 
                  whiteSpace: "pre-line",
                  backgroundColor: "var(--swiss-bg)",
                  border: "3px solid var(--swiss-border)",
                  borderRadius: "22px",
                  padding: "24px"
                }}
              >
                {selectedNote?.content}
              </div>

              {/* CTAs banner */}
              <div 
                style={{ 
                  borderTop: "3px solid var(--swiss-border)", 
                  paddingTop: "24px",
                  marginTop: "8px"
                }}
              >
                <h4 style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", marginBottom: "16px", color: "var(--swiss-fg)", letterSpacing: "0.05em" }}>
                  Trabajar esta lectura en Imaginalia:
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                  {selectedNote?.ctas.map((cta, index) => (
                    <button
                      key={index}
                      onClick={() => handleCtaClick(cta.action)}
                      className="swiss-landing-cta"
                      style={{
                        padding: "12px 14px",
                        fontSize: "12px",
                        borderRadius: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        backgroundColor: index === 0 ? "var(--swiss-accent)" : "var(--swiss-fg)",
                        color: index === 0 ? "#FFFFFF" : "var(--swiss-bg)"
                      }}
                    >
                      {cta.icon}
                      {cta.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flux-modal-footer" style={{ borderTop: "4px solid var(--swiss-border)", padding: "16px 32px" }}>
          <button 
            onClick={onClose} 
            className="swiss-landing-secondary-btn" 
            style={{ padding: "10px 20px", fontSize: "12px", border: "2px solid var(--swiss-border)", borderRadius: "22px" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
