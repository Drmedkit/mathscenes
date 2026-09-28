// common.ts: small page helpers shared by gallery / interactive / player.
import { type Canvas, canvasFor } from '../src/core/draw';
import { type Theme, themeByName } from '../src/core/theme';

/** a canvas that fills its CSS width, drawn in design px (w x h), crisp on hi-dpi screens */
export function liveCanvas(el: HTMLCanvasElement, th: Theme, w: number, h: number): Canvas {
  const cssW = el.clientWidth || el.parentElement?.clientWidth || w;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  el.style.aspectRatio = `${w} / ${h}`;
  return canvasFor(el, th, w, h, Math.round(cssW * dpr));
}

/** the theme chosen on this device (?theme= wins), remembered per viewer */
export function initialTheme(): Theme {
  const q = new URLSearchParams(location.search).get('theme');
  if (q) return themeByName(q);
  try { return themeByName(localStorage.getItem('mathscenes-theme')); } catch { return themeByName(null); }
}
export function rememberTheme(th: Theme): void {
  try { localStorage.setItem('mathscenes-theme', th.name); } catch { /* private mode: fine */ }
  document.documentElement.dataset['theme'] = th.name;
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const k of kids) e.append(k);
  return e;
}

/** a 0..1 tween driven by requestAnimationFrame */
export function tween(dur: number, onFrame: (p: number) => void, onDone?: () => void): () => void {
  let stop = false;
  const t0 = performance.now();
  const tick = (now: number) => {
    if (stop) return;
    const p = Math.min(1, (now - t0) / (dur * 1000));
    onFrame(p);
    if (p < 1) requestAnimationFrame(tick); else onDone?.();
  };
  requestAnimationFrame(tick);
  return () => { stop = true; };
}
