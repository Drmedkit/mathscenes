// tex-coverage.mjs: renders a battery of TeX expressions (everything primary + lower-secondary maths needs) with
// MathJax 4 -> SVG and reports, per expression: OK / ERROR (unknown macro, bad syntax) / TEXT (a character MathJax
// could not draw from its font as a path: it falls back to an SVG <text> node, which our canvas pipeline cannot
// outline, morph or write on). Writes out/tex-coverage.html (all SVGs, for a visual check) and a summary.
//   node tools/tex-coverage.mjs
import MathJax from '@mathjax/src';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const req = (f) => import(/^[A-Za-z]:[/]/.test(f) ? pathToFileURL(f).href : f);   // Windows: MathJax passes C:/... paths

const CASES = {
  'arithmetic': ['3+4=7', '12-5=7', '6\\times 7=42', '42\\div 6=7', '3\\cdot 4', '\\pm 3', '1{,}000{,}000', '3.14', '0.\\overline{3}', '5 \\neq 6', '7 < 9 > 2'],
  'fractions': ['\\frac{3}{4}', '\\dfrac{3}{4}', '\\tfrac{1}{2}', '2\\tfrac{1}{2}', '2\\frac{1}{2}', '\\frac{\\frac{1}{2}}{3}', '\\nicefrac{1}{2}', '\\sfrac{1}{2}', '\\frac{6}{8}=\\frac{3}{4}', '\\frac{\\cancel{6}}{\\cancel{8}}', '\\bcancel{4}', '\\xcancel{5}', '\\cancelto{3}{6}'],
  'written arithmetic': ['\\begin{array}{r} 347\\\\ +\\,250\\\\ \\hline 597 \\end{array}', '\\begin{array}{r} \\overset{1}{3}47\\\\ \\times\\;\\;6 \\\\ \\hline 2082\\end{array}', '\\enclose{longdiv}{1234}', '4\\enclose{longdiv}{1234}', '\\require{enclose}\\begin{array}{r} 308\\\\[-3pt] 4 \\enclose{longdiv}{1232}\\\\[-3pt] \\underline{12}\\phantom{32} \\end{array}', '\\hphantom{0}7', '\\stackrel{1}{4}7'],
  'place value / structure': ['\\underbrace{3}_{\\text{hundreds}}\\,\\underbrace{4}_{\\text{tens}}\\,\\underbrace{7}_{\\text{ones}}', '\\overbrace{2+2+2}^{3\\times 2}', '\\left(3+4\\right)\\times 2', '\\left\\{ 1,2,3 \\right\\}', '\\lvert -5 \\rvert', '\\lfloor 2.7 \\rfloor'],
  'powers / roots / sci': ['x^2', '2^{-3}', '10^{6}', '3.2\\times 10^{5}', '\\sqrt{16}=4', '\\sqrt[3]{27}', '\\sqrt{a^2+b^2}', 'a^2+b^2=c^2'],
  'percent / money / ratio': ['25\\%', '\\$4.50', '75\\text{¢}', '75\\unicode{xA2}', '\\text{\\textcent}75', '2:3', '2\\mathbin{:}3', '2\\colon 3', '4:6 = 2:3', '\\frac{2}{3}=\\frac{4}{6}'],
  'units / measure': ['5\\,\\text{ft}', '12\\,\\text{in} = 1\\,\\text{ft}', '15\\,\\text{ft}^2', '3\\,\\mathrm{m}^2', '90^\\circ', '90\\degree', '72\\,^\\circ\\mathrm{F}', '32\\,\\unicode{x2109}', '5\\,\\tfrac{\\text{mi}}{\\text{h}}', '60\\,\\text{mph}', '\\qty{5}{m}'],
  'geometry': ['\\angle ABC', '\\measuredangle A', '\\triangle ABC', '\\overline{AB}', '\\overleftrightarrow{AB}', '\\overrightarrow{AB}', 'AB \\parallel CD', 'AB \\perp CD', '\\triangle ABC \\cong \\triangle DEF', '\\sim', '\\square ABCD', '\\pi r^2', 'C = 2\\pi r', '\\text{rt}\\angle'],
  'relations / logic': ['\\leq', '\\geq', '\\approx', '\\equiv', '\\neq', '\\ll', '\\Rightarrow', '\\Leftrightarrow', '\\therefore', '\\because', '\\in', '\\notin', '\\subset', '\\cup', '\\cap', '\\emptyset', '\\mathbb{N}', '\\mathbb{Z}', '\\mathbb{R}'],
  'algebra': ['2x+3=11', '\\begin{aligned} 2x+3&=11\\\\ 2x&=8\\\\ x&=4\\end{aligned}', 'f(x)=3x-2', 'y=mx+b', '\\begin{cases} x+y=5\\\\ x-y=1\\end{cases}', 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}', '(a+b)^2', 'a(b+c)=ab+ac', '\\sin\\theta', '\\log_2 8', '\\lim_{n\\to\\infty}'],
  'statistics / chance': ['\\bar{x}', '\\sum_{i=1}^{n} x_i', '\\frac{1}{n}\\sum x_i', '\\sigma', '\\binom{5}{2}', 'P(A\\mid B)', 'P(A)=\\frac{1}{6}', '\\mu \\pm 2\\sigma'],
  'vectors / matrices': ['\\vec{v}', '\\begin{pmatrix} 1&2\\\\3&4\\end{pmatrix}', '\\begin{bmatrix} x\\\\ y\\end{bmatrix}'],
  'arrows / annotation': ['\\xrightarrow{\\times 2}', '\\xleftarrow{\\div 2}', '\\overset{\\times 2}{\\longrightarrow}', '\\to', '\\mapsto', '\\curvearrowright', '\\circlearrowright', '\\boxed{6}', '\\bbox[4px,border:2px solid]{6}', '\\fbox{6}', '\\enclose{circle}{6}', '\\enclose{updiagonalstrike}{5}', '\\enclose{horizontalstrike}{+2}', '\\underset{\\text{lemon}}{2}'],
  'text / colour / tags': ['\\text{cups of lemon}', '\\textbf{bold}', '\\textit{italic}', '\\mathrm{mi}', '\\color{#77C48C}{6}', '\\textcolor{#EF6D5C}{5}', '\\cssId{a}{2}:\\cssId{b}{3}', '\\class{lemon}{2}', '\\quad\\;\\,\\!', '\\phantom{00}7', '\\small 7 \\large 7', '\\text{Sam’s way}', '\\text{café}'],
  'symbols kids meet': ['\\checkmark', '\\times', '\\star', '\\bigstar', '\\heartsuit', '\\triangle', '\\bigcirc', '\\blacksquare', '\\infty', '\\ldots', '\\cdots', '\\dots', '\\#', '\\&', '\\_\\_'],
};

const MJ = await MathJax.init({ loader: { load: ['input/tex', 'output/svg', '[tex]/units', '[tex]/gensymb', '[tex]/textcomp', '[tex]/physics', '[tex]/cancel', '[tex]/enclose', '[tex]/mathtools', '[tex]/html', '[tex]/extpfeil'], require: req },
  tex: { packages: { '[+]': ['units', 'gensymb', 'textcomp', 'physics', 'cancel', 'enclose', 'mathtools', 'html', 'extpfeil'] },
         macros: { sfrac: ['{}^{#1}\\!/\\!{}_{#2}', 2] } }, output: { fontCache: 'none' } });
const A = MJ.startup.adaptor;
const rows = []; let ok = 0, err = 0, txt = 0;
for (const [group, list] of Object.entries(CASES)) {
  for (const src of list) {
    let html = '', status = 'OK', note = '';
    try {
      const node = await MJ.tex2svgPromise(src, { display: true });
      html = A.outerHTML(node);
      const m = html.match(/data-mjx-error="([^"]*)"/) || html.match(/<g data-mml-node="merror"[^>]*title="([^"]*)"/);
      if (m || html.includes('data-mml-node="merror"')) { status = 'ERROR'; note = m ? m[1] : 'merror'; }
      else if (/(fill|stroke|color)="red"/.test(html) && !/textcolor|\\color/.test(src)) { status = 'ERROR'; note = 'undefined macro (shown in red)'; }
      else if (/<text[\s>]/.test(html)) { status = 'TEXT'; note = [...html.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(x => x[1]).join(' '); }
    } catch (e) { status = 'ERROR'; note = String(e.message || e); }
    if (status === 'OK') ok++; else if (status === 'ERROR') err++; else txt++;
    rows.push({ group, src, status, note, html });
  }
}
fs.mkdirSync('out', { recursive: true });
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
fs.writeFileSync('out/tex-coverage.html', `<!doctype html><meta charset=utf-8><title>TeX coverage</title>
<style>body{font:14px system-ui;background:#fff;margin:20px}h2{margin:18px 0 6px}.r{display:grid;grid-template-columns:420px 90px 1fr;gap:10px;align-items:center;border-bottom:1px solid #eee;padding:4px 0}
code{font-size:12px;color:#333}.OK{color:#2a7}.ERROR{color:#d33;font-weight:700}.TEXT{color:#c80;font-weight:700}mjx-container svg{max-height:90px}</style>
${Object.keys(CASES).map(gp => `<h2>${gp}</h2>` + rows.filter(r => r.group === gp).map(r => `<div class=r><code>${esc(r.src)}</code><span class=${r.status}>${r.status}</span><div>${r.html}<small> ${esc(r.note)}</small></div></div>`).join('')).join('')}`);
console.log(`total ${rows.length}: OK ${ok}, ERROR ${err}, TEXT-fallback ${txt}`);
rows.filter(r => r.status !== 'OK').forEach(r => console.log(`${r.status.padEnd(5)} [${r.group}] ${r.src}  ->  ${r.note.slice(0, 120)}`));
