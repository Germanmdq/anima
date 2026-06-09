import React from "react";
import { X, Check } from "lucide-react";
import { BRAND_INTERNAL_SPACE, BRAND_NAME } from "@/lib/brand";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  if (!isOpen) return null;

  const handleSelectPlan = (planName: string) => {
    alert(`Has seleccionado la opción ${planName}. El acceso se configurará próximamente.`);
  };

  return (
    <div className="flux-modal-overlay" style={{ zIndex: 1000 }}>
      <div 
        className="flux-modal-content" 
        style={{ 
          maxWidth: "900px", 
          border: "4px solid var(--swiss-border)", 
          borderRadius: "22px",
          overflow: "hidden"
        }}
      >
        <div className="flux-modal-header" style={{ borderBottom: "4px solid var(--swiss-border)", padding: "24px 32px" }}>
          <div>
            <span className="flux-chat-header__eyebrow" style={{ color: "var(--swiss-accent)" }}>Acceso Completo</span>
            <h2 className="flux-modal-title" style={{ fontSize: "26px", fontWeight: 900, textTransform: "uppercase" }}>Elegí cómo querés empezar</h2>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
            aria-label="Cerrar"
          >
            <X size={24} style={{ color: "var(--swiss-fg)" }} />
          </button>
        </div>

        <div className="flux-modal-body" style={{ padding: "32px", backgroundColor: "var(--swiss-muted)" }}>
          <p style={{ fontSize: "14px", marginBottom: "28px", fontWeight: 600, color: "var(--swiss-fg)" }}>
            Sostené tus asunciones con el acompañamiento de {BRAND_NAME}. Elegí el camino que mejor se adapte a tu práctica actual:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
            
            {/* Práctica inicial */}
            <div style={{
              background: "var(--swiss-bg)",
              border: "4px solid var(--swiss-border)",
              borderRadius: "22px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative"
            }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 900, textTransform: "uppercase", marginBottom: "16px" }}>Práctica inicial</h3>
                <p style={{ fontSize: "13px", lineHeight: "1.5", color: "var(--swiss-fg)", marginBottom: "20px", fontWeight: 600 }}>
                  Para probar {BRAND_NAME} con una primera práctica completa.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    "Primera lectura de estado",
                    "Una escena imaginaria",
                    "Una práctica de 24 horas",
                    "Mensajes iniciales por Telegram si está disponible"
                  ].map((feat, i) => (
                    <li key={i} style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: 500 }}>
                      <Check size={14} style={{ color: "var(--swiss-accent)", flexShrink: 0 }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => handleSelectPlan("Práctica inicial")}
                className="swiss-landing-cta" 
                style={{ width: "100%", textAlign: "center", borderRadius: "22px" }}
              >
                Empezar práctica inicial
              </button>
            </div>

            {/* Camino completo */}
            <div style={{
              background: "var(--swiss-bg)",
              border: "4px solid var(--swiss-accent)",
              borderRadius: "22px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative"
            }}>
              <span style={{
                position: "absolute",
                top: "-14px",
                right: "16px",
                background: "var(--swiss-accent)",
                color: "#FFFFFF",
                fontSize: "10px",
                fontWeight: 900,
                padding: "4px 12px",
                textTransform: "uppercase",
                borderRadius: "22px",
                border: "2px solid var(--swiss-accent)"
              }}>
                Recomendado
              </span>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 900, textTransform: "uppercase", marginBottom: "16px" }}>Camino completo</h3>
                <p style={{ fontSize: "13px", lineHeight: "1.5", color: "var(--swiss-fg)", marginBottom: "20px", fontWeight: 600 }}>
                  Para practicar, estudiar y volver al estado elegido con continuidad.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    "Acompañamiento diario",
                    "Biblioteca viva de Neville",
                    "Lecturas de estado",
                    "Planes de 7, 15 y 30 días",
                    "Preguntas para integrar",
                    "Libro personal",
                    "Mensajes personalizados por Telegram",
                    BRAND_INTERNAL_SPACE
                  ].map((feat, i) => (
                    <li key={i} style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: 500 }}>
                      <Check size={14} style={{ color: "var(--swiss-accent)", flexShrink: 0 }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => handleSelectPlan("Camino completo")}
                className="swiss-landing-cta" 
                style={{ width: "100%", textAlign: "center", backgroundColor: "var(--swiss-accent)", borderRadius: "22px" }}
              >
                Entrar al camino completo
              </button>
            </div>

            {/* Fundador */}
            <div style={{
              background: "var(--swiss-bg)",
              border: "4px solid var(--swiss-border)",
              borderRadius: "22px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative"
            }}>
              <span style={{
                position: "absolute",
                top: "-14px",
                right: "16px",
                background: "var(--swiss-fg)",
                color: "var(--swiss-bg)",
                fontSize: "10px",
                fontWeight: 900,
                padding: "4px 12px",
                textTransform: "uppercase",
                borderRadius: "22px",
                border: "2px solid var(--swiss-border)"
              }}>
                Acceso fundador
              </span>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 900, textTransform: "uppercase", marginBottom: "16px" }}>Fundador</h3>
                <p style={{ fontSize: "13px", lineHeight: "1.5", color: "var(--swiss-fg)", marginBottom: "20px", fontWeight: 600 }}>
                  Para quienes quieren apoyar el nacimiento de {BRAND_NAME} y acceder a sus mejoras principales.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    "Acceso extendido",
                    "Límite superior de uso",
                    "Mensajes personalizados por Telegram",
                    "Mejoras futuras principales",
                    "Beneficios fundadores",
                    "Prioridad en nuevas funciones"
                  ].map((feat, i) => (
                    <li key={i} style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: 500 }}>
                      <Check size={14} style={{ color: "var(--swiss-accent)", flexShrink: 0 }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => handleSelectPlan("Fundador")}
                className="swiss-landing-cta" 
                style={{ width: "100%", textAlign: "center", borderRadius: "22px" }}
              >
                Quiero ser fundador
              </button>
            </div>

          </div>
        </div>

        <div className="flux-modal-footer" style={{ borderTop: "4px solid var(--swiss-border)", padding: "20px 32px" }}>
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
