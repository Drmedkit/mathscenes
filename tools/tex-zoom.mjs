// tex-zoom.mjs: renders a few expressions BIG (MathJax 4 SVG), for checking individual glyphs.
//   node tools/tex-zoom.mjs out/zoom.html "42\div 6" "75\text{¢}" ...
import MathJax from '@mathjax/src';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const req = (f) => import(/^[A-Za-z]:[\\/]/.test(f) ? pathToFileURL(f).href : f);   // Windows: MathJax passes C:/... paths
const [, , out, ...srcs] = process.argv;
const MJ = await MathJax.init({
  loader: { load: ['input/tex', 'output/svg', '[tex]/units', '[tex]/gensymb', '[tex]/textcomp', '[tex]/cancel', '[tex]/enclose', '[tex]/html'], require: req },
  tex: { packages: { '[+]': ['units', 'gensymb', 'textcomp', 'cancel', 'enclose', 'html'] } },
  output: { fontCache: 'none' },
});
const A = MJ.startup.adaptor;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
let body = '';
for (const src of srcs) body += `<div class=r><code>${esc(src)}</code><div>${A.outerHTML(await MJ.tex2svgPromise(src, { display: true }))}</div></div>`;
fs.writeFileSync(out, `<!doctype html><meta charset=utf-8><style>body{margin:20px;font:16px system-ui}.r{display:flex;gap:30px;align-items:center;border-bottom:1px solid #ddd}code{width:320px}mjx-container{font-size:64px}</style>${body}`);
