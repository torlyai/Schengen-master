import React from "react";
import { useCurrentFrame, interpolate, Easing, Img, staticFile, AbsoluteFill } from "remotion";
import { C, F, eyebrowStyle } from "../lib/brand";

export const Scene01ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();

  const markOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const markScale = interpolate(frame, [20, 40], [0.92, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const titleOpacity = interpolate(frame, [30, 55], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const eyebrowOpacity = interpolate(frame, [50, 75], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const fadeOut = interpolate(frame, [160, 180], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: fadeOut }}>
      <div style={{ opacity: markOpacity, transform: `scale(${markScale})`, marginBottom: 32 }}>
        <Img src={staticFile("mark.svg")} style={{ width: 96, height: 96 }} />
      </div>
      <div style={{ opacity: titleOpacity, fontFamily: F.serif, fontStyle: "italic", fontSize: 64, color: C.ink, marginBottom: 20, letterSpacing: "-0.01em" }}>
        Visa Master
      </div>
      <div style={{ opacity: eyebrowOpacity, ...eyebrowStyle }}>
        Schengen Visa Slot Watcher · TLScontact
      </div>
    </AbsoluteFill>
  );
};
