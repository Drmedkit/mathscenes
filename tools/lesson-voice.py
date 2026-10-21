"""lesson-voice.py: the narrator lines of a lesson -> mp3 files (ElevenLabs), cached by text.

    python tools/lesson-voice.py <slug> [--dry]

Reads pages/lessons/<slug>/voice/lines.json ({"id": {"text": "..."}}) and writes pages/lessons/<slug>/voice/<id>.mp3.
A line is (re)generated only when its text or the voice changed (hashes.json). One narrator for the whole line:
Chris, the Kubo Level Up narrator voice (owner's pick). Needs ELEVENLABS_API_KEY (.env), at most 2 requests at once.
"""
import sys, json, hashlib, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "audio"))
import el  # noqa: E402

VOICE = {"voice_id": "iP95p4xoKVk53GoZ742B", "model_id": "eleven_multilingual_v2",
         "voice_settings": {"stability": 0.55, "similarity_boost": 0.8, "style": 0.15, "speed": 0.95}}


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry" in sys.argv
    if not args:
        raise SystemExit(__doc__)
    folder = el.REPO / "pages" / "lessons" / args[0] / "voice"
    lines = el.load_json(folder / "lines.json")
    hp = folder / "hashes.json"
    hashes = el.load_json(hp) if hp.exists() else {}
    todo = []
    for lid, d in lines.items():
        h = hashlib.sha1((json.dumps(VOICE, sort_keys=True) + d["text"]).encode()).hexdigest()[:16]
        if hashes.get(lid) != h or not (folder / f"{lid}.mp3").exists():
            todo.append((lid, d["text"], h))
    chars = sum(len(t) for _, t, _ in todo)
    print(f"{args[0]}: {len(todo)} of {len(lines)} lines to generate ({chars} characters)")
    if dry or not todo:
        return

    import time, threading
    lock = threading.Lock()

    def gen(job):
        lid, text, h = job
        for attempt in range(5):   # dropped connections happen: retry with a back-off
            try:
                r = el.post(f"/v1/text-to-speech/{VOICE['voice_id']}?output_format=mp3_44100_128",
                            json={"text": text, "model_id": VOICE["model_id"], "voice_settings": VOICE["voice_settings"]})
                break
            except Exception as e:
                if attempt == 4: raise
                print(f"   retry {lid}: {type(e).__name__}"); time.sleep(3 * (attempt + 1))
        (folder / f"{lid}.mp3").write_bytes(r.content)
        with lock:   # save progress after every line, so a crash never loses finished lines
            hashes[lid] = h
            el.save_json(hp, hashes)
        return lid, h

    for lid, h in el.pmap(gen, todo):
        print("  ", lid)


if __name__ == "__main__":
    main()
