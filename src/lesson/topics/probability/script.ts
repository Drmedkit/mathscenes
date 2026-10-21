// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// amber = all outcomes, lime = the event / the answer, teal = the other outcomes), `say` is the same line written to
// be read aloud. pages/lessons/probability/voice/lines.json holds the `say` texts (the test keeps them in step).
import { fr } from '../../runtime/item';

const a = (s: string) => `<b class="a">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const B1 = 'B<sub>1</sub>', B2 = 'B<sub>2</sub>', B3 = 'B<sub>3</sub>';

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A bag holds ${a('4 marbles')}: ${s('3 blue')} and 1 white. You reach in without looking and pull one out.`, say: 'A bag holds four marbles: three blue and one white. You reach in without looking and pull one out.' },
  'q.ask': { html: `How likely is it that you pull a ${s('blue')} marble?`, say: 'How likely is it that you pull a blue marble?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `Every marble gets its own name: ${B1}, ${B2}, ${B3} and W. These ${a('4 outcomes')} are the sample space.`, say: 'Every marble gets its own name: B one, B two, B three, and W. These four outcomes are the sample space.' },
  'e.s2': { html: `The marbles are the same size and well mixed, so each one is equally likely: ${fr(1, 4)} each. The colors are not: there are more blue marbles.`, say: 'The marbles are the same size and well mixed, so each one is equally likely: one fourth each. The colors are not: there are more blue marbles.' },
  'e.s3': { html: `The event “blue” is made of ${s('3 outcomes')}: ${B1}, ${B2} and ${B3}. Three of the four.`, say: 'The event blue is made of three outcomes: B one, B two, and B three. Three of the four.' },
  'e.s4': { html: `P(blue) = ${s(fr(3, 4))}: the blue outcomes on top, ${a('all the outcomes')} underneath. On the scale from 0 to 1 that is likely, not certain.`, say: 'P of blue is three fourths: the blue outcomes on top, all the outcomes underneath. On the scale from zero to one, that is likely, not certain.' },
  'e.why': { html: 'Quick check: there are only two colors. Why isn’t the chance of blue one half?', say: "Quick check. There are only two colors. Why isn't the chance of blue one half?" },
  'e.w-ok': { html: `Yes. The marbles are what is equally likely, and ${s('3')} of the ${a('4')} are blue.`, say: 'Yes. The marbles are what is equally likely, and three of the four are blue.' },
  'e.w-eq': { html: 'Two colors don’t make it 50-50. Blue and white are not equally likely: blue has 3 marbles, white has 1.', say: "Two colors don't make it fifty-fifty. Blue and white are not equally likely: blue has three marbles, white has one." },
  'e.w-part': { html: `“3 to 1” compares blue with white. A probability compares blue with ${a('all the marbles')}: 3 of 4.`, say: 'Three to one compares blue with white. A probability compares blue with all the marbles: three of four.' },
  // 3. Your turn
  't.intro': { html: `Now the bag holds ${a('6 marbles')}: 2 blue, 3 white and 1 pink. What is the chance the marble is ${s('not white')}? The first two steps are done for you.`, say: 'Now the bag holds six marbles: two blue, three white, and one pink. What is the chance the marble is not white? The first two steps are done for you.' },
  't.given': { html: `Six marbles, six names, and each one is equally likely: ${fr(1, 6)} each. Your turn.`, say: 'Six marbles, six names, and each one is equally likely: one sixth each. Your turn.' },
  't.count': { html: `Which marbles make up the event ${s('“not white”')}? Tap every one, then Check.`, say: 'Which marbles make up the event not white? Tap every one, then check.' },
  't.c-ok': { html: `Yes: ${B1}, ${B2} and P. ${s('3 outcomes')}.`, say: 'Yes: B one, B two, and P. Three outcomes.' },
  't.c-white': { html: '“Not white” means every marble that is NOT white. Leave the white ones out.', say: 'Not white means every marble that is not white. Leave the white ones out.' },
  't.c-miss': { html: 'Some are missing. Every marble that is not white is in the event, the pink one too.', say: 'Some are missing. Every marble that is not white is in the event, the pink one too.' },
  't.c-one': { html: 'An event can hold more than one outcome. Tap every marble that is not white.', say: 'An event can hold more than one outcome. Tap every marble that is not white.' },
  't.write': { html: 'Now write the chance of not white as a fraction.', say: 'Now write the chance of not white as a fraction.' },
  't.w-ok': { html: `Yes: ${s('3')} of the ${a('6')} marbles, ${fr(3, 6)}.`, say: 'Yes: three of the six marbles. Three sixths.' },
  't.w-colors': { html: 'That counts colors: 2 of the 3 colors. The colors are not equally likely; the marbles are. Count marbles.', say: 'That counts colors: two of the three colors. The colors are not equally likely; the marbles are. Count marbles.' },
  't.w-part': { html: `That compares with the white marbles. Compare with ${a('all 6')} marbles.`, say: 'That compares with the white marbles. Compare with all six marbles.' },
  't.w-count': { html: '3 is how many marbles are in the event. A probability says out of how many: put all the marbles underneath.', say: 'Three is how many marbles are in the event. A probability says out of how many: put all the marbles underneath.' },
  't.w-other': { html: 'Count the marbles in the event for the top, and all the marbles for the bottom.', say: 'Count the marbles in the event for the top, and all the marbles for the bottom.' },
  't.place': { html: 'Where does it go on the scale?', say: 'Where does it go on the scale?' },
  't.p-ok': { html: `Right: ${fr(3, 6)} = ${fr(1, 2)}, as likely as not.`, say: 'Right. Three sixths is one half: as likely as not.' },
  't.p-no': { html: `${fr(3, 6)} is exactly ${fr(1, 2)}: the middle of the scale.`, say: 'Three sixths is exactly one half: the middle of the scale.' },
  't.cb-eq': { html: `At the start you picked ${fr(1, 2)} for blue: that counted colors. Here the answer is ${fr(1, 2)}, but because ${s('3')} of the ${a('6')} marbles count, not because there are two ways.`, say: 'At the start you picked one half for blue: that counted colors. Here the answer is one half, but because three of the six marbles count, not because there are two ways.' },
  't.cb-right': { html: `At the start you picked ${fr(3, 4)}, and you were right. Now you can show why: count the marbles, not the colors.`, say: 'At the start you picked three fourths, and you were right. Now you can show why: count the marbles, not the colors.' },
  't.cb-part': { html: `At the start you picked “3 to 1”. That compares blue with white. A probability compares with all the marbles: ${fr(3, 4)}.`, say: 'At the start you picked three to one. That compares blue with white. A probability compares with all the marbles: three fourths.' },
  't.cb-none': { html: `At the start: 3 of the 4 marbles are blue, so the chance of blue is ${fr(3, 4)}.`, say: 'At the start: three of the four marbles are blue, so the chance of blue is three fourths.' },
  // 4. Prove it
  'p.intro': { html: `Sam uses the first bag: ${s('3 blue')} and 1 white. Sam pulls a marble, puts it back and mixes, 4 times: blue, white, blue, white. Sam says: “The chance of blue is really ${fr(1, 2)}, so ${fr(3, 4)} was wrong.” Is Sam right?`, say: 'Sam uses the first bag: three blue and one white. Sam pulls a marble, puts it back and mixes, four times: blue, white, blue, white. Sam says: the chance of blue is really one half, so three fourths was wrong. Is Sam right?' },
  'p.yes': { html: 'Let’s test it. Build the argument and see where it leads.', say: "Let's test it. Build the argument and see where it leads." },
  'p.no': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'Ten batches of 4 draws: the number of blues jumps around, and 2 blue is nothing unusual.', say: 'Ten batches of four draws: the number of blues jumps around, and two blues is nothing unusual.' },
  'p.c2': { html: `Four hundred draws: the share of blue wanders at first, then settles close to ${fr(3, 4)}.`, say: 'Four hundred draws: the share of blue wanders at first, then settles close to three fourths.' },
  'p.c3': { html: `A probability describes the long run. Four draws can’t overturn ${fr(3, 4)}.`, say: "A probability describes the long run. Four draws can't overturn three fourths." },
  'p.x-mirror': { html: 'Four draws don’t have to give exactly 3 blue. The batches show it: they jump around.', say: "Four draws don't have to give exactly three blue. The batches show it: they jump around." },
  'p.x-closer': { html: 'Not every draw: the share can wander away for a while. It settles only over many draws.', say: 'Not every draw: the share can wander away for a while. It settles only over many draws.' },
  'p.x-due': { html: `Nothing is due: the marble goes back and the bag is mixed. Every draw is ${fr(3, 4)} for blue.`, say: 'Nothing is due: the marble goes back and the bag is mixed. Every draw is three fourths for blue.' },
  'p.x-other': { html: 'True, but it backs a different line. Which reason makes this line true?', say: 'True, but it backs a different line. Which reason makes this line true?' },
  'p.done': { html: 'That’s a proof: three claims, each with its reason, and the picture backs every one. Sam judged a probability by four draws.', say: "That's a proof: three claims, each with its reason, and the picture backs every one. Sam judged a probability by four draws." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
