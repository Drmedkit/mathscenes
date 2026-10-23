// Oracle for the lesson "judging-samples" (grade 7, 7.SP.A.1: population, sample, nonresponse and selection bias,
// how far a claim may reach, auditing a report). Written from what the student sees only: the prompt (the question,
// how the data were collected, why answers are missing), the choices, and the drawn picture (the population map with
// its counts, the asked group inside / outside it, the sign-up sheet rows). The judgments are made like a careful
// teacher: which group the question is about, who gave the data, whether a left-out or missing group is linked to the
// answer and which way that pushes the share, and which claim holds whatever the unknown answers were (by counting
// every completion). The few context judgments (a reason linked to the answer, a sample that leans one way) are written
// out below as a table. See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const num = s => Number(String(s).replace(/,/g, ''));
const map = q => q.data?.pic?.map ?? null;
const lc = s => String(s).toLowerCase();
/** the study's question topic (what a "yes" means) */
function topic(p) {
  if (/phones?/.test(p)) return 'phone';
  if (/bus|Route 7/.test(p)) return 'bus';
  if (/instrument|homeroom/.test(p)) return 'instrument';
  if (/lunch menu|menu|cafeteria/.test(p)) return 'menu';
  if (/exercise|Lincoln/.test(p)) return 'exercise';
  if (/skate/.test(p)) return 'skate';
  if (/read for fun|reading|Oak Hill/.test(p)) return 'read';
  if (/sleep|Pine Ridge/.test(p)) return 'sleep';
  if (/apples?|bruise/.test(p)) return 'apple';
  return null;
}
// why answers are missing → how the missing would lean on the question: 'yes' | 'no' | 'random' | 'unknown'
const MISSING = [
  [/No one knows why/, 'unknown'],
  [/do not have a phone skipped/, 'no'],
  [/skipped on days the bus came so late/, 'yes'],
  [/band trip/, 'yes'],
  [/never buy school lunch threw the form away/, 'no'],
  [/sports practice left school early/, 'yes'],
  [/do not skate mostly never opened/, 'no'],
  [/do not like reading often left the form/, 'no'],
  [/too tired came in late/, 'no'],
  [/muddy apples are often ones that fell on the ground/, 'yes'],
  [/glitch|dropped \d+ of the forms|soaked|recycled by mistake|was lost before|thrown out by mistake|typo in the address|got wet and were thrown|blew out of a window|power cut/, 'random'],
];
const missingLean = p => MISSING.find(([re]) => re.test(p))?.[1] ?? null;
// how a sample was chosen → [the left-out group (as the choices name it), how the sample leans: 'high' | 'low' | 'unknown']
const METHOD = [
  [/late-night gaming event/, 'Kids who were home in bed', 'low'],
  [/a\.m\. swim practice/, /^Kids who are still asleep at \d+ a\.m\.$/, 'low'],
  [/sleep-tips website/, 'Kids who never visit that site', 'unknown'],
  [/kids at the gym after school/, 'Kids who go straight home after school', 'high'],
  [/kids in the library at lunch/, 'Kids who play outside at lunch', 'low'],
  [/kids on the track team/, 'Seventh graders who are not on the track team', 'high'],
  [/PE class page/, 'Kids who skipped the poll', 'unknown'],
  [/outside the skate shop/, 'Kids who do not skate', 'high'],
  [/library chess afternoon/, 'Kids who were not at the library', 'unknown'],   // chess fans vs a skate park: no reason linked to the answer
  [/poll on the town website/, 'Kids who skipped the poll', 'unknown'],
  [/phone-free nature camp/, 'Students who did not go to the camp', 'low'],
  [/gaming forum/, 'Students who never visit the forum', 'high'],
  [/on the bus ride home/, 'Students who walk or get a ride home', 'unknown'],
  [/students in the chess club/, 'Students who are not in the chess club', 'unknown'],
  [/in the cafeteria line/, 'Students who bring lunch from home', 'high'],
  [/menu committee/, 'Students who did not help choose the menu', 'high'],
  [/comment box/, 'Students who did not bother to write', 'unknown'],
  [/cards that praised the food/, 'Students whose cards complained', 'high'],
  [/members of the book club/, 'Students who are not in the book club', 'high'],
  [/students in the library at lunch/, 'Students who spend lunch somewhere else', 'high'],
  [/at a basketball game/, 'Students who did not go to the game', 'unknown'],
  [/honors English/, 'Students in the other English classes', 'high'],
  [/by the band room door/, 'Students sitting across the room', 'high'],
  [/who came in early/, 'Students who came on time', 'unknown'],
  [/stayed for music club/, 'Students who went home after class', 'high'],
  [/top layer of the crates/, 'Apples at the bottom of the crates', 'low'],
  [/fallen on the ground/, 'Apples picked from the trees', 'high'],
  [/best-looking apples/, 'The apples that looked worse', 'low'],
  [/only on the \d+ Mondays/, 'Tuesdays to Fridays', 'unknown'],
  [/only on the \d+ rainy days/, 'The dry days', 'high'],
  [/days with no complaints/, 'Days when riders complained', 'low'],
];
const method = p => METHOD.find(([re]) => re.test(p)) ?? null;
/** the sheet: one entry per person (a repeated name is one person), blanks and duplicates */
function sheet(q) {
  const rows = q.data?.pic?.table?.rows;
  if (!rows) return null;
  const seen = new Map(), dups = [];
  for (const r of rows) { if (seen.has(r.name)) dups.push(r.name); else seen.set(r.name, r.ans); }
  const vals = [...seen.values()];
  return { people: seen.size, yes: vals.filter(a => a === 'yes').length, no: vals.filter(a => a === 'no').length, blank: vals.filter(a => a === '').length, dups };
}

// ---------------------------------------------------------------- the families
const F = {
  namePop(q) {
    const M = map(q);
    if (!M) return undefined;
    return choiceWhere(q, c => { const m = c.match(/^All ([\d,]+) /); return !!m && num(m[1]) === M.N; });
  },
  popOrSample(q) {
    const M = map(q), m = q.prompt.match(/what is “(.+?)”\?$/);
    if (!M || !m) return undefined;
    const x = m[1], n0 = x.match(/^the ([\d,]+) (.+)$/);
    const question = (q.prompt.match(/“(.+?)”/) ?? [])[1] ?? '';
    const methodText = q.prompt.replace(/“.+?”/, '').replace(/In this study, what is .*$/, '');
    // the group that gave the data is named in how they collected it; the population is the group the question names
    let kind = 'neither';
    if (n0 && methodText.includes(`${n0[1]} ${n0[2]}`)) kind = 'sample';
    else if (n0 && num(n0[1]) === M.N) kind = 'pop';
    else if (n0 && num(n0[1]) === M.n) kind = 'sample';
    void question;
    return choiceWhere(q, c => (kind === 'pop' ? /^The population:/.test(c) : kind === 'sample' ? /^The sample:/.test(c) : /^Neither:/.test(c)));
  },
  matchKind(q) {
    const M = map(q);
    if (!M) return undefined;
    // drawn: the asked group fills the whole map (census), is a block inside it (part) or a box outside it (different)
    const kind = M.outsideLabel ? 'different' : M.n === M.N ? 'census' : 'part';
    return choiceWhere(q, c => {
      if (/^A census: every one of the ([\d,]+) /.test(c)) return kind === 'census' && num(c.match(/^A census: every one of the ([\d,]+)/)[1]) === M.N;
      if (/^Part of the population: some of the ([\d,]+) /.test(c)) return kind === 'part' && num(c.match(/some of the ([\d,]+)/)[1]) === M.N;
      if (/^A different group:/.test(c)) return kind === 'different';
      return false;   // "a study can only ever ask some of a group"
    });
  },
  whoGave(q) {
    const M = map(q);
    if (!M) return undefined;
    const question = (q.prompt.match(/“(.+?)”/) ?? [])[1] ?? '';
    // the choice with the number that answered, that is not the group the question is about
    return choiceWhere(q, c => {
      const m = c.match(/^The ([\d,]+) (.+)$/);
      if (!m || num(m[1]) !== M.n) return false;
      const desc = m[2].replace(/^(students|seventh graders|school days|apples|kids) /, '');
      return !(num(m[1]) === M.N && question.includes(desc.replace(/^in /, '')));
    });
  },
  missingWhy(q) {
    const p = q.prompt, lean = missingLean(p);
    if (!lean) return undefined;
    return choiceWhere(q, c => {
      let m = c.match(/^Can’t tell which way: no one knows why\. If the missing ones (.+?) (less|fewer|more) (?:than the others|.*?), the result is too (high|low)$/);
      if (m) return lean === 'unknown' && ((m[2] === 'more') ? m[3] === 'low' : m[3] === 'high');
      if (/^Not likely: why they are missing has nothing to do with the answers$/.test(c)) return lean === 'random';
      m = c.match(/^Yes: why they are missing is linked to the answer, so the result is likely too (high|low)$/);
      if (m) return (lean === 'yes' && m[1] === 'low') || (lean === 'no' && m[1] === 'high');
      return false;   // "any missing answers make it wrong", "they would answer like the others"
    });
  },
  missingWay(q) {
    const lean = missingLean(q.prompt);
    if (!lean) return undefined;
    const want = lean === 'yes' ? 'Likely too low' : lean === 'no' ? 'Likely too high' : lean === 'unknown' ? 'Can’t tell which way' : /^About right/;
    return choiceWhere(q, c => (typeof want === 'string' ? c === want : want.test(c)));
  },
  leftOut(q) {
    const m = method(q.prompt);
    if (!m) return undefined;
    return choiceWhere(q, c => (typeof m[1] === 'string' ? c === m[1] : m[1].test(c)));
  },
  biasWay(q) {
    const m = method(q.prompt);
    if (!m) return undefined;
    const want = m[2] === 'high' ? 'Likely too high' : m[2] === 'low' ? 'Likely too low' : 'Can’t tell which way, even though we know who is left out';
    return choiceWhere(q, c => c === want);
  },
  scope(q) {
    const p = q.prompt, M = map(q);
    const r = p.match(/\. ([\d,]+) of the ([\d,]+) (?:said yes|are bruised|had a late bus)\. Which conclusion can they state\?/);
    if (!M || !r) return undefined;
    const k = num(r[1]), n = num(r[2]);
    const census = !M.outsideLabel && M.n === M.N;
    const kind = census ? 'census' : M.outsideLabel ? 'different' : /the report does not say how they were chosen/.test(p) ? 'unknown' : 'part';
    return choiceWhere(q, c => {
      if (kind === 'census') {
        let x = c.match(/^Most of the ([\d,]+) /);
        if (x) return num(x[1]) === M.N && k * 2 > M.N;
        x = c.match(/^([\d,]+) of the ([\d,]+) (?!studied)/);
        if (x && !/;/.test(c)) return num(x[1]) === k && num(x[2]) === M.N;
        return false;
      }
      const x = c.match(/^([\d,]+) of the ([\d,]+) .+?; (.+)$/);
      if (!x || num(x[1]) !== k || num(x[2]) !== n) return false;
      if (kind === 'unknown') return /^to say more we need to know how they were chosen$/.test(x[3]);
      if (kind === 'part') return /^it may not hold for the rest$/.test(x[3]);
      return /^it says nothing sure about the /.test(x[3]);
    });
  },
  complete(q) {
    const p = q.prompt;
    const m = p.match(/(\d+) (?:said yes|had a late bus|are bruised), (\d+) (?:said no|did not|are not), and (\d+) (?:gave no answer|have no record|got no reading)\. Can they state this for the whole group: “(.+?)”\?/);
    if (!m) return undefined;
    const yes = +m[1], no = +m[2], miss = +m[3], N = yes + no + miss;
    const claim = m[4];
    const holds = y => {
      if (/^More than half /.test(claim)) return 2 * y > N;
      if (/^At most half /.test(claim)) return 2 * y <= N;
      if (/^At least half /.test(claim)) return 2 * y >= N;
      if (/^Fewer than half |^Less than half /.test(claim)) return 2 * y < N;
      let x = claim.match(/^At least (\d+) /);
      if (x) return y >= +x[1];
      x = claim.match(/^At most (\d+) /);
      if (x) return y <= +x[1];
      return null;
    };
    const outs = [];
    for (let y = yes; y <= yes + miss; y++) outs.push(holds(y));
    if (outs.some(v => v === null)) return undefined;
    const all = outs.every(Boolean), none = outs.every(v => !v);
    return choiceWhere(q, c => {
      if (/^Yes: it is true however the missing ones would have answered$/.test(c)) return all;
      if (/^No: it is false however the missing ones would have answered$/.test(c)) return none;
      if (/^No: it could be true or false, depending on the missing answers$/.test(c)) return !all && !none;
      return false;   // "the answers we have already show it" ignores the missing; "nothing can be said"
    });
  },
  revise(q) {
    const p = q.prompt, S = sheet(q);
    const g = p.match(/Every member of the (.+?) \((\d+) people\) got the sign-up sheet/);
    if (!S || !g) return undefined;
    const N = +g[2], notOnSheet = N - S.people;
    const lo = S.yes, hi = S.yes + S.blank + Math.max(0, notOnSheet), exact = lo === hi;
    return choiceWhere(q, c => {
      let x;
      if ((x = c.match(/^(\d+) of the (\d+) members .+?: (.+?) was counted twice$/))) return +x[2] === N && exact && +x[1] === lo && S.dups.includes(x[3]);
      if ((x = c.match(/^Still true: without (.+?)’s second row, (\d+) of (\d+) is more than half$/))) return S.dups.includes(x[1]) && +x[2] === lo && +x[3] === N && 2 * lo > N;
      if ((x = c.match(/^Still true: (\d+) signed yes$/))) return +x[1] === lo && 2 * lo > N;
      if ((x = c.match(/^Not shown: (\d+) to (\d+) of (\d+) yes, so it depends on the blanks$/))) return +x[1] === lo && +x[2] === hi && +x[3] === N && 2 * lo <= N && 2 * hi > N;
      if ((x = c.match(/^False: at most (\d+) of (\d+),? not more than half$/))) return +x[1] === hi && +x[2] === N && 2 * hi <= N;
      if ((x = c.match(/^Still true: at least (\d+) of (\d+) after the fixes, more than half$/))) return +x[1] === lo && +x[2] === N && 2 * lo > N;
      if ((x = c.match(/^Exactly (\d+) of the (\d+) .+, as the report says$/))) return exact && +x[1] === lo && +x[2] === N;
      if ((x = c.match(/^At least (\d+) of the (\d+) .+; (\d+) left it blank$/))) return +x[1] === lo && +x[2] === N && +x[3] === S.blank && S.blank > 0;
      if ((x = c.match(/^(\d+) of the (\d+) members [^:]+$/))) return exact && +x[1] === lo && +x[2] === N;
      return false;   // "a duplicate means nothing can be trusted", "two problems", "the blanks answer like the rest", "messy"
    });
  },
  audit(q) {
    const p = q.prompt, S = sheet(q);
    const asked = p.match(/“(.+?)” The report says: “(.+?)”/);
    if (!asked) return undefined;
    const ask = asked[1], claim = asked[2];
    const problems = new Set();
    if (/^Only the (?:members|players) /.test(p.split('. ')[1] ?? '')) problems.add('chosen');
    if (/everywhere|across the state|whole city|across the country/.test(claim)) problems.add('group');
    const askEvery = /every day|daily/.test(ask), askOnce = /today|yesterday|this weekend|this week/.test(ask);
    if (askOnce && (/every day|daily|have a pet|play a second instrument|walk to school/.test(claim))) problems.add('measured');
    if (!askEvery && /every day/.test(claim) && !askOnce) problems.add('measured');
    const cnt = claim.match(/^(\d+) of the (\d+) members/);
    if (S && cnt && (S.dups.length || S.blank)) problems.add('rows');
    if (S && cnt && !S.dups.length && !S.blank && +cnt[1] !== S.yes) problems.add('rows?');
    if (problems.size !== 1) return -1;
    const kind = [...problems][0];
    return choiceWhere(q, c => (kind === 'chosen' ? c === 'How the group was chosen' : kind === 'group' ? c === 'The group the claim is stated for' : kind === 'measured' ? c === 'What was measured' : kind === 'rows' ? c === 'Repeated or blank rows on the sheet' : false));
  },
};

// ---------------------------------------------------------------- sane
function sane(q) {
  const out = [], p = q.prompt, M = map(q);
  if (M) {
    if (M.n > M.N && !M.outsideLabel) out.push('a sample bigger than the population');
    if (M.answered !== undefined && M.answered > M.n) out.push('more answers than people asked');
    if (M.yes !== undefined && M.answered !== undefined && M.yes > M.answered) out.push('more yes than answers');
    const k = p.match(/([\d,]+) (?:came back|answered|forms came back|got a reading|days have a time written down); ([\d,]+) (?:did not|got none|days are blank)/);
    if (k && M.answered !== undefined && (num(k[1]) !== M.answered || num(k[1]) + num(k[2]) !== M.N)) out.push('the counts in the story do not match the picture');
  }
  if (/asked \d+ school days|asked \d+ apples/.test(p)) out.push('days or apples are "asked"');
  if (q.family === 'revise' || q.family === 'audit') {
    const S = sheet(q), g = p.match(/\((\d+) people\)/);
    if (S && g && S.people > +g[1]) out.push('more people on the sheet than in the group');
    const rows = q.data?.pic?.table?.rows ?? [];
    const by = {};
    for (const r of rows) (by[r.name] ??= new Set()).add(r.ans);
    if (Object.values(by).some(s => s.size > 1)) out.push('a repeated name with two different answers');
  }
  if (q.input === 'choice') {
    let r; try { r = F[q.family]?.(q); } catch { r = undefined; }
    if (r === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    try { return f(q); } catch { return undefined; }
  },
  sane,
};
