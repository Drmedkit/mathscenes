# Script and timing formats: narration.json → words.json

A video is timed by its narration. You write the script (`data/narration.json`) with named **cue markers**; the audio
pipeline speaks it and writes `data/words.json`: every line and every word with its start and end time, plus the time
of every cue. A scene binds each animation beat to a cue or to a spoken word, so the picture changes on the exact word
that names it.

```
data/narration.json ──audio/narrate.py──▶ media/narration.wav  +  data/words.json ──▶ scene beats (TimeDriver)
      (you write)          (ElevenLabs TTS with                         (word + cue times)         │
                            character timestamps)                                                  ▼
data/sfx.json ──audio/gen_sfx.py──▶ media/sfx/*.mp3 ─┐                                   tools/render.mjs --audio
data/music.json ─audio/gen_music.py─▶ media/bed.mp3 ─┼─audio/mix.py (data/mix.json)──▶ media/final_mix.wav
media/narration.wav ─────────────────────────────────┘
```

Scene time **is** narration time: `t = 0` is the start of `narration.wav` (and of `final_mix.wav`).

## narration.json

```json
{
  "_doc": "free text: what the video is, the arc, the colour roles",
  "voices": {"narrator": "narrator", "student": {"voice": "narrator_alt", "voice_settings": {"speed": 1.0}}},
  "lead_in": 1.6,
  "default_gap": 0.55,
  "tail": 3.5,
  "lines": [
    {"section": "hook", "text": "{screens}A phone. {laptop}A laptop. {cinema}A cinema screen.", "gap": 0.5},
    {"section": "try", "text": "{tryq}Your turn. {q1}Is ten to fifteen the same ratio as two to three?", "gap": 3.6},
    {"section": "try", "speaker": "student", "text": "Yes!", "at": 219.0}
  ]
}
```

| field | meaning |
|---|---|
| `voices` | speaker id → a **name** from the voices file (`audio/voices.example.json`, or your own `audio/voices.json`), or an object `{"voice_id", "model_id", "voice_settings"}`, or `{"voice": name, ...overrides}` (overrides merge into that voice's settings). A speaker missing here is looked up by its own id in the voices file. |
| `lead_in` | silence before the first line (s) |
| `default_gap` | pause after each line (s) unless the line sets `gap` |
| `tail` | silence after the last line (s) |
| `lines[].section` | a short name for the part of the video (`hook`, `every`, `add`, …). Word lookups are per section. |
| `lines[].text` | what is spoken, with `{cue}` markers |
| `lines[].speaker` | default `"narrator"` |
| `lines[].gap` | pause after this line (s). A long gap is a **think pause** or room for a picture to finish. |
| `lines[].at` | optional: this line starts no earlier than this time (s) |

**Cue markers.** `{name}` is not spoken. It becomes `cues.name` = the start time of the first word after the marker.
Names are `\w+`, unique across the file (narrate.py refuses duplicates). Put a marker right before the word the picture
must land on: `for every {fe2}two orange tiles` → the orange count appears on "two".

**Writing lines for timing.** One idea per line (a line is cached and re-generated on its own, and short lines give
the voice natural pauses). Numbers spelled as they should be said ("two to three", "one and a half"). Pauses you need
for the picture go in `gap`, not in punctuation.

**Cost and cache.** Each line is cached by (text, model, settings, voice): editing one line only re-generates that
line. `python audio/narrate.py <project> --dry` lists what would be generated and the character count, without a key.

## words.json

Written by `narrate.py`; never edited by hand (re-run narrate instead).

```json
{
  "lines": [
    {
      "i": 0, "section": "hook", "speaker": "narrator",
      "text": "A phone. A laptop. A cinema screen.",
      "start": 1.6, "end": 4.015,
      "words": [ {"w": "A", "start": 1.6, "end": 1.693}, {"w": "phone.", "start": 1.739, "end": 2.041}, "..." ]
    }
  ],
  "cues": {"screens": 1.6, "laptop": 2.064, "cinema": 2.668, "...": 0},
  "duration": 233.715
}
```

- `words[].w` keeps punctuation as spoken text ("phone.", "It's"); lookups ignore case and punctuation.
- Times are seconds on the narration timeline, rounded to ms.
- `cues` holds every `{marker}`; `duration` = lead-in + lines + gaps + tail.

## Using it in a scene (TypeScript)

```ts
import DATA from './data/words.json';
import { Narration, type WordsFile } from '../../src/scenes/cues';

type Cue = keyof typeof DATA.cues;                      // a union of the cue names: typos are compile errors
const N = new Narration<Cue>(DATA as WordsFile<Cue>);

N.cue('laptop');                    // time of the cue
N.word('every', 'two', N.cue('forevery'));   // start of the first "two" in section "every" at/after that time
N.wordEnd('every', 'two');          // its end
N.lineAt(12.3);                     // the line being spoken (captions, debugging)
```

Beats of a block are then `{ at: N.cue('laptop') - 0.05, dur: 0.7 }` (see `examples/ratio/ratio.ts`, `beats()`).
Starting a beat 0.05–0.3 s **before** the word makes the change read as caused by the word; starting it after reads as late.

## sfx.json and mix.json

`data/sfx.json`: sound name → `[prompt, seconds]`, `{"prompt", "dur", "influence"}`, or `{"file": "path.mp3"}` (your own
sound). `data/mix.json`: the bed, the voice file(s), the ducking, loudness and a list of sound events anchored by `t`
(seconds), `cue`, `word` (`"section:word"`) or `beat` (with `bpm`), each with `gain` (dB), optional `offset`, `align`
(`peak` default: the loudest moment of the sound lands on the anchor; `start`; `end`) and a `note`. Full field lists
are in the headers of `audio/gen_sfx.py` and `audio/mix.py`.

Place sounds on the **visual** events (the beat times in the scene), with a note naming the event. In the ratio
example the sfx use absolute `t` values that match the shipped `words.json`; if you re-narrate (timings shift a
little), prefer `cue` / `word` anchors, or re-check the times with `python audio/mix.py <project> --dry`.
