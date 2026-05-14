// Visa Master brand glyph — the aperture mark that matches the new
// icon-{16,32,48,128}.png set in extension/public/icons/. Used wherever
// the in-extension UI shows brand chrome (welcome page, Settings header,
// Premium intro page nav).
//
// Outer ring + green wedge + center dot. `currentColor` lets callers tint
// the ring and dot by setting `color` on the parent; the wedge is locked
// to the brand green via the --green CSS var (with fallback).
import React from 'react';

export const ApertureMark: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 96 96"
    width={size}
    height={size}
    aria-hidden="true"
    className={className}
  >
    <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="4" />
    <path d="M 48,48 L 88,48 A 40,40 0 0 0 76.28,19.72 Z" fill="var(--green, #1e6f4a)" />
    <circle cx="48" cy="48" r="6" fill="currentColor" />
  </svg>
);

export default ApertureMark;
