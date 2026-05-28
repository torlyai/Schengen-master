import React from "react";
import { useCurrentFrame, interpolate, Easing, Img, staticFile, AbsoluteFill } from "remotion";
import { C, F, eyebrowStyle } from "../lib/brand";

// Scene09Landing — 5 seconds / 150 frames
// Shows the Premium landing-page screenshot (1280×800) with Ken Burns + fade in/out
// No narration — this scene is a visual sell closing the promo.

export const Scene09Landing: React.FC = () => {
  const frame = useCurrentFrame();

  const clamp = { extrapolateRight: "clamp" as const, extrapolateLeft: "clamp" as const };

  // Fade in over first 15 frames, fade out over last 15 frames (135–150)
  const fadeIn = interpolate(frame, [0, 15], [0, 1], clamp);
  const fadeOut = interpolate(frame, [135, 150], [1, 0], clamp);
  const opacity = Math.min(fadeIn, fadeOut);

  // Ken Burns: subtle scale 1.00 → 1.04 over the full 150-frame scene
  const kbScale = interpolate(frame, [0, 150], [1.0, 1.04], {
    ...clamp,
    easing: Easing.linear,
  });

  // Eyebrow: fades in around frame 45, fades out with scene (frame 135)
  const eyebrowOpacity = interpolate(frame, [45, 60], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  }) * interpolate(frame, [130, 150], [1, 0], clamp);

  // The source is 1280×800 (16:10), canvas is 1920×1080 (16:9).
  // objectFit: 'contain' centres it with paper letterboxing on top/bottom.

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.paper,
        opacity,
        overflow: "hidden",
      }}
    >
      {/* Screenshot with Ken Burns */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${kbScale})`,
          transformOrigin: "center center",
        }}
      >
        <Img
          src={staticFile("landing-premium.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Eyebrow — lower-left corner */}
      <div
        style={{
          position: "absolute",
          bottom: 72,
          left: 80,
          opacity: eyebrowOpacity,
          ...eyebrowStyle,
        }}
      >
        START SETUP — £0 TODAY
      </div>
    </AbsoluteFill>
  );
};
