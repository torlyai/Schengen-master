import React from "react";
import { useCurrentFrame, interpolate, Easing, Img, staticFile, AbsoluteFill } from "remotion";
import { C, F, eyebrowStyle } from "../lib/brand";

export const Scene07SlotFound: React.FC = () => {
  const frame = useCurrentFrame();

  const clamp = { extrapolateRight: "clamp" as const, extrapolateLeft: "clamp" as const };
  const ease = Easing.bezier(0.16, 1, 0.3, 1);

  // Red flash: first 6 frames
  const flashBg = frame < 6 ? C.red : C.paper;

  // Eyebrow: red for first 30 frames, then settles to ink
  const eyebrowColor = frame < 30 ? C.red : C.ink;
  const eyebrowOp = interpolate(frame, [0, 15], [0, 1], { ...clamp, easing: ease });

  // Popup punch: scale 0.94 → 1.02 → 1.0 over 25 frames
  const punchScale = interpolate(frame, [0, 15, 25], [0.94, 1.02, 1.0], {
    ...clamp,
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const imgOp = interpolate(frame, [0, 20], [0, 1], { ...clamp, easing: ease });

  const captionOp = interpolate(frame, [80, 105], [0, 1], { ...clamp, easing: ease });
  const fadeOut = interpolate(frame, [280, 300], [1, 0], clamp);

  // Popup ~60% of viewport height
  const popupH = 1080 * 0.6;
  const popupW = (popupH / 800) * 1280;

  return (
    <AbsoluteFill style={{ backgroundColor: flashBg, opacity: fadeOut, transition: "none" }}>
      <div style={{ position: "absolute", top: 72, left: 80, opacity: eyebrowOp, ...eyebrowStyle, color: eyebrowColor }}>
        Slot Found
      </div>

      {/* Popup centered */}
      <div style={{
        position: "absolute",
        top: (1080 - popupH) / 2,
        left: (1920 - popupW) / 2,
        opacity: imgOp,
        transform: `scale(${punchScale})`,
        transformOrigin: "center center",
      }}>
        <Img
          src={staticFile("screenshots/3-popup-slot-found.png")}
          style={{ width: popupW, height: popupH, borderRadius: 12, boxShadow: "0 24px 80px rgba(155,44,44,0.22)" }}
        />
      </div>

      {/* Caption below popup */}
      <div style={{
        position: "absolute",
        bottom: 90,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity: captionOp,
        fontFamily: F.serif,
        fontStyle: "italic",
        fontSize: 42,
        color: C.ink,
        padding: "0 120px",
        lineHeight: 1.3,
      }}>
        The second a slot opens — you're the first to know.
      </div>
    </AbsoluteFill>
  );
};
