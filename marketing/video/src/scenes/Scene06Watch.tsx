import React from "react";
import { useCurrentFrame, interpolate, Easing, Img, staticFile, AbsoluteFill } from "remotion";
import { C, F, eyebrowStyle } from "../lib/brand";

export const Scene06Watch: React.FC = () => {
  const frame = useCurrentFrame();

  const clamp = { extrapolateRight: "clamp" as const, extrapolateLeft: "clamp" as const };
  const ease = Easing.bezier(0.16, 1, 0.3, 1);

  const eyebrowOp = interpolate(frame, [0, 20], [0, 1], { ...clamp, easing: ease });
  const imgOp = interpolate(frame, [10, 35], [0, 1], { ...clamp, easing: ease });

  // Pulse: scale oscillates 1.00 ↔ 1.02 every 60 frames
  const pulsePhase = (frame % 60) / 60;
  const pulse = 1 + 0.02 * Math.sin(pulsePhase * Math.PI * 2);

  const captionOp = interpolate(frame, [60, 85], [0, 1], { ...clamp, easing: ease });
  const captionFadeOut = interpolate(frame, [270, 300], [1, 0], clamp);
  const fadeOut = interpolate(frame, [285, 300], [1, 0], clamp);

  // Popup sized so it's ~50% of 1080 viewport height
  const popupH = 1080 * 0.5;
  const popupW = (popupH / 800) * 1280;

  const captions = ["POLLS EVERY 2–15 MIN", "NO SERVERS", "NO TELEMETRY"];

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, opacity: fadeOut }}>
      <div style={{ position: "absolute", top: 72, left: 80, opacity: eyebrowOp, ...eyebrowStyle }}>
        Watching
      </div>

      {/* Popup image — centered slightly left to make room for caption */}
      <div style={{
        position: "absolute",
        top: (1080 - popupH) / 2,
        left: (1920 - popupW) / 2 - 180,
        opacity: imgOp,
        transform: `scale(${pulse})`,
        transformOrigin: "center center",
      }}>
        <Img
          src={staticFile("screenshots/2-popup-monitoring.png")}
          style={{ width: popupW, height: popupH, borderRadius: 12, boxShadow: "0 24px 64px rgba(20,14,8,0.16)" }}
        />
      </div>

      {/* Right-side caption block */}
      <div style={{
        position: "absolute",
        right: 100,
        top: "50%",
        transform: "translateY(-50%)",
        opacity: Math.min(captionOp, captionFadeOut),
        display: "flex",
        flexDirection: "column",
        gap: 20,
        alignItems: "flex-end",
      }}>
        {captions.map((line, i) => (
          <div key={i} style={{
            fontFamily: F.mono,
            fontSize: 16,
            color: C.ink,
            letterSpacing: "0.18em",
            opacity: interpolate(frame, [60 + i * 15, 85 + i * 15], [0, 1], { ...clamp, easing: ease }),
          }}>
            {line}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
