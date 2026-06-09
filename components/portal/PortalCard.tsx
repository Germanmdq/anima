import React from "react";

interface PortalCardProps {
  num: string;
  title: string;
  excerpt: string;
  desc: string;
  icon?: React.ReactNode;
  onEnter: () => void;
}

export default function PortalCard({
  num,
  title,
  excerpt,
  desc,
  icon,
  onEnter
}: PortalCardProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--swiss-bg)",
        border: "2px solid #000",
        borderRadius: "22px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "240px",
        boxSizing: "border-box",
        position: "relative",
        cursor: "pointer",
        transition: "transform 0.15s ease-out, border-color 0.15s ease-out"
      }}
      onClick={onEnter}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--swiss-accent)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--swiss-border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top Section */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: 900, color: "var(--swiss-text-muted)" }}>
            {num}
          </span>
          {icon && <div style={{ color: "var(--swiss-accent)" }}>{icon}</div>}
        </div>
        
        <h3 style={{ fontSize: "20px", fontWeight: 900, textTransform: "uppercase", marginBottom: "8px", color: "var(--swiss-fg)", letterSpacing: "-0.01em" }}>
          {title}
        </h3>
        
        <p style={{ fontSize: "13px", fontWeight: 700, lineHeight: "1.4", marginBottom: "6px", color: "var(--swiss-fg)" }}>
          {excerpt}
        </p>
        
        <p style={{ fontSize: "11.5px", fontWeight: 500, lineHeight: "1.4", color: "var(--swiss-text-muted)" }}>
          {desc}
        </p>
      </div>

      {/* Button Section */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
        <button
          className="swiss-landing-cta"
          style={{
            padding: "8px 20px",
            fontSize: "11px",
            borderRadius: "22px",
            textTransform: "uppercase",
            fontWeight: 900
          }}
          onClick={(e) => {
            e.stopPropagation();
            onEnter();
          }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
