"""gen_music.py: an optional music bed with Eleven Music (composition plans), generated in variants to pick from.

Input: <project>/data/music.json
{
  "bpm": 100,
  "styles": ["calm curious study music", "soft marimba", "warm pads", "100 BPM"],   # 5-7 short styles, English
  "negative": ["drums", "vocals"],
  "variants": {"A": [], "B": ["gentle piano lead"]},                               # extra styles per variant
  "chunks": [                                                                      # durations in BARS stay on the grid
    {"bars": 8, "text": "[Intro]\\n{soft, sparse}", "styles": ["sparse intro"]},
    {"bars": 16, "text": "[Loop]\\n{steady, calm, loopable}"}
  ],
  "instrumental": true
}
- A bed for an explainer should be calm, instrumental and loopable (mix.json loops it and ducks it under the voice).
- Lyrics (for songs) go in chunk text with \\n between lines; directions in {curly braces}. No artist names.
- Music costs far more credits than speech: check el.credits(), generate 2 variants, listen, keep one.

Usage: python audio/gen_music.py <project> [--variants A B]    -> media/variants/music_<id>.mp3 (+ .json)
       python audio/gen_music.py <project> --keep B            copy variant B to media/bed.mp3 (what mix.json uses)
       python audio/gen_music.py <project> --dry               print the composition plans; no key needed
"""
import argparse, json, email, shutil
import el


def plan(cfg, variant):
    bar_ms = round(4 * 60000 / cfg["bpm"])
    base = cfg["styles"] + cfg.get("variants", {}).get(variant, [])
    p = {"chunks": [{
        "text": c["text"], "duration_ms": max(3000, min(120000, c["bars"] * bar_ms)),
        "context_adherence": c.get("adherence", "high"),
        "positive_styles": base + c.get("styles", []),
        "negative_styles": cfg.get("negative", []) + c.get("negative", []),
    } for c in cfg["chunks"]]}
    # force_instrumental is only accepted with a plain prompt, not with a composition plan: for instrumentals put
    # "no vocals" in the styles and "vocals", "singing" in the negative styles
    if cfg.get("instrumental"):
        for c in p["chunks"]:
            c["positive_styles"] = list(dict.fromkeys(c["positive_styles"] + ["instrumental", "no vocals"]))
            c["negative_styles"] = list(dict.fromkeys(c["negative_styles"] + ["vocals", "singing", "voice"]))
    return p


def generate(P, cfg, variant):
    out = P.media / "variants"
    body = {"composition_plan": plan(cfg, variant), "model_id": cfg.get("model_id", "music_v2_5"), "with_timestamps": True}
    r = el.post("/v1/music/detailed?output_format=mp3_44100_192", json=body, headers={"Content-Type": "application/json"})
    msg = email.message_from_bytes(b"Content-Type: " + r.headers.get("Content-Type", "").encode() + b"\r\n\r\n" + r.content)
    meta, audio = {}, None
    for part in msg.walk():
        if part.is_multipart():
            continue
        payload = part.get_payload(decode=True)
        if "json" in part.get_content_type(): meta = json.loads(payload)
        elif part.get_content_type().startswith("audio") or "octet" in part.get_content_type(): audio = payload
    if audio is None:
        (out / f"music_{variant}.raw").write_bytes(r.content)
        return f"{variant}: no audio part in the response (raw saved)"
    (out / f"music_{variant}.mp3").write_bytes(audio)
    el.save_json(out / f"music_{variant}.json", {"plan": body["composition_plan"], "meta": meta})
    return f"{variant}: media/variants/music_{variant}.mp3"


def main():
    ap = argparse.ArgumentParser(description="music.json -> music bed variants")
    ap.add_argument("project", nargs="?", default=".")
    ap.add_argument("--variants", nargs="+", default=["A"])
    ap.add_argument("--keep", metavar="ID", help="copy media/variants/music_<ID>.mp3 to media/bed.mp3")
    ap.add_argument("--dry", action="store_true", help="print the plans; spend nothing, no key needed")
    a = ap.parse_args()
    P = el.Project(a.project)
    if a.keep:
        src = P.media / "variants" / f"music_{a.keep}.mp3"
        if not src.exists(): raise SystemExit(f"{src} not found")
        shutil.copy2(src, P.media / "bed.mp3")
        print(f"kept variant {a.keep} -> media/bed.mp3"); return
    cfg = P.json("music")
    if a.dry:
        for v in a.variants:
            p = plan(cfg, v)
            secs = sum(c["duration_ms"] for c in p["chunks"]) / 1000
            print(f"variant {v}: {len(p['chunks'])} chunks, {secs:.0f} s")
            print(json.dumps(p, indent=1))
        return
    (P.media / "variants").mkdir(parents=True, exist_ok=True)
    print("credits before:", el.credits())
    for res in el.pmap(lambda v: generate(P, cfg, v), a.variants):
        print(res)
    print("credits after:", el.credits())


if __name__ == "__main__":
    main()
