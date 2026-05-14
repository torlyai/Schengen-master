import React from "react";
import { useCurrentFrame, interpolate, Easing, AbsoluteFill } from "remotion";
import { C, F, eyebrowStyle } from "../lib/brand";

export const Scene02Problem: React.FC = () => {
  const frame = useCurrentFrame();

  const clamp = { extrapolateRight: "clamp" as const, extrapolateLeft: "clamp" as const };
  const ease = Easing.bezier(0.16, 1, 0.3, 1);

  const eyebrowOp = interpolate(frame, [0, 25], [0, 1], { ...clamp, easing: ease });
  const line1Op = interpolate(frame, [25, 50], [0, 1], { ...clamp, easing: ease });
  const line1Y = interpolate(frame, [25, 50], [20, 0], { ...clamp, easing: ease });
  const line2Op = interpolate(frame, [50, 75], [0, 1], { ...clamp, easing: ease });
  const line2Y = interpolate(frame, [50, 75], [20, 0], { ...clamp, easing: ease });
  const captionOp = interpolate(frame, [150, 175], [0, 1], { ...clamp, easing: ease });

  const fadeOut = interpolate(frame, [250, 270], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: fadeOut, gap: 0 }}>
      <div style={{ opacity: eyebrowOp, ...eyebrowStyle, marginBottom: 32 }}>The Problem</div>
      <div style={{ opacity: line1Op, transform: `translateY(${line1Y}px)`, fontFamily: F.serif, fontStyle: "italic", fontSize: 72, color: C.ink, lineHeight: 1.15 }}>
        TLScontact slots
      </div>
      <div style={{ opacity: line2Op, transform: `translateY(${line2Y}px)`, fontFamily: F.serif, fontStyle: "italic", fontSize: 72, color: C.ink, lineHeight: 1.15, marginBottom: 48 }}>
        disappear in seconds.
      </div>
      <div style={{ opacity: captionOp, fontFamily: F.mono, fontSize: 15, color: C.muted, letterSpacing: "0.08em" }}>
        Manual refresh is a lottery.
      </div>
    </AbsoluteFill>
  );
};
