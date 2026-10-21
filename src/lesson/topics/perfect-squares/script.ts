// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// amber = the area, lime = the side / the root), `say` is the same line written to be read aloud.
// pages/lessons/perfect-squares/voice/lines.json holds the `say` texts (the test keeps the two in step).
import { rad } from './items';

const a = (s: string) => `<b class="a">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`, w = (x: string) => `<b class="w">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A square patio is covered with ${a('64 square tiles')}, each one foot on a side. Its area is ${a('64 square feet')}.`, say: 'A square patio is covered with sixty-four square tiles, each one foot on a side. Its area is sixty-four square feet.' },
  'q.ask': { html: 'How long is one side of the patio?', say: 'How long is one side of the patio?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `The ${a('64 tiles')} fit exactly in a square: no tile left over, no gap.`, say: 'The sixty-four tiles fit exactly in a square: no tile left over, no gap.' },
  'e.s2': { html: `Count the tiles along the top edge: ${s('8')}. Each tile is one foot, so one side is ${s('8 feet')}.`, say: 'Count the tiles along the top edge: eight. Each tile is one foot, so one side is eight feet.' },
  'e.s3': { html: `Check by squaring: ${s('8')} rows of ${s('8')} tiles is 8 × 8 = ${a('64')}. The area comes back.`, say: 'Check by squaring: eight rows of eight tiles is eight times eight, sixty-four. The area comes back.' },
  'e.s4': { html: `${rad(a('64'))} = ${s('8')}. The square root of the area is the side. The root sign asks: which number times itself makes 64?`, say: 'The square root of sixty-four is eight. The square root of the area is the side. The root sign asks: which number times itself makes sixty-four?' },
  'e.why': { html: 'Quick check: why is the side 8 feet?', say: 'Quick check: why is the side eight feet?' },
  'e.w-ok': { html: 'Yes. Squaring the side gives back the area, and that is exactly what a square root means.', say: 'Yes. Squaring the side gives back the area, and that is exactly what a square root means.' },
  'e.w-half': { html: 'Halving three times lands on 8 here by luck. For 36 it gives 4.5, but the side is 6, because 6 × 6 = 36. The real reason is 8 × 8 = 64.', say: 'Halving three times lands on eight here by luck. For thirty-six it gives four and a half, but the side is six, because six times six is thirty-six. The real reason is eight times eight is sixty-four.' },
  'e.w-perim': { html: 'The 4 sides add up to 8 + 8 + 8 + 8 = 32 feet: that is the distance around. The 64 counts the tiles inside: 8 rows of 8.', say: 'The four sides add up to eight plus eight plus eight plus eight, thirty-two feet: that is the distance around. The sixty-four counts the tiles inside: eight rows of eight.' },
  // 3. Your turn
  't.intro': { html: `A bigger square patio has an area of ${a('144 square feet')}. The tiles are laid for you. The rest is your turn.`, say: 'A bigger square patio has an area of one hundred forty-four square feet. The tiles are laid for you. The rest is your turn.' },
  't.count': { html: 'Count the tiles along the top edge. How long is one side?', say: 'Count the tiles along the top edge. How long is one side?' },
  't.fill': { html: 'Type a number in the box first.', say: 'Type a number in the box first.' },
  't.c-ok': { html: `Yes: ${s('12')} tiles along the edge, so one side is ${s('12 feet')}.`, say: 'Yes: twelve tiles along the edge, so one side is twelve feet.' },
  't.c-half': { html: '72 is half of 144. Count the tiles along the top edge instead.', say: 'Seventy-two is half of one hundred forty-four. Count the tiles along the top edge instead.' },
  't.c-perim': { html: '36 is 144 shared by 4 sides, as if 144 were the distance around. But 144 counts the tiles inside. Count the tiles along one edge.', say: 'Thirty-six is one hundred forty-four shared by four sides, as if it were the distance around. But one hundred forty-four counts the tiles inside. Count the tiles along one edge.' },
  't.c-other': { html: 'Count the tiles along the top edge, one by one.', say: 'Count the tiles along the top edge, one by one.' },
  't.check': { html: `Now check by squaring. How many tiles do ${s('12')} rows of ${s('12')} make?`, say: 'Now check by squaring. How many tiles do twelve rows of twelve make?' },
  't.k-ok': { html: `Yes: 12 × 12 = ${a('144')}. The area comes back, so 12 is right.`, say: 'Yes: twelve times twelve is one hundred forty-four. The area comes back, so twelve is right.' },
  't.k-double': { html: '12 × 2 = 24 doubles the side. Squaring is 12 × 12: twelve rows of twelve.', say: 'Twelve times two is twenty-four: that doubles the side. Squaring is twelve times twelve: twelve rows of twelve.' },
  't.k-other': { html: '12 × 12 = 120 + 24. Count it again, row by row.', say: 'Twelve times twelve is one hundred twenty, plus twenty-four. Count it again, row by row.' },
  't.write': { html: 'Now write it with the root sign. Tap the numbers into the boxes.', say: 'Now write it with the root sign. Tap the numbers into the boxes.' },
  't.w-ok': { html: `Yes: ${rad(a('144'))} = ${s('12')}. The area goes under the sign; the side is its value.`, say: 'Yes: the square root of one hundred forty-four is twelve. The area goes under the sign; the side is its value.' },
  't.w-swap': { html: 'That is swapped. The area, 144, goes under the root sign; the side, 12, is the value.', say: 'That is swapped. The area, one hundred forty-four, goes under the root sign; the side, twelve, is the value.' },
  't.w-half': { html: '72 is half of 144, and 72 × 72 is far more than 144. The value of the root is the side.', say: 'Seventy-two is half of one hundred forty-four, and seventy-two times seventy-two is far more than that. The value of the root is the side.' },
  't.cb-right': { html: `At the start you said 8 feet, and you were right. Now you can show why: 8 × 8 = 64, so ${rad(64)} = 8.`, say: 'At the start you said eight feet, and you were right. Now you can show why: eight times eight is sixty-four, so the square root of sixty-four is eight.' },
  't.cb-half': { html: `At the start you picked 32 feet, half of 64. But 32 × 32 = 1,024. ${rad(64)} = 8, because 8 × 8 = 64.`, say: 'At the start you picked thirty-two feet, half of sixty-four. But thirty-two times thirty-two is one thousand and twenty-four. The square root of sixty-four is eight, because eight times eight is sixty-four.' },
  't.cb-perim': { html: `At the start you picked 16 feet: 64 shared by 4 sides. But 64 is the area, not the distance around. ${rad(64)} = 8.`, say: 'At the start you picked sixteen feet: sixty-four shared by four sides. But sixty-four is the area, not the distance around. The square root of sixty-four is eight.' },
  't.cb-none': { html: `At the start: a patio of 64 square feet has sides of 8 feet, because 8 × 8 = 64.`, say: 'At the start: a patio of sixty-four square feet has sides of eight feet, because eight times eight is sixty-four.' },
  // 4. Prove it
  'p.intro': { html: `Sam notices that ${rad(4)} = 2 and 4 ÷ 2 = 2. Sam says: “Taking the square root is the same as dividing by 2.”`, say: 'Sam notices that the square root of four is two, and four divided by two is also two. Sam says: taking the square root is the same as dividing by two.' },
  'p.ask': { html: 'Is Sam right?', say: 'Is Sam right?' },
  'p.build-wrong': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.build-right': { html: 'Let’s test it. Build the argument, and see where it leads.', say: "Let's test it. Build the argument, and see where it leads." },
  'p.c1': { html: 'Right: 2 × 2 = 4, so the side is 2. Half of 4 is 2 as well. Here the two rules agree.', say: 'Right: two times two is four, so the side is two. Half of four is two as well. Here the two rules agree.' },
  'p.c2': { html: `But 4 × 4 = 16, so ${rad(16)} = 4. Half of 16 is 8, and a side of 8 needs ${w('64 tiles')}: far too many.`, say: 'But four times four is sixteen, so the square root of sixteen is four. Half of sixteen is eight, and a side of eight needs sixty-four tiles: far too many.' },
  'p.c3': { html: 'One counterexample is enough: 16 breaks Sam’s rule.', say: "One counterexample is enough: sixteen breaks Sam's rule." },
  'p.x-differ': { html: 'They can agree: at 4 both give 2, and at 0 both give 0. Agreeing at a few numbers does not make two rules the same.', say: 'They can agree: at four both give two, and at zero both give zero. Agreeing at a few numbers does not make two rules the same.' },
  'p.x-examples': { html: 'Checking a few cases can’t prove “always”. One case that fails is enough to break it.', say: "Checking a few cases can't prove always. One case that fails is enough to break it." },
  'p.x-slot': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: 'That’s a proof: three claims, each with its reason, and the picture backs every one. Taking a square root is not halving.', say: "That's a proof: three claims, each with its reason, and the picture backs every one. Taking a square root is not halving." },
};
