// Scenes: every cue / word a scene binds to exists in its words.json, and the scene builds in both themes (so every
// block's layout rules hold for the scene's real numbers).
import { beforeAll, describe, expect, it } from 'vitest';
import { texReady } from '../src/core/tex';
import { ink, paper } from '../src/core/theme';
import { RATIO } from '../examples/ratio/cues';
import { SCENES } from '../src/scenes';

beforeAll(async () => { await texReady(); });

describe('cues', () => {
  it('reads typed cues and words from the ratio example words.json', () => {
    expect(RATIO.cue('table')).toBeCloseTo(66.407, 3);
    expect(RATIO.word('scale', 'multiplied', RATIO.cue('times'))).toBeCloseTo(71.481, 3);
    expect(RATIO.wordEnd('scale', 'multiplied')).toBeCloseTo(72.003, 3);
    expect(() => RATIO.word('scale', 'banana')).toThrow(/not found/);
  });
});

describe('scenes', () => {
  for (const [id, s] of Object.entries(SCENES)) {
    it(`${id} builds in ink and paper`, () => {
      expect(s.t1).toBeGreaterThan(s.t0);
      expect(() => s.build(ink)).not.toThrow();
      expect(() => s.build(paper)).not.toThrow();
    });
  }
});
