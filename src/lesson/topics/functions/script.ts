// script.ts: every line the panel shows in parts 1-4, by voice id, and the relations those parts use. `html` is what
// the panel shows (role colours: a = input, b = output, s = the answer / allowed, w = wrong, pk = the slice in focus);
// `say` is the same line written to be read aloud. pages/lessons/functions/voice/lines.json holds the `say` texts
// (the test keeps the two in step). The page shows a line and calls ctx.say(id) with it.
import type { Pair } from './relation';
import type { MapParams } from './MapDiagram';
import type { FnGraphParams } from './FnGraph';
import { fnPts } from './FnGraph';

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`;
const s = (x: string) => `<b class="s">${x}</b>`, w = (x: string) => `<b class="w">${x}</b>`, pk = (x: string) => `<b class="pk">${x}</b>`;

// ---------- the relations of the explain parts ----------
/** parts 1-2: five students and their birthday months (months in calendar order) */
export const EXAMPLE = {
  pairs: [['Ava', 'Mar'], ['Ben', 'Jul'], ['Cara', 'Mar'], ['Dev', 'Oct'], ['Eli', 'May']] as Pair[],
  map: { ins: ['Ava', 'Ben', 'Cara', 'Dev', 'Eli'], outs: ['Mar', 'May', 'Jul', 'Oct'], arrows: [[0, 0], [1, 2], [2, 0], [3, 3], [4, 1]], inName: 'student', outName: 'birthday month' } as MapParams,
  /** the flipped table, month -> student, in month order */
  back: [['Mar', 'Ava'], ['Mar', 'Cara'], ['May', 'Eli'], ['Jul', 'Ben'], ['Oct', 'Dev']] as Pair[],
};
/** part 3: five points; the input 1 has two outputs; -3 and 3 share the output 2 */
export const TURN = {
  pairs: [[-3, 2], [-1, -2], [1, 3], [3, 2], [1, -4]] as Pair[],
  witness: 1, shared: 2,
  graph: {
    x0: -5, x1: 5, y0: -5, y1: 5, xStep: 1, yStep: 1, xName: 'x (input)', yName: 'y (output)', equal: true,
    points: [{ key: 'p0', x: -3, y: 2 }, { key: 'p1', x: -1, y: -2 }, { key: 'p2', x: 1, y: 3 }, { key: 'p3', x: 3, y: 2 }, { key: 'p4', x: 1, y: -4 }],
  } as FnGraphParams,
};
/** part 4: y = x^2 */
export const PROVE = {
  slices: [-2, -1, 0, 1, 2],
  graph: {
    x0: -4, x1: 4, y0: -1, y1: 9, xStep: 1, yStep: 1, xName: 'x (input)', yName: 'y (output)',
    points: [{ key: 'm', x: -2, y: 4, label: true }, { key: 'n', x: 2, y: 4, label: true }],
    paths: [{ key: 'c', pts: fnPts(x => x * x, -3.05, 3.05) }],
  } as FnGraphParams,
};

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A class keeps a record of five ${a('students')} and their ${b('birthday months')}. Each arrow goes from a student to the month of their birthday.`, say: 'A class keeps a record of five students and their birthday months. Each arrow goes from a student to the month of their birthday.' },
  'q.ask': { html: `The record can be read two ways: ${a('student')} → ${b('month')}, or ${b('month')} → ${a('student')}. Which way is a function?`, say: 'The record can be read two ways: student to month, or month to student. Which way is a function?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the diagram moves first, then the board.', say: 'Four steps. Press each one: the diagram moves first, then the board.' },
  'e.s1': { html: `The ${a('inputs')} are the students: every arrow starts at one. A function gives every input exactly one output.`, say: 'The inputs are the students: every arrow starts at one. A function gives every input exactly one output.' },
  'e.s2': { html: `Follow each student’s arrows: Ava → Mar, Ben → Jul, Cara → Mar, Dev → Oct, Eli → May. Every student has exactly ${s('one')} arrow.`, say: "Follow each student's arrows. Ava to March, Ben to July, Cara to March, Dev to October, Eli to May. Every student has exactly one arrow." },
  'e.s3': { html: `${a('Ava')} and ${a('Cara')} share ${b('March')}. That is allowed: no student has two months. So student → month ${s('is a function')}.`, say: 'Ava and Cara share March. That is allowed: no student has two months. So student to month is a function.' },
  'e.s4': { html: `Now flip it: month → student. ${b('March')} has two arrows, to Ava and to Cara. One input with two outputs, so month → student is ${w('not a function')}.`, say: 'Now flip it: month to student. March has two arrows, to Ava and to Cara. One input with two outputs, so month to student is not a function.' },
  'e.why': { html: 'Quick check: why is student → month a function, even though March is used twice?', say: 'Quick check: why is student to month a function, even though March is used twice?' },
  'e.w-ok': { html: 'Yes. The test is about the inputs: each student needs exactly one month. Two students may share one.', say: 'Yes. The test is about the inputs: each student needs exactly one month. Two students may share one.' },
  'e.w-oto': { html: 'A function does not need different outputs. What it forbids is one input with two outputs.', say: 'A function does not need different outputs. What it forbids is one input with two outputs.' },
  'e.w-first': { html: 'Every arrow counts, not just the first. Here each student happens to have only one arrow.', say: 'Every arrow counts, not just the first. Here each student happens to have only one arrow.' },
  // 3. Your turn: the points on a graph
  't.intro': { html: `Now a relation on a graph. Each point is a pair (${a('input')}, ${b('output')}). The first step is done for you.`, say: 'Now a relation on a graph. Each point is a pair: input, output. The first step is done for you.' },
  't.s1': { html: 'The five points as pairs: (−3, 2), (−1, −2), (1, 3), (3, 2) and (1, −4). The board lists them.', say: 'The five points as pairs: negative three, two. Negative one, negative two. One, three. Three, two. And one, negative four. The board lists them.' },
  't.slice': { html: `Your step: a ${pk('vertical slice')} fixes one input and meets all its outputs. Which input has two points on its slice?`, say: 'Your step: a vertical slice fixes one input and meets all its outputs. Which input has two points on its slice?' },
  't.sl-ok': { html: `Yes: the slice at x = 1 meets (1, 3) and (1, −4).`, say: 'Yes: the slice at x equals one meets one, three and one, negative four.' },
  't.sl-shared': { html: 'The points at −3 and 3 are at the same height: they share an output. Each of those slices meets only one point.', say: 'The points at negative three and three are at the same height: they share an output. Each of those slices meets only one point.' },
  't.sl-other': { html: 'The slice at x = −1 meets only one point. Look for a slice that meets two.', say: 'The slice at x equals negative one meets only one point. Look for a slice that meets two.' },
  't.share': { html: 'Your step: (−3, 2) and (3, 2) share the output 2. Does that break the function?', say: 'Your step: negative three, two and three, two share the output two. Does that break the function?' },
  't.sh-ok': { html: `Right: inputs may share an output. That is ${s('allowed')}, and it is not what breaks this relation.`, say: 'Right: inputs may share an output. That is allowed, and it is not what breaks this relation.' },
  't.sh-no': { html: 'Sharing an output is allowed: −3 and 3 each still have exactly one output.', say: 'Sharing an output is allowed: negative three and three each still have exactly one output.' },
  't.wit': { html: 'Last step: which sentence proves that this is not a function?', say: 'Last step: which sentence proves that this is not a function?' },
  't.w-ok': { html: `Yes: one input with two outputs, quoted from the graph. That is a ${s('counterexample')}, and one is enough.`, say: 'Yes: one input with two outputs, quoted from the graph. That is a counterexample, and one is enough.' },
  't.w-out': { html: 'The output 2 having two inputs is allowed. The proof needs an input with two outputs.', say: 'The output two having two inputs is allowed. The proof needs an input with two outputs.' },
  't.w-vague': { html: 'True, but a proof names where: the input 1, with the outputs 3 and −4.', say: 'True, but a proof names where: the input one, with the outputs three and negative four.' },
  't.cb-right': { html: 'At the start you picked student → month only, and you were right: each student has one month, but March has two students.', say: 'At the start you picked student to month only, and you were right: each student has one month, but March has two students.' },
  't.cb-month': { html: 'At the start you picked month → student. That checks the outputs. A function is checked from the inputs, and as an input March has two students.', say: 'At the start you picked month to student. That checks the outputs. A function is checked from the inputs, and as an input March has two students.' },
  't.cb-both': { html: 'At the start you picked both. Flipping can break a function: as an input, March goes to two students.', say: 'At the start you picked both. Flipping can break a function: as an input, March goes to two students.' },
  't.cb-sure': { html: 'You were sure, and changing your mind after being sure is exactly how this sticks.', say: 'You were sure, and changing your mind after being sure is exactly how this sticks.' },
  // 4. Prove it: Jordan on y = x^2
  'p.intro': { html: 'Jordan says: “y = x² is not a function, because 2 and −2 both give 4.”', say: 'Jordan says: y equals x squared is not a function, because two and negative two both give four.' },
  'p.ask': { html: 'Is Jordan right?', say: 'Is Jordan right?' },
  'p.j-ok': { html: 'Jordan is wrong. Now prove it: fill each “because” with the reason that makes the line true.', say: 'Jordan is wrong. Now prove it: fill each because with the reason that makes the line true.' },
  'p.j-test': { html: 'Let’s test it. Build the argument and see where it leads.', say: "Let's test it. Build the argument and see where it leads." },
  'p.c1': { html: `Each input x gives exactly ${s('one')} value of x²,`, say: 'Each input x gives exactly one value of x squared,' },
  'p.c2': { html: `and 2 and −2 sharing the output ${b('4')} is allowed,`, say: 'and two and negative two sharing the output four is allowed,' },
  'p.c3': { html: `so y = x² ${s('is a function')}, and Jordan is wrong.`, say: 'so y equals x squared is a function, and Jordan is wrong.' },
  'p.x-line': { html: 'Curves can be functions. What matters is one output for each input.', say: 'Curves can be functions. What matters is one output for each input.' },
  'p.x-examples': { html: 'A few checks cannot cover every input. The reason has to work for every x.', say: 'A few checks cannot cover every input. The reason has to work for every x.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: 'That’s a proof: an argument about every input, plus a shared output that is allowed. y = x² is a function.', say: "That's a proof: an argument about every input, plus a shared output that is allowed. y equals x squared is a function." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
