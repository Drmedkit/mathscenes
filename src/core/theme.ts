// theme.ts: the design tokens. Blocks never hard-code a colour: they ask the theme for a ROLE (lemon, water, ratio,
// wrong, ...) and a use (fill / line / text / soft), so the same scene renders on the dark `ink` board and on light
// `paper`, and a future painterly theme can plug in. Roles keep their meaning everywhere (pictures, digits, words):
//   lemon = lemon juice (warm yellow), water = water (blue), ratio = the ratio / the right step / answers (green),
//   wrong = wrong or struck (rose: never confusable with orange), pick = a chosen / highlighted option (violet),
//   brown = containers and frames, ink / dim / faint = plain.
//   The amount palette (no yellow, no blue): first = the first amount (orange), second = the second amount
//   (green), link = what ties them together: the ratio, equivalence, the line through zero, a key insight (lavender).
import { clamp, lerp } from './math';

export const ROLES = ['ink', 'dim', 'faint', 'lemon', 'water', 'ratio', 'wrong', 'pick', 'brown', 'first', 'second', 'link'] as const;
export type Role = (typeof ROLES)[number];
export type Hex = `#${string}`;
export type Rgba = `rgba(${string})`;
/** a colour: a role (resolved by the theme) or a literal hex / rgba() */
export type Paint = Role | Hex | Rgba;

export interface RoleTokens {
  /** solid shapes (cups, bars) */ fill: Hex;
  /** outlines of those shapes */ line: Hex;
  /** text and digits in this role (contrast-checked against the board) */ text: Hex;
}
export interface Theme {
  readonly name: string;
  readonly dark: boolean;
  /** board, raised board, panel, faint rules */
  readonly bg: Hex; readonly bg2: Hex; readonly panel: Hex; readonly rule: Hex;
  readonly roles: Readonly<Record<Role, RoleTokens>>;
  /** line weights in design px (1920 x 1080) */
  readonly lw: { readonly hair: number; readonly thin: number; readonly base: number; readonly bold: number; readonly heavy: number };
  /** TeX em sizes in design px. Rules: numbers >= minNum, labels >= minLabel at 1080p */
  readonly font: { readonly big: number; readonly eq: number; readonly num: number; readonly label: number; readonly small: number; readonly minNum: number; readonly minLabel: number };
  /** glow strength multiplier (a halo reads on a dark board; on paper it is kept subtle) */
  readonly glow: number;
  /** board light: centre / edge overlays of the background gradient */
  readonly light: { readonly centre: string; readonly edge: string };
}

const LW = { hair: 1.5, thin: 2.5, base: 4, bold: 6, heavy: 9 } as const;
const FONT = { big: 140, eq: 88, num: 76, label: 52, small: 46, minNum: 60, minLabel: 44 } as const;

/** dark theme: a warm deep ink board (aubergine-ink, not a cool slate), cream text */
export const ink: Theme = {
  name: 'ink', dark: true,
  bg: '#1E1A22', bg2: '#26212B', panel: '#2B2531', rule: '#3F3746',
  roles: {
    ink:   { fill: '#F3ECDF', line: '#F3ECDF', text: '#F3ECDF' },
    dim:   { fill: '#B5ACB2', line: '#B5ACB2', text: '#BDB4BA' },
    faint: { fill: '#6F6673', line: '#6F6673', text: '#8A8190' },
    lemon: { fill: '#F7C548', line: '#FCE4A2', text: '#F9CB55' },
    water: { fill: '#5AB4DC', line: '#AEDCF0', text: '#6DC1E6' },
    ratio: { fill: '#7CCB8F', line: '#BCE7C6', text: '#86D598' },
    wrong: { fill: '#E9578A', line: '#F6ADC6', text: '#FF6E9C' },
    pick:  { fill: '#AE93EE', line: '#D5C6F7', text: '#B9A1F2' },
    brown: { fill: '#B28E66', line: '#B28E66', text: '#C7A47C' },
    first: { fill: '#EE8A3F', line: '#F8C496', text: '#FF9F58' },
    second:{ fill: '#48B574', line: '#A6E2BD', text: '#5BCF8A' },
    link:  { fill: '#A08AF2', line: '#D9CEFF', text: '#BCA9FF' },
  },
  lw: LW, font: FONT, glow: 1,
  light: { centre: 'rgba(255,236,214,0.035)', edge: 'rgba(0,0,0,0.16)' },
};

/** light theme: warm paper, dark ink, deeper role colours for text contrast */
export const paper: Theme = {
  name: 'paper', dark: false,
  bg: '#F6F0E4', bg2: '#EEE6D6', panel: '#FFFBF3', rule: '#D9CEBB',
  roles: {
    ink:   { fill: '#2B2530', line: '#2B2530', text: '#2B2530' },
    dim:   { fill: '#6C6270', line: '#6C6270', text: '#625866' },
    faint: { fill: '#B7ADA3', line: '#B7ADA3', text: '#8E8479' },
    lemon: { fill: '#F4BF38', line: '#A77C0B', text: '#9A7000' },
    water: { fill: '#55AEDB', line: '#1E6C94', text: '#1B6891' },
    ratio: { fill: '#62B879', line: '#2D7845', text: '#27743F' },
    wrong: { fill: '#E04C7E', line: '#A8264F', text: '#B3285A' },
    pick:  { fill: '#8C6ADF', line: '#5B3DB0', text: '#5E3FB5' },
    brown: { fill: '#8C6C4A', line: '#8C6C4A', text: '#7A5C3D' },
    first: { fill: '#F08A3C', line: '#A65410', text: '#A04E0B' },
    second:{ fill: '#4FB27A', line: '#1F7445', text: '#1C7141' },
    link:  { fill: '#8E74E8', line: '#5A3FC0', text: '#5A3DBF' },
  },
  lw: LW, font: FONT, glow: 0.45,
  light: { centre: 'rgba(255,255,255,0.35)', edge: 'rgba(120,90,50,0.07)' },
};

export const THEMES = { ink, paper } as const;
export type ThemeName = keyof typeof THEMES;
export const themeByName = (n: string | null | undefined): Theme => (n && n in THEMES ? THEMES[n as ThemeName] : ink);

export const isRole = (p: string): p is Role => (ROLES as readonly string[]).includes(p);
/** resolve a paint to a hex colour for a given use */
export function paint(th: Theme, p: Paint, use: keyof RoleTokens = 'text'): Hex | Rgba {
  return isRole(p) ? th.roles[p][use] : p;
}

// ---------- colour maths ----------
function hexRgb(h: string): [number, number, number] {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map(c => c + c).join('');
  const n = parseInt(s.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** mix two hex colours (k 0 -> a, 1 -> b) */
export function mix(a: string, b: string, k: number): Hex {
  const A = hexRgb(a), B = hexRgb(b);
  return ('#' + A.map((v, i) => Math.round(lerp(v, B[i]!, clamp(k))).toString(16).padStart(2, '0')).join('')) as Hex;
}
export function rgba(h: string, a: number): Rgba {
  const [r, g, b] = hexRgb(h);
  return `rgba(${r},${g},${b},${clamp(a)})`;
}
