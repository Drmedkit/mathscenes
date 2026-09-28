// player.ts: a scene on a fixed 1920 x 1080 canvas, for the video renderer (tools/render.mjs) and for a quick look.
//   player.html?scene=ratio&theme=ink               plays the scene in a loop (real time)
//   player.html?scene=ratio&render=1                waits: the renderer calls window.renderFrame(t) per frame
//   player.html?scene=ratio&t=110                   one still frame at t
// window.ready resolves (with the scene info) once MathJax, the fonts and the scene are built.
import { begin, canvasFor } from '../src/core/draw';
import { themeByName } from '../src/core/theme';
import { texReady, texSettled } from '../src/core/tex';
import { sceneById } from '../src/scenes';

export interface SceneInfo { id: string; title: string; t0: number; t1: number; theme: string; audio: { file: string; offset: number } | null }
declare global {
  interface Window {
    ready: Promise<SceneInfo>;
    renderFrame: (t: number) => void;
    sceneInfo?: SceneInfo;
  }
}

const q = new URLSearchParams(location.search);
const cv = document.getElementById('cv') as HTMLCanvasElement;
const msg = document.getElementById('msg')!;

window.renderFrame = () => { throw new Error('not ready: await window.ready'); };
window.ready = (async () => {
  const scene = sceneById(q.get('scene') ?? 'ratio');
  if (!scene) throw new Error(`unknown scene '${q.get('scene')}'`);
  const th = themeByName(q.get('theme'));
  await texReady();
  const c = canvasFor(cv, th, 1920, 1080, 1920);
  let run = scene.build(th);
  // a first pass over the whole scene makes sure every formula (and its font file) is loaded before frames count
  for (let t = scene.t0; t <= scene.t1; t += 0.5) { begin(c); run.draw(c, t); }
  await texSettled();
  run = scene.build(th);
  window.renderFrame = (t: number) => { begin(c); run.draw(c, t); };
  const info: SceneInfo = { id: scene.id, title: scene.title, t0: scene.t0, t1: scene.t1, theme: th.name, audio: scene.audio ?? null };
  window.sceneInfo = info;
  document.title = `${scene.id} (${th.name})`;
  if (!q.has('render')) {
    const tq = q.get('t');
    if (tq !== null) window.renderFrame(Number(tq));
    else {
      const start = performance.now();
      const loop = (now: number) => {
        const t = scene.t0 + (((now - start) / 1000) % (scene.t1 - scene.t0 + 1));
        window.renderFrame(t);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }
  return info;
})();
window.ready.catch(e => { msg.textContent = String(e?.stack ?? e); });
