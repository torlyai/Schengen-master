// Small SVG icon set — line-weight matched, monochromatic.
// Ported verbatim from the design source (popup.jsx).
import React from 'react';

type IcoProps = React.SVGProps<SVGSVGElement>;

export const Gear: React.FC<IcoProps> = (p) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" {...p}>
    <circle cx="8" cy="8" r="2.2" />
    <path d="M8 1.5v1.7M8 12.8v1.7M14.5 8h-1.7M3.2 8H1.5M12.6 3.4l-1.2 1.2M4.6 11.4l-1.2 1.2M12.6 12.6l-1.2-1.2M4.6 4.6 3.4 3.4" />
  </svg>
);

export const More: React.FC<IcoProps> = (p) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" {...p}>
    <circle cx="3.5" cy="8" r="1.2" />
    <circle cx="8" cy="8" r="1.2" />
    <circle cx="12.5" cy="8" r="1.2" />
  </svg>
);

export const Pause: React.FC<IcoProps> = (p) => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" {...p}>
    <rect x="4" y="3" width="3" height="10" rx="0.6" />
    <rect x="9" y="3" width="3" height="10" rx="0.6" />
  </svg>
);

export const Play: React.FC<IcoProps> = (p) => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" {...p}>
    <path d="M4 3.2v9.6c0 .4.45.66.8.46l8-4.8a.53.53 0 0 0 0-.92l-8-4.8A.53.53 0 0 0 4 3.2Z" />
  </svg>
);

export const Refresh: React.FC<IcoProps> = (p) => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
    <path d="M13.7 2v3.2h-3.2" />
  </svg>
);

export const ArrowOut: React.FC<IcoProps> = (p) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 11 11 5" />
    <path d="M6.5 5H11v4.5" />
  </svg>
);

export const Target: React.FC<IcoProps> = (p) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" {...p}>
    <circle cx="8" cy="8" r="6" />
    <circle cx="8" cy="8" r="3" />
    <circle cx="8" cy="8" r="0.9" fill="currentColor" />
  </svg>
);

export const Bell: React.FC<IcoProps> = (p) => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" {...p}>
    <path d="M8 1.5a3.6 3.6 0 0 0-3.6 3.6V8L3 10.4v.7h10v-.7L11.6 8V5.1A3.6 3.6 0 0 0 8 1.5Z" />
    <path d="M6.6 12.4a1.5 1.5 0 0 0 2.8 0Z" />
  </svg>
);

export const Link: React.FC<IcoProps> = (p) => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
    <path d="M7 9 9 7" />
    <path d="m6.5 4.5 1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1" />
    <path d="m9.5 11.5-1 1a2.5 2.5 0 0 1-3.5-3.5l1-1" />
  </svg>
);

export const Poll: React.FC<IcoProps> = (p) => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" {...p}>
    <rect x="2" y="9" width="2.4" height="5" rx="0.4" />
    <rect x="6.8" y="6" width="2.4" height="8" rx="0.4" />
    <rect x="11.6" y="3" width="2.4" height="11" rx="0.4" />
  </svg>
);

// Aggregated namespace export so callers can write <Ico.gear/> style if they want.
export const Ico = {
  gear: Gear,
  more: More,
  pause: Pause,
  play: Play,
  refresh: Refresh,
  arrowOut: ArrowOut,
  target: Target,
  bell: Bell,
  link: Link,
  poll: Poll,
};
