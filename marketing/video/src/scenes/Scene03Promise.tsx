import React from "react";
import { useCurrentFrame, interpolate, Easing, AbsoluteFill } from "remotion";
import { C, F, eyebrowStyle } from "../lib/brand";

export const Scene03Promise: React.FC = () => {
  const frame = useCurrentFrame();

  const clamp = { extrapolateRight: "clamp" as const, extrapolateLeft: "clamp" as const };
  const ease = Easing.bezier(0.16, 1, 0.3, 1);

  const eyebrowOp = interpolate(frame, [0, 20], [0, 1], { ...clamp, easing: ease });
  const line1Op = interpolate(frame, [15, 40], [0, 1], { ...clamp, easing: ease });
  const line1Y = interpolate(frame, [15, 40], [18, 0], { ...clamp, easing: ease });
  const line2Op = interpolate(frame, [40, 65], [0, 1], { ...clamp, easing: ease });
  const line2Y = interpolate(frame, [40, 65], [18, 0], { ...clamp, easing: ease });
  const captionOp = interpolate(frame, [130, 155], [0, 1], { ...clamp, easing: ease });

  const fadeOut = interpolate(frame, [240, 270], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: fadeOut, gap: 0 }}>
      <div style={{ opacity: eyebrowOp, ...eyebrowStyle, marginBottom: 32 }}>We Fix That</div>
      <div style={{ opacity: line1Op, transform: `translateY(${line1Y}px)`, fontFamily: F.serif, fontStyle: "italic", fontSize: 84, color: C.ink, lineHeight: 1.1 }}>
        We watch the tab
      </div>
      <div style={{ opacity: line2Op, transform: `translateY(${line2Y}px)`, fontFamily: F.serif, fontStyle: "italic", fontSize: 84, color: C.ink, lineHeight: 1.1, marginBottom: 56 }}>
        for you.
      </div>
      <div style={{ opacity: captionOp, fontFamily: F.mono, fontSize: 14, color: C.muted, letterSpacing: "0.12em" }}>
        Polite cadence · desktop + phone alerts · 100% local.
      </div>
    </AbsoluteFill>
  );
};
