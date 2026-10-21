// script.ts: every line the panel shows in parts 1-4, by voice line id. The spoken text of each id (written to be
// read aloud) is in pages/lessons/reading-maps/voice/lines.json; the test checks both have the same ids.
// Colour roles in the text: a = a map length (amber), b = a real distance (teal), s = the answer (lime).
export const SCRIPT: Record<string, string> = {
  // 1 The question
  'q.intro': 'Maya bikes from <b>Millbrook</b> to <b>Lake Camp</b> on the roads: east on the highway, then north on the road. About how far does she ride? Pick an answer, and say how sure you are.',

  // 2 Worked example
  'e.intro': 'Four steps. Press each one: the map moves first, then the board.',
  'e.step0': 'The map key says a dot is a town and a tent is a camp. Measure from the <b>center</b> of each symbol. The size of a symbol is not the size of the place.',
  'e.step1': 'The scale bar is a number line: 0, 2, 4, 6 miles. Every interval is <b class="a">1 inch</b> long and represents <b class="b">2 miles</b>, everywhere on this map.',
  'e.step2': 'Lay copies of one interval along the road: 4 fit along the highway, <b class="b">8 miles</b>, and 3 along the road north, <b class="b">6 miles</b>. By road: <b class="s">14 miles</b>.',
  'e.step3': 'Straight across the lake, as the crow flies, only 5 intervals fit: <b class="b">10 miles</b>. Maya can’t ride across a lake, so her ride is <b class="s">14 miles</b>.',
  'e.why': 'Quick check: why is the trip by road longer than the straight line?',
  'e.why.ok': 'Yes. A straight line is the shortest way between two places. The road bends around the lake, so it can only be longer.',
  'e.why.wide': 'The width of a line only tells you the kind of road. Distance is measured along the line, and every inch is 2 miles.',
  'e.why.scale': 'One map, one scale: every inch represents 2 miles, on the roads and across the lake alike.',

  // 3 Your turn
  't.intro': 'Next day, Maya rides from <b>Lake Camp</b> to <b>Pinecrest</b> by road. Finding the places and reading the bar are done for you.',
  't.road': 'Copies of one interval are laid along the road. How many miles is the ride?',
  't.road.ok': 'Yes: 3&#8202;½ intervals of 2 miles. 3 × 2 = 6, and half of 2 is 1: <b class="s">7 miles</b>.',
  't.road.whole': 'The last copy only fits halfway. Half an interval is 1 mile, not 2.',
  't.road.drop': 'Don’t drop the last half interval: it is 1 more mile.',
  't.road.count': '3&#8202;½ is the number of intervals. Each interval represents 2 miles.',
  't.road.miss': 'Count the intervals along the road, the half one too, then use 2 miles for each.',
  't.empty': 'Type a number first.',
  't.line': 'And as the crow flies, straight from the camp to Pinecrest?',
  't.line.ok': 'Yes: 2&#8202;½ intervals, <b class="s">5 miles</b>. The road is 2 miles longer.',
  't.line.road': '7 miles is the ride along the road. The straight line cuts the corner.',
  't.line.inch': '2&#8202;½ is the number of intervals, the inches on the map. Each one represents 2 miles.',
  'q.cb.right': 'At the start you picked 14 miles, and you were right. Now you can show why: lay the bar along the road.',
  'q.cb.straight': 'At the start you picked 10 miles. That is the straight line across the lake, but Maya rides the road.',
  'q.cb.count': 'At the start you picked 7 miles. That counts the intervals as miles, but each one represents 2 miles.',
  'q.cb.none': 'Find the places with the key, read the bar, and lay it along the road you travel.',

  // 4 Prove it
  'p.intro': 'Sam measures the trail from Millbrook to Pinecrest. He says: “The bar ends at 6, so each interval is 6 miles. The trail is 5&#8202;½ intervals, and 5&#8202;½ × 6 = 33 miles.” Is Sam right?',
  'p.test': 'Let’s test it. Build the argument, and see where it leads.',
  'p.build': 'Now prove it. Fill each “because” with the reason that makes the line true.',
  'p.c1': 'Right. The bar counts 0, 2, 4, 6: each interval is 2 miles. 6 is where the whole bar ends.',
  'p.c2': 'Right. Copies of one interval fit along the trail: 5 and a half of them.',
  'p.c3': 'Right. 5&#8202;½ × 2 = 11. The trail is 11 miles, not 33.',
  'p.no.total': 'That is exactly Sam’s slip. 6 is where the whole bar ends. Each interval is 2.',
  'p.no.marks': 'Count spaces, not marks: 4 marks make 3 intervals.',
  'p.no.other': 'True, but it is the reason for a different line. Which reason makes this line true?',
  'p.done': 'That’s a proof: three claims, each with its reason, and the map backs every one. Sam read the end of the bar as one interval.',
};
