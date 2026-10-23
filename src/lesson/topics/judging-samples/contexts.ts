// contexts.ts: the study skins of "judging samples". Each context is one statistical question about one population
// (people, days, apples), with the ways a study could have collected its data: selective rules (who they favour or
// leave out, and the likely direction of the effect), other groups that are NOT the population, a census, and
// reasons answers went missing (linked to the answer, with a direction). Pure data; US English, no money.
import type { Direction } from './sampling';
import type { Mark } from './SampleMap';

export interface Rule {
  kind: 'convenience' | 'voluntary' | 'place' | 'keep';
  /** what they did ('{n}' is the number asked) */
  how: string;
  n: readonly [number, number];
  /** the asked group, plural, without the number: 'kids at the gym after school' */
  group: string;
  /** short map label after the number: '60 at the gym' */
  tag: string;
  /** who the rule leaves out */
  leftOut: string;
  dir: Direction;
  /** why that direction (or why it cannot be told) */
  why: string;
}
export interface Other { group: string; tag: string; n: readonly [number, number]; why: string }
export interface Missing {
  /** 'handed a survey form to all 240 seventh graders' */
  sent: string;
  /** '{r} forms came back' / '{m} were not returned' */
  back: string; notBack: string;
  /** a stipulated reason NOT linked to the answer ('{m}' allowed) */
  lost: string[];
  /** reasons linked to the answer, with the likely direction of the result */
  related: { reason: string; dir: 'high' | 'low' }[];
}
export interface Ctx {
  id: string;
  mark: Mark;
  /** what one member is called, plural (the map's scale note) */
  unit: string;
  N: number;
  /** 'all 240 seventh graders at Lincoln Middle' / 'the 240 seventh graders at Lincoln Middle' / map label */
  pop: string; popOf: string; popShort: string;
  /** the population named without its scope ('all seventh graders') */
  broad: string;
  /** a wider group an overreaching claim jumps to */
  wider: string;
  /** the members, plural ('Lincoln seventh graders') */
  members: string;
  asker: string; askerGroup: string;
  q: string;
  ourAsker: string; qOur: string;
  /** what "yes" means, as a plural verb phrase ('get an hour of exercise most days') */
  yes: string;
  /** 'the missing ones {yesLess}' -> the result is too high */
  yesLess: string;
  rules: Rule[];
  others: Other[];
  census: string;
  missing: Missing;
}

export const CONTEXTS: readonly Ctx[] = [
  {
    id: 'lincoln', unit: 'students', mark: 'person', N: 240,
    pop: 'all 240 seventh graders at Lincoln Middle', popOf: 'the 240 seventh graders at Lincoln Middle', popShort: '240 seventh graders',
    broad: 'all seventh graders', wider: 'seventh graders across the country', members: 'Lincoln seventh graders',
    asker: 'The Lincoln student council', askerGroup: 'the student council members',
    q: 'Do seventh graders at Lincoln Middle get an hour of exercise most days?',
    ourAsker: 'A Lincoln seventh grader asks', qOur: 'Do seventh graders at our school get an hour of exercise most days?',
    yes: 'get an hour of exercise most days', yesLess: 'exercise less than the others',
    rules: [
      { kind: 'place', how: 'asked {n} kids at the gym after school', n: [40, 70], group: 'kids at the gym after school', tag: 'at the gym', leftOut: 'kids who go straight home after school', dir: 'high', why: 'kids at the gym are more likely to exercise' },
      { kind: 'convenience', how: 'asked the {n} kids on the track team', n: [18, 32], group: 'kids on the track team', tag: 'track team', leftOut: 'seventh graders who are not on the track team', dir: 'high', why: 'runners on a team train almost every day' },
      { kind: 'voluntary', how: 'posted a poll on the PE class page, and {n} kids chose to answer', n: [50, 110], group: 'kids who chose to answer the poll', tag: 'poll answers', leftOut: 'kids who skipped the poll', dir: 'unknown', why: 'we cannot tell whether kids who answer polls exercise more or less than the rest' },
      { kind: 'place', how: 'asked {n} kids in the library at lunch', n: [25, 45], group: 'kids in the library at lunch', tag: 'in the library', leftOut: 'kids who play outside at lunch', dir: 'low', why: 'the kids playing outside at lunch are likely more active' },
    ],
    others: [
      { group: 'parents at the PTA meeting', tag: 'PTA parents', n: [20, 45], why: 'parents are not seventh graders' },
      { group: 'eighth graders in the after-school club', tag: 'eighth graders', n: [20, 40], why: 'eighth graders are not seventh graders' },
    ],
    census: 'had every one of the 240 seventh graders answer on a form in homeroom',
    missing: {
      sent: 'handed a survey form to all 240 seventh graders', back: '{r} forms came back', notBack: '{m} did not',
      lost: ['A folder with {m} of the forms was lost before anyone read them.', 'The {m} forms from one homeroom were thrown out by mistake before anyone read them.'],
      related: [{ reason: 'Many kids with sports practice left school early that day and never got the form.', dir: 'low' }],
    },
  },
  {
    id: 'oakhill', unit: 'students', mark: 'person', N: 200,
    pop: 'all 200 students at Oak Hill Middle', popOf: 'the 200 students at Oak Hill Middle', popShort: '200 students',
    broad: 'all students', wider: 'middle schoolers everywhere', members: 'Oak Hill students',
    asker: 'The Oak Hill librarian', askerGroup: 'the librarian',
    q: 'Do students at Oak Hill Middle read for fun every week?',
    ourAsker: 'The Oak Hill school paper asks', qOur: 'Do students at our school read for fun every week?',
    yes: 'read for fun every week', yesLess: 'read less than the others',
    rules: [
      { kind: 'place', how: 'asked {n} students in the library at lunch', n: [30, 50], group: 'students in the library at lunch', tag: 'in the library', leftOut: 'students who spend lunch somewhere else', dir: 'high', why: 'students who choose the library are more likely to read for fun' },
      { kind: 'convenience', how: 'asked the {n} members of the book club', n: [12, 24], group: 'book club members', tag: 'book club', leftOut: 'students who are not in the book club', dir: 'high', why: 'book club members read for fun almost by definition' },
      { kind: 'keep', how: 'kept only the forms from the honors English classes, {n} in all', n: [40, 70], group: 'students in honors English', tag: 'honors English', leftOut: 'students in the other English classes', dir: 'high', why: 'honors English students are likely to read more' },
      { kind: 'place', how: 'asked {n} students at a basketball game', n: [40, 80], group: 'students at the basketball game', tag: 'at the game', leftOut: 'students who did not go to the game', dir: 'unknown', why: 'we cannot tell whether fans read more or less than other students' },
    ],
    others: [
      { group: 'teachers in the staff room', tag: 'teachers', n: [12, 25], why: 'teachers are not Oak Hill students' },
      { group: 'parents at the book fair', tag: 'parents', n: [20, 40], why: 'parents are not Oak Hill students' },
    ],
    census: 'had every one of the 200 students fill in the form in homeroom',
    missing: {
      sent: 'handed a reading survey to all 200 students', back: '{r} forms came back', notBack: '{m} did not',
      lost: ['A folder with {m} of the forms was lost before anyone read them.', 'The {m} forms from one hallway locker got wet and were thrown away unread.'],
      related: [{ reason: 'Teachers noticed that students who do not like reading often left the form in their backpacks.', dir: 'high' }],
    },
  },
  {
    id: 'eastside', unit: 'students', mark: 'person', N: 600,
    pop: 'all 600 students at Eastside Middle', popOf: 'the 600 students at Eastside Middle', popShort: '600 students',
    broad: 'all students', wider: 'students at every school in the city', members: 'Eastside students',
    asker: 'The Eastside cafeteria manager', askerGroup: 'the cafeteria manager',
    q: 'Do students at Eastside Middle like the new lunch menu?',
    ourAsker: 'The Eastside student paper asks', qOur: 'Do students at our school like the new lunch menu?',
    yes: 'like the new lunch menu', yesLess: 'like the menu less than the others',
    rules: [
      { kind: 'place', how: 'asked {n} students in the cafeteria line', n: [120, 220], group: 'students in the cafeteria line', tag: 'in the lunch line', leftOut: 'students who bring lunch from home', dir: 'high', why: 'students who dislike the menu are more likely to bring lunch from home' },
      { kind: 'voluntary', how: 'set out a comment box, and {n} students dropped in a card', n: [30, 80], group: 'students who chose to leave a card', tag: 'comment cards', leftOut: 'students who did not bother to write', dir: 'unknown', why: 'people with strong feelings either way write cards, so we cannot tell which way' },
      { kind: 'keep', how: 'printed only the {n} cards that praised the food', n: [15, 40], group: 'students whose cards praised the food', tag: 'praise cards', leftOut: 'students whose cards complained', dir: 'high', why: 'every complaint was left out' },
      { kind: 'convenience', how: 'asked the {n} students on the menu committee', n: [8, 15], group: 'students on the menu committee', tag: 'menu committee', leftOut: 'students who did not help choose the menu', dir: 'high', why: 'the committee picked the menu, so they are likely to like it' },
    ],
    others: [
      { group: 'cafeteria workers', tag: 'cafeteria staff', n: [8, 16], why: 'the workers are not Eastside students' },
      { group: 'students at Westside Middle', tag: 'Westside students', n: [40, 90], why: 'Westside students go to a different school' },
    ],
    census: 'had all 600 students vote on the menu in homeroom',
    missing: {
      sent: 'handed a menu survey to all 600 students', back: '{r} forms came back', notBack: '{m} did not',
      lost: ['A box with {m} of the forms was recycled by mistake before anyone read them.'],
      related: [{ reason: 'Students who never buy school lunch threw the form away, saying it was not about them.', dir: 'high' }],
    },
  },
  {
    id: 'riverside', unit: 'students', mark: 'person', N: 500,
    pop: 'all 500 students at Riverside Middle', popOf: 'the 500 students at Riverside Middle', popShort: '500 students',
    broad: 'all teenagers', wider: 'teenagers everywhere', members: 'Riverside students',
    asker: 'A Riverside health teacher', askerGroup: 'the health teacher',
    q: 'Do students at Riverside Middle spend more than 2 hours a day on their phones?',
    ourAsker: 'The Riverside student council asks', qOur: 'Do students at our school spend more than 2 hours a day on their phones?',
    yes: 'spend more than 2 hours a day on their phones', yesLess: 'use their phones less than the others',
    rules: [
      { kind: 'voluntary', how: 'posted a poll on a gaming forum, and {n} Riverside students answered', n: [40, 120], group: 'students who answered on the gaming forum', tag: 'forum answers', leftOut: 'students who never visit the forum', dir: 'high', why: 'kids on a gaming forum are likely to spend a lot of time on screens' },
      { kind: 'convenience', how: 'asked the {n} students in the chess club', n: [12, 25], group: 'chess club members', tag: 'chess club', leftOut: 'students who are not in the chess club', dir: 'unknown', why: 'we cannot tell whether chess players use their phones more or less' },
      { kind: 'place', how: 'asked {n} students on the bus ride home', n: [40, 80], group: 'students on the bus home', tag: 'on the bus', leftOut: 'students who walk or get a ride home', dir: 'unknown', why: 'we cannot tell whether bus riders use their phones more or less' },
      { kind: 'place', how: 'asked {n} students at the phone-free nature camp', n: [30, 60], group: 'students at the phone-free camp', tag: 'nature camp', leftOut: 'students who did not go to the camp', dir: 'low', why: 'kids who sign up for a phone-free camp are likely to use their phones less' },
    ],
    others: [
      { group: 'parents at back-to-school night', tag: 'parents', n: [30, 60], why: 'parents are not Riverside students' },
      { group: 'high school students at the mall', tag: 'high schoolers', n: [25, 50], why: 'high school students are not Riverside Middle students' },
    ],
    census: 'had all 500 students answer on a class tablet in homeroom',
    missing: {
      sent: 'sent a phone survey to all 500 students', back: '{r} answered', notBack: '{m} did not',
      lost: ['A server glitch deleted {m} answers before anyone read them, picked by the order they came in.'],
      related: [{ reason: 'Students who do not have a phone skipped the question.', dir: 'high' }],
    },
  },
  {
    id: 'bus', unit: 'days', mark: 'day', N: 21,
    pop: 'all 21 school days in March', popOf: 'the 21 school days in March', popShort: '21 school days',
    broad: 'all days', wider: 'every school day of the year', members: 'March school days',
    asker: 'A parent on bus Route 7', askerGroup: 'the parent who kept the log',
    q: 'Was the 7:40 bus on Route 7 late on most school days in March?',
    ourAsker: 'A Route 7 rider asks', qOur: 'Was our bus late on most school days this March?',
    yes: 'had a late bus', yesLess: 'had fewer late buses than the others',
    rules: [
      { kind: 'place', how: 'checked the bus only on the {n} rainy days', n: [4, 6], group: 'rainy days', tag: 'rainy days', leftOut: 'the dry days', dir: 'high', why: 'buses run late more often in the rain' },
      { kind: 'place', how: 'checked the bus only on the {n} Mondays', n: [4, 4], group: 'Mondays', tag: 'Mondays', leftOut: 'Tuesdays to Fridays', dir: 'unknown', why: 'we cannot tell whether Mondays are better or worse than other days' },
      { kind: 'keep', how: 'used only the {n} days with no complaints in the bus company report', n: [8, 14], group: 'days with no complaints', tag: 'no-complaint days', leftOut: 'days when riders complained', dir: 'low', why: 'riders complain most when the bus is late' },
    ],
    others: [
      { group: 'school days in May', tag: 'May days', n: [18, 22], why: 'May days are not March days' },
      { group: 'school days last March', tag: 'last March', n: [18, 22], why: 'last year is a different March' },
    ],
    census: 'wrote down the arrival time on every one of the 21 school days',
    missing: {
      sent: 'kept a log of the 7:40 bus for all 21 school days', back: '{r} days have a time written down', notBack: '{m} days are blank',
      lost: ['The page for {m} of the days got soaked by a spilled drink before anyone read it.'],
      related: [{ reason: 'The log was skipped on days the bus came so late that everyone rushed to class.', dir: 'low' }],
    },
  },
  {
    id: 'orchard', unit: 'apples', mark: 'apple', N: 2000,
    pop: 'all 2,000 apples picked this week at Miller Orchard', popOf: 'the 2,000 apples picked this week', popShort: '2,000 apples',
    broad: 'all apples', wider: 'apples from every orchard', members: 'apples from this week',
    asker: 'The orchard owner', askerGroup: 'the orchard owner',
    q: 'Are many of the apples picked this week at Miller Orchard bruised?',
    ourAsker: 'The Miller Orchard owner asks', qOur: 'Are many of our apples from this week bruised?',
    yes: 'are bruised', yesLess: 'are less bruised than the others',
    rules: [
      { kind: 'keep', how: 'checked {n} apples from the top layer of the crates', n: [30, 60], group: 'apples from the top layer', tag: 'top layer', leftOut: 'apples at the bottom of the crates', dir: 'low', why: 'the bottom apples get squashed, so they bruise more' },
      { kind: 'keep', how: 'checked only the {n} best-looking apples set aside for the farm stand', n: [20, 50], group: 'best-looking apples', tag: 'farm stand', leftOut: 'the apples that looked worse', dir: 'low', why: 'the bad-looking apples were never checked' },
      { kind: 'place', how: 'checked {n} apples that had fallen on the ground', n: [20, 40], group: 'apples from the ground', tag: 'from the ground', leftOut: 'apples picked from the trees', dir: 'high', why: 'apples that fall hit the ground and bruise' },
    ],
    others: [
      { group: 'apples at the grocery store', tag: 'store apples', n: [20, 50], why: 'store apples are not the Miller apples from this week' },
      { group: 'apples from last year', tag: 'last year', n: [30, 60], why: 'last year was a different harvest' },
    ],
    census: 'ran every one of the 2,000 apples through a bruise scanner',
    missing: {
      sent: 'ran all 2,000 apples through a bruise scanner', back: '{r} got a reading', notBack: '{m} got none',
      lost: ['The scanner skipped {m} apples during a short power cut, whatever apples happened to be on the belt.'],
      related: [{ reason: 'The scanner could not read apples covered in mud, and muddy apples are often ones that fell on the ground.', dir: 'low' }],
    },
  },
  {
    id: 'maplefalls', unit: 'kids', mark: 'person', N: 900,
    pop: 'all 900 kids ages 10 to 14 in Maple Falls', popOf: 'the 900 kids ages 10 to 14 in Maple Falls', popShort: '900 kids, 10 to 14',
    broad: 'all kids', wider: 'kids in every town', members: 'Maple Falls kids ages 10 to 14',
    asker: 'The Maple Falls town council', askerGroup: 'the town council members',
    q: 'Do kids ages 10 to 14 in Maple Falls want a skate park?',
    ourAsker: 'A Maple Falls kid asks', qOur: 'Do kids ages 10 to 14 in our town want a skate park?',
    yes: 'want a skate park', yesLess: 'care less about skating than the others',
    rules: [
      { kind: 'place', how: 'asked {n} kids outside the skate shop', n: [30, 60], group: 'kids outside the skate shop', tag: 'at the skate shop', leftOut: 'kids who do not skate', dir: 'high', why: 'kids at a skate shop are likely to skate' },
      { kind: 'voluntary', how: 'put a poll on the town website, and {n} kids voted', n: [60, 140], group: 'kids who chose to vote online', tag: 'online votes', leftOut: 'kids who skipped the poll', dir: 'unknown', why: 'kids who care a lot either way vote, so we cannot tell which way' },
      { kind: 'place', how: 'asked {n} kids at the library chess afternoon', n: [15, 30], group: 'kids at the chess afternoon', tag: 'chess afternoon', leftOut: 'kids who were not at the library', dir: 'unknown', why: 'we cannot tell whether chess players want a skate park more or less' },
    ],
    others: [
      { group: 'adults at the town meeting', tag: 'adults', n: [25, 60], why: 'adults are not kids ages 10 to 14' },
      { group: 'high school seniors', tag: 'seniors', n: [20, 45], why: 'seniors are older than 14' },
    ],
    census: 'had every one of the 900 kids answer a form sent home through the schools',
    missing: {
      sent: 'emailed a survey to all 900 kids ages 10 to 14', back: '{r} answered', notBack: '{m} did not',
      lost: ['A typo in the address list sent {m} of the emails to nobody, whatever the kids thought.'],
      related: [{ reason: 'Kids who do not skate mostly never opened the email about the survey.', dir: 'high' }],
    },
  },
  {
    id: 'rivera', unit: 'students', mark: 'person', N: 28,
    pop: 'all 28 students in Ms. Rivera’s homeroom', popOf: 'the 28 students in Ms. Rivera’s homeroom', popShort: '28 students',
    broad: 'all students', wider: 'students in every homeroom', members: 'students in Ms. Rivera’s homeroom',
    asker: 'Ms. Rivera', askerGroup: 'Ms. Rivera',
    q: 'Do students in Ms. Rivera’s homeroom play an instrument?',
    ourAsker: 'A student in Ms. Rivera’s homeroom asks', qOur: 'Do students in our homeroom play an instrument?',
    yes: 'play an instrument', yesLess: 'play music less than the others',
    rules: [
      { kind: 'convenience', how: 'asked the {n} students who stayed for music club', n: [6, 10], group: 'music club students', tag: 'music club', leftOut: 'students who went home after class', dir: 'high', why: 'music club students are likely to play an instrument' },
      { kind: 'place', how: 'asked the {n} students who came in early', n: [6, 12], group: 'students who came in early', tag: 'came early', leftOut: 'students who came on time', dir: 'unknown', why: 'we cannot tell whether early students play more or less music' },
      { kind: 'place', how: 'asked the {n} students sitting by the band room door', n: [5, 9], group: 'students by the band room door', tag: 'by the band room', leftOut: 'students sitting across the room', dir: 'high', why: 'band kids sit near the band room so they can leave early for practice' },
    ],
    others: [
      { group: 'students in Mr. Park’s homeroom', tag: 'Mr. Park’s class', n: [24, 30], why: 'they are in a different homeroom' },
      { group: 'music teachers', tag: 'music teachers', n: [3, 5], why: 'teachers are not students in the homeroom' },
    ],
    census: 'asked all 28 students and counted every answer',
    missing: {
      sent: 'handed a form to all 28 students', back: '{r} came back', notBack: '{m} did not',
      lost: ['Ms. Rivera dropped {m} of the forms on the bus before reading them.'],
      related: [{ reason: 'The students on a band trip that day missed the survey.', dir: 'low' }],
    },
  },
  {
    id: 'pineridge', unit: 'students', mark: 'person', N: 150,
    pop: 'all 150 seventh graders at Pine Ridge', popOf: 'the 150 seventh graders at Pine Ridge', popShort: '150 seventh graders',
    broad: 'all seventh graders', wider: 'seventh graders everywhere', members: 'Pine Ridge seventh graders',
    asker: 'The Pine Ridge school nurse', askerGroup: 'the school nurse',
    q: 'Do seventh graders at Pine Ridge sleep at least 9 hours on school nights?',
    ourAsker: 'A Pine Ridge seventh grader asks', qOur: 'Do seventh graders at our school sleep at least 9 hours on school nights?',
    yes: 'sleep at least 9 hours on school nights', yesLess: 'sleep less than the others',
    rules: [
      { kind: 'place', how: 'asked {n} kids at the 6 a.m. swim practice', n: [15, 30], group: 'kids at early swim practice', tag: 'swim practice', leftOut: 'kids who are still asleep at 6 a.m.', dir: 'low', why: 'kids who get up before dawn for practice may sleep less' },
      { kind: 'place', how: 'asked {n} kids at a late-night gaming event', n: [15, 35], group: 'kids at the gaming event', tag: 'gaming night', leftOut: 'kids who were home in bed', dir: 'low', why: 'kids who stay up late are less likely to sleep 9 hours' },
      { kind: 'voluntary', how: 'linked a poll on a sleep-tips website, and {n} kids answered', n: [20, 50], group: 'kids who answered the website poll', tag: 'website poll', leftOut: 'kids who never visit that site', dir: 'unknown', why: 'we cannot tell whether kids on a sleep website sleep more or less' },
    ],
    others: [
      { group: 'parents of Pine Ridge seventh graders', tag: 'parents', n: [20, 50], why: 'parents are not seventh graders' },
      { group: 'fifth graders at the elementary school', tag: 'fifth graders', n: [20, 45], why: 'fifth graders are not Pine Ridge seventh graders' },
    ],
    census: 'had every one of the 150 seventh graders answer in science class',
    missing: {
      sent: 'handed a sleep survey to all 150 seventh graders', back: '{r} came back', notBack: '{m} did not',
      lost: ['A stack of {m} forms blew out of a window before anyone read them.'],
      related: [{ reason: 'Kids who were too tired came in late and missed the survey in first period.', dir: 'high' }],
    },
  },
];

// ---------- small groups with sign-up sheets (integrate-report) ----------
export interface Sheet {
  id: string;
  /** 'the robotics club' (the whole group the sheet covers) */
  group: string;
  /** what the sheet asked, and the yes phrase as a plural verb */
  question: string; ask: string; yes: string;
  /** a wider group an overreaching claim jumps to */
  wider: string;
  /** a measurement mismatch: what was really asked vs. what the claim says */
  measured: { question: string; claim: string };
  /** a collection defect: who actually signed */
  partial: string;
}
export const SHEETS: readonly Sheet[] = [
  { id: 'robotics', group: 'the robotics club', question: 'Do you walk to school?', ask: 'walks?', yes: 'walk to school', wider: 'kids in the whole city',
    measured: { question: 'Did you walk to school today?', claim: 'walk to school every day' }, partial: 'Only the members at Friday’s build session signed the sheet.' },
  { id: 'soccer', group: 'the soccer team', question: 'Do you have a pet?', ask: 'pet?', yes: 'have a pet', wider: 'kids across the state',
    measured: { question: 'Did you take care of a pet this weekend?', claim: 'have a pet' }, partial: 'Only the players who stayed after practice signed the sheet.' },
  { id: 'art', group: 'the art club', question: 'Do you sketch every day?', ask: 'sketch?', yes: 'sketch every day', wider: 'kids everywhere',
    measured: { question: 'Did you sketch today?', claim: 'sketch every day' }, partial: 'Only the members at the Tuesday meeting signed the sheet.' },
  { id: 'band', group: 'the jazz band', question: 'Do you play a second instrument?', ask: 'second?', yes: 'play a second instrument', wider: 'musicians everywhere',
    measured: { question: 'Did you practice a second instrument this week?', claim: 'play a second instrument' }, partial: 'Only the players at the early rehearsal signed the sheet.' },
  { id: 'debate', group: 'the debate team', question: 'Do you read the news daily?', ask: 'news?', yes: 'read the news daily', wider: 'teenagers everywhere',
    measured: { question: 'Did you read the news yesterday?', claim: 'read the news every day' }, partial: 'Only the members at the Monday practice signed the sheet.' },
];
export const NAMES: readonly string[] = [
  'Ava R.', 'Liam K.', 'Mia T.', 'Noah P.', 'Zoe L.', 'Eli M.', 'Ruby S.', 'Owen D.', 'Isla B.', 'Leo W.', 'Nora C.', 'Jack H.',
  'Maya G.', 'Sam F.', 'Lily J.', 'Ben A.', 'Emma V.', 'Kai N.', 'Ella Y.', 'Jude O.', 'Aria Q.', 'Finn E.', 'June Z.', 'Theo U.',
  'Rosa I.', 'Max X.', 'Ivy P.', 'Gus T.', 'Lena B.', 'Omar S.',
];
