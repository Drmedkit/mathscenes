// script.ts: every voiced line of parts 1-4: the panel HTML (h) and the spoken text (s, written to be read aloud).
// pages/lessons/enlarge-on-grids/voice/lines.json holds the same spoken texts ({id: {text}}); the test keeps them equal.
// Colours: b.a = the original (amber), b.b = the copy (teal), b.s = the scale factor / the answer (lime).
const a = (t: string | number) => `<b class="a">${t}</b>`, b = (t: string | number) => `<b class="b">${t}</b>`, s = (t: string | number) => `<b class="s">${t}</b>`;

export const SCRIPT: Record<string, { h: string; s: string }> = {
  // 1 the question
  'q.intro': {
    h: `A house icon for a map is ${a('2 squares wide')}, with walls ${a('3 squares tall')}. Dev makes a bigger copy, ${b('4 squares wide')}. It has to be the same shape, not stretched.`,
    s: 'A house icon for a map is two squares wide, with walls three squares tall. Dev makes a bigger copy, four squares wide. It has to be the same shape, not stretched.',
  },
  'q.ask': {
    h: 'How tall must the copy’s walls be? Pick an answer, and say how sure you are.',
    s: "How tall must the copy's walls be? Pick an answer, and say how sure you are.",
  },
  // 2 worked example
  'e.intro': {
    h: 'Four steps. Press each one and watch the picture first.',
    s: "Let's work it out in four steps. Press each one, and watch the picture first.",
  },
  'e.step0': {
    h: `The copy’s base is ${b(4)}, the house’s base is ${a(2)}. Two of those 2s fit along it: 4 is ${s('2 times')} as long. The scale factor is ${s(2)}.`,
    s: "The copy's base is four. The house's base is two. Two of those twos fit along it, so four is two times as long. The scale factor is two.",
  },
  'e.step1': {
    h: `Start at the dot and walk around the house, one side at a time: right ${a(2)}, up ${a(3)}. A slanted roof side is two steps: left ${a(1)} and up ${a(1)}.`,
    s: 'Start at the dot and walk around the house, one side at a time. Right two, up three. A slanted roof side is two steps: left one and up one.',
  },
  'e.step2': {
    h: `Now walk the copy from its own dot, every move ${s('2 times')} as far: right ${b(4)}, up ${b(6)}, and the roof steps left ${b(2)} and up ${b(2)}. The walls are ${s(6)} tall.`,
    s: 'Now walk the copy from its own dot, every move two times as far. Right four, up six, and the roof steps left two and up two. The walls are six squares tall.',
  },
  'e.step3': {
    h: 'The walk ends back on the dot, so the copy closes up. Adding 2 instead would make the walls 5 tall: the red house is too wide for its height.',
    s: 'The walk ends back on the dot, so the copy closes up. Adding two instead would make the walls five tall. The red house is too wide for its height.',
  },
  'e.why': {
    h: 'Why are the walls 6 squares tall, not 5?',
    s: 'Why are the walls six squares tall, and not five?',
  },
  'e.why.ok': {
    h: `Right. One factor for every length: the base ${a(2)} × 2 = ${b(4)}, the walls ${a(3)} × 2 = ${s(6)}.`,
    s: 'Right. One factor for every length. The base, two times two is four. The walls, three times two is six.',
  },
  'e.why.add': {
    h: 'Adding 2 keeps the difference, not the shape. Look at the red house: it is squashed.',
    s: 'Adding two keeps the difference, not the shape. Look at the red house: it is squashed.',
  },
  'e.why.some': {
    h: 'If only the width changes, the house gets wider but not taller: stretched. Every length gets the factor.',
    s: 'If only the width changes, the house gets wider but not taller. That is stretched. Every length gets the factor.',
  },
  // 3 your turn: the sail, x3
  't.intro': {
    h: `A sail for a boat icon. Make a copy ${s('3 times')} as big, walking from the dot. The base is done: right ${a(3)} becomes right ${b(9)}.`,
    s: 'Here is a sail for a boat icon. Make a copy three times as big, walking from the dot. The base is done for you: right three becomes right nine.',
  },
  't.slant': {
    h: `The sail’s slanted side goes ${a('left 1, up 3')}. How does the copy’s slanted side go?`,
    s: "The sail's slanted side goes left one, up three. How does the copy's slanted side go?",
  },
  't.slant.ok': { h: `Yes: both steps × 3, left ${s(3)}, up ${s(9)}.`, s: 'Yes. Both steps times three: left three, up nine.' },
  't.slant.one': {
    h: 'Only one step got the factor. A slanted side is two steps, and both get × 3.',
    s: 'Only one step got the factor. A slanted side is two steps, and both get times three.',
  },
  't.slant.same': {
    h: 'That is the sail’s own slant. The copy’s is 3 times as long: both steps × 3.',
    s: "That is the sail's own slant. The copy's is three times as long: both steps times three.",
  },
  't.slant.other': {
    h: 'Split the slanted side into its two steps, and multiply each one by 3.',
    s: 'Split the slanted side into its two steps, and multiply each one by three.',
  },
  't.back': {
    h: `The last side goes ${a('left 2, down 3')}, back to the dot. And the copy’s last side?`,
    s: "The last side goes left two, down three, back to the dot. And the copy's last side?",
  },
  't.back.ok': {
    h: `Yes: left ${s(6)}, down ${s(9)}, and the pen lands on the dot. The walk closes.`,
    s: 'Yes. Left six, down nine, and the pen lands on the dot. The walk closes.',
  },
  't.back.other': {
    h: 'Multiply both steps by 3. Check: the pen has to end on the dot.',
    s: 'Multiply both steps by three. Check: the pen has to end on the dot.',
  },
  't.angle': {
    h: 'Last check: compare each corner of the copy with the same corner of the sail.',
    s: 'Last check. Compare each corner of the copy with the same corner of the sail.',
  },
  't.angle.arm': {
    h: 'Longer sides do not open a corner wider. Lay the sail’s corner on the copy’s: they match.',
    s: "Longer sides do not open a corner wider. Lay the sail's corner on the copy's: they match.",
  },
  't.angle.times': {
    h: 'Angles are not multiplied. A scaled copy keeps every angle; only the lengths grow.',
    s: 'Angles are not multiplied. A scaled copy keeps every angle. Only the lengths grow.',
  },
  't.done': {
    h: 'That’s the method: walk from the dot, multiply every step by the factor, and the corners stay the same.',
    s: "That's the method. Walk from the dot, multiply every step by the factor, and the corners stay the same.",
  },
  't.cb.right': { h: 'At the start you picked 6 for the walls. Right: every length × 2.', s: 'At the start you picked six for the walls. Right: every length times two.' },
  't.cb.add': { h: 'At the start you picked 5, adding 2. Now you have seen why it is 6: adding squashes the house.', s: 'At the start you picked five, adding two. Now you have seen why it is six. Adding squashes the house.' },
  't.cb.some': { h: 'At the start you picked 3, keeping the walls. But every length has to grow, the walls too.', s: 'At the start you picked three, keeping the walls. But every length has to grow, the walls too.' },
  't.cb.none': { h: 'Every move times the factor: that is the whole idea.', s: 'Every move times the factor. That is the whole idea.' },
  't.sure.0': { h: 'You said you were guessing. Now you have a method instead.', s: 'You said you were guessing. Now you have a method instead.' },
  't.sure.1': { h: 'You said you were pretty sure. Now you can check it.', s: 'You said you were pretty sure. Now you can check it.' },
  't.sure.2': { h: 'You said you were certain. Now you can check any answer with the walk.', s: 'You said you were certain. Now you can check any answer with the walk.' },
  // 4 prove it: always, sometimes or never?
  'p.intro': {
    h: 'Jordan says: <i>“Add the same number of squares to every side, and you always get a scaled copy.”</i> Always true, sometimes true, or never true?',
    s: 'Jordan says: add the same number of squares to every side, and you always get a scaled copy. Is that always true, sometimes true, or never true?',
  },
  'p.test': { h: 'Let’s test it on two shapes before we decide.', s: "Let's test it on two shapes before we decide." },
  'p.build': { h: 'Build the proof: tap the reason that makes each line true.', s: 'Build the proof. Tap the reason that makes each line true.' },
  'p.no.add': { h: 'That is Jordan’s claim, not a reason. Look at the red strip: adding changed its shape.', s: "That is Jordan's claim, not a reason. Look at the red strip: adding changed its shape." },
  'p.no.angles': { h: 'Every rectangle has four right angles, even a stretched one. Angles cannot decide here.', s: 'Every rectangle has four right angles, even a stretched one. Angles cannot decide here.' },
  'p.no.one': { h: 'One pair of sides is not enough: the width and the height must get the same factor.', s: 'One pair of sides is not enough. The width and the height must get the same factor.' },
  'p.no.looks': { h: 'Looks are not proof: check the factors across and up.', s: 'Looks are not proof. Check the factors across and up.' },
  'p.no.other': { h: 'True, but it is the reason for a different line. Which reason makes this line true?', s: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.c1': { h: '', s: 'Right. Two plus two is four, and that is also two times two, across and up. So the square copy is scaled.' },
  'p.c2': { h: '', s: 'Right. One to two is times two, so a scaled copy would be six tall. Four is too short: the strip is stretched.' },
  'p.c3': { h: '', s: 'So adding works only sometimes: only when it happens to multiply every side by the same factor.' },
  'p.done': {
    h: 'That’s a proof: an example where it works, one where it fails, and the reason. Jordan’s “always” is only “sometimes”.',
    s: "That's a proof. An example where it works, one where it fails, and the reason. Jordan's always is only sometimes.",
  },
};
