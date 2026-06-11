import React from "react";

interface PortalCardProps {
  num: string;
  title: string;
  excerpt: string;
  desc: string;
  icon?: React.ReactNode;
  onEnter: () => void;
}

export default function PortalCard({ num, title, excerpt, desc, icon, onEnter }: PortalCardProps) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "220px",
        boxSizing: "border-box",
        position: "relative",
        cursor: "pointer",
        boxShadow: "var(--shadow-card)",
        transition: "box-shadow 0.15s, transform 0.15s"
      }}
      onClick={onEnter}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
          <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-muted)", fontFamily: "var(--font-base)" }}>
            {num}
          </span>
          {icon && <div style={{ color: "var(--color-accent)" }}>{icon}</div>}
        </div>

        <h3 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "8px", color: "var(--color-dark)", fontFamily: "var(--font-base)" }}>
          {title}
        </h3>

        <p style={{ fontSize: "13px", fontWeight: 500, lineHeight: "1.45", marginBottom: "4px", color: "var(--color-dark)", fontFamily: "var(--font-base)" }}>
          {excerpt}
        </p>

        <p style={{ fontSize: "12px", fontWeight: 400, lineHeight: "1.4", color: "var(--color-muted)", fontFamily: "var(--font-base)" }}>
          {desc}
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
        <button
          style={{
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: 600,
            borderRadius: "100px",
            background: "var(--color-accent)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-base)"
          }}
          onClick={(e) => { e.stopPropagation(); onEnter(); }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
