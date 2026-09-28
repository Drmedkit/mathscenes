"""gen_sfx.py: sound effects -> <project>/media/sfx/<name>.mp3 (ElevenLabs sound generation).

Input: <project>/data/sfx.json, one entry per sound name used in mix.json:
  "whoosh": ["soft airy swoosh transition, gentle, short", 0.7]      prompt + seconds (0.5-30; keep it 0.5-5)
  "whoosh": {"prompt": "...", "dur": 0.7, "influence": 0.6}         same, object form (influence = prompt_influence 0-1)
  "pop":    {"file": "../my-sounds/pop.mp3"}                          use your own file (relative to the project), no API
Keys starting with "_" are comments.

Only missing sounds are made; existing media/sfx/<name>.mp3 files are kept (delete one, or --force it, to redo it).

Usage: python audio/gen_sfx.py <project>                 (all missing sounds)
       python audio/gen_sfx.py <project> --force pop ding (make these anew, even if present)
       python audio/gen_sfx.py <project> --dry           (show what would be generated; no key needed)
"""
import argparse, shutil
import el


def norm(name, entry):
    """-> ('file', path) | ('gen', prompt, dur, influence)"""
    if isinstance(entry, dict) and "file" in entry: return ("file", entry["file"])
    if isinstance(entry, dict): return ("gen", entry["prompt"], float(entry.get("dur", 1.0)), float(entry.get("influence", 0.6)))
    if isinstance(entry, list) and len(entry) == 2: return ("gen", entry[0], float(entry[1]), 0.6)
    raise SystemExit(f"sfx.json '{name}': expected [prompt, seconds], {{prompt, dur}} or {{file}}")


def main():
    ap = argparse.ArgumentParser(description="sfx.json -> media/sfx/*.mp3")
    ap.add_argument("project", nargs="?", default=".")
    ap.add_argument("--force", nargs="+", default=[], metavar="NAME", help="regenerate these sounds")
    ap.add_argument("--dry", action="store_true", help="show what would happen; spend nothing, no key needed")
    a = ap.parse_args()
    P = el.Project(a.project)
    cfg = {k: v for k, v in P.json("sfx").items() if not k.startswith("_")}
    out = P.media / "sfx"
    for n in a.force:
        if n not in cfg: raise SystemExit(f"'{n}' is not in sfx.json")
    names = a.force or [n for n in cfg if not (out / f"{n}.mp3").exists()]
    kept = [n for n in cfg if n not in names]
    if kept: print(f"present: {', '.join(kept)}")
    gen = []
    for n in names:
        kind = norm(n, cfg[n])
        if kind[0] == "file":
            src = P.path(kind[1])
            if not src.exists(): raise SystemExit(f"{n}: {src} not found")
            print(f"{n}: copy {kind[1]}")
            if not a.dry:
                out.mkdir(parents=True, exist_ok=True); shutil.copy2(src, out / f"{n}.mp3")
            continue
        gen.append((n, *kind[1:]))
    if not gen:
        print("nothing to generate"); return
    for n, prompt, dur, infl in gen:
        print(f"{'would generate' if a.dry else 'generate'} {n} ({dur:.1f} s): {prompt}")
    if a.dry: return
    out.mkdir(parents=True, exist_ok=True)

    def generate(g):
        n, prompt, dur, infl = g
        r = el.post("/v1/sound-generation?output_format=mp3_44100_128",
                    json={"text": prompt, "duration_seconds": min(30, max(0.5, dur)), "prompt_influence": infl},
                    headers={"Content-Type": "application/json"}, timeout=120)
        (out / f"{n}.mp3").write_bytes(r.content)
        return n
    print(f"credits before: {el.credits()}")
    for n in el.pmap(generate, gen):
        print(f"{n}: generated -> media/sfx/{n}.mp3")
    print(f"credits after: {el.credits()}")


if __name__ == "__main__":
    main()
