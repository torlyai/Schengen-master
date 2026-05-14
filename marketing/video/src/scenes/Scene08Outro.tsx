import React from "react";
import { useCurrentFrame, interpolate, Easing, AbsoluteFill } from "remotion";
import { C, F, eyebrowStyle } from "../lib/brand";

const Bullet: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ fontFamily: F.mono, fontSize: 12, color: C.muted, letterSpacing: "0.14em", marginBottom: 6 }}>
    {text}
  </div>
);

export const Scene08Outro: React.FC = () => {
  const frame = useCurrentFrame();

  const clamp = { extrapolateRight: "clamp" as const, extrapolateLeft: "clamp" as const };
  const ease = Easing.bezier(0.16, 1, 0.3, 1);

  const eyebrowOp = interpolate(frame, [0, 20], [0, 1], { ...clamp, easing: ease });
  const cardsOp = interpolate(frame, [15, 45], [0, 1], { ...clamp, easing: ease });
  const cardsY = interpolate(frame, [15, 45], [24, 0], { ...clamp, easing: ease });
  const ctasOp = interpolate(frame, [150, 175], [0, 1], { ...clamp, easing: ease });
  const fadeOut = interpolate(frame, [270, 300], [1, 0], clamp);

  const cardBase: React.CSSProperties = {
    backgroundColor: C.paper,
    border: `1px solid ${C.hair}`,
    borderRadius: 16,
    padding: "40px 44px",
    width: 380,
    boxShadow: "0 8px 32px rgba(20,14,8,0.08)",
  };

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: fadeOut }}>
      <div style={{ opacity: eyebrowOp, ...eyebrowStyle, marginBottom: 48 }}>Free · or Premium Auto-Book</div>

      {/* Tier cards */}
      <div style={{ opacity: cardsOp, transform: `translateY(${cardsY}px)`, display: "flex", gap: 40, marginBottom: 64 }}>
        {/* Free card */}
        <div style={cardBase}>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 32, color: C.ink, marginBottom: 20 }}>£0 · forever</div>
          <Bullet text="WATCHES YOUR TAB" />
          <Bullet text="DESKTOP + PHONE ALERTS" />
          <Bullet text="100% LOCAL" />
        </div>

        {/* Premium card */}
        <div style={{ ...cardBase, borderColor: C.green, position: "relative" }}>
          {/* AVAILABLE pill */}
          <div style={{
            position: "absolute",
            top: 16,
            right: 16,
            backgroundColor: C.green,
            color: "#fff",
            fontFamily: F.mono,
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: 20,
          }}>
            Available
          </div>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 32, color: C.ink, marginBottom: 20 }}>£19 · only on booking</div>
          <Bullet text="AUTO-LOGIN" />
          <Bullet text="AUTO-BOOK" />
          <Bullet text="24H REFUND" />
        </div>
      </div>

      {/* CTAs */}
      <div style={{ opacity: ctasOp, display: "flex", gap: 20, alignItems: "center" }}>
        <div style={{
          backgroundColor: C.ink,
          color: C.paper,
          fontFamily: F.sans,
          fontSize: 15,
          fontWeight: 500,
          padding: "14px 28px",
          borderRadius: 8,
          letterSpacing: "0.02em",
        }}>
          Install on Chrome Web Store
        </div>
        <div style={{
          border: `1.5px solid ${C.ink}`,
          color: C.ink,
          fontFamily: F.mono,
          fontSize: 13,
          padding: "13px 24px",
          borderRadius: 8,
          letterSpacing: "0.06em",
        }}>
          github.com/torlyai/Schengen-master
        </div>
      </div>
    </AbsoluteFill>
  );
};
