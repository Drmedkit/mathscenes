// =====================================================================================================
// sweep.mjs: the practice sweep of the lesson line (docs/lessons/QUALITY_LAYER.md). For every (sub-goal, family)
// pair a lesson's practice can ask, it makes many items with the lesson's own generators and checks each one:
//   answer   the independent oracle (tests/oracle/<slug>.mjs, written from what the student sees) agrees with
//            item.answer, and item.check() accepts the oracle's answer typed the way a student types it
//   wrong    every wrong choice is rejected (a far-off typed answer accepted is a warning: open questions exist); exactly one choice is right, none repeat
//   text     prompt, board, choices, unit, solution and steps: no undefined / NaN / "+ -" / "- -" / -0 / float noise /
//            double spaces; "1 ...s" is flagged for a look
//   world    the oracle's sane(q): nothing impossible in the story
//   steps    explain(it) (src/lesson/topics/<slug>/explain.ts): 2-5 steps, clean text, the result equals the
//            oracle's answer and passes item.check()
//   variety  at least 12 different items per pair; the same seed gives the same item
//   feedback the share of wrong choices that only get general feedback (no misconception id)
//
//   node tools/quality/sweep.mjs <slug> [<slug> ...]      these lessons
//   node tools/quality/sweep.mjs --all                     every live lesson (report: out/quality/sweep.json)
//   --n=300 items per pair per seed (default 300) · --seeds=2 · --json · --quiet (only failing lessons)
// Exit code 1 when any lesson has an error.
// =====================================================================================================
import fs from 'node:fs';
import path from 'node:path';
import { loadLesson, loadOracle, closeLoader, pairsOf, lessonSlugs, loadTs, ROOT } from './load.mjs';
import { viewOf, plainText } from './view.mjs';
import { sameAnswer, responsesFor, wrongTyped, show } from './answers.mjs';

const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : null; };
const N = Number(opt('n') || 300), SEEDS = Number(opt('seeds') || 2), JSON_OUT = args.includes('--json'), QUIET = args.includes('--quiet');
const only = args.filter(a => !a.startsWith('--'));
const slugs = only.length ? only : args.includes('--all') ? lessonSlugs() : [];
if (!slugs.length) { console.error('usage: node tools/quality/sweep.mjs <slug> [...] | --all  [--n=300] [--seeds=2] [--json] [--quiet]'); process.exit(2); }

const I = await loadTs(path.join(ROOT, 'src', 'lesson', 'runtime', 'item.ts'));
const P = await loadTs(path.join(ROOT, 'src', 'lesson', 'runtime', 'panel.ts'));

// ---- text that should never reach a student ----
const BAD_TEXT = [
  [/(?<!is )undefined|NaN|\bnull\b|\[object|Infinity/, 'broken value'],
  [/\+\s*[-−]\s*\d/, '"+ -" sign'],
  [/(^|[^-−])[-−]\s*[-−]\s*\d/, 'double minus'],
  [/(^|[^\d.,])[-−]0(?![.,\d])/, 'negative zero'],
  [/(^|[^\d])(\d+)\/0(?!\d|\.\d)/, 'zero denominator'],
  [/\d\.\d*[1-9](0{6,}|9{6,})[1-9]/, 'float noise (5.0000000001)'],
  [/\s{2,}\S/, 'double space'],
  [/(^|[^\d.,−-])1 (?!of\b|in\b|out\b|to\b|for\b|and\b|or\b|is\b|more\b|less\b)([a-z]{3,}?)s\b/, 'plural after 1 (check)'],
];
const BAD_TEX = BAD_TEXT.filter(([, why]) => !/double space|plural/.test(why));
// a lesson may allow text that is right in its maths (explain.ts `export const TEXT_OK = [/7\/0/]`: "1/0 has no value")
let ALLOW = [];
const textProblems = (t, tex = false) => { const u = ALLOW.reduce((x, re) => x.replace(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'), ' '), String(t)); return (tex ? BAD_TEX : BAD_TEXT).filter(([re]) => re.test(u)).map(([, why]) => why); };
const STEP_MAX = 5, STEP_CHARS = 200;
const big = (k, v) => (typeof v === 'bigint' ? `${v}n` : v);
const strip = it => JSON.stringify(it, (k, v) => (typeof v === 'function' ? undefined : big(k, v)));

async function sweepLesson(slug) {
  const res = { slug, pairs: {}, errors: [], warnings: [], oracle: false, explain: false };
  const err = (pair, msg, it) => res.errors.push({ pair, msg, item: it ? show(it) : undefined });
  const warn = (pair, msg, it) => res.warnings.push({ pair, msg, item: it ? show(it) : undefined });
  let L;
  try { L = await loadLesson(slug); } catch (e) { err('-', `does not load: ${e.message}`); return res; }
  let O = null;
  try { O = await loadOracle(slug); } catch (e) { err('-', `oracle does not load: ${e.message}`); }
  res.oracle = !!O; res.explain = !!L.explain; ALLOW = L.textOk ?? [];
  if (!O) warn('-', 'no oracle (tests/oracle/' + slug + '.mjs): answers are not independently checked');
  if (!L.explain) warn('-', 'no explain.ts: the steps card falls back to item.solution (not checked against the oracle)');
  for (const { subgoal, family } of pairsOf(L.plan)) {
    const key = `${subgoal}/${family}`;
    const t = res.pairs[key] = { items: 0, distinct: 0, checked: 0, wrongAnswer: 0, notAccepted: 0, farAccepted: 0, choiceIssues: 0, wrongChoiceAccepted: 0, textIssues: 0, insane: 0, explained: 0, badSteps: 0, distractors: 0, generic: 0 };
    const seen = {}, cap = (k, n = 3) => (seen[k] = (seen[k] ?? 0) + 1) <= n;
    const keys = new Set();
    const gen = L.gens[family];
    try {
      const a = strip(gen(I.rng(4242), 1, subgoal)), b = strip(gen(I.rng(4242), 1, subgoal));
      if (a !== b) warn(key, 'the same seed gives different items (Math.random or shared state in the generator)');
    } catch { /* reported below */ }
    for (let s = 1; s <= SEEDS; s++) {
      const R = I.rng(s * 7919 + family.length * 131 + subgoal.length);
      for (let n = 1; n <= N; n++) {
        let it;
        try { it = gen(R, n, subgoal); } catch (e) { if (cap('throw')) err(key, `generator throws: ${e.message}`); continue; }
        t.items++;
        it.subgoal = subgoal;
        const q = viewOf(it, subgoal);
        keys.add(plainText(it.prompt) + '|' + it.board + '|' + (it.choices ?? []).join('|') + '|' + JSON.stringify(q.data, big));   // a new picture is a new item
        // the item's own answer must pass its own check
        let own;
        try { own = it.check(it.answer); } catch (e) { own = { ok: false, say: `check throws: ${e.message}` }; }
        if (!own.ok && cap('own')) err(key, `check() rejects item.answer ${JSON.stringify(it.answer)}`, it);
        // text
        const texts = [[q.prompt, false], [it.board ?? '', true], [q.unit, false], ...(q.choices ?? []).map(c => [c, false]), ...it.solution.map(l => [plainText(l), false]),
          ...(q.pair ? [[`${q.pair.lead} ${q.pair.op} ${q.pair.tail}`, false]] : [])];
        const probs = [...new Set(texts.flatMap(([x, tex]) => textProblems(String(x), tex)))];
        if (probs.length) {
          t.textIssues++;
          const hard = probs.filter(p => !p.includes('check'));
          if (cap('text:' + probs.join())) (hard.length ? err : warn)(key, `text: ${probs.join(', ')}: "${texts.map(([x]) => x).filter(x => textProblems(String(x)).length || textProblems(String(x), true).length).join(' / ').slice(0, 220)}"`, it);
        }
        // choices: unique, exactly one right
        if (it.input === 'choice') {
          const cs = q.choices ?? [];
          let verdicts = [];
          try { verdicts = cs.map((_, i) => it.check({ kind: 'choice', i })); } catch (e) { if (cap('cthrow')) err(key, `check throws on a choice: ${e.message}`, it); }
          const right = verdicts.filter(v => v.ok).length, dup = new Set((it.choices ?? []).map(c => String(c).trim())).size !== cs.length;   // raw HTML: an overline or a sup is part of the choice
          if (cs.length < 2 || right !== 1 || dup) { t.choiceIssues++; if (cap('choice')) err(key, `choices: ${cs.length} shown, ${right} marked right${dup ? ', duplicates' : ''}`, it); }
          verdicts.forEach(v => { if (!v.ok) { t.distractors++; if (!v.mc) t.generic++; } });
        }
        // the oracle
        let want;
        if (O) {
          try { want = O.solve(q); } catch (e) { if (cap('othrow')) err(key, `oracle.solve throws: ${e.message}`, it); want = undefined; }
          if (want !== undefined) {
            t.checked++;
            if (!sameAnswer(it, want, it.answer)) { t.wrongAnswer++; if (cap('wrong')) err(key, `wrong answer: the lesson says ${JSON.stringify(it.answer)}, the oracle says ${JSON.stringify(want)}`, it); }
            // the student's way in: the oracle's answer typed / picked, through the panel's own parser
            const forms = responsesFor(it, want, P);
            let ok = false;
            for (const r of forms) { try { if (it.check(r).ok) { ok = true; break; } } catch { /* below */ } }
            if (!ok) { t.notAccepted++; if (cap('accept')) err(key, `the lesson rejects the oracle's answer ${JSON.stringify(want)} typed as ${forms.map(r => JSON.stringify(r)).join(' or ')}`, it); }
            if (it.input === 'choice') {
              const wi = typeof want === 'number' ? want : (q.choices ?? []).findIndex(c => c.toLowerCase() === String(want).toLowerCase());
              (q.choices ?? []).forEach((_, i) => { if (i !== wi) { try { if (it.check({ kind: 'choice', i }).ok) { t.wrongChoiceAccepted++; if (cap('wca')) err(key, `the lesson accepts choice ${i} "${q.choices[i]}", the oracle says ${wi}`, it); } } catch { /* noted */ } } });
            }
            let sane = '';
            try { sane = O.sane ? O.sane(q) || '' : ''; } catch (e) { sane = `sane throws: ${e.message}`; }
            if (sane) { t.insane++; if (cap('sane')) err(key, `world: ${sane}`, it); }
          }
        }
        // a far-off typed answer is wrong
        const far = wrongTyped(it);
        if (far) { try { if (it.check(far).ok) { t.farAccepted++; if (cap('far')) warn(key, `the lesson accepts a far-off answer ${JSON.stringify(far)}`, it); } } catch { /* fine */ } }
        // worked steps
        if (L.explain) {
          let ex = null, bad = '';
          try { ex = L.explain(it); } catch (e) { bad = `explain throws: ${e.message}`; }
          if (!bad && ex) {
            t.explained++;
            const steps = Array.isArray(ex.steps) ? ex.steps.map(plainText) : [];
            const sp = steps.flatMap(l => textProblems(l)).filter(p => !p.includes('check'));
            if (steps.length < 2 || steps.length > STEP_MAX) bad = `${steps.length} steps (want 2-${STEP_MAX})`;
            else if (sp.length) bad = `broken step text (${sp.join(', ')}): ${JSON.stringify(steps)}`;
            else if (steps.some(l => l.length > STEP_CHARS)) bad = `a step longer than ${STEP_CHARS} characters: "${steps.find(l => l.length > STEP_CHARS)}"`;
            else if (!ex.result || ex.result.kind !== it.input) bad = `steps result ${JSON.stringify(ex.result)} is not a ${it.input} response`;
            else {
              let rok = false; try { rok = it.check(ex.result).ok; } catch { rok = false; }
              if (!rok) bad = `the steps end in ${JSON.stringify(ex.result)}, which the lesson marks wrong`;
              else if (want !== undefined && !sameAnswer(it, want, ex.result)) bad = `the steps end in ${JSON.stringify(ex.result)}, the oracle says ${JSON.stringify(want)}`;
            }
          } else if (!bad) bad = 'explain gives nothing for this family (null)';
          if (bad) { t.badSteps++; if (cap('steps')) err(key, bad, it); }
        }
      }
    }
    t.distinct = keys.size;
    if (t.items && keys.size < 12) err(key, `only ${keys.size} different items (need at least 12)`);
    if (O && t.items && !t.checked) warn(key, 'the oracle does not cover this family (solve returns undefined)');
    if (t.distractors && t.generic / t.distractors > 0.5) warn(key, `${Math.round(100 * t.generic / t.distractors)}% of wrong choices get only general feedback (no misconception id)`);
  }
  return res;
}

const results = [];
for (const s of slugs) results.push(await sweepLesson(s));
await closeLoader();
const errors = results.reduce((a, r) => a + r.errors.length, 0), warnings = results.reduce((a, r) => a + r.warnings.length, 0);
const report = { at: new Date().toISOString(), n: N, seeds: SEEDS, lessons: results.length, withOracle: results.filter(r => r.oracle).length, withExplain: results.filter(r => r.explain).length, errors, warnings, results };
fs.mkdirSync(path.join(ROOT, 'out', 'quality'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'out', 'quality', only.length === 1 ? `sweep-${only[0]}.json` : 'sweep.json'), JSON.stringify(report, null, 1));
if (JSON_OUT) console.log(JSON.stringify(report, null, 1));
else {
  for (const r of results) {
    if (QUIET && !r.errors.length) continue;
    const ps = Object.values(r.pairs), items = ps.reduce((a, t) => a + t.items, 0), checked = ps.reduce((a, t) => a + t.checked, 0);
    console.log(`${r.errors.length ? 'FAIL' : 'ok  '} ${r.slug.padEnd(32)} ${String(items).padStart(6)} items, ${String(checked).padStart(6)} by oracle${r.oracle ? '' : ' (none)'}, steps ${r.explain ? 'yes' : 'no '}, ${r.errors.length} errors, ${r.warnings.length} warnings`);
    for (const e of r.errors.slice(0, 40)) console.log(`       x [${e.pair}] ${e.msg}${e.item ? `\n           ${e.item}` : ''}`);
    for (const w of r.warnings.slice(0, 12)) console.log(`       ! [${w.pair}] ${w.msg}${w.item ? `\n           ${w.item}` : ''}`);
  }
  console.log(`\n${results.length} lessons, ${report.withOracle} with an oracle, ${report.withExplain} with steps: ${errors} errors, ${warnings} warnings`);
}
process.exit(errors ? 1 : 0);
