/**
 * Convert a hex color string (#RRGGBB or #RGB) to an RGB tuple string.
 * Returns "0, 0, 0" for invalid input.
 */
export function hexToRgb(hex: string): string {
  const cleaned = hex.replace(/^#/, "");

  // Handle shorthand (#RGB)
  if (cleaned.length === 3) {
    const [rHex, gHex, bHex] = cleaned;
    if (!rHex || !gHex || !bHex) {
      return "0, 0, 0";
    }

    const r = parseInt(`${rHex}${rHex}`, 16);
    const g = parseInt(`${gHex}${gHex}`, 16);
    const b = parseInt(`${bHex}${bHex}`, 16);
    return `${r}, ${g}, ${b}`;
  }

  // Handle full form (#RRGGBB)
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  return "0, 0, 0";
}

/**
 * Lighten a hex color by a given percentage.
 */
export function lightenHex(hex: string, amount: number): string {
  const cleaned = hex.replace(/^#/, "");
  if (cleaned.length !== 6) return hex;

  const r = Math.min(255, parseInt(cleaned.substring(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(cleaned.substring(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(cleaned.substring(4, 6), 16) + amount);

  const toHex = (n: number): string => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Darken a hex color by a given percentage.
 */
export function darkenHex(hex: string, amount: number): string {
  const cleaned = hex.replace(/^#/, "");
  if (cleaned.length !== 6) return hex;

  const r = Math.max(0, parseInt(cleaned.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(cleaned.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(cleaned.substring(4, 6), 16) - amount);

  const toHex = (n: number): string => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export interface PortalTheme extends Record<string, string> {
  "--portal-primary": string;
  "--portal-primary-mid": string;
  "--portal-primary-light": string;
  "--portal-primary-faded": string;
  "--portal-surface-subtle": string;
  "--portal-border-subtle": string;
}

/**
 * Generate CSS-compatible theme variables from a brand hex color.
 * Returns a Record of CSS variable names to RGB values for use with
 * `rgb(var(--variable-name))` in Tailwind classes.
 */
export function generatePortalTheme(brandColor: string): PortalTheme {
  const rgb = hexToRgb(brandColor);
  const primaryMid = hexToRgb(lightenHex(brandColor, 20));
  const primaryLight = hexToRgb(lightenHex(brandColor, 60));
  const primaryFaded = hexToRgb(lightenHex(brandColor, 140));
  const surfaceSubtle = hexToRgb(lightenHex(brandColor, 230));
  const borderSubtle = hexToRgb(lightenHex(brandColor, 200));

  return {
    "--portal-primary": rgb,
    "--portal-primary-mid": primaryMid,
    "--portal-primary-light": primaryLight,
    "--portal-primary-faded": primaryFaded,
    "--portal-surface-subtle": surfaceSubtle,
    "--portal-border-subtle": borderSubtle,
  };
}

/**
 * Apply portal theme CSS variables to a DOM element.
 * By default, applies to document.documentElement.
 * Returns the applied theme object for reference.
 */
export function applyPortalTheme(
  theme: PortalTheme,
  element: HTMLElement | null = null,
): PortalTheme {
  const target = element ?? document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    target.style.setProperty(key, value);
  });
  return theme;
}
