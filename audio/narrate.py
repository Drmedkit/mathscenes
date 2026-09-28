"""narrate.py: a script (one voice or a dialogue) -> media/narration.wav + data/words.json (word timings + cues).

Input: <project>/data/narration.json (full format: docs/WORDS_FORMAT.md)
{
  "voices": {"narrator": "narrator"},          # speaker id -> a NAME from the voices file, or a full object
                                               #   {"voice_id", "model_id", "voice_settings"}, or {"voice": name, + overrides}
  "lead_in": 1.6,                              # silence before the first line (s)
  "default_gap": 0.55,                         # pause after each line (s)
  "tail": 3.5,                                 # silence after the last line (s)
  "lines": [
    {"section": "hook", "text": "{screens}A phone. {laptop}A laptop.", "gap": 0.5},
    {"section": "try", "speaker": "student", "text": "Is it the same?"},
    ...
  ]
}
- `{name}` markers are not spoken; they become cues: words.json "cues": {"laptop": <start of the next word>}.
  A scene binds its animation to that exact spoken word.
- "speaker" (default "narrator") picks the voice. Prosody context (previous/next text) only comes from neighbouring
  lines of the SAME speaker.
- A long "gap" after a line gives the picture time (a think pause for the viewer). "at": <s> forces a line's start.
- Voices file: --voices-file F, else $MATHSCENES_VOICES, else audio/voices.json (your own, git-ignored), else
  audio/voices.example.json (premade public ElevenLabs voices).
- CACHE: each line is cached by sha1(text + model + settings + voice_id), NOT by its neighbours, so editing one line only
  re-pays for that line. Default cache: <project>/media/narration_cache/; share one across projects with --cache DIR.
- The API key is only needed when a line actually has to be generated.

Usage: python audio/narrate.py <project>                (generate / reuse cache, assemble, write words.json)
       python audio/narrate.py <project> --dry          (which lines are cached / would be generated; no key needed)
       python audio/narrate.py --list-voices            (the voices your key can use; needs a key)
"""
import sys, re, json, base64, hashlib, argparse, os, pathlib
import el

SR = 48000


def list_voices():
    import requests
    d = requests.get(f"{el.API}/v2/voices?page_size=100", headers={"xi-api-key": el.key()}, timeout=30).json()
    for v in d["voices"]:
        lab = v.get("labels") or {}
        print(f"{v['voice_id']}  {v['name']:<45} {v.get('category', ''):<12} {lab.get('gender','')} {lab.get('age','')} {lab.get('accent','')} {lab.get('use_case','')}")


def voices_file(arg):
    for c in [arg, os.environ.get("MATHSCENES_VOICES"), el.AUDIO_DIR / "voices.json", el.AUDIO_DIR / "voices.example.json"]:
        if c and pathlib.Path(c).exists():
            return pathlib.Path(c)
    return None


def resolve_speakers(cfg, needed, vfile):
    """speaker id -> {voice_id, model_id, voice_settings}. narration.json "voices" entry (a name from the voices file, or
    an object, optionally {"voice": name} + overrides) > the voices-file entry with the same id as the speaker."""
    lib = {k: v for k, v in (el.load_json(vfile) if vfile else {}).items() if not k.startswith("_")}
    table, out = cfg.get("voices", {}), {}
    for sp in needed:
        e = table.get(sp)
        if isinstance(e, str):
            if e not in lib: raise SystemExit(f"narration.json voices.{sp} = '{e}': not in {vfile} ({', '.join(lib) or 'empty'})")
            v = dict(lib[e])
        elif isinstance(e, dict):
            name = e.get("voice")
            if name is not None and name not in lib: raise SystemExit(f"narration.json voices.{sp}.voice = '{name}': not in {vfile}")
            base = lib[name] if name is not None else ({} if "voice_id" in e else lib.get(sp, {}))
            v = {**base, **{k: x for k, x in e.items() if k != "voice"}}
            if base.get("voice_settings") and "voice_settings" in e:   # override single settings (e.g. just speed)
                v["voice_settings"] = {**base["voice_settings"], **e["voice_settings"]}
        elif sp in lib:
            v = dict(lib[sp])
        else:
            raise SystemExit(f"speaker '{sp}' has no voice: add it to narration.json \"voices\" or to {vfile}")
        v.setdefault("model_id", "eleven_multilingual_v2"); v.setdefault("voice_settings", {})
        if not v.get("voice_id"): raise SystemExit(f"speaker '{sp}': no voice_id")
        out[sp] = {k: v[k] for k in ("voice_id", "model_id", "voice_settings")}
    return out


def split_markers(text):
    """'a {x}b' -> ('a b', [('x', char_index_in_clean_text)])"""
    out, marks, i = "", [], 0
    for m in re.finditer(r"\{(\w+)\}", text):
        out += text[i:m.start()]
        marks.append((m.group(1), len(out)))
        i = m.end()
    out += text[i:]
    lead = len(out) - len(out.lstrip())          # keep indices valid: only trim the ends
    return out.strip(), [(n, max(0, c - lead)) for n, c in marks]


def line_key(voice, clean):
    # the key ignores previous/next text, so editing one line doesn't re-bill its neighbours
    body = {"text": clean, "model_id": voice["model_id"], "voice_settings": voice["voice_settings"]}
    return hashlib.sha1(json.dumps([body, voice["voice_id"]], sort_keys=True).encode()).hexdigest()[:16]


def main():
    ap = argparse.ArgumentParser(description="script -> narration.wav + words.json")
    ap.add_argument("project", nargs="?", default=".", help="project folder (with data/narration.json)")
    ap.add_argument("--dry", action="store_true", help="show what would be generated; spend nothing, no key needed")
    ap.add_argument("--list-voices", action="store_true", help="list the voices available to your key")
    ap.add_argument("--voices-file", help="voices JSON (name -> voice_id/model_id/voice_settings)")
    ap.add_argument("--cache", help="line cache folder (default <project>/media/narration_cache)")
    a = ap.parse_args()
    if a.list_voices:
        list_voices(); return

    P = el.Project(a.project)
    cache = pathlib.Path(a.cache).resolve() if a.cache else P.media / "narration_cache"
    cfg = P.json("narration")
    lines = cfg["lines"]
    spk = [l.get("speaker", "narrator") for l in lines]
    vfile = voices_file(a.voices_file)
    V = resolve_speakers(cfg, sorted(set(spk)), vfile)
    cleaned = [split_markers(l["text"]) for l in lines]

    def neighbour(i, step):                                    # nearest line of the SAME speaker (context for prosody)
        k = i + step
        while 0 <= k < len(lines):
            if spk[k] == spk[i]: return cleaned[k][0]
            k += step
        return None
    jobs = [{"i": i, "speaker": spk[i], "voice": V[spk[i]], "clean": cleaned[i][0], "prev": neighbour(i, -1),
             "next": neighbour(i, 1), "hash": line_key(V[spk[i]], cleaned[i][0])} for i in range(len(lines))]
    have = lambda h: (cache / f"{h}.mp3").exists() and (cache / f"{h}.json").exists()
    todo = [j for j in jobs if not have(j["hash"])]
    print(f"{P.name}: {len(lines)} lines, {len(V)} voice(s) ({', '.join(f'{s}={V[s]["voice_id"]}' for s in V)})"
          f" from {vfile.name if vfile else '-'}, cache {cache}")
    print(f"  {len(jobs) - len(todo)} cached, {len(todo)} to generate ({sum(len(j['clean']) for j in todo)} characters)")
    cues = [n for _, m in cleaned for n, _ in m]
    dup = sorted({c for c in cues if cues.count(c) > 1})
    if dup: raise SystemExit(f"cue names used twice: {', '.join(dup)}")
    if a.dry:
        for j in todo: print(f"  would generate [{j['speaker']}] ({len(j['clean'])} chars): {j['clean']}")
        print(f"  cues: {', '.join(cues)}")
        return

    import numpy as np, soundfile as sf, librosa

    def tts_line(job):
        voice, h = job["voice"], job["hash"]
        mp3, js = cache / f"{h}.mp3", cache / f"{h}.json"
        if have(h):
            return mp3, json.loads(js.read_text(encoding="utf-8"))
        body = {"text": job["clean"], "model_id": voice["model_id"], "voice_settings": voice["voice_settings"]}
        if job["prev"]: body["previous_text"] = job["prev"]
        if job["next"]: body["next_text"] = job["next"]
        r = el.post(f"/v1/text-to-speech/{voice['voice_id']}/with-timestamps?output_format=mp3_44100_128",
                    json=body, headers={"Content-Type": "application/json"})
        d = r.json()
        cache.mkdir(parents=True, exist_ok=True)
        mp3.write_bytes(base64.b64decode(d["audio_base64"]))
        al = d.get("alignment") or d.get("normalized_alignment")
        js.write_text(json.dumps(al), encoding="utf-8")
        print(f"  generated [{job['speaker']}]: {job['clean'][:60]}")
        return mp3, al

    if todo:
        print(f"credits before: {el.credits()}")
    results = el.pmap(tts_line, jobs)
    t = cfg.get("lead_in", 1.0)
    out_lines, cue_t, pieces = [], {}, []
    for i, (l, (clean, marks), (mp3, al)) in enumerate(zip(lines, cleaned, results)):
        y, _ = librosa.load(mp3, sr=SR, mono=True)
        if "at" in l: t = max(t, l["at"])          # optional absolute start
        ws = words_from_alignment(al)
        words = [{"w": w["w"], "start": round(t + w["start"], 3), "end": round(t + w["end"], 3)} for w in ws]
        for name, ci in marks:
            nxt = next((w for w, raw in zip(words, ws) if raw["ci"] >= ci), words[-1])
            cue_t[name] = nxt["start"]
        out_lines.append({"i": i, "section": l.get("section", "main"), "speaker": spk[i], "text": clean,
                          "start": words[0]["start"], "end": words[-1]["end"], "words": words})
        pieces.append((t, y))
        t += len(y) / SR + l.get("gap", cfg.get("default_gap", .45))
    total = t + cfg.get("tail", 2.0)
    buf = np.zeros(int(total * SR) + 1, dtype=np.float32)
    for st, y in pieces:
        s = int(st * SR); buf[s:s + len(y)] += y
    P.media.mkdir(parents=True, exist_ok=True)
    sf.write(P.media / "narration.wav", buf, SR)
    el.save_json(P.data / "words.json", {"lines": out_lines, "cues": cue_t, "duration": round(total, 3)})
    print(f"narration {total:.2f}s, {len(out_lines)} lines, {len(cue_t)} cues -> media/narration.wav, data/words.json")
    if todo:
        print(f"credits after: {el.credits()}")
    for l in out_lines:
        print(f"  {l['start']:6.2f}-{l['end']:6.2f} [{l['section']}{'' if l['speaker'] == 'narrator' else ' ' + l['speaker']}] {l['text']}")


def words_from_alignment(al):
    """character timings -> words [{w, start, end, ci}] (ci = index of the word's first character)"""
    chars, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur = [], None
    for idx, (c, a, b) in enumerate(zip(chars, st, en)):
        if c.isspace():
            if cur: words.append(cur); cur = None
            continue
        if cur is None: cur = {"w": "", "start": a, "end": b, "ci": idx}
        cur["w"] += c; cur["end"] = b
    if cur: words.append(cur)
    return words


if __name__ == "__main__":
    main()
