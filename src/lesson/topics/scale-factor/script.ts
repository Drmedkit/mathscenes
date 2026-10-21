// script.ts: every voiced line of parts 1-4: the panel HTML (h) and the spoken text (s, written to be read aloud).
// pages/lessons/scale-factor/voice/lines.json holds the same spoken texts ({id: {text}}); the test keeps them equal.
// Colours: b.a = the original (amber), b.b = the copy (teal), b.s = the scale factor / the answer (lime).
const f = (n: number | string, d: number | string) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;

export const SCRIPT: Record<string, { h: string; s: string }> = {
  // 1 the question
  'q.intro': {
    h: 'A sticker is <b class="a">3 squares wide</b> and <b class="a">2 squares tall</b>. Jamie makes a bigger copy that is <b class="b">6 squares wide</b>. It has to be the same shape, not stretched.',
    s: 'A sticker is three squares wide and two squares tall. Jamie makes a bigger copy that is six squares wide. It has to be the same shape, not stretched.',
  },
  'q.ask': {
    h: 'How tall must the copy be? Pick an answer, and say how sure you are.',
    s: 'How tall must the copy be? Pick an answer, and say how sure you are.',
  },
  // 2 worked example
  'e.intro': {
    h: 'Four steps. Press each one: the picture moves first, then the notation.',
    s: "Let's work it out in four steps. Press each one, and watch the picture first.",
  },
  'e.step0': {
    h: 'The bottom of the sticker matches the bottom of the copy: <b class="a">3</b> goes with <b class="b">6</b>.',
    s: 'The bottom of the sticker matches the bottom of the copy. Three goes with six.',
  },
  'e.step1': {
    h: 'The scale factor is copy ÷ original: <b class="b">6</b> ÷ <b class="a">3</b> = <b class="s">2</b>. Every length of the copy is 2 times as long.',
    s: 'The scale factor is the copy divided by the original. Six divided by three is two. Every length of the copy is two times as long.',
  },
  'e.step2': {
    h: 'So the height is <b class="a">2</b> × <b class="s">2</b> = <b class="s">4</b> squares. Every length gets the same factor, the height too.',
    s: 'So the height is two times two, four squares. Every length gets the same factor, the height too.',
  },
  'e.step3': {
    h: 'Slide the sticker onto the copy’s corner: one straight line runs through both top corners, and the corners stay right angles. The copy that adds 3, <b class="w">6 by 5</b>, misses the line: it is stretched.',
    s: "Slide the sticker onto the copy's corner. One straight line runs through both top corners, and the corners stay right angles. The copy that adds three, six by five, misses the line. It is stretched.",
  },
  'e.why': { h: 'Quick check: why is the copy 4 squares tall, not 5?', s: 'Quick check. Why is the copy four squares tall, not five?' },
  'e.why.ok': {
    h: 'Yes. A scaled copy multiplies every length by the same number. Adding the same amount does not.',
    s: 'Yes. A scaled copy multiplies every length by the same number. Adding the same amount does not.',
  },
  'e.why.add': {
    h: 'Adding 3 gives 6 by 5, and its corner misses the line: stretched. Scaling multiplies: 2 × 2 = 4.',
    s: 'Adding three gives six by five, and its corner misses the line. It is stretched. Scaling multiplies: two times two is four.',
  },
  'e.why.some': {
    h: 'Then the copy would be 6 by 2: squashed flat. Every length gets the same factor: 2 × 2 = 4.',
    s: 'Then the copy would be six by two, squashed flat. Every length gets the same factor: two times two is four.',
  },
  // 3 your turn
  't.intro': {
    h: 'Now an L-shaped logo, <b class="a">6 squares wide</b>, is copied smaller for a badge. The copy’s bottom is <b class="b">3 squares</b>. The first step is done for you.',
    s: "Now an L-shaped logo, six squares wide, is copied smaller for a badge. The copy's bottom is three squares. The first step is done for you.",
  },
  't.k': { h: 'What is the scale factor from the logo to the copy?', s: 'What is the scale factor from the logo to the copy?' },
  't.k.ok': {
    h: `Yes: <b class="b">3</b> ÷ <b class="a">6</b> = <b class="s">${f(1, 2)}</b>. A scale factor less than 1 makes the copy smaller.`,
    s: 'Yes. Three divided by six is one half. A scale factor less than one makes the copy smaller.',
  },
  't.side': { h: 'The left side of the logo is <b class="a">4 squares</b>. How long is it on the copy?', s: 'The left side of the logo is four squares. How long is it on the copy?' },
  't.side.ok': {
    h: `Yes: 4 × ${f(1, 2)} = <b class="s">2</b>. Every other side is × ${f(1, 2)} too: watch the copy.`,
    s: 'Yes. Four times one half is two. Every other side is times one half too. Watch the copy.',
  },
  't.angle': { h: 'Check the shape. What happens to the corners of the copy?', s: 'Check the shape. What happens to the corners of the copy?' },
  't.k.inv': {
    h: 'That is 6 ÷ 3, the logo ÷ the copy. The factor goes FROM the logo TO the copy: <b class="b">3</b> ÷ <b class="a">6</b>.',
    s: 'That is six divided by three, the logo divided by the copy. The factor goes from the logo to the copy: three divided by six.',
  },
  't.k.diff': {
    h: '6 − 3 = 3 is how much shorter, not how many times as long. <b class="a">6</b> × ? = <b class="b">3</b>.',
    s: 'Six minus three is how much shorter, not how many times as long. Six times what makes three?',
  },
  't.k.other': { h: 'Scale factor = copy ÷ original. Which one is the copy here?', s: 'Scale factor is copy divided by original. Which one is the copy here?' },
  't.side.add': {
    h: `The bottom went 6 → 3: that is × ${f(1, 2)}, not − 3. So 4 × ${f(1, 2)} = ?`,
    s: 'The bottom went from six to three. That is times one half, not minus three. So what is four times one half?',
  },
  't.side.some': { h: `Every side changes, this one too: 4 × ${f(1, 2)}.`, s: 'Every side changes, this one too: four times one half.' },
  't.side.rev': { h: `× ${f(1, 2)} makes it smaller, not bigger: 4 × ${f(1, 2)} = 4 ÷ 2.`, s: 'Times one half makes it smaller, not bigger. Four times one half is four divided by two.' },
  't.side.other': { h: `Multiply the logo’s side by the factor: 4 × ${f(1, 2)}.`, s: "Multiply the logo's side by the factor: four times one half." },
  't.angle.half': {
    h: 'Only lengths are multiplied by ½. A corner of a square grid stays square: 90°.',
    s: 'Only lengths are multiplied by one half. A square corner stays square: ninety degrees.',
  },
  't.angle.arm': {
    h: 'An angle is how wide the corner opens, not how long its sides are. Still 90°.',
    s: 'An angle is how wide the corner opens, not how long its sides are. Still ninety degrees.',
  },
  't.cb.add': {
    h: 'At the start you picked <b>5 squares</b>. It is <b class="s">4</b>: adding 3 to every side stretches the sticker. A scaled copy multiplies every length by the same number.',
    s: 'At the start you picked five squares. It is four. Adding three to every side stretches the sticker. A scaled copy multiplies every length by the same number.',
  },
  't.cb.right': {
    h: 'At the start you picked <b>4 squares</b>, and that was right: every length × 2. Now you have seen a factor less than 1 too.',
    s: 'At the start you picked four squares, and that was right: every length times two. Now you have seen a factor less than one too.',
  },
  't.cb.some': {
    h: 'At the start you picked <b>2 squares</b>. It is <b class="s">4</b>: keeping the height squashes the sticker flat. Every length gets the same factor.',
    s: 'At the start you picked two squares. It is four. Keeping the height squashes the sticker flat. Every length gets the same factor.',
  },
  't.cb.none': { h: 'At the start: a copy 6 wide of the 3 by 2 sticker must be 4 tall.', s: 'At the start: a copy six wide of the three by two sticker must be four tall.' },
  't.sure.0': { h: 'You were guessing then. Now you can explain it.', s: 'You were guessing then. Now you can explain it.' },
  't.sure.1': { h: 'You were pretty sure then.', s: 'You were pretty sure then.' },
  't.sure.2': { h: 'You were certain then.', s: 'You were certain then.' },
  't.done': {
    h: `Every length × ${f(1, 2)}, every angle the same: a scaled copy, smaller.`,
    s: 'Every length times one half, and every angle the same. A scaled copy, smaller.',
  },
  // 4 prove it
  'p.intro': {
    h: 'Riley prints a <b class="a">6 in. × 4 in.</b> photo at <b class="b">10 in. × 8 in.</b> and says: “I added 4 inches to both sides, so the print is a scaled copy.” Is Riley right?',
    s: 'Riley prints a six by four inch photo at ten by eight inches, and says: I added four inches to both sides, so the print is a scaled copy. Is Riley right?',
  },
  'p.build': {
    h: 'Prove it. Fill each “because” with the reason that makes the line true.',
    s: 'Prove it. Fill each because with the reason that makes the line true.',
  },
  'p.test': { h: 'Let’s test it: build the argument and see where it leads.', s: "Let's test it. Build the argument, and see where it leads." },
  'p.no.add': {
    h: 'That is Riley’s idea. 4 + 4 = 8 but 6 + 4 = 10: the factors are 2 and <span class="fr"><span>5</span><span>3</span></span>, not the same.',
    s: "That is Riley's idea. Four plus four is eight, but six plus four is ten. The factors are two and five thirds, not the same.",
  },
  'p.no.looks': { h: 'Looks can fool you: check the factors. And look at the sun in the print: it is stretched.', s: 'Looks can fool you. Check the factors. And look at the sun in the print: it is stretched.' },
  'p.no.one': { h: 'One pair is not enough: every pair of sides has to give the same factor.', s: 'One pair is not enough. Every pair of sides has to give the same factor.' },
  'p.no.other': { h: 'True, but it is the reason for a different line. Which reason makes this line true?', s: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.c1': { h: '', s: 'Right. Eight divided by four is two: the height is multiplied by two.' },
  'p.c2': { h: '', s: 'But ten divided by six is five thirds. That is less than two, so the width grew by a smaller factor.' },
  'p.c3': { h: '', s: 'Two different factors. A scaled copy needs one factor for every length, so the print is stretched. Look at the line: it misses the corner.' },
  'p.c4': { h: '', s: 'Six times two is twelve. A twelve by eight print is a scaled copy, and its corner sits on the line.' },
  'p.done': {
    h: 'That’s a proof: each line has its reason, and the picture backs every one. Riley added; a scaled copy multiplies.',
    s: "That's a proof. Each line has its reason, and the picture backs every one. Riley added. A scaled copy multiplies.",
  },
};
