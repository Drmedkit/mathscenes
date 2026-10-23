// load.mjs: load a lesson topic's TypeScript modules in Node (Vite SSR transform, same as Vitest), for the quality
// tools (sweep, items dump, placement check). Pure modules only: items.ts, plan.ts, explain.ts, placement.ts.
//   const L = await loadLesson('two-step-equations'); L.plan, L.gens, L.names, L.explain, L.placement; await closeLoader();
import { createServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TOPICS = path.join(ROOT, 'src', 'lesson', 'topics');
export const ORACLES = path.join(ROOT, 'tests', 'oracle');
let server = null;

async function vite() {
  if (!server) server = await createServer({ configFile: path.join(ROOT, 'vite.config.ts'), logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] } });
  return server;
}
export async function loadTs(abs) { return (await vite()).ssrLoadModule(abs.split(path.sep).join('/')); }
export async function closeLoader() { if (server) { await server.close(); server = null; } }

/** every lesson slug in the topics.json order (live ones) */
export function lessonSlugs() {
  const t = JSON.parse(fs.readFileSync(path.join(ROOT, 'pages', 'lessons', 'topics.json'), 'utf8'));
  return t.filter(x => x.live !== false && fs.existsSync(path.join(TOPICS, x.slug, 'items.ts'))).map(x => x.slug);
}

/** the topic's generator map (GENERATORS or GENS), family names, plan, and the optional quality-layer modules */
export async function loadLesson(slug) {
  const dir = path.join(TOPICS, slug);
  const items = await loadTs(path.join(dir, 'items.ts'));
  const planMod = await loadTs(path.join(dir, 'plan.ts'));
  const plan = planMod.PLAN;
  if (!Array.isArray(plan)) throw new Error(`${slug}: plan.ts has no PLAN`);
  const fams = new Set(plan.flatMap(p => p.families));
  const isGens = v => v && typeof v === 'object' && !Array.isArray(v) && [...fams].every(f => typeof v[f] === 'function');
  const gens = items.GENERATORS ?? items.GENS ?? Object.values(items).find(isGens);
  if (!isGens(gens)) throw new Error(`${slug}: no generator map covering every plan family`);
  const names = items.FAMILY_NAMES ?? {};
  const opt = async f => (fs.existsSync(path.join(dir, f)) ? loadTs(path.join(dir, f)) : null);
  const ex = await opt('explain.ts'), pl = await opt('placement.ts');
  return { slug, dir, plan, gens, names, explain: ex?.explain ?? null, placement: pl?.PLACEMENT ?? null };
}

/** the independent oracle of a lesson (tests/oracle/<slug>.mjs), or null */
export async function loadOracle(slug) {
  const f = path.join(ORACLES, `${slug}.mjs`);
  if (!fs.existsSync(f)) return null;
  return (await import(pathToFileURL(f).href + `?t=${fs.statSync(f).mtimeMs}`)).default;
}

/** every (sub-goal, family) pair the practice can ask, in plan order */
export const pairsOf = plan => plan.flatMap(p => p.families.map(f => ({ subgoal: p.id, family: f })));
