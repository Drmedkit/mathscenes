// items.ts: practice families for "Counterexamples, inference and proof" (v2.extension.counterexample-inference-and-proof,
// 15 sub-goals). Every claim states its domain, so its truth can be decided from what the student sees; every
// counterexample is checked (in the domain, hypothesis true, conclusion false); every "valid" inference is detachment,
// modus tollens or a matching chain; every choice item has exactly one right choice (kit.choiceItem), and every
// recognised slip carries its catalogue id (math-curriculum-essentials/misconceptions.json).
// Pictures (item.picture; solution-side data under `reveal`): table (CaseTable), euler (Euler), pairs (Pairs),
// nest (Nest), proof (ProofFrame) with an optional fig (GeoFig), card (a statement card).
// famA.ts: counterexamples, generality, representations, direct proofs, proof audits.
// famB.ts: detachment, chaining, tollens, invalid forms, converses, contrapositives, necessary / sufficient, iff.
import type { Gen } from './kit';
import { FAM_A } from './famA';
import { FAM_B } from './famB';

export { MC, type CPItem, type CPPicture } from './kit';

export const GENERATORS: Record<string, Gen> = { ...FAM_A, ...FAM_B };

export const FAMILY_NAMES: Record<string, string> = {
  cxPick: 'Find the counterexample', cxJudge: 'Is it a counterexample?', cxShape: 'Shapes that break a claim',
  examplesProof: 'Examples or proof?', argCovers: 'What an argument covers', afterProof: 'After a proof',
  repPick: 'Any number of that kind', repWhyInt: 'Why “an integer”?', repRead: 'Read the form',
  proofFill: 'Fill the proof', proofAngle: 'Angle proofs',
  auditFind: 'Find the broken line', auditKind: 'What is wrong with it?',
  detach: 'What follows?', detachWhich: 'The law of detachment',
  chain: 'Chain two statements', chainValid: 'Does it chain?',
  validForm: 'Valid or invalid?', countermodel: 'Find a countermodel',
  converseJudge: 'Is the converse true?', converseCx: 'Break the converse',
  fourCases: 'The four cases', mustBeTrue: 'Which must be true?',
  tollens: 'Without the conclusion', formName: 'Name the law',
  suffRead: 'Sufficient means', suffTrue: 'Is it sufficient?',
  necRead: 'Necessary and “only if”', necTrue: 'Is it necessary?',
  iffParts: 'Both directions', iffJudge: 'Is the “if and only if” proved?',
  classify: 'Necessary, sufficient, both or neither', classifyWhy: 'The value that shows it',
};
