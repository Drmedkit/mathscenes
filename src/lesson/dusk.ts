// dusk.ts: the lesson theme. A navy / plum dusk board (the palette of the Kubo Level Up "style E" world) with the
// maths in bright colour roles. The roles keep the mathscenes meaning:
//   first  = the amount that is shared / the dividend   (amber)
//   second = who shares / the divisor                     (teal)
//   link   = one share, the answer, the key relation      (lime)
//   wrong  = wrong or struck                              (red)
//   pick   = a chosen / focused option                    (lavender)
// Washes (wash.ts) paint the concrete objects; digits and notation stay crisp TeX on a calm board.
import type { Theme } from '../core/theme';

export const DUSK = {
  navy: '#161A36', navy2: '#20244A', plum: '#2E2650', panel: '#232850', rule: '#3A3F6B',
  ink: '#221B2E', cream: '#EFE6F7', wood: '#7A4E35', woodLight: '#9A6646', napkin: '#E9E1EE',
} as const;

export const dusk: Theme = {
  name: 'dusk', dark: true,
  bg: '#181B3A', bg2: '#20244A', panel: '#232850', rule: '#3A3F6B',
  roles: {
    ink:    { fill: '#EFE6F7', line: '#EFE6F7', text: '#EFE6F7' },
    dim:    { fill: '#B7B0CC', line: '#B7B0CC', text: '#BDB6D2' },
    faint:  { fill: '#5E6290', line: '#5E6290', text: '#8A8EB8' },
    lemon:  { fill: '#F7C548', line: '#FCE4A2', text: '#F9CB55' },
    water:  { fill: '#5AB4DC', line: '#AEDCF0', text: '#6DC1E6' },
    ratio:  { fill: '#B4EA6A', line: '#D8F5B0', text: '#BDEE7A' },
    wrong:  { fill: '#F0524F', line: '#F8A3A1', text: '#FF6B67' },
    pick:   { fill: '#AE93EE', line: '#D5C6F7', text: '#C3AEF6' },
    brown:  { fill: '#9A6646', line: '#B98763', text: '#D3A27C' },
    first:  { fill: '#FFB547', line: '#FFD79A', text: '#FFBE5C' },
    second: { fill: '#3CC6C2', line: '#A4EAE7', text: '#4FD3CF' },
    link:   { fill: '#B4EA6A', line: '#D8F5B0', text: '#BDEE7A' },
  },
  lw: { hair: 1.5, thin: 2.5, base: 4, bold: 6, heavy: 9 },
  font: { big: 140, eq: 88, num: 76, label: 52, small: 46, minNum: 60, minLabel: 44 },
  glow: 0.6,
  light: { centre: 'rgba(255,214,170,0.05)', edge: 'rgba(5,6,20,0.30)' },
};
