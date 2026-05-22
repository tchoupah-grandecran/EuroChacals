// ── ESC 2026 — Theme definitions ─────────────────────────────────────────────
// Each theme exposes a flat token map consumed via ThemeContext.

export const THEMES = {
  classic: {
    id: 'classic',
    label: 'ESC',

    // Backgrounds
    bgApp:        '#0f0c20',
    bgHeader:     'rgba(15, 12, 32, 0.85)',
    bgCard:       'rgba(255, 255, 255, 0.04)',
    bgSection:    'rgba(0, 0, 0, 0.25)',
    bgInput:      '#1a1635',
    bgModal:      '#15102a',

    // Accent
    accent:       '#ff007f',
    accentGlow:   'rgba(255, 0, 127, 0.4)',
    accentSoft:   'rgba(255, 0, 127, 0.1)',
    accentBorder: 'rgba(255, 0, 127, 0.3)',

    // Text
    textPrimary:  '#ffffff',
    textMuted:    '#a0aec0',
    textFaint:    '#718096',

    // Border
    border:       'rgba(255, 255, 255, 0.08)',
    borderLight:  'rgba(255, 255, 255, 0.12)',

    // Tab active shadow
    tabShadow:    '0 0 15px rgba(255, 0, 127, 0.4)',

    // Logo / header icon color
    logoColor:    '#ff007f',

    // Font (body)
    fontBody:     "'Outfit', sans-serif",
    fontDisplay:  "'Fredoka', sans-serif",
  },

  junior: {
    id: 'junior',
    label: 'Junior',

    // Backgrounds — warm white-ish with a soft purple tint
    bgApp:        '#1a0f3a',
    bgHeader:     'rgba(26, 15, 58, 0.9)',
    bgCard:       'rgba(255, 255, 255, 0.06)',
    bgSection:    'rgba(255, 255, 255, 0.04)',
    bgInput:      '#2a1f50',
    bgModal:      '#221648',

    // Accent — sunny yellow-orange
    accent:       '#f9a825',
    accentGlow:   'rgba(249, 168, 37, 0.45)',
    accentSoft:   'rgba(249, 168, 37, 0.12)',
    accentBorder: 'rgba(249, 168, 37, 0.35)',

    // Text
    textPrimary:  '#ffffff',
    textMuted:    '#c4b5e8',
    textFaint:    '#8b7ab5',

    // Border
    border:       'rgba(255, 255, 255, 0.1)',
    borderLight:  'rgba(255, 255, 255, 0.15)',

    // Tab active shadow
    tabShadow:    '0 0 15px rgba(249, 168, 37, 0.4)',

    // Logo / header icon color
    logoColor:    '#f9a825',

    fontBody:     "'Outfit', sans-serif",
    fontDisplay:  "'Fredoka', sans-serif",
  },
};