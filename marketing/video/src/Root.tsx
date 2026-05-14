import React from "react";
import { Composition } from "remotion";
import { VisaMasterPromo } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="visa-master-promo"
      component={VisaMasterPromo}
      durationInFrames={2250}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
