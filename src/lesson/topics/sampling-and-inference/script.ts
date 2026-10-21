// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// the population amber, a sample / its values teal, the estimate and the key relation lime, a biased method
// lavender), `say` is the same line written to be read aloud. pages/lessons/sampling-and-inference/voice/lines.json
// holds the `say` texts (the test keeps the two in step). The numbers are the story's (story.ts asserts them).

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`, p = (x: string) => `<b class="p">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question: Maya 46, Leo 34, 200 seventh graders
  'q.intro': { html: `Ridgeview Middle has ${a('200 seventh graders')}. The student council wants their mean homework time last night.`, say: 'Ridgeview Middle has two hundred seventh graders. The student council wants their mean homework time last night.' },
  'q.draw': { html: `Maya draws ${b('10 names from a hat')}: their mean is ${b('46 minutes')}. Leo puts the names back and draws 10: ${b('34 minutes')}.`, say: 'Maya draws ten names from a hat: their mean is forty-six minutes. Leo puts the names back and draws ten: thirty-four minutes.' },
  'q.ask': { html: 'What should the council conclude?', say: 'What should the council conclude?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the board.', say: 'Four steps. Press each one: the picture moves first, then the board.' },
  'e.s1': { html: `The ${a('population')} is all 200 seventh graders: everyone the question is about. The ${b('sample')} is the 10 names Maya drew, by chance.`, say: 'The population is all two hundred seventh graders: everyone the question is about. The sample is the ten names Maya drew, by chance.' },
  'e.s2': { html: `Maya’s 10 times add up to 460 minutes. 460 ÷ 10 = ${s('46')}: the ${s('sample mean')}, our estimate for all 200.`, say: 'Maya’s ten times add up to four hundred sixty minutes. Four hundred sixty divided by ten is forty-six: the sample mean, our estimate for all two hundred.' },
  'e.s3': { html: `Draw again, and again: 20 random samples of 10. Each dot is ${s('one sample’s mean')}. They run from 34 to 50.5.`, say: 'Draw again, and again: twenty random samples of ten. Each dot is one sample’s mean. They run from thirty-four to fifty and a half.' },
  'e.s4': { html: `The planner app logged everyone: the ${a('mean of all 200 is 42')}. Most sample means land ${s('within 6 minutes')} of it.`, say: 'The planner app logged everyone: the mean of all two hundred is forty-two. Most sample means land within six minutes of it.' },
  'e.why': { html: 'Quick check: why don’t the 20 sample means all equal 42?', say: 'Quick check: why don’t the twenty sample means all equal forty-two?' },
  'e.w-ok': { html: 'Yes. Chance picks a different 10 each time, so each mean comes out a little different. That is sampling variability, not a mistake.', say: 'Yes. Chance picks a different ten each time, so each mean comes out a little different. That is sampling variability, not a mistake.' },
  'e.w-mirror': { html: 'Every one of these samples was drawn fairly. A fair random sample lands near the population mean, not on it.', say: 'Every one of these samples was drawn fairly. A fair random sample lands near the population mean, not on it.' },
  'e.w-dot': { html: 'Look at the bottom plot again: each dot is the mean of a whole sample of 10, not one student.', say: 'Look at the bottom plot again: each dot is the mean of a whole sample of ten, not one student.' },
  // 3. Your turn: samples of 40
  't.intro': { html: `Now each sample has ${b('40 students')}. Step one is done for you.`, say: 'Now each sample has forty students. Step one is done for you.' },
  't.mean': { html: `This sample’s 40 times add up to ${b('1,720 minutes')}. What is the sample mean?`, say: 'This sample’s forty times add up to one thousand seven hundred twenty minutes. What is the sample mean?' },
  't.m-ok': { html: `Yes: 1,720 ÷ 40 = ${s('43')}. Our estimate: about 43 minutes for all 200.`, say: 'Yes: one thousand seven hundred twenty divided by forty is forty-three. Our estimate: about forty-three minutes for all two hundred.' },
  't.m-ten': { html: 'There are 40 students in this sample, not 10. Divide by 40.', say: 'There are forty students in this sample, not ten. Divide by forty.' },
  't.m-other': { html: 'Share the total equally: 1,720 ÷ 40.', say: 'Share the total equally: one thousand seven hundred twenty divided by forty.' },
  't.predict': { html: 'Predict: 20 random samples of 40. Compared with the means of samples of 10, their means will be…', say: 'Predict: twenty random samples of forty. Compared with the means of samples of ten, their means will be…' },
  't.p-ok': { html: `Right. A mean of 40 times averages out more highs and lows, so the ${s('means bunch closer')}.`, say: 'Right. A mean of forty times averages out more highs and lows, so the means bunch closer.' },
  't.p-same': { html: 'The students vary as much as ever (top plot). But a mean of 40 averages out more highs and lows: watch the bottom plot.', say: 'The students vary as much as ever, in the top plot. But a mean of forty averages out more highs and lows: watch the bottom plot.' },
  't.p-more': { html: 'More students in a sample make its mean steadier, not wilder. Watch the bottom plot.', say: 'More students in a sample make its mean steadier, not wilder. Watch the bottom plot.' },
  't.far': { html: 'Most of the 20 means of 40 land within about how far of 42?', say: 'Most of the twenty means of forty land within about how far of forty-two?' },
  't.f-ok': { html: `Yes: within about ${s('3 minutes')}, half as far as with samples of 10.`, say: 'Yes: within about three minutes, half as far as with samples of ten.' },
  't.f-six': { html: '6 minutes was for samples of 10. Look at the bottom plot: the means of 40 bunch tighter.', say: 'Six minutes was for samples of ten. Look at the bottom plot: the means of forty bunch tighter.' },
  't.f-14': { html: '14 minutes is how far single students typically are from 42. Means of 40 vary far less.', say: 'Fourteen minutes is how far single students typically are from forty-two. Means of forty vary far less.' },
  't.cb-right': { html: 'At the start you said both samples were fair estimates, and you were right: random samples vary. Now you can see how much, and that bigger samples vary less.', say: 'At the start you said both samples were fair estimates, and you were right: random samples vary. Now you can see how much, and that bigger samples vary less.' },
  't.cb-mirror': { html: 'At the start you thought one of them made a mistake. Now you have seen 20 fair samples: none of them matched exactly. Random samples vary.', say: 'At the start you thought one of them made a mistake. Now you have seen twenty fair samples: none of them matched exactly. Random samples vary.' },
  't.cb-exact': { html: 'At the start you picked “exactly 40”. The mean of all 200 is 42: two samples give estimates, never the exact value.', say: 'At the start you picked exactly forty. The mean of all two hundred is forty-two: two samples give estimates, never the exact value.' },
  't.cb-none': { html: 'At the start: Maya’s 46 and Leo’s 34 are both fair estimates. Random samples vary, and bigger samples vary less.', say: 'At the start: Maya’s forty-six and Leo’s thirty-four are both fair estimates. Random samples vary, and bigger samples vary less.' },
  // 4. Prove it: the online poll
  'p.intro': { html: `Ridgeview also ran an ${p('online poll')}: 60 seventh graders chose to answer, mean ${p('55 minutes')}. Jordan says: “60 answers beat 40, so 55 is the better estimate.” Is Jordan right?`, say: 'Ridgeview also ran an online poll: sixty seventh graders chose to answer, mean fifty-five minutes. Jordan says: sixty answers beat forty, so fifty-five is the better estimate. Is Jordan right?' },
  'p.test': { html: 'Let’s test it. Build the argument and see where it leads.', say: 'Let’s test it. Build the argument and see where it leads.' },
  'p.prove': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: `A ${b('random sample of 40')} lands near the ${a('mean of all 200')}, give or take chance,`, say: 'A random sample of forty lands near the mean of all two hundred, give or take chance, because every student had the same chance to be picked.' },
  'p.c2': { html: `the ${p('poll’s 60')} lean toward students with lots of homework,`, say: 'the poll’s sixty lean toward students with lots of homework, because students with a lot of homework are the most likely to answer a poll about it.' },
  'p.c3': { html: `so the poll misses ${p('the same way every time')}, however many answer.`, say: 'so the poll misses the same way every time, however many answer, because more answers shrink chance error, not the error from how the sample was chosen.' },
  'p.x-big': { html: 'More volunteers lean the same way. Size shrinks chance error, not a lean in who answers.', say: 'More volunteers lean the same way. Size shrinks chance error, not a lean in who answers.' },
  'p.x-honest': { html: 'Everyone can answer honestly and the poll still misses: the problem is who answered, not lying.', say: 'Everyone can answer honestly and the poll still misses: the problem is who answered, not lying.' },
  'p.x-mirror': { html: 'A random sample lands near the population mean, not exactly on it. That is not the reason here.', say: 'A random sample lands near the population mean, not exactly on it. That is not the reason here.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: 'That’s the proof. Random samples miss by chance, both ways, and less when they are bigger. The poll misses by 13 minutes, the same way every time: that is bias, and more answers don’t fix it.', say: 'That’s the proof. Random samples miss by chance, both ways, and less when they are bigger. The poll misses by thirteen minutes, the same way every time: that is bias, and more answers don’t fix it.' },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
