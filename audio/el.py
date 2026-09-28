"""el.py: small shared helpers for the audio tools (ElevenLabs API, project folders, ffmpeg, JSON).

- The API key comes ONLY from the environment: ELEVENLABS_API_KEY, or a `.env` file (repo root or the current folder;
  see .env.example). It is never printed, logged or written anywhere. `.env` is in .gitignore.
- The key is only needed when something is actually generated: every tool has a `--dry` mode that works without it.
- credits() -> remaining characters/credits (check before big generations: keys may have a spending cap).
- post() retries on 429 (many plans allow only 2 concurrent requests) and raises readable errors.
- pmap(fn, items): at most 2 requests in parallel.

A PROJECT is one video folder (see examples/ratio):
    <project>/data/narration.json   the script                    (you write it)
    <project>/data/words.json       word + cue timings            (narrate.py writes it)
    <project>/data/sfx.json         sound effect prompts          (you write it)
    <project>/data/music.json       optional music bed plan       (you write it)
    <project>/data/mix.json         bed + voice + sfx events      (you write it)
    <project>/media/                generated audio (git-ignored): narration.wav, narration_cache/, sfx/, bed.mp3,
                                    variants/, final_mix.wav
"""
import os, sys, time, json, pathlib, shutil, concurrent.futures as cf

REPO = pathlib.Path(__file__).resolve().parent.parent
AUDIO_DIR = pathlib.Path(__file__).resolve().parent
API = "https://api.elevenlabs.io"

try:                                                   # optional: the tools also work with plain env vars
    from dotenv import load_dotenv, find_dotenv
    load_dotenv(REPO / ".env")
    load_dotenv(find_dotenv(usecwd=True))
except ImportError:
    pass


class Project:
    """paths of one video project folder"""

    def __init__(self, path):
        self.root = pathlib.Path(path).resolve()
        if not (self.root / "data").is_dir():
            raise SystemExit(f"{self.root}: not a project folder (expected a data/ folder with narration.json, mix.json, ...)")
        self.name = self.root.name
        self.data = self.root / "data"
        self.media = self.root / "media"

    def json(self, name, required=True):
        p = self.data / f"{name}.json"
        if not p.exists():
            if required: raise SystemExit(f"{p} not found")
            return None
        return load_json(p)

    def path(self, rel):
        """a path from a config file: relative to the project folder"""
        return self.root / rel


def key():
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not k:
        raise SystemExit("ELEVENLABS_API_KEY is not set. Copy .env.example to .env and put your key there "
                         "(or export the variable). Use --dry to see what would be generated without a key.")
    return k


def credits():
    import requests
    d = requests.get(f"{API}/v1/user/subscription", headers={"xi-api-key": key()}, timeout=30).json()
    return d["character_limit"] - d["character_count"]


def post(path, retries=6, **kw):
    import requests
    kw.setdefault("timeout", 600)
    headers = {"xi-api-key": key(), **kw.pop("headers", {})}
    for i in range(retries):
        r = requests.post(f"{API}{path}", headers=headers, **kw)
        if r.status_code == 429:           # concurrency / rate limit: back off and retry
            time.sleep(4 * (i + 1))
            continue
        if r.status_code != 200:
            raise RuntimeError(f"{path}: HTTP {r.status_code} {r.text[:400]}")
        return r
    raise RuntimeError(f"{path}: still rate-limited after {retries} tries")


def pmap(fn, items, workers=2):
    with cf.ThreadPoolExecutor(workers) as ex:
        return list(ex.map(fn, items))


def ffmpeg():
    """ffmpeg: $FFMPEG, then PATH, then (Windows) a WinGet Gyan.FFmpeg install"""
    env = os.environ.get("FFMPEG")
    if env and pathlib.Path(env).exists():
        return env
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    if sys.platform == "win32":
        import glob
        hits = glob.glob(os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\ffmpeg-*\bin\ffmpeg.exe"))
        if hits:
            return hits[0]
    raise SystemExit("ffmpeg not found: install it (https://ffmpeg.org) and put it on PATH, or set FFMPEG=/path/to/ffmpeg")


def load_json(p):
    return json.loads(pathlib.Path(p).read_text(encoding="utf-8"))


def save_json(p, d):
    pathlib.Path(p).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(p).write_text(json.dumps(d, indent=1, ensure_ascii=False), encoding="utf-8")
