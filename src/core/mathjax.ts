// mathjax.ts: the MathJax 4 engine, built from its direct ES modules (no CDN, no global MathJax, no DOM): TeX input ->
// SVG output with the New Computer Modern font and fontCache 'none' (every glyph its own <path>), on the lite adaptor,
// so the SAME code runs in the browser (Vite dev + built dist + headless renderer) and in Node (Vitest).
//
// The font's rarely used ranges (arrows, symbols, other scripts) live in 40 "dynamic" files that MathJax loads on
// demand through mathjax.asyncLoad. We map each file to a static import() so Vite bundles them as lazy chunks.
// Packages (docs/TEX_COVERAGE.md): base ams newcommand configmacros html(\cssId) cancel enclose textmacros textcomp
// units gensymb mathtools extpfeil color + our macros \sfrac, \qty, \unit.
import { mathjax } from '@mathjax/src/js/mathjax.js';
import { TeX } from '@mathjax/src/js/input/tex.js';
import { SVG } from '@mathjax/src/js/output/svg.js';
import { liteAdaptor, type LiteAdaptor } from '@mathjax/src/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from '@mathjax/src/js/handlers/html.js';
import '@mathjax/src/js/input/tex/base/BaseConfiguration.js';
import '@mathjax/src/js/input/tex/ams/AmsConfiguration.js';
import '@mathjax/src/js/input/tex/newcommand/NewcommandConfiguration.js';
import '@mathjax/src/js/input/tex/configmacros/ConfigMacrosConfiguration.js';
import '@mathjax/src/js/input/tex/html/HtmlConfiguration.js';
import '@mathjax/src/js/input/tex/cancel/CancelConfiguration.js';
import '@mathjax/src/js/input/tex/enclose/EncloseConfiguration.js';
import '@mathjax/src/js/input/tex/textmacros/TextMacrosConfiguration.js';
import '@mathjax/src/js/input/tex/textcomp/TextcompConfiguration.js';
import '@mathjax/src/js/input/tex/units/UnitsConfiguration.js';
import '@mathjax/src/js/input/tex/gensymb/GensymbConfiguration.js';
import '@mathjax/src/js/input/tex/mathtools/MathtoolsConfiguration.js';
import '@mathjax/src/js/input/tex/extpfeil/ExtpfeilConfiguration.js';
import '@mathjax/src/js/input/tex/color/ColorConfiguration.js';
import '@mathjax/src/js/input/tex/bbox/BboxConfiguration.js';
import { MathJaxNewcmFont } from '@mathjax/mathjax-newcm-font/js/svg.js';

const DYNAMIC: Record<string, () => Promise<unknown>> = {
  'PUA': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/PUA.js'),
  'accents-b-i': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/accents-b-i.js'),
  'accents': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/accents.js'),
  'arabic': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/arabic.js'),
  'arrows': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/arrows.js'),
  'braille-d': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/braille-d.js'),
  'braille': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/braille.js'),
  'calligraphic': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/calligraphic.js'),
  'cherokee': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/cherokee.js'),
  'cyrillic-ss': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/cyrillic-ss.js'),
  'cyrillic': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/cyrillic.js'),
  'devanagari': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/devanagari.js'),
  'double-struck': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/double-struck.js'),
  'fraktur': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/fraktur.js'),
  'greek-ss': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/greek-ss.js'),
  'greek': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/greek.js'),
  'hebrew': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/hebrew.js'),
  'latin-b': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/latin-b.js'),
  'latin-bi': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/latin-bi.js'),
  'latin-i': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/latin-i.js'),
  'latin': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/latin.js'),
  'marrows': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/marrows.js'),
  'math': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/math.js'),
  'monospace-ex': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/monospace-ex.js'),
  'monospace-l': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/monospace-l.js'),
  'monospace': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/monospace.js'),
  'mshapes': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/mshapes.js'),
  'phonetics-ss': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/phonetics-ss.js'),
  'phonetics': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/phonetics.js'),
  'sans-serif-b': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/sans-serif-b.js'),
  'sans-serif-bi': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/sans-serif-bi.js'),
  'sans-serif-ex': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/sans-serif-ex.js'),
  'sans-serif-i': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/sans-serif-i.js'),
  'sans-serif-r': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/sans-serif-r.js'),
  'sans-serif': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/sans-serif.js'),
  'script': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/script.js'),
  'shapes': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/shapes.js'),
  'symbols-b-i': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/symbols-b-i.js'),
  'symbols': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/symbols.js'),
  'variants': () => import('@mathjax/mathjax-newcm-font/js/svg/dynamic/variants.js'),
};

/** our macros on top of MathJax (see docs/TEX_COVERAGE.md) */
export const MACROS: Record<string, [string, number]> = {
  sfrac: ['{}^{#1}\\!/\\!{}_{#2}', 2],
  qty: ['#1\\,\\text{#2}', 2],
  unit: ['\\text{#1}', 1],
};
export const PACKAGES = ['base', 'ams', 'newcommand', 'configmacros', 'html', 'cancel', 'enclose', 'textmacros', 'textcomp',
  'units', 'gensymb', 'mathtools', 'extpfeil', 'color', 'bbox'] as const;

/** a lite-DOM node (opaque: walked through the adaptor) */
export type MjNode = unknown;
export interface Engine {
  adaptor: LiteAdaptor;
  /** synchronous convert; throws {retry: Promise} when a dynamic font file must load first */
  convert(src: string): MjNode;
  /** convert, loading any font files it needs */
  convertAsync(src: string): Promise<MjNode>;
}

let engine: Engine | null = null;

export function getEngine(): Engine {
  if (engine) return engine;
  (mathjax as { asyncLoad: ((f: string) => unknown) | null }).asyncLoad = (file: string) => {
    const name = file.replace(/^.*[/\\]/, '').replace(/\.js$/, '');
    const load = DYNAMIC[name];
    if (!load) return Promise.reject(new Error(`MathJax wants '${file}', which is not a known font file`));
    return load();
  };
  const adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);
  const tex = new TeX({
    packages: [...PACKAGES],
    macros: MACROS,
    // a bad formula throws (with MathJax's message) instead of drawing red error text
    formatError: (_jax: unknown, err: Error) => { throw err; },
  });
  const svg = new SVG({ fontCache: 'none', fontData: MathJaxNewcmFont, linebreaks: { inline: false } });
  const doc = mathjax.document('', { InputJax: tex, OutputJax: svg });
  const convert = (src: string): MjNode => doc.convert(src, { display: false });
  engine = {
    adaptor,
    convert,
    convertAsync: (src: string) => mathjax.handleRetriesFor(() => convert(src)) as Promise<MjNode>,
  };
  return engine;
}
