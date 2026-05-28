import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "./lib/brand";

const CX = 48;
const CY = 48;
const R = 40;

function wedgePath(sweepDeg: number): string {
  const startAngleDeg = 330;
  const endAngleDeg = startAngleDeg + sweepDeg;
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = (endAngleDeg * Math.PI) / 180;
  const x1 = CX + R * Math.cos(startRad);
  const y1 = CY + R * Math.sin(startRad);
  const x2 = CX + R * Math.cos(endRad);
  const y2 = CY + R * Math.sin(endRad);
  return `M ${CX},${CY} L ${x1.toFixed(4)},${y1.toFixed(4)} A ${R},${R} 0 0,1 ${x2.toFixed(4)},${y2.toFixed(4)} Z`;
}

const ApertureMark: React.FC<{ size: number; ringPx?: number }> = ({ size, ringPx = 8 }) => (
  <svg width={size} height={size} viewBox="0 0 96 96">
    <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.ink} strokeWidth={ringPx} />
    <path d={wedgePath(30)} fill={C.green} />
    <circle cx={CX} cy={CY} r={5} fill={C.ink} />
  </svg>
);

const Chip: React.FC<{ price: string; label: string; accent?: boolean }> = ({ price, label, accent }) => (
  <div
    style={{
      backgroundColor: accent ? C.green : C.paper,
      border: accent ? `1.5px solid ${C.green}` : `1.5px solid ${C.ink}`,
      color: accent ? "#fff" : C.ink,
      padding: "18px 28px",
      borderRadius: 14,
      display: "flex",
      flexDirection: "column",
      gap: 4,
      minWidth: 180,
    }}
  >
    <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 44, lineHeight: 1 }}>{price}</div>
    <div
      style={{
        fontFamily: F.mono,
        fontSize: 11,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        opacity: accent ? 0.92 : 0.7,
      }}
    >
      {label}
    </div>
  </div>
);

export const Thumbnail: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      {/* Eyebrow row — top-left */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 80,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <ApertureMark size={44} ringPx={9} />
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 16,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.muted,
          }}
        >
          Visa Master · Chrome extension
        </div>
      </div>

      {/* Headline — left half */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 180,
          maxWidth: 720,
          fontFamily: F.serif,
          fontStyle: "italic",
          color: C.ink,
          lineHeight: 0.96,
        }}
      >
        <div style={{ fontSize: 128 }}>Stop</div>
        <div style={{ fontSize: 128 }}>refreshing</div>
        <div style={{ fontSize: 128, color: C.green }}>TLScontact.</div>
      </div>

      {/* Big ApertureMark — right half */}
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 120,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <ApertureMark size={420} ringPx={6} />
      </div>

      {/* Price chips — bottom-left under the headline */}
      <div
        style={{
          position: "absolute",
          left: 80,
          bottom: 80,
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        <Chip price="£0" label="Free · forever" />
        <Chip price="£19" label="Only on a booking" accent />
        <div
          style={{
            fontFamily: F.sans,
            fontSize: 14,
            color: C.muted,
            maxWidth: 180,
            lineHeight: 1.35,
          }}
        >
          No subscription.
          <br />
          No card on file.
        </div>
      </div>

      {/* Footer wordmark — bottom-right */}
      <div
        style={{
          position: "absolute",
          right: 80,
          bottom: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
        }}
      >
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 28, color: C.ink }}>
          torly.ai
        </div>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.muted,
          }}
        >
          github.com/torlyai/Schengen-master
        </div>
      </div>
    </AbsoluteFill>
  );
};
