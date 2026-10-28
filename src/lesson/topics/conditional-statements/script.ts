// script.ts: every voiced panel line of parts 1-4, the panel HTML beside the spoken text (no digits or symbols).
// pages/lessons/conditional-statements/voice/lines.json is generated from this table (the topic test checks it).
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`, W = (s: string) => `<b class="w">${s}</b>`;
const n = '<i>n</i>', x = '<i>x</i>';

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // ---------- 1 the question ----------
  'q.intro': {
    html: `Ms. Reyes promises her class: “${A('If you score 90 or more on the final')}, ${B('then you get an A')}.” After the final, three students compare. Who can say she <b>broke</b> her promise? Pick one, and say how sure you are.`,
    say: 'Ms. Reyes promises her class: if you score ninety or more on the final, then you get an A. After the final, three students compare. Who can say she broke her promise? Pick one, and say how sure you are.',
  },
  // ---------- 2 worked example ----------
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.step0': {
    html: `The statement: “If ${A(`${n} is a multiple of 4`)}, then ${B(`${n} is even`)}.” The <b>hypothesis</b> is the part after “if”: the amber region. The <b>conclusion</b> is the part after “then”: the teal region. The domain is the integers 1 to 12.`,
    say: 'The statement: if n is a multiple of four, then n is even. The hypothesis is the part after if: the amber region. The conclusion is the part after then: the teal region. The domain is the integers one to twelve.',
  },
  'e.step1': {
    html: `Every number goes where it belongs. 4, 8 and 12 land in amber, and amber sits <b>inside</b> teal. No number is in amber but outside teal, so the statement is ${S('true')} for this domain.`,
    say: 'Every number goes where it belongs. Four, eight and twelve land in amber, and amber sits inside teal. No number is in amber but outside teal, so the statement is true for this domain.',
  },
  'e.step2': {
    html: `Each number is one of four cases. 8: <i>p</i> true, <i>q</i> true. 6: <i>p</i> false, <i>q</i> true. 7: both false. None of them breaks it. Only <i>p</i> true with <i>q</i> false could, and that zone is empty. An if-then statement is ${W('false')} in that one case only.`,
    say: 'Each number is one of four cases. Eight: p true, q true. Six: p false, q true. Seven: both false. None of them breaks it. Only p true with q false could, and that zone is empty. An if then statement is false in that one case only.',
  },
  'e.step3': {
    html: `Swap the parts: “If ${B(`${n} is even`)}, then ${A(`${n} is a multiple of 4`)}.” That is the <b>converse</b>. Now teal is the hypothesis, and 6 is even but not a multiple of 4. The converse is ${W('false')}, while the statement is true: they are different statements.`,
    say: 'Swap the parts: if n is even, then n is a multiple of four. That is the converse. Now teal is the hypothesis, and six is even but not a multiple of four. The converse is false, while the statement is true: they are different statements.',
  },
  'e.why': { html: 'Quick check: why does 7 not break the statement?', say: 'Quick check: why does seven not break the statement?' },
  'e.why.ok': { html: 'Yes. The statement only promises something when the hypothesis is true. 7 is outside amber: nothing was promised, so nothing was broken.', say: 'Yes. The statement only promises something when the hypothesis is true. Seven is outside amber: nothing was promised, so nothing was broken.' },
  'e.why.hyp': { html: '7 is not even, but it is not a multiple of 4 either. The statement only says what happens to multiples of 4.', say: 'Seven is not even, but it is not a multiple of four either. The statement only says what happens to multiples of four.' },
  'e.why.conv': { html: 'The converse is false: 6 breaks it. 7 is fine for a different reason: it is not a multiple of 4.', say: 'The converse is false: six breaks it. Seven is fine for a different reason: it is not a multiple of four.' },
  // ---------- 3 your turn ----------
  't.intro': {
    html: `Your turn. The domain is the integers 0 to 9, and the statement is “If ${A(`${x} &gt; 6`)}, then ${B(`${x} &gt; 3`)}.” The parts are named and the numbers sorted for you.`,
    say: 'Your turn. The domain is the integers zero to nine, and the statement is: if x is greater than six, then x is greater than three. The parts are named and the numbers sorted for you.',
  },
  't.neg': { html: `First, negate the hypothesis ${A(`${x} &gt; 6`)}. Which sentence is true exactly when ${x} &gt; 6 is false?`, say: 'First, negate the hypothesis, x is greater than six. Which sentence is true exactly when x is greater than six is false?' },
  't.neg.ok': { html: `Yes. 6 itself is not greater than 6, so the negation includes it: ${A(`${x} ≤ 6`)}. The same way, the negation of ${x} &gt; 3 is ${B(`${x} ≤ 3`)}.`, say: 'Yes. Six itself is not greater than six, so the negation includes it: x is at most six. The same way, the negation of x greater than three is x at most three.' },
  't.neg.opp': { html: `Check 6: ${x} &gt; 6 is false at 6, so its negation must be true there. But ${x} &lt; 6 is false at 6 too.`, say: 'Check six: x greater than six is false at six, so its negation must be true there. But x less than six is false at six too.' },
  't.neg.ge': { html: `${x} ≥ 6 is true at 7, 8 and 9, where ${x} &gt; 6 is true too. A statement and its negation are never true together.`, say: 'x at least six is true at seven, eight and nine, where x greater than six is true too. A statement and its negation are never true together.' },
  't.contra': { html: 'Now form the <b>contrapositive</b>: swap the two parts and negate both.', say: 'Now form the contrapositive: swap the two parts and negate both.' },
  't.contra.ok': { html: `Yes. Look at the picture: everything outside teal is also outside amber. The contrapositive is ${S('true')}, like the statement: it is the same picture, read from the outside.`, say: 'Yes. Look at the picture: everything outside teal is also outside amber. The contrapositive is true, like the statement: it is the same picture, read from the outside.' },
  't.contra.inv': { html: 'That one negates without swapping: that is the <b>inverse</b>. The contrapositive also swaps.', say: 'That one negates without swapping: that is the inverse. The contrapositive also swaps.' },
  't.contra.conv': { html: 'That one swaps without negating: that is the <b>converse</b>. The contrapositive also negates.', say: 'That one swaps without negating: that is the converse. The contrapositive also negates.' },
  't.contra.opp': { html: `Check the boundaries: the negation of ${x} &gt; 3 is ${x} ≤ 3, not ${x} &lt; 3.`, say: 'Check the boundaries: the negation of x greater than three is x at most three, not x less than three.' },
  't.inv': { html: `The <b>inverse</b> negates without swapping: “If ${A(`${x} ≤ 6`)}, then ${B(`${x} ≤ 3`)}.” Which ${x} shows the inverse is false?`, say: 'The inverse negates without swapping: if x is at most six, then x is at most three. Which x shows the inverse is false?' },
  't.inv.ok': { html: `Yes. 5 ≤ 6, so the inverse's hypothesis is true, but 5 is not ≤ 3. The inverse is ${W('false')}, even though the statement is true.`, say: 'Yes. Five is at most six, so the inverse\'s hypothesis is true, but five is not at most three. The inverse is false, even though the statement is true.' },
  't.inv.two': { html: '2 is at most 6 and at most 3: it agrees with the inverse.', say: 'Two is at most six and at most three: it agrees with the inverse.' },
  't.inv.eight': { html: '8 is not at most 6, so the inverse makes no promise about it.', say: 'Eight is not at most six, so the inverse makes no promise about it.' },
  't.inv.none': { html: 'The inverse is a different statement, and it can fail. Try a number between 3 and 6.', say: 'The inverse is a different statement, and it can fail. Try a number between three and six.' },
  'q.cb.jo': { html: 'At the start you picked Jo, and you were right: 95 is in the amber region and a B is outside teal. That is the one case that breaks an if-then promise.', say: 'At the start you picked Jo, and you were right: ninety five is in the amber region, and a B is outside teal. That is the one case that breaks an if then promise.' },
  'q.cb.max': { html: 'At the start you picked Max. But Max scored 85: the promise says nothing about scores under 90. Thinking it does is the inverse, and the inverse can be false. Jo broke it.', say: 'At the start you picked Max. But Max scored eighty five: the promise says nothing about scores under ninety. Thinking it does is the inverse, and the inverse can be false. Jo broke it.' },
  'q.cb.lee': { html: 'At the start you picked Lee. But Lee is outside amber: the promise made no claim about Lee. Only Jo, in amber and outside teal, breaks it.', say: 'At the start you picked Lee. But Lee is outside amber: the promise made no claim about Lee. Only Jo, in amber and outside teal, breaks it.' },
  'q.cb.none': { html: 'An if-then promise breaks only when the hypothesis happens and the conclusion does not: that was Jo.', say: 'An if then promise breaks only when the hypothesis happens and the conclusion does not: that was Jo.' },
  // ---------- 4 prove it ----------
  'p.intro': {
    html: `Sam says: “${A('Every quadrilateral here with four right angles')} ${B('has four equal sides')}. I checked A and D.” A small square marks a right angle; matching tick marks show equal sides. Is Sam right?`,
    say: 'Sam says: every quadrilateral here with four right angles has four equal sides. I checked A and D. A small square marks a right angle; matching tick marks show equal sides. Is Sam right?',
  },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: 'Let\'s test it. Build the argument, and see where it leads.' },
  'p.build': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'Right. “Every A is B” means: if a member is an A, then it is a B.', say: 'Right. Every A is B means: if a member is an A, then it is a B.' },
  'p.c2': { html: 'Right. B has a right-angle mark in each of its four corners: the hypothesis is true for B.', say: 'Right. B has a right angle mark in each of its four corners: the hypothesis is true for B.' },
  'p.c3': { html: 'Right. One tick on two sides, two ticks on the other two: the conclusion is false for B.', say: 'Right. One tick on two sides, two ticks on the other two: the conclusion is false for B.' },
  'p.c4': { html: 'Right. One counterexample settles an “every” claim, however many examples worked.', say: 'Right. One counterexample settles an every claim, however many examples worked.' },
  'p.no.checked': { html: 'Checked examples never cover every member. Look at the ones Sam did not check.', say: 'Checked examples never cover every member. Look at the ones Sam did not check.' },
  'p.no.c': { html: 'C has no right angles: the hypothesis is false for C, so C cannot break the claim.', say: 'C has no right angles: the hypothesis is false for C, so C cannot break the claim.' },
  'p.no.none': { html: '“Not all” is not “none”: A and D do have both. The negation is “some … do not”.', say: 'Not all is not none: A and D do have both. The negation is: some do not.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: `That is a <b>disproof by counterexample</b>: one member with the hypothesis true and the conclusion false. Sam's claim is ${W('false')}, and its negation is ${S('true')}: some quadrilateral here has four right angles but not four equal sides.`, say: 'That is a disproof by counterexample: one member with the hypothesis true and the conclusion false. Sam\'s claim is false, and its negation is true: some quadrilateral here has four right angles but not four equal sides.' },
};
