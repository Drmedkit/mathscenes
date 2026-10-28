// script.ts: every voiced panel line of parts 1-4, the panel HTML beside the spoken text (no digits or symbols).
// pages/lessons/conditional-probability/voice/lines.json is generated from this table (the topic test checks it).
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`;

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // ---------- 1 the question ----------
  'q.intro': {
    html: `A high school surveyed its <b>200 juniors</b>: does each one have a part-time job, and a driver’s license? The counselor picks one of the ${A('juniors with a job')} at random. What is the probability that this junior ${B('has a license')}? Pick one, and say how sure you are.`,
    say: 'A high school surveyed its two hundred juniors: does each one have a part-time job, and a driver’s license? The counselor picks one of the juniors with a job at random. What is the probability that this junior has a license? Pick one, and say how sure you are.',
  },
  // ---------- 2 worked example ----------
  'e.intro': { html: 'Four steps on the same table. Press each one: the picture moves first, then the notation.', say: 'Four steps on the same table. Press each one: the picture moves first, then the notation.' },
  'e.step0': {
    html: `Each inside cell is an “and”: <b>48</b> juniors have a job ${A('and')} a license. The margins are single groups: <b>80</b> have a job, <b>110</b> have a license, <b>200</b> in all.`,
    say: 'Each inside cell is an and: forty-eight juniors have a job and a license. The margins are single groups: eighty have a job, a hundred and ten have a license, two hundred in all.',
  },
  'e.step1': {
    html: `“Given a job” rules out everyone in the No job row. Only the Job row is left: its total, ${A('80')}, is the <b>new whole</b>. That is what the bar in P(L | J) means.`,
    say: 'Given a job rules out everyone in the no job row. Only the job row is left: its total, eighty, is the new whole. That is what the bar in P of L given J means.',
  },
  'e.step2': {
    html: `Inside the new whole, ${B('48')} have a license: P(L | J) = 48/80 = ${S('3/5')}. Three out of every five juniors with a job can drive.`,
    say: 'Inside the new whole, forty-eight have a license: P of L given J is forty-eight over eighty, which is three fifths. Three out of every five juniors with a job can drive.',
  },
  'e.step3': {
    html: `With probabilities it is the same move: P(L | J) = P(L and J) ÷ P(J) = (48/200) ÷ (80/200). The 200s cancel, and 48/80 is left. Dividing by P(J) <b>is</b> making the Job row the whole.`,
    say: 'With probabilities it is the same move: P of L given J equals P of L and J, divided by P of J. That is forty-eight over two hundred, divided by eighty over two hundred. The two hundreds cancel, and forty-eight over eighty is left. Dividing by P of J is making the job row the whole.',
  },
  'e.why': { html: 'Quick check: why divide by 80 and not by 200?', say: 'Quick check: why divide by eighty and not by two hundred?' },
  'e.why.ok': { html: 'Yes. The junior was picked from those with a job, so nobody else is possible: the 80 are the whole.', say: 'Yes. The junior was picked from those with a job, so nobody else is possible: the eighty are the whole.' },
  'e.why.all': { html: 'The 200 include 120 juniors with no job, and none of them can be picked. The condition shrinks the whole.', say: 'The two hundred include a hundred and twenty juniors with no job, and none of them can be picked. The condition shrinks the whole.' },
  'e.why.inv': { html: 'The 110 are the juniors with a license. Dividing by them answers the reverse question: of the license holders, how many have a job?', say: 'The hundred and ten are the juniors with a license. Dividing by them answers the reverse question: of the license holders, how many have a job?' },
  // ---------- 3 your turn ----------
  't.intro': {
    html: `A music teacher surveys <b>160 students</b>: left- or right-handed, and do they play an instrument? Is playing an instrument <b>independent</b> of being left-handed? The first step is done for you.`,
    say: 'A music teacher surveys a hundred and sixty students: left or right handed, and do they play an instrument? Is playing an instrument independent of being left handed? The first step is done for you.',
  },
  't.cond': { html: 'Of the <b>left-handed</b> students, what fraction play an instrument? That is P(I | L).', say: 'Of the left handed students, what fraction play an instrument? That is P of I given L.' },
  't.cond.ok': { html: `Yes: 6 of the 16 left-handers, 6/16 = ${S('3/8')}.`, say: 'Yes: six of the sixteen left handers, six sixteenths, which is three eighths.' },
  't.cond.all': { html: '6/160 divides by every student. Given left-handed, only the 16 left-handers count.', say: 'Six over a hundred and sixty divides by every student. Given left handed, only the sixteen left handers count.' },
  't.cond.inv': { html: '6/60 looks inside the instrument players: that is P(L | I). The condition here is left-handed.', say: 'Six over sixty looks inside the instrument players: that is P of L given I. The condition here is left handed.' },
  't.cond.no': { html: 'The Left-handed row is the whole: 16 students. How many of them play?', say: 'The left handed row is the whole: sixteen students. How many of them play?' },
  't.all': { html: 'Now with no condition: of <b>all</b> 160 students, what fraction play an instrument? That is P(I).', say: 'Now with no condition: of all one hundred and sixty students, what fraction play an instrument? That is P of I.' },
  't.all.ok': { html: `Yes: 60 of 160, 60/160 = ${S('3/8')}.`, say: 'Yes: sixty of a hundred and sixty, which is three eighths.' },
  't.all.left': { html: '16/160 is the share who are left-handed. Count all the players: the Plays column total.', say: 'Sixteen over a hundred and sixty is the share who are left handed. Count all the players: the plays column total.' },
  't.all.joint': { html: '6/160 is only the left-handed players. All players: the column total, 60.', say: 'Six over a hundred and sixty is only the left handed players. All players: the column total, sixty.' },
  't.all.no': { html: 'Use the Plays column total over the grand total.', say: 'Use the plays column total over the grand total.' },
  't.judge': { html: 'P(I | L) = 3/8 and P(I) = 3/8. So are the two events independent?', say: 'P of I given L is three eighths, and P of I is three eighths. So are the two events independent?' },
  't.judge.ok': { html: 'Right: knowing a student is left-handed does not change the chance they play. The events are independent.', say: 'Right: knowing a student is left handed does not change the chance they play. The events are independent.' },
  't.judge.cell': { html: 'Only 6 sounds small, but there are only 16 left-handers. Compare shares, not one cell: 3/8 and 3/8.', say: 'Only six sounds small, but there are only sixteen left handers. Compare shares, not one cell: three eighths and three eighths.' },
  't.judge.story': { html: 'How it sounds does not decide it. The shares are equal, so the condition changes nothing.', say: 'How it sounds does not decide it. The shares are equal, so the condition changes nothing.' },
  't.empty': { html: 'Type a fraction first.', say: 'Type a fraction first.' },
  'q.cb.right': { html: 'At the start you picked 48/80, and you were right: the juniors with a job are the whole.', say: 'At the start you picked forty-eight over eighty, and you were right: the juniors with a job are the whole.' },
  'q.cb.all': { html: 'At the start you picked 48/200. That divides by every junior. Given a job, only the 80 with a job count: 48/80.', say: 'At the start you picked forty-eight over two hundred. That divides by every junior. Given a job, only the eighty with a job count: forty-eight over eighty.' },
  'q.cb.inv': { html: 'At the start you picked 48/110. That is the share of license holders who have a job: the reverse question. Here it is 48/80.', say: 'At the start you picked forty-eight over a hundred and ten. That is the share of license holders who have a job: the reverse question. Here it is forty-eight over eighty.' },
  'q.cb.none': { html: 'Conditioning shrinks the whole to the condition’s row or column, then you count inside it.', say: 'Conditioning shrinks the whole to the condition’s row or column, then you count inside it.' },
  // ---------- 4 prove it ----------
  'p.intro': {
    html: `Roll one die. ${A('A: the roll is 1 or 2')}. ${B('B: the roll is 6')}. A and B can never happen together. Sam says: “Mutually exclusive events have nothing to do with each other, so they are <b>independent</b>.” Is Sam right?`,
    say: 'Roll one die. A: the roll is one or two. B: the roll is six. A and B can never happen together. Sam says: mutually exclusive events have nothing to do with each other, so they are independent. Is Sam right?',
  },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: 'Let’s test it. Build the argument, and see where it leads.' },
  'p.build': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'Right. No face is in both circles: the overlap is empty.', say: 'Right. No face is in both circles: the overlap is empty.' },
  'p.c2': { html: 'Right. One third times one sixth is one eighteenth, more than zero.', say: 'Right. One third times one sixth is one eighteenth, more than zero.' },
  'p.c3': { html: 'Right. And look: given B, A is impossible. P(A | B) = 0, but P(A) = 1/3.', say: 'Right. And look: given B, A is impossible. P of A given B is zero, but P of A is one third.' },
  'p.no.disj': { html: 'Having no outcomes in common is the strongest link there is: if B happens, A can’t.', say: 'Having no outcomes in common is the strongest link there is: if B happens, A can’t.' },
  'p.no.example': { html: 'One die example doesn’t prove a rule. The reason has to work for every pair of events.', say: 'One die example doesn’t prove a rule. The reason has to work for every pair of events.' },
  'p.no.unequal': { html: 'Different probabilities don’t decide anything: independent events can have different probabilities too.', say: 'Different probabilities don’t decide anything: independent events can have different probabilities too.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': {
    html: `That’s a proof, and it works for <b>any</b> mutually exclusive events with positive probabilities: P(A and B) = 0, but P(A) × P(B) > 0. They are ${S('dependent')}. (The one exception is an impossible event, with probability 0.)`,
    say: 'That’s a proof, and it works for any mutually exclusive events with positive probabilities: P of A and B is zero, but P of A times P of B is more than zero. They are dependent. The one exception is an impossible event, with probability zero.',
  },
};
