/**
 * WCAG 2.1 color contrast utilities for accessibility compliance.
 * Refactored: 2026-02-16 @ extraction from page.tsx
 */

/**
 * Calculate relative luminance of a color (WCAG 2.1)
 * @param r Red (0-255)
 * @param g Green (0-255)
 * @param b Blue (0-255)
 * @returns Luminance value between 0 and 1
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two luminance values (WCAG 2.1)
 * @param lum1 First luminance value
 * @param lum2 Second luminance value
 * @returns Contrast ratio (1:1 to 21:1)
 */
export function getContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse hex color to RGB components
 * @param hex Hex color string (with or without #)
 * @returns RGB object with r, g, b values (0-255)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB values to hex color string
 * @param r Red (0-255)
 * @param g Green (0-255)
 * @param b Blue (0-255)
 * @returns Hex color string with # prefix
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Adjust color brightness to meet WCAG AA contrast ratio
 * Lightens/darkens the color iteratively until target contrast is achieved.
 * 
 * @param color Hex color string to adjust
 * @param bgColor Background hex color (defaults to dark theme bg)
 * @param targetRatio Target contrast ratio (4.5 for AA normal text, 3.0 for AA large text)
 * @returns Adjusted hex color that meets the target contrast ratio
 */
export function ensureContrastRatio(
  color: string,
  bgColor: string = '#0a0a1a',
  targetRatio: number = 4.5
): string {
  const fg = hexToRgb(color);
  const bg = hexToRgb(bgColor);
  
  const bgLum = getLuminance(bg.r, bg.g, bg.b);
  let fgLum = getLuminance(fg.r, fg.g, fg.b);
  let currentRatio = getContrastRatio(fgLum, bgLum);
  
  // If contrast is already sufficient, return original color
  if (currentRatio >= targetRatio) {
    return color;
  }
  
  // Lighten the color iteratively until it meets the target ratio
  let { r, g, b } = fg;
  let attempts = 0;
  const maxAttempts = 100;
  
  while (currentRatio < targetRatio && attempts < maxAttempts) {
    // Increase brightness by moving towards white (10% per iteration)
    r = Math.min(255, r + (255 - r) * 0.1);
    g = Math.min(255, g + (255 - g) * 0.1);
    b = Math.min(255, b + (255 - b) * 0.1);
    
    fgLum = getLuminance(r, g, b);
    currentRatio = getContrastRatio(fgLum, bgLum);
    attempts++;
  }
  
  return rgbToHex(r, g, b);
}
