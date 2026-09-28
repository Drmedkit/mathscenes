// scene registry (player.html?scene=<id>, tools/render.mjs <id>). Add your own scene here.
import { ratioVideo } from '../../examples/ratio/ratio';
import type { SceneDef } from './scene';

export const SCENES = { ratio: ratioVideo } as const satisfies Record<string, SceneDef>;
export type SceneId = keyof typeof SCENES;
export const sceneById = (id: string | null | undefined): SceneDef | undefined => (id && id in SCENES ? SCENES[id as SceneId] : undefined);
export type { SceneDef, SceneRun } from './scene';
