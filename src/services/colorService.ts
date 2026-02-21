/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as d3 from 'd3-color';
import { hcl, lch, lab } from 'd3-color';

export interface ColorFormats {
  hex: string;
  rgb: string;
  hsl: string;
  lch: string;
}

/**
 * Normalizes a hex string to 6 characters.
 * @param hex The hex string to normalize.
 * @returns A 6-character hex string starting with #.
 */
export function normalizeHex(hex: string): string {
  const color = d3.color(hex);
  return color ? color.formatHex() : '#000000';
}

/**
 * Converts a color to multiple formats.
 * @param colorStr Any valid CSS color string.
 * @returns An object containing hex, rgb, hsl, and lch representations.
 */
export function getColorFormats(colorStr: string): ColorFormats {
  const color = d3.color(colorStr);
  if (!color) {
    return { hex: '#000000', rgb: 'rgb(0,0,0)', hsl: 'hsl(0,0%,0%)', lch: 'lch(0 0 0)' };
  }
  
  const hex = color.formatHex();
  const rgb = color.formatRgb();
  const hsl = color.formatHsl();
  
  // d3-color doesn't have a direct LCH format string but we can get values
  const lchVal = lch(color);
  const lchStr = `lch(${Math.round(lchVal.l)} ${Math.round(lchVal.c)} ${Math.round(lchVal.h || 0)})`;
  
  return { hex, rgb, hsl, lch: lchStr };
}

/**
 * Generates analogous colors.
 * @param hex Base color hex.
 * @returns Array of 2 analogous colors.
 */
export function getAnalogous(hex: string): string[] {
  const color = d3.lch(hex);
  if (!color) return ['#000000', '#000000'];
  const h = color.h || 0;
  const l = color.l || 0;
  const c = color.c || 0;
  return [
    d3.lch(l, c, (h + 30) % 360).formatHex(),
    d3.lch(l, c, (h - 30 + 360) % 360).formatHex()
  ];
}

/**
 * Generates shades (darker versions).
 * @param hex Base color hex.
 * @returns Array of 3 shades.
 */
export function getShades(hex: string): string[] {
  const color = d3.lch(hex);
  if (!color) return ['#000000', '#000000', '#000000'];
  const l = color.l || 0;
  const c = color.c || 0;
  const h = color.h || 0;
  return [
    d3.lch(l * 0.8, c, h).formatHex(),
    d3.lch(l * 0.6, c, h).formatHex(),
    d3.lch(l * 0.4, c, h).formatHex()
  ];
}

/**
 * Generates tones (desaturated versions).
 * @param hex Base color hex.
 * @returns Array of 3 tones.
 */
export function getTones(hex: string): string[] {
  const color = d3.lch(hex);
  if (!color) return ['#000000', '#000000', '#000000'];
  const l = color.l || 0;
  const c = color.c || 0;
  const h = color.h || 0;
  return [
    d3.lch(l, c * 0.7, h).formatHex(),
    d3.lch(l, c * 0.4, h).formatHex(),
    d3.lch(l, c * 0.1, h).formatHex()
  ];
}

/**
 * Generates triad colors.
 * @param hex Base color hex.
 * @returns Array of 2 triad colors.
 */
export function getTriads(hex: string): string[] {
  const color = d3.lch(hex);
  if (!color) return ['#000000', '#000000'];
  const h = color.h || 0;
  const l = color.l || 0;
  const c = color.c || 0;
  return [
    d3.lch(l, c, (h + 120) % 360).formatHex(),
    d3.lch(l, c, (h + 240) % 360).formatHex()
  ];
}

/**
 * Generates complementary color.
 * @param hex Base color hex.
 * @returns Complementary color hex.
 */
export function getComplementary(hex: string): string {
  const color = lch(hex);
  const h = color.h || 0;
  return lch(color.l, color.c, (h + 180) % 360).formatHex();
}

/**
 * Adjusts color properties using LCH space.
 * @param hex Base color hex.
 * @param brightness Offset for L (-100 to 100).
 * @param saturation Multiplier for C (0 to 2).
 * @param warmth Offset for H (-180 to 180).
 * @returns Adjusted color hex.
 */
export function adjustColor(hex: string, brightness: number, saturation: number, warmth: number): string {
  const color = lch(hex);
  const newL = Math.max(0, Math.min(100, color.l + brightness));
  const newC = Math.max(0, color.c * saturation);
  const newH = ((color.h || 0) + warmth + 360) % 360;
  return lch(newL, newC, newH).formatHex();
}

/**
 * Checks contrast ratio between two colors.
 * @param foreground Foreground hex.
 * @param background Background hex.
 * @returns Object with ratio and WCAG status.
 */
export function checkContrast(foreground: string, background: string) {
  const f = d3.rgb(foreground);
  const b = d3.rgb(background);
  
  const getLuminance = (c: d3.RGBColor) => {
    const a = [c.r, c.g, c.b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  
  const l1 = getLuminance(f);
  const l2 = getLuminance(b);
  
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return {
    ratio: ratio.toFixed(2),
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    aaLarge: ratio >= 3
  };
}
