import React from "react";
import { BRAND_DESCRIPTION, BRAND_NAME_UPPER, BRAND_TAGLINE } from "@/lib/brand";

interface ImaginaliaHeroProps {
  onStartReading: () => void;
  onScrollToWhatIncludes: () => void;
}

export default function ImaginaliaHero({
  onStartReading,
  onScrollToWhatIncludes
}: ImaginaliaHeroProps) {
  return (
    <div className="swiss-landing-hero">
      {/* Left Column: Title and Content */}
      <div className="swiss-landing-hero-left" style={{ justifyContent: "flex-start", paddingTop: "80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", color: "var(--swiss-accent)", letterSpacing: "0.1em" }}>
              {BRAND_TAGLINE}
            </span>
            <h1 className="swiss-landing-title" style={{ marginTop: "8px", fontSize: "64px" }}>
              {BRAND_NAME_UPPER}
            </h1>
          </div>
          
          <div className="swiss-landing-divider-bar" style={{ margin: 0 }} />
          
          <p className="swiss-landing-description" style={{ fontSize: "20px", fontWeight: 900, lineHeight: "1.3", margin: 0, color: "var(--swiss-fg)" }}>
            Entrá, escribí tu deseo y recibí una primera lectura para volver al estado elegido.
          </p>
          
          <p style={{ fontSize: "14px", color: "var(--swiss-fg)", fontWeight: 500, lineHeight: "1.6", margin: 0 }}>
            {BRAND_DESCRIPTION}
          </p>

          <div className="swiss-landing-btn-group" style={{ marginTop: "12px" }}>
            <button 
              onClick={onStartReading}
              className="swiss-landing-enter-btn"
              style={{ borderRadius: "22px" }}
            >
              Empezar mi primera lectura
            </button>
            <button 
              onClick={onScrollToWhatIncludes}
              className="swiss-landing-secondary-btn"
              style={{ borderRadius: "22px" }}
            >
              Ver qué incluye Odiseo
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Video Hero */}
      <div className="swiss-landing-hero-right swiss-grid-pattern" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="imaginalia-hero-video-container" style={{ borderRadius: "22px" }}>
          <video
            src="/videos/imaginalia-hero.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="imaginalia-hero-video"
          />
        </div>
      </div>
    </div>
  );
}
