"""lesson-scaffold.py: the mechanical files of a new topic, so the builder starts on the maths, not on boilerplate.

    python tools/lesson-scaffold.py <slug>          (the slug must be a row of pages/lessons/topics.json)

Writes (never overwrites an existing file):
  pages/lessons/<slug>.html                        the page shell (header, rail, canvas, panel, voice switch)
  src/lesson/topics/<slug>/plan.ts                 every sub-goal of the topic JSON in order, families still empty
  tests/lesson-<slug>.test.ts                      the generic checks every topic needs (extend with your own)
  pages/lessons/<slug>/voice/lines.json            an empty voice file
and prints the topic's sub-goals and the misconception ids that name it (for DESIGN.md and items.ts).
"""
import json, sys, pathlib, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
ESS = ROOT.parent / "math-curriculum-essentials"
if len(sys.argv) < 2:
    raise SystemExit(__doc__)
slug = sys.argv[1]
row = next((t for t in json.loads((ROOT / "pages/lessons/topics.json").read_text(encoding="utf-8")) if t["slug"] == slug), None)
if not row:
    raise SystemExit(f"{slug}: not in pages/lessons/topics.json")
topic = json.loads((ESS / "topics" / f"{row['id']}.json").read_text(encoding="utf-8"))
mcs = [m for m in json.loads((ESS / "misconceptions.json").read_text(encoding="utf-8"))["misconceptions"]
       if any(str(u).startswith(row["id"]) for u in (m.get("used_by") or []))]


def write(rel, text):
    p = ROOT / rel
    if p.exists():
        print(f"  keep  {rel}")
        return
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")
    print(f"  wrote {rel}")


title = html.escape(row["title"])
write(f"pages/lessons/{slug}.html", f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="icon" href="data:,">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <link rel="stylesheet" href="./lesson.css">
</head>
<body>
  <header class="top">
    <h1><a class="home" href="./index.html" aria-label="All lessons">Math 7–8</a> · {title}</h1>
    <nav id="rail" aria-label="Lesson parts"></nav>
    <div id="tools"></div>
  </header>
  <main class="lesson">
    <div class="stage"><canvas id="cv" aria-label="The model and the notation board"></canvas></div>
    <aside class="panel" id="panel" aria-live="polite"></aside>
  </main>
  <script type="module" src="./{slug}.ts"></script>
</body>
</html>
""")

sg = "\n".join(f"  {{ id: '{s['id']}', title: {json.dumps(s['title'][:60])}, families: [] }},   // TODO families" for s in topic["subgoals"])
write(f"src/lesson/topics/{slug}/plan.ts", f"""// plan.ts: practice walks through every sub-goal of {row['id']}, in topic JSON order.
// Give each sub-goal a short kid-friendly title and the families that practise it (every sub-goal needs >= 1).
import type {{ SubgoalPlan }} from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
{sg}
];
""")

write(f"tests/lesson-{slug}.test.ts", f"""// lesson-{slug}: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import {{ describe, expect, it }} from 'vitest';
import fs from 'node:fs';
import {{ rng }} from '../src/lesson/runtime/item';
import {{ GENERATORS }} from '../src/lesson/topics/{slug}/items';
import {{ PLAN }} from '../src/lesson/topics/{slug}/plan';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/{row['id']}.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: {{ id: string }}) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('{slug}: plan', () => {{
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {{
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: {{ id: string }}) => s.id));
    for (const p of PLAN) {{ expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }}
  }});
}});

describe('{slug}: families', () => {{
  for (const p of PLAN) for (const f of p.families) {{
    it(`${{p.id}} / ${{f}}: 300 seeds`, () => {{
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {{
        const item = GEN[f]!(rng(s * 31 + 7), s, p.id);
        expect(item.check(item.answer).ok, `${{item.prompt}} ${{JSON.stringify(item.answer)}}`).toBe(true);
        if (item.choices) {{
          expect(new Set(item.choices).size, item.prompt).toBe(item.choices.length);
          expect(item.choices.filter((_, i) => item.check({{ kind: 'choice', i }}).ok).length, item.prompt).toBe(1);
          item.choices.forEach((_, i) => {{ const mc = item.check({{ kind: 'choice', i }}).mc; if (mc) expect(CATALOG.has(mc), mc).toBe(true); }});
        }}
        seen.add(item.prompt + '|' + item.board);
      }}
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    }});
  }}
}});
""")

write(f"pages/lessons/{slug}/voice/lines.json", "{}\n")

print(f"\n{row['id']}  ({len(topic['subgoals'])} sub-goals, {len(mcs)} misconceptions)")
for s in topic["subgoals"]:
    print(f"  - {s['id']}: {s['title']}")
print("misconceptions:")
for m in mcs:
    print(f"  - {m['id']}: {m.get('name', '')}")
