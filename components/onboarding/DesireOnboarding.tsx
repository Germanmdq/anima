import React, { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Smile, ShieldAlert } from "lucide-react";

interface DesireOnboardingProps {
  desireInput: string;
  setDesireInput: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedEmotion: string;
  setSelectedEmotion: (val: string) => void;
  selectedBlock: string;
  setSelectedBlock: (val: string) => void;
  onComplete: () => void;
}

const CATEGORIES_DATA = [
  { title: "Dinero", desc: "Seguridad, provisión y libertad interior." },
  { title: "Amor / relaciones", desc: "Vínculos, perdón, nueva historia y estado cumplido." },
  { title: "Salud / cuerpo", desc: "Vivir desde el estado de bienestar, no desde el miedo al síntoma." },
  { title: "Propósito", desc: "Trabajo, vocación, obra y dirección." },
  { title: "Paz mental", desc: "Ansiedad, diálogo interno y descanso." },
  { title: "Identidad / Yo Soy", desc: "Autoconcepto, merecimiento y nuevo estado." }
];

const EMOTIONS = [
  "Urgencia",
  "Duda",
  "Miedo",
  "Cansancio",
  "Confianza inestable"
];

const BLOCKAGES = [
  "Mirar demasiado la realidad actual",
  "Esperar señales",
  "Sentir que tarda",
  "No sentirme merecedor",
  "No sostener disciplina mental",
  "Volver a contar la vieja historia",
  "Creer que la causa está afuera",
  "Forzar técnicas sin sentir naturalidad",
  "Diálogo interno contradictorio",
  "Miedo a que no funcione"
];

const EXAMPLES = [
  "quiero dinero",
  "quiero amor",
  "quiero sentirme bien en mi cuerpo",
  "quiero paz",
  "quiero encontrar mi propósito",
  "quiero sentirme suficiente"
];

export default function DesireOnboarding({
  desireInput,
  setDesireInput,
  selectedCategory,
  setSelectedCategory,
  selectedEmotion,
  setSelectedEmotion,
  selectedBlock,
  setSelectedBlock,
  onComplete
}: DesireOnboardingProps) {
  const [step, setStep] = useState(1);

  // Auto-detect category based on user typing
  useEffect(() => {
    if (step !== 1) return;
    const text = desireInput.toLowerCase();
    
    if (/dinero|plata|dolar|dólar|riqueza|pesos|millon|millón|financiero|deuda|pagar/i.test(text)) {
      setSelectedCategory("Dinero");
    } else if (/amor|pareja|novio|novia|relacion|relación|casamiento|reconciliar|atraer/i.test(text)) {
      setSelectedCategory("Amor / relaciones");
    } else if (/salud|enfermo|cuerpo|dolor|sano|curar|migraña|bienestar|energia|energía|síntoma/i.test(text)) {
      setSelectedCategory("Salud / cuerpo");
    } else if (/trabajo|empleo|profesion|profesión|negocio|exito|éxito|vocacion|vocación|carrera|ascenso|propósito/i.test(text)) {
      setSelectedCategory("Propósito");
    } else if (/paz|ansiedad|miedo|tranquilidad|calma|mente|estres|estrés|angustia/i.test(text)) {
      setSelectedCategory("Paz mental");
    } else if (/yo soy|identidad|ser|seguridad|confianza|autoestima|autoconcepto|merecimiento/i.test(text)) {
      setSelectedCategory("Identidad / Yo Soy");
    }
  }, [desireInput, step, setSelectedCategory]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!desireInput.trim()) {
        alert("Por favor, escribí qué querés trabajar para continuar.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedEmotion) {
        alert("Por favor, seleccioná una emoción.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedBlock) {
        alert("Por favor, seleccioná qué te cuesta más sostener.");
        return;
      }
      onComplete();
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Indicador de pasos */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: "4px",
              backgroundColor: s <= step ? "var(--swiss-accent)" : "rgba(0, 0, 0, 0.1)",
              transition: "background-color 0.2s"
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label 
            htmlFor="desire-textarea"
            style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}
          >
            ¿Qué querés trabajar con Imaginalia?
          </label>
          <textarea
            id="desire-textarea"
            className="swiss-landing-textarea"
            placeholder="Ejemplo: quiero dinero"
            value={desireInput}
            onChange={(e) => setDesireInput(e.target.value)}
            style={{ margin: 0, height: "100px", borderRadius: "22px" }}
          />

          {/* Ejemplos rápidos en texto plano */}
          <div style={{ fontSize: "11px", color: "var(--swiss-text-muted)", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
            <span style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "10px" }}>Ejemplos:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setDesireInput(ex)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--swiss-accent)",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "11px",
                  fontWeight: 500,
                  textDecoration: "underline"
                }}
              >
                {ex}
              </button>
            ))}
          </div>

          <div style={{ marginTop: "12px" }}>
            <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", display: "block", marginBottom: "12px", color: "var(--swiss-text-muted)" }}>
              También podés elegir una puerta de entrada:
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {CATEGORIES_DATA.map((cat) => {
                const isSelected = selectedCategory === cat.title;
                return (
                  <button
                    key={cat.title}
                    type="button"
                    onClick={() => setSelectedCategory(cat.title)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      padding: "12px 16px",
                      borderRadius: "22px",
                      border: isSelected ? "3px solid var(--swiss-accent)" : "2px solid var(--swiss-border)",
                      backgroundColor: isSelected ? "var(--swiss-muted)" : "var(--swiss-bg)",
                      color: "var(--swiss-fg)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s ease-out"
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase" }}>{cat.title}</span>
                    <span style={{ fontSize: "9.5px", color: "var(--swiss-text-muted)", fontWeight: "500", lineHeight: "1.3" }}>{cat.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
            ¿Qué sentís cuando pensás en eso?
          </h2>
          <p style={{ fontSize: "12px", color: "var(--swiss-text-muted)", fontWeight: 500 }}>
            Identificar el estado emocional actual nos ayuda a saber dónde se origina tu asunción.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {EMOTIONS.map((emo) => {
              const isSelected = selectedEmotion === emo;
              return (
                <button
                  key={emo}
                  type="button"
                  onClick={() => setSelectedEmotion(emo)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px",
                    borderRadius: "22px",
                    border: isSelected ? "3px solid var(--swiss-accent)" : "2px solid var(--swiss-border)",
                    backgroundColor: isSelected ? "var(--swiss-muted)" : "var(--swiss-bg)",
                    color: "var(--swiss-fg)",
                    fontSize: "13px",
                    fontWeight: 700,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.1s ease-out"
                  }}
                >
                  <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <Smile size={16} style={{ color: isSelected ? "var(--swiss-accent)" : "var(--swiss-fg)" }} />
                    {emo}
                  </span>
                  {isSelected && <span style={{ color: "var(--swiss-accent)", fontWeight: 900 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
            ¿Qué te cuesta más sostener?
          </h2>
          <p style={{ fontSize: "12px", color: "var(--swiss-text-muted)", fontWeight: 500 }}>
            Este es el principal obstáculo mental en tu dieta mental de Neville Goddard.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
            {BLOCKAGES.map((block) => {
              const isSelected = selectedBlock === block;
              return (
                <button
                  key={block}
                  type="button"
                  onClick={() => setSelectedBlock(block)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    borderRadius: "22px",
                    border: isSelected ? "3px solid var(--swiss-accent)" : "2px solid var(--swiss-border)",
                    backgroundColor: isSelected ? "var(--swiss-muted)" : "var(--swiss-bg)",
                    color: "var(--swiss-fg)",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.1s ease-out"
                  }}
                >
                  <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <ShieldAlert size={16} style={{ color: isSelected ? "var(--swiss-accent)" : "var(--swiss-fg)" }} />
                    {block}
                  </span>
                  {isSelected && <span style={{ color: "var(--swiss-accent)", fontWeight: 900 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="swiss-landing-secondary-btn"
            style={{ flex: 1, padding: "12px", fontSize: "11px", borderRadius: "22px" }}
          >
            Atrás
          </button>
        )}
        <button
          type="button"
          onClick={handleNextStep}
          className="swiss-landing-enter-btn"
          style={{ flex: 2, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "22px" }}
        >
          {step === 3 ? "Ver mi lectura de estado" : "Siguiente"}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
