export const isHexColor = (value: string): boolean =>
  /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);

export const expandHex = (value: string): string => {
  const trimmed = value.trim();
  const short = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(trimmed);
  if (short) {
    const [, r, g, b] = short;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
};

export const hexToRgb = (value: string): { r: number; g: number; b: number } => {
  const match = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(expandHex(value));
  if (!match) return { r: 5, g: 108, b: 242 };
  const [, r, g, b] = match;
  return { r: parseInt(r, 16), g: parseInt(g, 16), b: parseInt(b, 16) };
};

const toChannel = (n: number): string => Math.round(n).toString(16).padStart(2, "0");

export const mixHex = (hex: string, other: string, amount: number): string => {
  const a = hexToRgb(hex);
  const b = hexToRgb(other);
  const mix = (x: number, y: number) => x + (y - x) * amount;
  return `#${toChannel(mix(a.r, b.r))}${toChannel(mix(a.g, b.g))}${toChannel(mix(a.b, b.b))}`;
};

export const toRgbTriplet = (hex: string): string => {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
};

export type AccentRamp = {
  blue: string;
  accent: string;
  mid: string;
  light: string;
  rgb: string;
  midRgb: string;
  lightRgb: string;
};

export const buildAccentRamp = (hex: string): AccentRamp => {
  const base = expandHex(hex);
  return {
    blue: base,
    accent: mixHex(base, "#FFFFFF", 0.12),
    mid: mixHex(base, "#FFFFFF", 0.35),
    light: mixHex(base, "#FFFFFF", 0.68),
    rgb: toRgbTriplet(base),
    midRgb: toRgbTriplet(mixHex(base, "#FFFFFF", 0.35)),
    lightRgb: toRgbTriplet(mixHex(base, "#FFFFFF", 0.68)),
  };
};