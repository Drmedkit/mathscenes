// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours: the
// dividend amber, the divisor teal, the quotient lime, the remainder lavender), `say` is the same line written to be
// read aloud. pages/lessons/polynomial-division/voice/lines.json holds the `say` texts (the test keeps them in step).
const I = (s: string) => `<i>${s}</i>`;
const x = I('x');
const sq = (v: string) => `${v}<sup>2</sup>`, cu = (v: string) => `${v}<sup>3</sup>`;
const s = (t: string) => `<b class="s">${t}</b>`;
const P5 = `${sq(x)} + 5${x} + 7`, D2 = `${x} + 2`;
const P_ = I('P'), D_ = I('D'), Q_ = I('Q'), S_ = I('S'), t_ = I('t'), R_ = I('R');

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `47 ÷ 6 is 7 with 5 left over. As one true line: <b>47 = 6 · 7 + 5</b>.`, say: 'Forty seven divided by six is seven, with five left over. As one true line: forty seven equals six times seven, plus five.' },
  'q.ask': { html: `Polynomials divide the same way. What is (${P5}) ÷ (${D2})? Pick one, and say how sure you are.`, say: 'Polynomials divide the same way. What is x squared plus five x plus seven, divided by x plus two? Pick one, and say how sure you are.' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the layout moves first, then the algebra.', say: 'Four steps. Press each one: the layout moves first, then the algebra.' },
  'e.s0': { html: `Divide the leading terms: ${sq(x)} ÷ ${x} = ${x}. That is the first quotient term, written above the ${x} column.`, say: 'Divide the leading terms. x squared divided by x is x. That is the first quotient term, written above the x column.' },
  'e.s1': { html: `Multiply ${x} by the WHOLE divisor: ${x}(${D2}) = ${sq(x)} + 2${x}. Subtract it: the ${sq(x)} terms cancel and 3${x} + 7 is left.`, say: 'Multiply x by the whole divisor: x times x plus two is x squared plus two x. Subtract it. The x squared terms cancel, and three x plus seven is left.' },
  'e.s2': { html: `Repeat with 3${x} + 7: 3${x} ÷ ${x} = 3. Then 3(${D2}) = 3${x} + 6, and (3${x} + 7) − (3${x} + 6) = 1.`, say: 'Repeat with three x plus seven. Three x divided by x is three. Then three times x plus two is three x plus six, and three x plus seven, minus three x plus six, is one.' },
  'e.s3': { html: `1 has degree 0, below the divisor's degree 1: stop. So ${P5} = (${D2})(${x} + 3) + 1, and ${s(`(${P5})/(${D2}) = ${x} + 3 + 1/(${D2})`)}, for ${x} ≠ −2.`, say: 'One has degree zero, below the degree of the divisor: stop. So x squared plus five x plus seven equals x plus two, times x plus three, plus one. Divided by x plus two, that is x plus three, plus one over x plus two, for x not equal to negative two.' },
  'e.why': { html: 'Quick check: why does the division stop at 1?', say: 'Quick check. Why does the division stop at one?' },
  'e.w-ok': { html: `Yes. A finished remainder has lower degree than the divisor: no term times ${D2} can cancel a constant.`, say: 'Yes. A finished remainder has lower degree than the divisor. No term times x plus two can cancel a constant.' },
  'e.w-int': { html: `Size is the whole-number rule. For polynomials the test is degree: 1 has degree 0, ${D2} has degree 1.`, say: 'Size is the whole number rule. For polynomials the test is degree. One has degree zero, and x plus two has degree one.' },
  'e.w-zero': { html: 'A division does not have to come out even. Once the degree is below the divisor’s, what is left is the remainder.', say: 'A division does not have to come out even. Once the degree is below the degree of the divisor, what is left is the remainder.' },
  // 3. Your turn
  't.intro': { html: `Now the shortcut for a divisor like ${x} − 2: <b>synthetic division</b>. The same numbers as long division, without the ${x}s. Divide ${cu(x)} − 7${x} + 9 by ${x} − 2.`, say: 'Now the shortcut for a divisor like x minus two: synthetic division. The same numbers as long division, without the x s. Divide x cubed minus seven x plus nine by x minus two.' },
  't.setup': { html: `Done for you: <i>c</i> = 2 in the box (${x} − 2 = ${x} − <i>c</i>), and the row 1, 0, −7, 9, with a 0 for the missing ${sq(x)}. Bring down 1; 2 · 1 = 2; 0 + 2 = 2.`, say: 'Done for you. c is two, in the box. The top row is one, zero, negative seven, nine, with a zero for the missing x squared. Bring down the one. Two times one is two, and zero plus two is two.' },
  't.next': { html: 'Your step: multiply the newest bottom entry by 2 and add it to −7. What goes in the bottom row?', say: 'Your step. Multiply the newest bottom entry by two, and add it to negative seven. What goes in the bottom row?' },
  't.n-ok': { html: 'Yes: 2 · 2 = 4, and −7 + 4 = −3.', say: 'Yes. Two times two is four, and negative seven plus four is negative three.' },
  't.n-sub': { html: 'The tableau ADDS the product: −7 + 4.', say: 'The tableau adds the product: negative seven plus four.' },
  't.n-rec': { html: 'Multiply the newest BOTTOM entry, 2, not the top entry 0.', say: 'Multiply the newest bottom entry, two, not the top entry zero.' },
  't.n-no': { html: 'Multiply 2 by the bottom entry 2, then add that to −7.', say: 'Multiply two by the bottom entry two, then add that to negative seven.' },
  't.last': { html: 'Same move for the last column: 2 times −3, added to 9. What is the last entry?', say: 'Same move for the last column. Two times negative three, added to nine. What is the last entry?' },
  't.l-ok': { html: 'Yes: 2 · (−3) = −6, and 9 + (−6) = 3.', say: 'Yes. Two times negative three is negative six, and nine plus negative six is three.' },
  't.l-sub': { html: 'Add the product, do not subtract it: 9 + (−6).', say: 'Add the product, do not subtract it: nine plus negative six.' },
  't.l-rec': { html: 'Multiply the newest bottom entry, −3, not the top entry −7.', say: 'Multiply the newest bottom entry, negative three, not the top entry negative seven.' },
  't.l-no': { html: '2 times −3 is −6. Add it to 9.', say: 'Two times negative three is negative six. Add it to nine.' },
  't.num': { html: 'Type a number first.', say: 'Type a number first.' },
  't.read': { html: 'The bottom row is 1, 2, −3 and, in its box, 3. Which quotient and remainder does it give?', say: 'The bottom row is one, two, negative three, and in its box, three. Which quotient and remainder does it give?' },
  't.r-ok': { html: `Yes: the quotient is one degree lower, ${s(`${sq(x)} + 2${x} − 3`)}, and the boxed 3 is the remainder: the same as long division.`, say: 'Yes. The quotient is one degree lower: x squared plus two x minus three. And the boxed three is the remainder. The same as long division.' },
  't.r-deg': { html: `Dividing a cubic by ${x} − 2 gives a quadratic: the first entry goes with ${sq(x)}, not ${cu(x)}.`, say: 'Dividing a cubic by x minus two gives a quadratic. The first entry goes with x squared, not x cubed.' },
  't.r-rem': { html: 'The last entry is the remainder, fenced off in its box: it is not a coefficient of the quotient.', say: 'The last entry is the remainder, fenced off in its box. It is not a coefficient of the quotient.' },
  't.cb-right': { html: `At the start you picked ${s(`${x} + 3 + 1/(${D2})`)}, and you were right: the remainder 1 is still divided by ${D2}.`, say: 'At the start you picked x plus three, plus one over x plus two. And you were right: the remainder one is still divided by x plus two.' },
  't.cb-adds': { html: `At the start you picked ${x} + 4. That adds the remainder 1 onto the quotient. The 1 is left over, so it is still divided: + 1/(${D2}).`, say: 'At the start you picked x plus four. That adds the remainder one onto the quotient. The one is left over, so it is still divided by x plus two.' },
  't.cb-term': { html: `At the start you picked ${x} + 7/2. That divides term by term: ${sq(x)} by ${x}, and 7 by 2. A sum is divided as a whole, and the layout does exactly that.`, say: 'At the start you picked x plus seven halves. That divides term by term: x squared by x, and seven by two. A sum is divided as a whole, and the layout does exactly that.' },
  't.cb-none': { html: 'Every division ends the same way: dividend = divisor · quotient + remainder.', say: 'Every division ends the same way. Dividend equals divisor times quotient, plus remainder.' },
  // 4. Prove it
  'p.intro': { html: `Kai says: “Long division is right because that is the rule: divide, multiply, subtract, repeat.” Is that a reason why it works?`, say: 'Kai says: long division is right because that is the rule. Divide, multiply, subtract, repeat. Is that a reason why it works?' },
  'p.build': { html: 'Right: naming the steps is not a reason. Build one: fill each “because” with the reason that makes the line true.', say: 'Right. Naming the steps is not a reason. Build one: fill each because, with the reason that makes the line true.' },
  'p.test': { html: 'Repeating the rule does not show why it is right. Build a real reason, and see.', say: 'Repeating the rule does not show why it is right. Build a real reason, and see.' },
  'p.c1': { html: `Right. Before anything is divided, ${P_} = ${D_} · 0 + ${P_}.`, say: 'Right. Before anything is divided, P equals D times zero, plus P.' },
  'p.c2': { html: `Right. ${D_}(${Q_} + ${t_}) adds ${t_}${D_} to the product, and ${S_} − ${t_}${D_} takes the same ${t_}${D_} away: the total is still ${P_}.`, say: 'Right. D times Q plus t adds t D to the product, and S minus t D takes the same t D away. The total is still P.' },
  'p.c3': { html: `Right. ${t_} is the leading term of ${S_} divided by the leading term of ${D_}, so ${t_}${D_} and ${S_} share a leading term, and it cancels.`, say: 'Right. t is the leading term of S divided by the leading term of D. So t D and S share a leading term, and it cancels.' },
  'p.c4': { html: `Right. The degree drops every step, so it reaches a degree below ${D_}'s, and the line ${P_} = ${D_}${Q_} + ${R_} is still true.`, say: 'Right. The degree drops every step, so it reaches a degree below the degree of D. And the line P equals D Q plus R is still true.' },
  'p.no.ex': { html: 'One example that works is not a reason for every polynomial.', say: 'One example that works is not a reason for every polynomial.' },
  'p.no.rule': { html: 'That repeats the rule. The question is WHY the rule gives a true line.', say: 'That repeats the rule. The question is why the rule gives a true line.' },
  'p.no.comp': { html: `Adding ${t_} to ${Q_} adds ${t_}${D_} to the product: without paying it back, the line is no longer true.`, say: 'Adding t to Q adds t D to the product. Without paying it back, the line is no longer true.' },
  'p.no.zero': { html: 'The residual does not have to reach 0: 1 was left over in the example.', say: 'The residual does not have to reach zero. One was left over in the example.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: `That is why long division always works: every step keeps ${P_} = ${D_}${Q_} + ${S_} true and lowers the degree of ${S_}. Synthetic division is the same steps, written short.`, say: 'That is why long division always works. Every step keeps P equals D Q plus S true, and lowers the degree of S. Synthetic division is the same steps, written short.' },
};
