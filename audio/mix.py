"""mix.py: music bed + voice + sound effects -> <project>/media/final_mix.wav, ducked and loudness-normalised.

Input: <project>/data/mix.json (paths are relative to the project folder)
{
  "duration": 233.9,                                      # length of the mix (s): the scene's t1
  "bed":   {"file": "media/bed.mp3", "gain": -15, "loop": true},   # optional; skipped with a warning if missing
  "voice": [{"file": "media/narration.wav", "t": 0}],     # narrate.py output, already timed (scene time = mix time)
  "duck_db": -11,                                         # extra bed reduction while the voice speaks
  "bpm": 100, "beat_offset": 0,                           # only needed for "beat" anchors
  "sfx": [
    {"sfx": "tick", "t": 1.75, "gain": -2, "note": "phone draws on"},   # anchors: t | cue "name" | word "section:Word"
    {"sfx": "ding", "cue": "answer", "offset": 0.1, "gain": -9},        #          | beat n; "offset" shifts (s)
    {"sfx": "whoosh", "word": "line:line", "align": "start"}            # align: peak (default) | start | end
  ],
  "fade_out": 3.0,
  "lufs": -16
}
Sound names are files media/sfx/<name>.mp3 (made by gen_sfx.py). Keys starting with "_" are comments.
Place an effect on the VISUAL event it belongs to (the scene's beat time), not "somewhere in the sentence".

Usage: python audio/mix.py <project>         -> media/final_mix.wav + a sorted cue sheet
       python audio/mix.py <project> --dry   the cue sheet only (checks every anchor; no audio needed)
"""
import argparse, subprocess
import el

SR = 48000


def main():
    ap = argparse.ArgumentParser(description="mix.json -> media/final_mix.wav")
    ap.add_argument("project", nargs="?", default=".")
    ap.add_argument("--dry", action="store_true", help="print the cue sheet only")
    a = ap.parse_args()
    P = el.Project(a.project)
    cfg = P.json("mix")
    words = P.json("words", required=False)
    period, boff = 60 / cfg.get("bpm", 120), cfg.get("beat_offset", 0)

    def word_t(ref):
        sec, w = ref.split(":", 1)
        norm = lambda s: "".join(c for c in s if c.isalnum() or c in ".'").lower()
        for line in words["lines"]:
            if line["section"] == sec:
                for x in line["words"]:
                    if norm(x["w"]) == norm(w):
                        return x["start"]
        raise SystemExit(f"mix.json: word '{ref}' not found in words.json")

    def anchor(c):
        off = c.get("offset", 0)
        if "beat" in c: return boff + c["beat"] * period + off
        if ("word" in c or "cue" in c) and not words: raise SystemExit("mix.json uses word/cue anchors but data/words.json is missing (run narrate.py)")
        if "word" in c: return word_t(c["word"]) + off
        if "cue" in c:
            if c["cue"] not in words["cues"]: raise SystemExit(f"mix.json: cue '{c['cue']}' not in words.json")
            return words["cues"][c["cue"]] + off
        return c.get("t", 0) + off

    events = [(anchor(c), c) for c in cfg.get("sfx", [])]
    if a.dry:
        names = sorted({c["sfx"] for _, c in events})
        missing = [n for n in names if not (P.media / "sfx" / f"{n}.mp3").exists()]
        print(f"{P.name}: {cfg['duration']} s, {len(events)} sfx events, sounds: {', '.join(names)}")
        if missing: print(f"  not generated yet: {', '.join(missing)} (python audio/gen_sfx.py {a.project})")
        for t, c in sorted(events, key=lambda e: e[0]):
            print(f"  {t:7.3f}  {c['sfx']:8s} {c.get('gain', 0):+5.1f} dB  {c.get('note', '')}")
        return

    import numpy as np, librosa

    def load(rel):
        y, _ = librosa.load(P.path(rel), sr=SR, mono=False)
        return np.vstack([y, y]) if y.ndim == 1 else y

    total = int(cfg["duration"] * SR)
    bed, fx, vox = (np.zeros((2, total)) for _ in range(3))
    report = []

    def place(buf, y, start, gain_db, label):
        g = 10 ** (gain_db / 20); s = int(round(start * SR))
        lo, hi = max(0, s), min(total, s + y.shape[1])
        if hi > lo: buf[:, lo:hi] += y[:, lo - s:hi - s] * g
        report.append((start, label))

    b = cfg.get("bed")
    if b and not P.path(b["file"]).exists():
        print(f"warning: bed {b['file']} not found: mixing without music (gen_music.py makes one; or remove \"bed\")")
        b = None
    if b:
        y = load(b["file"]); pos = int(b.get("t", 0) * SR)
        while pos < total:
            place(bed, y, pos / SR, b.get("gain", 0), f"bed {b['file']}")
            if not b.get("loop"): break
            pos += y.shape[1]

    for v in cfg.get("voice", []):
        if not P.path(v["file"]).exists(): raise SystemExit(f"{v['file']} not found: run python audio/narrate.py {a.project}")
        place(vox, load(v["file"]), anchor(v) - v.get("word_time", 0), v.get("gain", 0), f"VOICE {v['file']}")

    cache = {}
    for t, c in events:
        f = f"media/sfx/{c['sfx']}.mp3"
        if not P.path(f).exists(): raise SystemExit(f"{f} not found: run python audio/gen_sfx.py {a.project}")
        y = cache.setdefault(c["sfx"], load(f))
        al = c.get("align", "peak")
        if al == "peak":
            env = np.convolve(np.abs(y).mean(0), np.ones(480) / 480, "same"); start = t - np.argmax(env) / SR
        elif al == "end": start = t - y.shape[1] / SR
        else: start = t
        place(fx, y, start, c.get("gain", 0), f"{c['sfx']:8s} @ {t:7.3f}  {c.get('note', '')}")

    # duck the bed wherever the voice track is active (fast attack, slow release)
    env = np.abs(vox).mean(0)
    win = int(.03 * SR); env = np.convolve(env, np.ones(win) / win, "same")
    active = (env > 10 ** (-40 / 20)).astype(float)
    att, rel = int(.06 * SR), int(.35 * SR)
    act = np.convolve(active, np.ones(att) / att, "same") > 0          # extend earlier by the attack window
    act = np.maximum.accumulate(np.where(act, np.arange(total), 0))     # time of last activity
    act = (np.arange(total) - act) < rel                                # hold for the release time
    target = np.where(act, 10 ** (cfg.get("duck_db", -6) / 20), 1.0)
    gain = np.convolve(target, np.ones(att) / att, "same")               # smooth the edges
    mix = bed * gain + fx + vox
    fade = int(cfg.get("fade_out", .6) * SR)
    if fade: mix[:, -fade:] *= np.linspace(1, 0, fade)

    P.media.mkdir(parents=True, exist_ok=True)
    tmp, out = P.media / "_premix.f32", P.media / "final_mix.wav"
    mix.T.astype(np.float32).tofile(tmp)
    subprocess.run([el.ffmpeg(), "-y", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", str(tmp),
                    "-af", f"loudnorm=I={cfg.get('lufs', -16)}:TP=-1.0:LRA=11", "-ar", str(SR), "-c:a", "pcm_s16le", str(out)], check=True)
    tmp.unlink()
    print(f"wrote {out.relative_to(P.root)} ({cfg['duration']} s)")
    for t, label in sorted(report):
        print(f"  {t:7.3f}  {label}")


if __name__ == "__main__":
    main()
