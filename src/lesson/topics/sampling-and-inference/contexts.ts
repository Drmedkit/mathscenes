// contexts.ts: the skins of the practice families (US settings, US units, no money). A numerical context gives a
// measured variable on a 0-100 scale; a categorical one a yes/no question; a bias context a selection method with
// the direction it pushes the estimate; two-group contexts give two populations to compare.

export interface NumCtx {
  /** the variable, e.g. 'minutes of homework last night' */
  what: string;
  /** the unit word for an answer box and the axis */
  unit: string;
  /** who / what is measured, plural and singular */
  who: string; one: string;
  /** where the population lives */
  place: string;
  /** a typical population mean and spread on the 0-100 scale */
  mu: number; sd: number;
  /** a short verb phrase for claims: 'spend about 42 minutes on homework' */
  claim: (m: string) => string;
  /** a comparison: 'spend more time on homework' */
  higher: string;
}
export const NUM: readonly NumCtx[] = [
  { what: 'minutes of homework last night', unit: 'minutes', who: 'students', one: 'student', place: 'Ridgeview Middle', mu: 45, sd: 16, claim: m => `spend about ${m} minutes on homework a night`, higher: 'spend more time on homework' },
  { what: 'minutes spent reading on Saturday', unit: 'minutes', who: 'students', one: 'student', place: 'Oak Hill Middle', mu: 35, sd: 15, claim: m => `read about ${m} minutes on a Saturday`, higher: 'read more on Saturdays' },
  { what: 'minutes of screen time before school', unit: 'minutes', who: 'students', one: 'student', place: 'Lakeside Middle', mu: 30, sd: 14, claim: m => `spend about ${m} minutes on screens before school`, higher: 'spend more screen time before school' },
  { what: 'minutes it takes to get to school', unit: 'minutes', who: 'students', one: 'student', place: 'Jefferson Middle', mu: 20, sd: 9, claim: m => `take about ${m} minutes to get to school`, higher: 'take longer to get to school' },
  { what: 'heights of tomato plants (inches)', unit: 'inches', who: 'tomato plants', one: 'plant', place: 'the community garden', mu: 40, sd: 12, claim: m => `are about ${m} inches tall`, higher: 'grow taller' },
  { what: 'points scored on a video game level', unit: 'points', who: 'players', one: 'player', place: 'the gaming club', mu: 55, sd: 17, claim: m => `score about ${m} points on the level`, higher: 'score more points' },
  { what: 'minutes of instrument practice yesterday', unit: 'minutes', who: 'band students', one: 'band student', place: 'Westview Middle', mu: 40, sd: 15, claim: m => `practice about ${m} minutes a day`, higher: 'practice longer' },
  { what: 'push-ups in one minute', unit: 'push-ups', who: 'students', one: 'student', place: 'Grant Middle', mu: 30, sd: 10, claim: m => `do about ${m} push-ups in a minute`, higher: 'do more push-ups' },
  { what: 'pages read last week', unit: 'pages', who: 'students', one: 'student', place: 'Maple Grove Middle', mu: 50, sd: 18, claim: m => `read about ${m} pages a week`, higher: 'read more pages' },
];

export interface CatCtx {
  /** what the counted answer says: 'walk to school' */
  verb: string;
  /** the other answer: 'do not walk to school' */
  not: string;
  /** who: 'students' */
  who: string;
  place: string;
  /** a ballot / election framing word for percent items */
  q: string;
}
export const CAT: readonly CatCtx[] = [
  { verb: 'walk to school', not: 'do not walk to school', who: 'students', place: 'Pine Ridge Middle', q: 'How do you get to school?' },
  { verb: 'want a later start time', not: 'do not want a later start time', who: 'students', place: 'Central Middle', q: 'Should school start later?' },
  { verb: 'would vote for the new mascot', not: 'would vote against the new mascot', who: 'students', place: 'Hillside Middle', q: 'New mascot: yes or no?' },
  { verb: 'have a library card', not: 'do not have a library card', who: 'students', place: 'Brookfield', q: 'Do you have a library card?' },
  { verb: 'ride the bus', not: 'do not ride the bus', who: 'students', place: 'Valley View Middle', q: 'Do you ride the bus?' },
  { verb: 'support the new park', not: 'do not support the new park', who: 'voters', place: 'Fairview', q: 'Should the town build the park?' },
  { verb: 'play on a school team', not: 'do not play on a school team', who: 'students', place: 'Lincoln Middle', q: 'Do you play on a team?' },
  { verb: 'prefer tacos for Friday lunch', not: 'prefer something else', who: 'students', place: 'Riverside Middle', q: 'Friday lunch: tacos?' },
];

/** three-way choices (the remaining share = 100% minus the stated shares) */
export interface Cat3 { topic: string; who: string; place: string; opts: [string, string, string] }
export const CAT3: readonly Cat3[] = [
  { topic: 'the class trip', who: 'students', place: 'Eastwood Middle', opts: ['the science museum', 'the zoo', 'the aquarium'] },
  { topic: 'the cafeteria’s new lunch', who: 'students', place: 'Hamilton Middle', opts: ['pizza', 'tacos', 'salad bowls'] },
  { topic: 'the school color', who: 'students', place: 'Summit Middle', opts: ['blue', 'green', 'orange'] },
  { topic: 'the town’s new trail', who: 'voters', place: 'Cedar Falls', opts: ['a bike trail', 'a walking trail', 'no new trail'] },
];

/** a sampling method that pushes the estimate one way, and why */
export interface BiasCtx {
  goal: string;            // 'estimate how many minutes Pine Middle students exercise each day'
  how: (n: number) => string;   // 'asked 80 students in the gym after school'
  kind: 'convenience' | 'voluntary' | 'undercoverage';
  dir: 'high' | 'low';
  why: string;             // 'students in the gym exercise more than most'
}
export const BIAS: readonly BiasCtx[] = [
  { goal: 'estimate how many minutes Pine Middle students exercise each day', how: n => `asked ${n} students in the gym after school`, kind: 'convenience', dir: 'high', why: 'students in the gym after school exercise more than most' },
  { goal: 'estimate the share of Fairview voters who want a new skate park', how: n => `put a poll on the city website; ${n} people answered`, kind: 'voluntary', dir: 'high', why: 'people who care about skate parks are the most likely to answer' },
  { goal: 'estimate the share of Oak Hill students who bring lunch from home', how: n => `asked ${n} students in the cafeteria lunch line`, kind: 'convenience', dir: 'low', why: 'students in the lunch line are buying lunch, not bringing it' },
  { goal: 'estimate how many minutes Lakeside students read for fun each day', how: n => `asked ${n} students in the library at lunch`, kind: 'convenience', dir: 'high', why: 'students who spend lunch in the library read more than most' },
  { goal: 'estimate the share of Brookfield families who own a car', how: n => `surveyed ${n} homes on the streets next to the train station`, kind: 'undercoverage', dir: 'low', why: 'families next to the station can take the train, so fewer of them need a car' },
  { goal: 'estimate how many hours teens play video games each week', how: n => `posted a poll on a gaming website; ${n} teens answered`, kind: 'voluntary', dir: 'high', why: 'teens on a gaming website play more games than most' },
  { goal: 'estimate the share of Valley View students who ride the bus', how: n => `asked ${n} students who live in the apartments across from the school`, kind: 'undercoverage', dir: 'low', why: 'students who live across from the school walk instead of riding the bus' },
  { goal: 'estimate the share of Central students who think there is too much homework', how: n => `asked readers of the school paper to email their opinion; ${n} emailed`, kind: 'voluntary', dir: 'high', why: 'students who feel strongly that there is too much homework are the most likely to email' },
];

/** two groups to compare (numerical), A usually higher */
export interface TwoCtx { what: string; unit: string; A: string; B: string; who: string; more: string; mu: number }
export const TWO: readonly TwoCtx[] = [
  { what: 'long-jump distances (inches)', unit: 'inches', A: 'eighth graders', B: 'seventh graders', who: 'students', more: 'jump farther', mu: 60 },
  { what: 'minutes of practice a day', unit: 'minutes', A: 'band students', B: 'choir students', who: 'students', more: 'practice longer', mu: 40 },
  { what: 'heights of bean plants (inches)', unit: 'inches', A: 'plants with plant food', B: 'plants without plant food', who: 'plants', more: 'grow taller', mu: 30 },
  { what: 'pages read in a week', unit: 'pages', A: 'students in the reading club', B: 'students not in the club', who: 'students', more: 'read more pages', mu: 50 },
  { what: 'reaction times (hundredths of a second)', unit: 'hundredths of a second', A: 'students who slept under 7 hours', B: 'students who slept 9 hours', who: 'students', more: 'react more slowly', mu: 45 },
  { what: 'scores on a typing test (words per minute)', unit: 'words per minute', A: 'students in the coding class', B: 'students not in the class', who: 'students', more: 'type faster', mu: 35 },
];

export const NAMES = ['Maya', 'Leo', 'Jordan', 'Ava', 'Diego', 'Priya', 'Sam', 'Noah', 'Zoe', 'Malik', 'Grace', 'Ethan', 'Sofia', 'Kenji', 'Aisha', 'Lucas'] as const;
