// shareLayout.ts: the EqualShare layout constants and its height, pure (no DOM, no TeX), so item generators can make
// only the sharing problems the picture can show.
export const L = 360, H = 80, BAR_GAP = 20, PAD = 16, ICON = 66, TRAY_GAP_X = 40, TRAY_GAP_Y = 20, ROW_GAP = 12, LABEL_H = 64, MID = 40;

/** the height (design px) the EqualShare model needs for a wholes among b */
export function equalShareHeight(a: number, b: number): number {
  const rows = Math.max(1, Math.ceil(a / b)), trayH = rows * H + (rows - 1) * ROW_GAP + 2 * PAD;
  const barRows = Math.ceil(a / (a > 3 ? 2 : 1)), trayRows = Math.ceil(b / 2);
  return LABEL_H + barRows * H + (barRows - 1) * BAR_GAP + MID + LABEL_H + trayRows * trayH + (trayRows - 1) * TRAY_GAP_Y;
}
export const equalShareFits = (a: number, b: number, h = 940): boolean =>
  Number.isInteger(a) && Number.isInteger(b) && a >= 1 && a <= 8 && b >= 2 && b <= 6 && Math.ceil(a / b) <= 2 && equalShareHeight(a, b) <= h;
