// the narration timing of the ratio example: data/words.json (made by audio/narrate.py from data/narration.json)
import RATIOData from './data/words.json';
import { Narration, type WordsFile } from '../../src/scenes/cues';

export type RatioCue = keyof typeof RATIOData.cues;
export const RATIO = new Narration<RatioCue>(RATIOData as WordsFile<RatioCue>);
