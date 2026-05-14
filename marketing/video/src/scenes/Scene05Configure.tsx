import React from "react";
import { useCurrentFrame, interpolate, Easing, Img, staticFile, AbsoluteFill } from "remotion";
import { C, F, eyebrowStyle } from "../lib/brand";

const Callout: React.FC<{ label: string; top: number; left: number; opacity: number }> = ({ label, top, left, opacity }) => (
  <div style={{
    position: "absolute",
    top,
    left,
    opacity,
    backgroundColor: C.paper,
    border: `1px solid ${C.hair}`,
    borderRadius: 8,
    padding: "8px 16px",
    fontFamily: F.mono,
    fontSize: 13,
    color: C.ink,
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 16px rgba(20,14,8,0.10)",
    zIndex: 10,
  }}>
    {label}
  </div>
);

export const Scene05Configure: React.FC = () => {
  const frame = useCurrentFrame();

  const clamp = { extrapolateRight: "clamp" as const, extrapolateLeft: "clamp" as const };
  const ease = Easing.bezier(0.16, 1, 0.3, 1);

  const eyebrowOp = interpolate(frame, [0, 20], [0, 1], { ...clamp, easing: ease });
  const imgOp = interpolate(frame, [10, 35], [0, 1], { ...clamp, easing: ease });
  const callout1Op = interpolate(frame, [80, 105], [0, 1], { ...clamp, easing: ease });
  const callout2Op = interpolate(frame, [160, 185], [0, 1], { ...clamp, easing: ease });
  const fadeOut = interpolate(frame, [300, 330], [1, 0], clamp);

  // Display at 60px margin on each side
  const displayW = 1920 - 120;
  const displayH = (displayW / 1280) * 800;

  // Callout positions — approximate visual anchors for Target row and Cadence row
  // Settings screenshot shows TOC on right, settings form on left ~
  // Target row is roughly 35% down, Cadence row ~47% down
  const imgTop = (1080 - displayH) / 2;
  const callout1Top = imgTop + displayH * 0.35 - 20;
  const callout2Top = imgTop + displayH * 0.47 - 20;

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, overflow: "hidden", opacity: fadeOut }}>
      <div style={{ position: "absolute", top: 40, left: 80, opacity: eyebrowOp, ...eyebrowStyle }}>
        Configure
      </div>

      <div style={{ position: "absolute", top: (1080 - displayH) / 2, left: 60, opacity: imgOp }}>
        <Img
          src={staticFile("screenshots/4-settings.png")}
          style={{
            width: displayW,
            height: displayH,
            borderRadius: 12,
            boxShadow: "0 20px 60px rgba(20,14,8,0.14)",
          }}
        />
      </div>

      {/* Callout 1 — Target */}
      <Callout label="Pick your visa centre" top={callout1Top} left={displayW * 0.38 + 60} opacity={callout1Op} />
      {/* Thin line from callout to settings area */}
      <div style={{
        position: "absolute",
        top: callout1Top + 16,
        left: displayW * 0.34 + 60,
        width: displayW * 0.04,
        height: 1,
        backgroundColor: C.hair,
        opacity: callout1Op,
      }} />

      {/* Callout 2 — Cadence */}
      <Callout label="Choose your cadence" top={callout2Top} left={displayW * 0.38 + 60} opacity={callout2Op} />
      <div style={{
        position: "absolute",
        top: callout2Top + 16,
        left: displayW * 0.34 + 60,
        width: displayW * 0.04,
        height: 1,
        backgroundColor: C.hair,
        opacity: callout2Op,
      }} />
    </AbsoluteFill>
  );
};
