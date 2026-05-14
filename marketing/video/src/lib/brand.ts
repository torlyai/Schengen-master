export const C = {
  paper: "#f6f3ee",
  ink: "#15140f",
  subtle: "#3a3631",
  muted: "#6e6962",
  hair: "#d8d1c2",
  green: "#0f5132",
  red: "#9b2c2c",
} as const;

export const F = {
  sans: "'IBM Plex Sans', sans-serif",
  serif: "'IBM Plex Serif', serif",
  mono: "'IBM Plex Mono', monospace",
} as const;

export const eyebrowStyle: React.CSSProperties = {
  fontFamily: F.mono,
  fontSize: 13,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: C.muted,
};
