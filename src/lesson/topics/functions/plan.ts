// plan.ts: the practice walks through every sub-goal of secondary-t5-32-functions-concept-and-representations, in topic
// JSON order (ids = the topic's subgoal ids); each names the families that practise it (items.ts uses its ranges).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'relation-pairs', title: 'Read a relation input → output', families: ['readMap', 'pairsCount'] },
  { id: 'exactly-one-criterion', title: 'Exactly one output per input', families: ['mapVerdict', 'pairVerdict'] },
  { id: 'allowed-inputs', title: 'The allowed inputs', families: ['statedSet', 'contextInputs'] },
  { id: 'table-recognition', title: 'Function or not, in a table', families: ['tableVerdict'] },
  { id: 'graph-as-pairs', title: 'A point is (input, output)', families: ['readPoint', 'outputAt'] },
  { id: 'domain-range-sets', title: 'Domain and range as sets', families: ['domainRange'] },
  { id: 'graph-recognition', title: 'Function or not, on a graph', families: ['graphVerdict'] },
  { id: 'domain-range-intervals', title: 'Domain and range of a segment', families: ['segInterval'] },
  { id: 'explicit-rule-recognition', title: 'A rule y = … is a function', families: ['ruleVerdict', 'ruleOutput'] },
  { id: 'pair-satisfies-equation', title: 'Does a pair fit the equation?', families: ['whichPair', 'pairYesNo'] },
  { id: 'implicit-equation-check', title: 'Two pairs with one input', families: ['implicitShows'] },
  { id: 'match-representations', title: 'Same function? Check every input', families: ['sameFn'] },
  { id: 'sample-vs-complete', title: 'All the inputs, or a sample?', families: ['sampleOrAll'] },
  { id: 'compare-outputs-common-input', title: 'Compare two functions at one input', families: ['compareAt', 'crossover'] },
  { id: 'counterexample-witness', title: 'Prove it is not a function', families: ['pickWitness', 'witnessInput'] },
  { id: 'examples-dont-prove', title: 'When does checking prove it?', families: ['enoughProof'] },
  { id: 'context-direction', title: 'Both directions in a story', families: ['bothWays', 'reverseWitness'] },
  { id: 'qualitative-graphs', title: 'Story graphs', families: ['readStory', 'sketchStory'] },
];
