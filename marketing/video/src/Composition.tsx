import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-serif/400.css";
import "@fontsource/ibm-plex-serif/400-italic.css";
import "@fontsource/ibm-plex-mono/400.css";

import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Scene01ColdOpen } from "./scenes/Scene01ColdOpen";
import { Scene02Problem } from "./scenes/Scene02Problem";
import { Scene03Promise } from "./scenes/Scene03Promise";
import { Scene04Welcome } from "./scenes/Scene04Welcome";
import { Scene05Configure } from "./scenes/Scene05Configure";
import { Scene06Watch } from "./scenes/Scene06Watch";
import { Scene07SlotFound } from "./scenes/Scene07SlotFound";
import { Scene08Outro } from "./scenes/Scene08Outro";

// Scene start frames (cumulative)
// S1: 0–180 (180)   S2: 180–450 (270)   S3: 450–720 (270)
// S4: 720–1020 (300) S5: 1020–1350 (330) S6: 1350–1650 (300)
// S7: 1650–1950 (300) S8: 1950–2250 (300)
const S = [0, 180, 450, 720, 1020, 1350, 1650, 1950] as const;
const D = [180, 270, 270, 300, 330, 300, 300, 300] as const;

export const VisaMasterPromo: React.FC = () => {
  const fps = 30;
  return (
    <AbsoluteFill>
      <Sequence from={S[0]} durationInFrames={D[0]} premountFor={fps}><Scene01ColdOpen /></Sequence>
      <Sequence from={S[1]} durationInFrames={D[1]} premountFor={fps}><Scene02Problem /></Sequence>
      <Sequence from={S[2]} durationInFrames={D[2]} premountFor={fps}><Scene03Promise /></Sequence>
      <Sequence from={S[3]} durationInFrames={D[3]} premountFor={fps}><Scene04Welcome /></Sequence>
      <Sequence from={S[4]} durationInFrames={D[4]} premountFor={fps}><Scene05Configure /></Sequence>
      <Sequence from={S[5]} durationInFrames={D[5]} premountFor={fps}><Scene06Watch /></Sequence>
      <Sequence from={S[6]} durationInFrames={D[6]} premountFor={fps}><Scene07SlotFound /></Sequence>
      <Sequence from={S[7]} durationInFrames={D[7]} premountFor={fps}><Scene08Outro /></Sequence>
    </AbsoluteFill>
  );
};
