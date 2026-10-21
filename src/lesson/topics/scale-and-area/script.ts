// script.ts: every voiced line of parts 1-4: the panel HTML (h) and the spoken text (s, written to be read aloud).
// pages/lessons/scale-and-area/voice/lines.json holds the same spoken texts ({id: {text}}); the test keeps them equal.
// Colours: b.a = the original (amber), b.b = the copy (teal), b.s = the factor / the answer (lime).
export const SCRIPT: Record<string, { h: string; s: string }> = {
  // 1 the question
  'q.intro': {
    h: 'A rug is <b class="a">3 ft</b> by <b class="a">2 ft</b>, so it takes <b class="a">6 square feet</b> of fabric. A scaled copy has every length <b class="s">3 times</b> as long. How much fabric does the copy take? Pick an answer, and say how sure you are.',
    s: 'A rug is three feet by two feet, so it takes six square feet of fabric. A scaled copy has every length three times as long. How much fabric does the copy take? Pick an answer, and say how sure you are.',
  },
  // 2 worked example
  'e.intro': {
    h: 'Four steps. Press each one: the rugs move first, then the notation.',
    s: 'Four steps. Press each one, and watch the rugs move first.',
  },
  'e.step0': {
    h: 'Every length × <b class="s">3</b>: the copy is <b class="b">9 ft</b> long and <b class="b">6 ft</b> wide.',
    s: 'Every length times three. The copy is nine feet long and six feet wide.',
  },
  'e.step1': {
    h: 'The length × <b class="s">3</b>: one row holds <b class="a">3 rugs</b>. That is 3 × 6 = <b class="b">18</b> square feet. But the copy is not full yet.',
    s: 'The length times three. One row holds three rugs. That is three times six, eighteen square feet. But the copy is not full yet.',
  },
  'e.step2': {
    h: 'The width × <b class="s">3</b> as well: <b class="a">3 rows</b> of 3 rugs. The row’s 18 square feet, three times: 18 × 3 = <b class="b">54</b>.',
    s: 'The width times three as well. Three rows of three rugs. The row’s eighteen square feet, three times. Eighteen times three is fifty-four.',
  },
  'e.step3': {
    h: 'Each length gave one factor of 3, so the area is × 3 × 3 = <b class="s">3²</b> = 9. That is 9 rugs: <b class="s">54 square feet</b>. Check: 9 × 6 = 54.',
    s: 'Each length gave one factor of three, so the area is times three times three. Three squared is nine. That is nine rugs, fifty-four square feet. Check: nine times six is fifty-four.',
  },
  'e.why': {
    h: 'Quick check: why does the copy take 9 times the fabric, not 3 times?',
    s: 'Quick check. Why does the copy take nine times the fabric, not three times?',
  },
  'e.why.ok': {
    h: 'Yes. The length multiplies the area by 3, and the width multiplies it by 3 again.',
    s: 'Yes. The length multiplies the area by three, and the width multiplies it by three again.',
  },
  'e.why.k': {
    h: 'Three times the fabric is just one row of rugs. The copy is 3 times as long AND 3 times as wide: 3 rows.',
    s: 'Three times the fabric is just one row of rugs. The copy is three times as long and three times as wide. That makes three rows.',
  },
  'e.why.add': {
    h: 'Six rugs would leave a gap. Count them: 3 rows of 3 is 9. The factors multiply.',
    s: 'Six rugs would leave a gap. Count them. Three rows of three is nine. The factors multiply.',
  },
  // 3 your turn
  't.intro': {
    h: 'A photo is <b class="a">4 in</b> by <b class="a">3 in</b>: <b class="a">12 square inches</b>. A print has every length <b class="s">2 times</b> as long. The first two steps are done for you.',
    s: 'A photo is four inches by three inches. That is twelve square inches. A print has every length two times as long. The first two steps are done for you.',
  },
  't.count': {
    h: 'Now the width doubles too. How many photos fill the print?',
    s: 'Now the width doubles too. How many photos fill the print?',
  },
  't.count.ok': {
    h: 'Yes: 2 rows of 2 photos, 2 × 2 = <b class="s">4</b>.',
    s: 'Yes. Two rows of two photos. Two times two is four.',
  },
  't.count.k': {
    h: 'Two photos fill only one row: that was the length. The width doubles too, so there are 2 rows.',
    s: 'Two photos fill only one row. That was the length. The width doubles too, so there are two rows.',
  },
  't.count.no': {
    h: 'Count the rows, then the photos in each row.',
    s: 'Count the rows, then the photos in each row.',
  },
  't.area': {
    h: 'What is the area of the print?',
    s: 'What is the area of the print?',
  },
  't.area.ok': {
    h: 'Yes: 4 photos of 12 square inches, <b class="s">48 square inches</b>. And 8 × 6 = 48 checks.',
    s: 'Yes. Four photos of twelve square inches. Forty-eight square inches. And eight times six is forty-eight. It checks.',
  },
  't.area.k': {
    h: '24 is one row of photos. There are 2 rows: 4 photos of 12 square inches.',
    s: 'Twenty-four is one row of photos. There are two rows. Four photos of twelve square inches.',
  },
  't.area.factor': {
    h: '4 is how many photos fit, not the area. Each photo is 12 square inches.',
    s: 'Four is how many photos fit, not the area. Each photo is twelve square inches.',
  },
  't.area.sq': {
    h: 'That squares the area. Square the scale factor instead: 2 × 2 = 4 photos of 12.',
    s: 'That squares the area. Square the scale factor instead. Two times two is four photos of twelve.',
  },
  't.area.no': {
    h: 'Four photos, and each one is 12 square inches.',
    s: 'Four photos, and each one is twelve square inches.',
  },
  't.empty': {
    h: 'Type a number first.',
    s: 'Type a number first.',
  },
  'q.cb.right': {
    h: 'At the start you picked 54 square feet, and you were right. Now you can show why: one factor of 3 for each length.',
    s: 'At the start you picked fifty-four square feet, and you were right. Now you can show why. One factor of three for each length.',
  },
  'q.cb.k': {
    h: 'At the start you picked 18 square feet. That is one row of rugs: it scales the length only. The width scales too.',
    s: 'At the start you picked eighteen square feet. That is one row of rugs. It scales the length only. The width scales too.',
  },
  'q.cb.add': {
    h: 'At the start you picked 36 square feet. That adds the factors, 3 + 3. The rows of rugs show they multiply: 3 × 3.',
    s: 'At the start you picked thirty-six square feet. That adds the factors, three plus three. The rows of rugs show they multiply. Three times three.',
  },
  'q.cb.none': {
    h: 'Every length × k: the area is × k, then × k again. That is k².',
    s: 'Every length times k. The area is times k, then times k again. That is k squared.',
  },
  // 4 prove it
  'p.intro': {
    h: 'Riley scales a triangle by <b class="s">2</b>: base <b class="a">4</b> → <b class="b">8</b>, height <b class="a">3</b> → <b class="b">6</b>. Riley says: “k × k is for rectangles. My triangle’s area just doubles: <b>6 → 12</b> square units.” Is Riley right?',
    s: 'Riley scales a triangle by two. The base goes from four to eight, the height from three to six. Riley says: k times k is for rectangles. My triangle’s area just doubles, from six to twelve square units. Is Riley right?',
  },
  'p.test': {
    h: 'Let’s test it. Build the argument, and see where it leads.',
    s: 'Let’s test it. Build the argument, and see where it leads.',
  },
  'p.build': {
    h: 'Now prove it. Fill each “because” with the reason that makes the line true.',
    s: 'Now prove it. Fill each because with the reason that makes the line true.',
  },
  'p.c1': {
    h: 'Right. Four copies fill the big triangle, the middle one turned around. Riley’s 12 is struck out.',
    s: 'Right. Four copies fill the big triangle, the middle one turned around. Riley’s twelve is struck out.',
  },
  'p.c2': {
    h: 'Right. Four copies of 6 square units: 4 × 6 = 24.',
    s: 'Right. Four copies of six square units. Four times six is twenty-four.',
  },
  'p.c3': {
    h: 'Right. Doubling the base doubles the area; doubling the height doubles it again. And ½ × 8 × 6 = 24 checks.',
    s: 'Right. Doubling the base doubles the area. Doubling the height doubles it again. And one half times eight times six is twenty-four. It checks.',
  },
  'p.no.k': {
    h: 'That is exactly Riley’s claim. Count the copies in the picture: there are 4, not 2.',
    s: 'That is exactly Riley’s claim. Count the copies in the picture. There are four, not two.',
  },
  'p.no.rect': {
    h: 'The triangle tiles too: 4 copies fill it. The rule is not special to rectangles.',
    s: 'The triangle tiles too. Four copies fill it. The rule is not special to rectangles.',
  },
  'p.no.ex': {
    h: 'One triangle can’t prove it for every figure. The reason must work for any base and any height.',
    s: 'One triangle can’t prove it for every figure. The reason must work for any base and any height.',
  },
  'p.no.other': {
    h: 'True, but it is the reason for a different line. Which reason makes this line true?',
    s: 'True, but it is the reason for a different line. Which reason makes this line true?',
  },
  'p.done': {
    h: 'That’s a proof: three claims, each with its reason, and the picture backs every one. Scaling by 2 makes 4 times the area, for triangles too.',
    s: 'That’s a proof. Three claims, each with its reason, and the picture backs every one. Scaling by two makes four times the area, for triangles too.',
  },
};
