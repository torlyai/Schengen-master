import React from "react";
import { useCurrentFrame, interpolate, Easing, Img, staticFile, AbsoluteFill } from "remotion";
import { C, F, eyebrowStyle } from "../lib/brand";

export const Scene04Welcome: React.FC = () => {
  const frame = useCurrentFrame();

  const clamp = { extrapolateRight: "clamp" as const, extrapolateLeft: "clamp" as const };
  const ease = Easing.bezier(0.16, 1, 0.3, 1);

  const eyebrowOp = interpolate(frame, [0, 20], [0, 1], { ...clamp, easing: ease });
  const imgOp = interpolate(frame, [10, 35], [0, 1], { ...clamp, easing: ease });
  const imgY = interpolate(frame, [10, 35], [24, 0], { ...clamp, easing: ease });

  // Ken Burns: scale 1.0 → 1.08, subtle pan right (translateX 0 → 24px)
  const kbScale = interpolate(frame, [0, 300], [1.0, 1.08], clamp);
  const kbX = interpolate(frame, [0, 300], [0, 24], clamp);

  const captionOp = interpolate(frame, [120, 145], [0, 1], { ...clamp, easing: ease });
  const captionFadeOut = interpolate(frame, [270, 300], [1, 0], clamp);
  const fadeOut = interpolate(frame, [280, 300], [1, 0], clamp);

  // Screenshot is 1280×800 — display at native size with paper margins
  const imgW = 1280 * 0.7;
  const imgH = 800 * 0.7;

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, overflow: "hidden", opacity: fadeOut }}>
      {/* Eyebrow top-left */}
      <div style={{ position: "absolute", top: 72, left: 80, opacity: eyebrowOp, ...eyebrowStyle }}>
        First Run
      </div>

      {/* Screenshot centered with Ken Burns */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: imgOp, transform: `translateY(${imgY}px)` }}>
        <div style={{ transform: `scale(${kbScale}) translateX(${kbX}px)`, transformOrigin: "center center" }}>
          <Img
            src={staticFile("screenshots/1-welcome-tiers.png")}
            style={{
              width: imgW,
              height: imgH,
              borderRadius: 12,
              boxShadow: "0 30px 80px rgba(20,14,8,0.18)",
            }}
          />
        </div>
      </div>

      {/* Bottom-right caption */}
      <div style={{
        position: "absolute",
        bottom: 72,
        right: 80,
        opacity: Math.min(captionOp, captionFadeOut),
        fontFamily: F.mono,
        fontSize: 13,
        color: C.muted,
        letterSpacing: "0.1em",
        textAlign: "right",
      }}>
        Free forever · or auto-book on Premium
      </div>
    </AbsoluteFill>
  );
};
