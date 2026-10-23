// Oracle for the lesson "probability" (grade 7: the 0–1 scale, sample spaces, events, theoretical and experimental
// probability, complements, expected counts, chance variation, simulation, compound events). Written from what the
// student sees only: the prompt (bags, cubes, spinners, data, digit strings), the board, the choices and the drawn
// picture (the batch dots of a fair model). Probabilities are counted exactly (favorable over equally likely outcomes,
// compound events by listing every outcome); conceptual choices are judged by testing each claim. See
// docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
const val = s => { const t = String(s).trim().replace(/−/g, '-'); let m = t.match(/^(-?\d+(?:\.\d+)?)%$/); if (m) return Q(m[1]).div(100); if (!/^-?\d+(?:\.\d+)?$|^-?\d+\/\d+$/.test(t)) return null; try { return Q(t); } catch { return null; } };
/** "2 gray, 1 blue and 1 pink marbles" → [{ c: 'gray', n: 2 }, ...] */
function bag(p) {
  const m = p.match(/(?:holds|of) ((?:\d+ [a-z]+(?:, | and )?)+?) marbles/);
  if (!m) return null;
  return [...m[1].matchAll(/(\d+) ([a-z]+)/g)].map(x => ({ c: x[2], n: +x[1] }));
}
const total = B => B.reduce((s, x) => s + x.n, 0);
const setOf = c => { const t = String(c).trim(); if (/^\{\s*\}(?: \(no outcomes\))?$/.test(t)) return []; const m = t.match(/^\{ (.*) \}$/); return m ? m[1].split(', ').map(s => s.trim()) : null; };
const sameSet = (a, b) => a && b && a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
/** the outcomes 1..n of a cube / spinner that make an event, from its words */
function eventNums(ev, n) {
  const all = Array.from({ length: n }, (_, i) => i + 1);
  let m;
  ev = ev.trim().replace(/^(?:rolling |spinning )/, '');
  if (/^an even number$|^even$/.test(ev)) return all.filter(x => x % 2 === 0);
  if (/^an odd number$|^odd$/.test(ev)) return all.filter(x => x % 2 === 1);
  if ((m = ev.match(/^(?:a number )?(?:greater|more) than (\d+)$/))) return all.filter(x => x > +m[1]);
  if ((m = ev.match(/^(?:a number )?less than (\d+)$/))) return all.filter(x => x < +m[1]);
  if ((m = ev.match(/^at most (\d+)$/))) return all.filter(x => x <= +m[1]);
  if ((m = ev.match(/^at least (\d+)$/))) return all.filter(x => x >= +m[1]);
  if ((m = ev.match(/^a multiple of (\d+)$/))) return all.filter(x => x % +m[1] === 0);
  if ((m = ev.match(/^not an? (\d+)$/))) return all.filter(x => x !== +m[1]);
  if ((m = ev.match(/^an? (\d+)$|^(\d+)$/))) return all.filter(x => x === +(m[1] ?? m[2]));
  return null;
}
/** the word for a probability on the 0–1 scale */
const word = v => (v.eq(0) ? 'Impossible' : v.eq(1) ? 'Certain' : v.eq(Q(1, 2)) ? 'As likely as not' : v.cmp(Q(1, 2)) < 0 ? 'Unlikely' : 'Likely');
/** every sequence of k coin tosses */
const tosses = k => (k === 0 ? [''] : tosses(k - 1).flatMap(s => [s + 'H', s + 'T']));
/** the digits a phrase names: "0 to 3", "0, 1 and 2", "0 and 1", "only 2", "6" */
function digitsOf(s) {
  s = String(s).trim();
  let m = s.match(/^(?:digits )?(\d) to (\d)$/i);
  if (m) { const out = []; for (let d = +m[1]; d <= +m[2]; d++) out.push(d); return out; }
  m = s.match(/^(?:digits )?only (\d)$/i);
  if (m) return [+m[1]];
  const L = s.replace(/^digits /i, '').split(/, | and /).map(x => x.trim());
  return L.every(x => /^\d$/.test(x)) ? L.map(Number) : null;
}

// ---------------------------------------------------------------- the families
const F = {
  scale(q) {
    const p = q.prompt;
    let m = p.match(/^The forecast says a (\d+)% chance of ([a-z ]+?) today \(that is (\d+) out of 100\)\. (.+?)\. Was the forecast wrong\?/);
    if (m) {
      const pc = +m[1], like = pc > 50 ? 'likely' : pc < 50 ? 'unlikely' : null, edge = pc > 50 ? 'certain' : 'impossible';
      return choiceWhere(q, c => { const x = c.match(/^No\. (\d+) out of 100 makes [a-z ]+? (likely|unlikely), not (certain|impossible)\.$/); return !!x && +x[1] === pc && x[2] === like && x[3] === edge && pc > 0 && pc < 100; });
    }
    m = p.match(/^P\(.+?\) = (\S+?)(?: \(that is \S+\))?\. Which word fits\?$/);
    if (m) { const v = val(m[1]); return v ? choiceWhere(q, c => c === word(v)) : undefined; }
    m = p.match(/^How likely is (.+?)\?$/);
    if (!m) return undefined;
    const e = m[1];
    let v = null, x;
    if ((x = e.match(/^rolling (.+?) on a number cube$/))) { const s = eventNums(x[1], 6); v = s && Q(s.length, 6); }
    else if ((x = e.match(/^spinning a (\d+) on a spinner with (\d+) equal parts numbered 1 to \2$/))) v = Q(+x[1] >= 1 && +x[1] <= +x[2] ? 1 : 0, +x[2]);
    else if ((x = e.match(/^picking a ticket with a name on it from a hat of (\d+) name tickets$/))) v = Q(1);
    else if ((x = e.match(/^a spinner with (\d+) equal parts, (\d+) of them striped, landing on a striped part$/))) v = Q(+x[2], +x[1]);
    else if (/^a fair coin landing (heads|tails)$/.test(e)) v = Q(1, 2);
    else if ((x = e.match(/^pulling (?:a|the) ([a-z]+) marble from a bag of (\d+) ([a-z]+) marbles and (\d+) ([a-z]+)$/))) v = Q(x[1] === x[3] ? +x[2] : x[1] === x[5] ? +x[4] : 0, +x[2] + +x[4]);
    else if ((x = e.match(/^pulling a ([a-z]+) marble from a bag that holds only ([a-z]+) and ([a-z]+) marbles$/))) v = Q(x[1] === x[2] || x[1] === x[3] ? 1 : 0, 1);
    return v ? choiceWhere(q, c => c === word(v)) : undefined;
  },
  space(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/^A spinner has (\d+) equal parts, numbered 1 to \1\. How many outcomes/))) return +m[1];
    if ((m = p.match(/from a class list of (\d+) students\. How many outcomes/))) return +m[1];
    if (/each with its own number sticker\. You record which marble you pull\. How many outcomes/.test(p)) { const B = bag(p); return B ? total(B) : undefined; }
    if (/^A number cube has been rolled .+ What is the sample space for one roll\?/.test(p)) return choiceWhere(q, c => sameSet(setOf(c), ['1', '2', '3', '4', '5', '6']));
    if (/You pull one and write down its color\. What is the sample space\?/.test(p)) { const B = bag(p); return B ? choiceWhere(q, c => sameSet(setOf(c), B.filter(x => x.n > 0).map(x => x.c))) : undefined; }
    if (/Each marble has its own number sticker .+ write down which marble it is\. What is the sample space\?/.test(p)) {
      const B = bag(p);
      if (!B) return undefined;
      const S = B.flatMap(x => { const L = x.c[0].toUpperCase(); return x.n === 1 ? [L] : Array.from({ length: x.n }, (_, i) => `${L}_${i + 1}`); });
      return choiceWhere(q, c => sameSet(setOf(c), S));
    }
    return undefined;
  },
  event(q) {
    const p = q.prompt;
    let m = p.match(/^Roll a number cube\. (Which|How many) outcomes make up the event “(.+?)”\?/);
    if (m) {
      const s = eventNums(m[2], 6);
      if (!s) return undefined;
      return m[1] === 'How many' ? s.length : choiceWhere(q, c => sameSet(setOf(c), s.map(String)));
    }
    m = p.match(/each with its own sticker: \{ (.+?) \}\. Which outcomes make up the event “the marble is ([a-z]+)”\?/);
    if (m) {
      const L = m[2][0].toUpperCase(), S = m[1].split(', ').filter(s => s === L || s.startsWith(L + '_'));
      return choiceWhere(q, c => sameSet(setOf(c), S));
    }
    return undefined;
  },
  equal(q) {
    const p = q.prompt;
    let kind;
    if (/^A (?:fair number cube|fair coin)/.test(p) || /identical tickets/.test(p) || /each with its own number sticker, is mixed/.test(p)) kind = 'eq';
    else if (/weight hidden inside/.test(p)) kind = 'not';
    else if (/^A spinner has \d+ equal parts: [a-z, ]+\. The outcomes are the \d+ colors/.test(p)) { const parts = p.match(/equal parts: ([a-z, ]+)\./)[1].split(/, | and |,? and /); kind = new Set(parts).size === parts.length ? 'eq' : 'not'; }
    else if (/^A spinner is (.+?)\. The outcomes/.test(p)) { const parts = [...p.matchAll(/\b(half|one third|one sixth|one quarter|a quarter|one fourth|two thirds)\b/g)].map(x => x[1]); kind = new Set(parts).size > 1 ? 'not' : 'eq'; }
    else if (/^A bag of .+ marbles is mixed, and you pull one\. The outcomes are the colors/.test(p)) { const B = bag(p); kind = B && B.every(x => x.n === B[0].n) ? 'eq' : 'not'; }
    else if (/thumbtack|paper cup|water bottle|bottle is flipped/.test(p)) kind = 'data';
    else return undefined;
    return choiceWhere(q, c => (kind === 'eq' ? /^Equally likely:/.test(c) : kind === 'not' ? /^Not equally likely:/.test(c) : /^Can.t tell without data:/.test(c)));
  },
  relFreq(q) {
    const p = q.prompt;
    let m = p.match(/The results: (.+)\. What is the experimental probability of (.+?)\?$/);
    if (m) {
      const R = [...m[1].matchAll(/([a-z ]+?) (\d+)(?:, |$)/g)].map(x => ({ k: x[1].trim(), n: +x[2] }));
      const t = R.reduce((s, x) => s + x.n, 0), r = R.find(x => x.k === m[2]);
      return r ? Q(r.n, t).pair : undefined;
    }
    m = p.match(/What does (\d+)\/(\d+) tell you about P\((.+?)\)\?$/);
    if (m) return choiceWhere(q, c => /^It is an estimate: another \d+ trials would likely give a slightly different share\.$/.test(c) && +c.match(/another (\d+)/)[1] === +m[2]);
    return undefined;
  },
  theory(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/^A class has (\d+) girls and (\d+) boys\. .+? What is P\((girl|boy)\)\?/))) return Q(m[3] === 'girl' ? +m[1] : +m[2], +m[1] + +m[2]).pair;
    if ((m = p.match(/^A bag holds .+? marbles\. You pull one without looking\. What is P\((not )?([a-z]+)\)\?/))) {
      const B = bag(p), t = total(B), k = B.find(x => x.c === m[2])?.n ?? 0;
      return Q(m[1] ? t - k : k, t).pair;
    }
    if ((m = p.match(/^A spinner has (\d+) equal parts, numbered 1 to \1\. What is P\((.+?)\)\?/))) { const s = eventNums(m[2], +m[1]); return s ? Q(s.length, +m[1]).pair : undefined; }
    if ((m = p.match(/^Tickets numbered 1 to (\d+) are mixed in a box, and one is pulled\. What is P\((.+?)\)\?/))) { const s = eventNums(m[2], +m[1]); return s ? Q(s.length, +m[1]).pair : undefined; }
    if ((m = p.match(/^Roll a (?:fair )?number cube\. What is the probability of (?:rolling )?(.+?)\?$/))) {
      const s = eventNums(m[1], 6);
      if (!s) return undefined;
      const v = Q(s.length, 6);
      return q.input === 'choice' ? choiceWhere(q, c => val(c)?.eq(v)) : v.pair;
    }
    return undefined;
  },
  model(q) {
    const p = q.prompt;
    if (/Which table could be a complete probability model/.test(p)) {
      return choiceWhere(q, c => {
        const v = [...c.matchAll(/[A-Z]: (−?\d+\/\d+|−?\d+(?:\.\d+)?)/g)].map(x => val(x[1]));
        return v.length > 0 && v.every(x => x && x.cmp(0) >= 0 && x.cmp(1) <= 0) && v.reduce((s, x) => s.add(x), Q(0)).eq(1);
      });
    }
    if (/gives P\(.+?\) = 0\/\d+\. What does that mean\?/.test(p)) return choiceWhere(q, c => /^It is an estimate: in \d+ tosses it didn.t happen, but it still could\.$/.test(c));
    const m = p.match(/The model(?: from the data)?: (.+?)\. What is P\(.+?\)/);
    if (m) { const v = [...m[1].matchAll(/= (\d+\/\d+|\d+(?:\.\d+)?)/g)].map(x => val(x[1])); return Q(1).sub(v.reduce((s, x) => s.add(x), Q(0))).pair; }
    return undefined;
  },
  complement(q) {
    const p = q.prompt;
    let m = p.match(/P\([^)]*\) = (\d+\/\d+)\. What is P\(not .+?\)\?|P\([^)]*\) = (\d+\/\d+)\. What is P\(no .+?\)\?/);
    if (m) return Q(1).sub(val(m[1] ?? m[2])).pair;
    m = p.match(/a (\d+(?:\.\d+)?)% chance of [a-z ]+ \(that is \d+ out of 100\)\. What is the chance of no [a-z ]+\?/);
    if (m) return 100 - +m[1];
    return undefined;
  },
  forms(q) {
    const p = q.prompt;
    let m = p.match(/^P\(.+?\) = (\S+?)\. Which is the same probability\?$/);
    if (m) { const v = val(m[1]); return choiceWhere(q, c => { const x = c.match(/^(\S+), or (\S+)$/); return !!x && val(x[1])?.eq(v) && val(x[2])?.eq(v); }); }
    if (/^Which of these numbers could be a probability\?$/.test(p)) return choiceWhere(q, c => { const v = val(c); return !!v && v.cmp(0) >= 0 && v.cmp(1) <= 0; });
    m = p.match(/^Three events: P\(A\) = (\S+), P\(B\) = (\S+), P\(C\) = (\S+?)\. Which event is (most|least) likely\?$/);
    if (m) {
      const v = [m[1], m[2], m[3]].map(val), best = m[4] === 'most' ? v.reduce((a, b) => (b.cmp(a) > 0 ? b : a)) : v.reduce((a, b) => (b.cmp(a) < 0 ? b : a));
      return choiceWhere(q, c => { const x = c.match(/^Event ([ABC])$/); return !!x && v['ABC'.indexOf(x[1])].eq(best); });
    }
    m = p.match(/^P\((.+?)\) = (\S+?)\. What is P\(no .+?\)\?$/);
    if (m) { const v = Q(1).sub(val(m[2])); return choiceWhere(q, c => val(c)?.eq(v)); }
    return undefined;
  },
  predict(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/landed [a-z ]+? (\d+) times in (\d+) tosses\. About how many times would it land [a-z ]+? in (\d+) tosses\?/))) return Q(+m[1], +m[2]).mul(+m[3]).value;
    if ((m = p.match(/lands on [a-z]+ (\d+\/\d+|\d+%) of the time\. About how many of the next (\d+) spins/))) return val(m[1]).mul(+m[2]).value;
    if ((m = p.match(/is late (\d+%|\d+\/\d+) of the days\. About how many of the next (\d+) school days/))) return val(m[1]).mul(+m[2]).value;
    if ((m = p.match(/makes (\d+%|\d+\/\d+) of her free throws\. About how many of her next (\d+) shots/))) return val(m[1]).mul(+m[2]).value;
    if ((m = p.match(/A number cube is rolled (\d+) times\. About how many times do you expect (.+?)\?/))) {
      const parts = m[2].split(/, | or /).map(s => eventNums(/^\d+$/.test(s.trim()) ? s.trim() : s, 6));
      if (parts.some(s => !s)) return undefined;
      return Q(new Set(parts.flat()).size, 6).mul(+m[1]).value;
    }
    if ((m = p.match(/is (?:tossed|rolled) (\d+) times\. Which prediction for the number of times you get (.+?) is best\?/))) {
      return choiceWhere(q, c => /^About \d+, maybe a few more or fewer\.$/.test(c));
    }
    return undefined;
  },
  nonUniform(q) {
    const p = q.prompt;
    let m = p.match(/has (\d+) equal parts: (\d+) of them are marked ([A-Z]), the others .+?\. What is P\(([A-Z])\)\?/);
    if (m && m[3] === m[4]) return Q(+m[2], +m[1]).pair;
    m = p.match(/cut into (\d+) equal parts: (.+?)\. What is P\((.+?)\)\?/);
    if (m) {
      const cov = Object.fromEntries([...m[2].matchAll(/([A-Z]) covers (\d+)/g)].map(x => [x[1], +x[2]]));
      const ev = m[3].split(' or ').map(s => s.trim());
      return Q(ev.reduce((s, k) => s + (cov[k] ?? 0), 0), +m[1]).pair;
    }
    m = p.match(/flipped (\d+) times: (.+?)\. Using these data as the model, what is P\((.+?)\)\?/);
    if (m) {
      const R = Object.fromEntries([...m[2].matchAll(/([a-z ]+?) (\d+)(?:, |$)/g)].map(x => [x[1].trim(), +x[2]]));
      const ev = m[3].split(' or ').map(s => s.trim());
      return Q(ev.reduce((s, k) => s + (R[k] ?? NaN), 0), +m[1]).pair;
    }
    return undefined;
  },
  batches(q) {
    const p = q.prompt;
    let m = p.match(/^([A-Z][a-z]+) tossed a coin (\d+) times and got (\d+) heads\. ([A-Z][a-z]+) tossed it (\d+) times and got (\d+) heads\. Whose share of heads is closer to 1\/2\?/);
    if (m) {
      const a = Q(+m[3], +m[2]).sub(Q(1, 2)), b = Q(+m[6], +m[5]).sub(Q(1, 2));
      const da = Math.abs(a.value), db = Math.abs(b.value);
      return choiceWhere(q, c => (c.startsWith(m[1]) ? da < db : c.startsWith(m[4]) ? db < da : /same distance/.test(c) ? da === db : false));
    }
    if (/each toss a fair coin \d+ times\. .+ Why are the counts different\?/.test(p)) return choiceWhere(q, c => /^Chance: every batch of \d+ tosses varies, even with the same fair coin\.$/.test(c));
    return undefined;
  },
  longRun(q) {
    const p = q.prompt;
    if (/The chart shows the share of heads as a fair coin is tossed/.test(p)) return choiceWhere(q, c => /^The share swings a lot at first, then settles near 1\/2\. It can still drift away for a while\.$/.test(c));
    if (/more likely to be far from 1\/2: the share after (\d+) tosses, or after ([\d,]+) tosses\?/.test(p)) {
      const m = p.match(/after (\d+) tosses, or after ([\d,]+) tosses/);
      return choiceWhere(q, c => c === `After ${m[1]} tosses`);
    }
    const m = p.match(/^After (\d+) tosses there (?:were|was) (\d+) heads? .+? After ([\d,]+) tosses there (?:were|was) (\d+) heads? .+? Which share is closer to 1\/2\?/);
    if (m) {
      const n2 = +m[3].replace(/,/g, '');
      const d1 = Math.abs(+m[2] / +m[1] - 0.5), d2 = Math.abs(+m[4] / n2 - 0.5);
      return choiceWhere(q, c => {
        const x = c.match(/^After ([\d,]+) tosses: (\S+) is closer to (\S+) than (\S+)$/);
        if (x) { const n = +x[1].replace(/,/g, ''); const mine = n === +m[1] ? d1 : d2, other = n === +m[1] ? d2 : d1; return mine < other && Math.abs(+x[2] - (n === +m[1] ? +m[2] / +m[1] : +m[4] / n2)) < 1e-9 && +x[3] === 0.5; }
        if (/equally close/.test(c)) return d1 === d2;
        return false;   // "3 away is closer than 18 away" compares counts, not shares
      });
    }
    return undefined;
  },
  streak(q) {
    const p = q.prompt;
    let v = null;
    if (/^A fair coin has landed/.test(p)) v = Q(1, 2);
    else if (/^A fair number cube has not shown a (\d)/.test(p)) v = Q(1, 6);
    else if (/put it back and mix/.test(p)) { const B = bag(p), m = p.match(/What is P\(([a-z]+)\) on the next pull\?/); if (B && m) v = Q(B.find(x => x.c === m[1])?.n ?? 0, total(B)); }
    if (!v) return undefined;
    return choiceWhere(q, c => { const x = c.match(/^(\d+\/\d+)(?:, the same as .*)?$/); return !!x && val(x[1]).eq(v); });
  },
  discrepancy(q) {
    const P = q.data?.pic;
    if (!P?.ref || P.obs === undefined) return undefined;
    const ref = P.ref, obs = P.obs, mean = ref.reduce((s, x) => s + x, 0) / ref.length;
    const above = obs >= mean;
    // as extreme as the result, on its own side of the centre
    const k = ref.filter(x => (above ? x >= obs : x <= obs)).length;
    return choiceWhere(q, c => {
      let x = c.match(/^Not unusual: (\d+) of the (\d+) batches got (\d+) or (more|fewer), so chance can explain it\.$/);
      if (x) {
        // the count must be the true one; the conclusion holds when some batches were at least as extreme
        const said = ref.filter(r => (x[4] === 'more' ? r >= +x[3] : r <= +x[3])).length;
        return +x[1] === said && +x[3] === obs && k > 0 && said > 0;
      }
      if (/^Unusual: none of the \d+ batches came close\./.test(c)) return k === 0;
      return false;   // "it should give exactly ...", "only N more", "nothing can be said" ignore the batches
    });
  },
  simDigits(q) {
    const p = q.prompt;
    let m = p.match(/^You simulate an event with P = (\d+)% using random digits 0 to 9\. Which digits should stand for the event\?/);
    if (m) {
      const need = +m[1] / 10;
      return choiceWhere(q, c => { const d = digitsOf(c); return !!d && d.length === need && new Set(d).size === d.length; });
    }
    m = p.match(/(Three|\d+) (?:donors come in|boxes|shots)|You buy (\d+) boxes|She takes (\d+) shots|(Three) donors/);
    const k = (() => { const x = p.match(/You buy (\d+) boxes|She takes (\d+) shots|(Three) donors come in/); if (!x) return null; return x[3] ? 3 : +(x[1] ?? x[2]); })();
    const rule = p.match(/\(digits (.+?) = ([a-z A]+?), (.+?) = ([a-z A]+?)\)/);
    if (/How do you cut the digits into trials\?/.test(p)) {
      const s = p.match(/: (\d+)\.\.\./)?.[1];
      return choiceWhere(q, c => {
        const x = c.match(/^(\d+) digits at a time, one block after the other: (.+)$/);
        if (!x || +x[1] !== k) return false;
        const blocks = x[2].split(' | ').filter(b => /^\d+$/.test(b));
        return blocks.every((b, i) => b === s.slice(i * k, (i + 1) * k));
      });
    }
    m = p.match(/Success: (.+?)\. Simulation \(digits (.+?) = ([a-z A]+?), (.+?) = ([a-z A]+?)\), (?:one trial = (\d+) digits|(\d+) trials of (\d+) digits): ([\d ]+)\. (How many of these (\d+) trials are successes|What is the estimate of P\(success\))\?/);
    if (m) {
      const yesD = digitsOf(m[2]), what = m[3].trim(), trials = m[9].trim().split(/\s+/);
      const hit = d => yesD.includes(+d);
      const succ = t => {
        const n = [...t].filter(hit).length, L = t.length;
        if (/^at least one ([a-z]+)$/.test(m[1])) { const w = m[1].match(/^at least one ([a-z]+)$/)[1]; return what.startsWith(w) || what === w ? n >= 1 : (L - n) >= 1; }
        if (/^at least two type A$/.test(m[1])) return n >= 2;
        return null;
      };
      const r = trials.map(succ);
      if (r.some(x => x === null)) return undefined;
      const s = r.filter(Boolean).length;
      return /How many/.test(m[10]) ? s : Q(s, trials.length).pair;
    }
    return undefined;
  },
  compoundSpace(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/A bag holds (\d+) [a-z]+: .+?\. You pull one, (keep it out|put it back), and pull a second\. How many ordered outcomes/))) { const n = +m[1]; return m[2] === 'put it back' ? n * n : n * (n - 1); }
    if (/You roll two number cubes/.test(p)) return 36;
    if (/You toss a coin and roll a number cube/.test(p)) return 12;
    if ((m = p.match(/You toss a coin and spin a spinner with (\d+) equal parts/))) return 2 * +m[1];
    if ((m = p.match(/Spinner 1 has (\d+) equal parts, spinner 2 has (\d+)\./))) return +m[1] * +m[2];
    if ((m = p.match(/A coin is tossed (\d+) times\. How many outcomes/))) return 2 ** +m[1];
    if ((m = p.match(/A coin is tossed (twice|\d+ times)\. Which list is the complete sample space\?/))) { const k = m[1] === 'twice' ? 2 : +m[1]; return choiceWhere(q, c => sameSet(setOf(c), tosses(k))); }
    return undefined;
  },
  compoundP(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/^P\(event\) = (\d+\/\d+)\. Which is the same probability as a decimal and a percent\?/))) {
      const v = val(m[1]);
      return choiceWhere(q, c => { const x = c.match(/^(\S+) = (\S+)$/); return !!x && val(x[1])?.eq(v) && val(x[2])?.eq(v); });
    }
    const cubes = []; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) cubes.push([a, b]);
    if ((m = p.match(/You roll two number cubes\. What is P\(the sum is (\d+)\)\?/))) return Q(cubes.filter(([a, b]) => a + b === +m[1]).length, 36).pair;
    if (/You roll two number cubes\. What is P\(doubles\)/.test(p)) return Q(6, 36).pair;
    if ((m = p.match(/You toss a coin and roll a number cube\. What is P\((heads|tails) and (.+?)\)\?/))) { const s = eventNums(m[2], 6); return s ? Q(s.length, 12).pair : undefined; }
    if ((m = p.match(/A fair coin is tossed (\d+) times\. What is P\((.+?)\)\?/))) {
      const k = +m[1], all = tosses(k), heads = s => [...s].filter(c => c === 'H').length;
      const W = { no: 0, one: 1, two: 2, three: 3, four: 4 };
      let f = null, x;
      if (m[2] === 'no heads') f = s => heads(s) === 0;
      else if (m[2] === 'at least one head') f = s => heads(s) >= 1;
      else if (m[2] === 'all the same') f = s => heads(s) === 0 || heads(s) === k;
      else if ((x = m[2].match(/^exactly (one|two|three) heads?$/))) f = s => heads(s) === W[x[1]];
      else if ((x = m[2].match(/^(two|three|four) heads$/))) f = s => heads(s) === W[x[1]];
      return f ? Q(all.filter(f).length, all.length).pair : undefined;
    }
    return undefined;
  },
  designSim(q) {
    const p = q.prompt;
    let m;
    if (/without putting the first one back\. .+ spinning a \d+-part spinner twice\. What is the problem\?/.test(p)) return choiceWhere(q, c => /^The second spin can land on the card already drawn/.test(c));
    if ((m = p.match(/Which chance device matches P = (\S+?)\?$/))) {
      const v = val(m[1]);
      const devP = c => {
        let x;
        if (/^Toss a coin: heads = /.test(c)) return Q(1, 2);
        if ((x = c.match(/^Roll a number cube: (.+?) = /))) { const d = digitsOf(x[1]); return d ? Q(d.filter(n => n >= 1 && n <= 6).length, 6) : null; }
        if ((x = c.match(/^Random digits: (.+?) = /))) { const d = digitsOf(x[1]); return d ? Q(d.length, 10) : null; }
        if ((x = c.match(/^Spin a spinner with (\d+) equal parts, one marked/))) return Q(1, +x[1]);
        return null;
      };
      return choiceWhere(q, c => devP(c)?.eq(v) ?? false);
    }
    if ((m = p.match(/You estimate P\((.+?)\)(?:, with digits (.+?) = ([a-z A]+?))? by simulation\. What is one trial\?/))) {
      const ev = m[1];
      if (/^it takes at least \d+ donors to find one with type A blood$/.test(ev)) return choiceWhere(q, c => /^Read digits until the first .+; count how many digits that took$/.test(c));
      if ((m = ev.match(/^at least one 6 in (\d+) rolls of a number cube$/))) return choiceWhere(q, c => c === `Roll the cube ${m[1]} times and check for a 6`);
      if ((m = ev.match(/^a \d+% shooter makes both of (\d+) free throws$/))) return choiceWhere(q, c => { const x = c.match(/^Read (\d+) digits and check that both are/); return !!x && +x[1] === +m[1]; });
    }
    return undefined;
  },
  compoundPredict(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/^A class ran (\d+) trials of \d+ tosses\. (\d+) trials gave .+?\. What is the experimental probability\?/))) return Q(+m[2], +m[1]).pair;
    if ((m = p.match(/^P\(.+?\) = (\d+\/\d+)\. One trial is \d+ tosses\. About how many of (\d+) trials/))) return val(m[1]).mul(+m[2]).value;
    if ((m = p.match(/^Theory: P\(.+?\) = (\d+\/\d+), so about (\d+) of (\d+) trials\. The class got (\d+)\. What fits best\?/))) {
      // "what fits best": chance variation; "exactly" and "guaranteed" are never right (sane() flags a result that is
      // far from the prediction, where "near" is not honest)
      return choiceWhere(q, c => /^Close enough: \d+ trials vary by chance/.test(c));
    }
    return undefined;
  },
};

// ---------------------------------------------------------------- sane
function sane(q) {
  const out = [], p = q.prompt;
  switch (q.family) {
    case 'scale': {
      const m = p.match(/a (\d+)% chance .+?\. (.+?)\. Was the forecast wrong\?/);
      if (m && +m[1] === 50) out.push('a 50% forecast is neither likely nor unlikely');
      break;
    }
    case 'theory': {
      const m = p.match(/A class has (\d+) girls and (\d+) boys\. The teacher puts all (\d+) names/);
      if (m && +m[1] + +m[2] !== +m[3]) out.push('the names in the hat are not the class');
      break;
    }
    case 'model': {
      const m = p.match(/tossed (\d+) times: (.+?)\. The model/);
      if (m) { const s = [...m[2].matchAll(/ (\d+)(?:,|$)/g)].reduce((t, x) => t + +x[1], 0); if (s !== +m[1]) out.push('the counts do not add up to the tosses'); }
      const e = p.match(/The model from the data: (.+?)\. What is/);
      if (e) { const v = [...e[1].matchAll(/= (\d+\/\d+)/g)].reduce((s, x) => s.add(Q(x[1])), Q(0)); if (v.cmp(1) > 0) out.push('the model already adds to more than 1'); }
      break;
    }
    case 'predict': case 'compoundPredict': {
      let v; try { v = F[q.family](q); } catch { v = undefined; }
      if (typeof v === 'number' && !Number.isInteger(v)) out.push(`the expected count ${v} is not a whole number to type "about"`);
      break;
    }
    case 'simDigits': {
      const k = (() => { const x = p.match(/You buy (\d+) boxes|She takes (\d+) shots|(Three) donors come in/); return x ? (x[3] ? 3 : +(x[1] ?? x[2])) : null; })();
      const t = p.match(/one trial = (\d+) digits: ([\d ]+)\./) ?? p.match(/\d+ trials of (\d+) digits: ([\d ]+)\./);
      if (k && t) {
        if (+t[1] !== k) out.push(`one trial is ${t[1]} digits for ${k} tries`);
        if (t[2].trim().split(/\s+/).some(s => s.length !== +t[1])) out.push('a trial with the wrong number of digits');
      }
      const pc = p.match(/has a prize (\d+)% of the time|makes (\d+)% of her free throws|^(\d+)% of blood donors/);
      const r = p.match(/\(digits (.+?) = /);
      if (pc && r) { const d = digitsOf(r[1]); const want = +(pc[1] ?? pc[2] ?? pc[3]) / 10; if (d && d.length !== want) out.push(`${d.length} digits of 10 do not make ${want * 10}%`); }
      const tr = p.match(/How many of these (\d+) trials/), ts = p.match(/: ([\d ]+)\. How many/);
      if (tr && ts && ts[1].trim().split(/\s+/).length !== +tr[1]) out.push('the number of trials listed is not the stated one');
      break;
    }
    case 'designSim': {
      const m = p.match(/Which chance device matches P = (\S+?)\?$/), w = p.match(/\((\d+)%\)|(\d+)% free-throw|\((\d+) in (\d+) boxes\)|\((\d+) day in (\d+)\)/);
      if (m && w) {
        const v = w[1] ? Q(+w[1], 100) : w[2] ? Q(+w[2], 100) : w[3] ? Q(+w[3], +w[4]) : Q(+w[5], +w[6]);
        if (!v.eq(Q(String(m[1]).replace('%', '')).div(/%/.test(m[1]) ? 100 : 1))) out.push('the stated P is not the story');
      }
      break;
    }
    case 'compoundPredict': break;
    default: break;
  }
  if (q.family === 'compoundPredict') {
    const m = p.match(/^Theory: P\(.+?\) = (\d+\/\d+), so about (\d+) of (\d+) trials/);
    if (m && !Q(m[1]).mul(+m[3]).eq(+m[2])) out.push('the "about" count is not P × trials');
    const g = p.match(/^Theory: P\(.+?\) = (\d+\/\d+), so about (\d+) of (\d+) trials\. The class got (\d+)\./);
    if (g) {
      const pr = Q(g[1]).value, n = +g[3], sd = Math.sqrt(n * pr * (1 - pr)), d = Math.abs(+g[4] - pr * n);
      if (d > 2 * sd) out.push(`${g[4]} is ${(d / sd).toFixed(1)} SD from ${pr * n}: "${g[4]} is near ${g[2]}" is not honest`);
    }
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
