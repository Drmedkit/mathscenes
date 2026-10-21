// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = block A / the whole solid, b = block B, p = where the blocks touch, s = the answer), `say` is the same line
// written to be read aloud; pages/lessons/composite-area-volume/voice/lines.json holds the `say` texts (the test keeps
// the two in step).
const a = (x: string) => `<b class="a">${x}</b>`, b = (x: string) => `<b class="b">${x}</b>`, s = (x: string) => `<b class="s">${x}</b>`, p = (x: string) => `<b class="p">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A gym step is two foam blocks glued together. The ${a('bottom block')} is 4 ft long, 3 ft deep and 1 ft tall. The ${b('top block')} is 2 ft long, 3 ft deep and 1 ft tall.`, say: 'A gym step is two foam blocks glued together. The bottom block is four feet long, three feet deep and one foot tall. The top block is two feet long, three feet deep and one foot tall.' },
  'q.skins': { html: `On its own, the ${a('bottom block')} has a surface area of ${a('38 ft²')}, the ${b('top block')} ${b('22 ft²')}.`, say: 'On its own, the bottom block has a surface area of thirty-eight square feet. The top block has twenty-two.' },
  'q.ask': { html: 'The whole step gets covered in vinyl: every outside surface, the bottom too. How much vinyl does it take?', say: 'The whole step gets covered in vinyl: every outside surface, the bottom too. How much vinyl does it take?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `Pull the step apart into its two blocks. They touch only on a ${p('2 ft × 3 ft region')}: no overlap, no gap.`, say: 'Pull the step apart into its two blocks. They touch only on a two foot by three foot region. No overlap, no gap.' },
  'e.s2': { html: `Volume adds: ${a('12')} + ${b('6')} = ${s('18 ft³')}. The touching faces have no thickness, so no space is lost.`, say: 'Volume adds. Twelve plus six is eighteen cubic feet. The touching faces have no thickness, so no space is lost.' },
  'e.s3': { html: `Each block's own surface: ${a('38')} + ${b('22')} = 60 ft². Both of them include the ${p('6 ft²')} region where they touch.`, say: "Each block's own surface: thirty-eight plus twenty-two is sixty square feet. Both of them include the six square foot region where they touch." },
  'e.s4': { html: `Glue it back. ${p('Both')} 6 ft² faces end up inside, so take 6 away twice: 60 − 12 = ${s('48 ft²')}.`, say: 'Glue it back. Both six square foot faces end up inside, so take six away twice. Sixty minus twelve is forty-eight square feet.' },
  'e.why': { html: 'Quick check: why take the 6 ft² away twice?', say: 'Quick check. Why take the six square feet away twice?' },
  'e.w-ok': { html: 'Yes. The 6 ft² was counted once in each block, and neither copy is on the outside now.', say: 'Yes. The six square feet was counted once in each block, and neither copy is on the outside now.' },
  'e.w-once': { html: "The bottom block's top is covered there too: the top block sits right on it. Both faces are inside.", say: "The bottom block's top is covered there too: the top block sits right on it. Both faces are inside." },
  'e.w-none': { html: 'Nothing is cut off, but two faces are now glued together inside the step. Vinyl cannot reach them.', say: 'Nothing is cut off, but two faces are now glued together inside the step. Vinyl cannot reach them.' },
  // 3. Your turn
  't.intro': { html: `A trophy stand is two wooden blocks: a ${a('10 in × 10 in × 4 in')} base, and a ${b('6 in × 6 in × 4 in')} block glued in the middle of its top. It is dipped in varnish, so every outside surface gets coated.`, say: 'A trophy stand is two wooden blocks: a ten by ten by four inch base, and a six by six by four inch block glued in the middle of its top. It is dipped in varnish, so every outside surface gets coated.' },
  't.s1': { html: 'Split it into the two blocks.', say: 'Split it into the two blocks.' },
  't.s2': { html: `Volume adds: ${a('400')} + ${b('144')} = ${s('544 in³')}.`, say: 'Volume adds. Four hundred plus one hundred forty-four is five hundred forty-four cubic inches.' },
  't.s3': { html: `Each block's own surface: ${a('360')} + ${b('168')} = 528 in².`, say: "Each block's own surface: three hundred sixty plus one hundred sixty-eight is five hundred twenty-eight square inches." },
  't.contact': { html: `Your step. How big is the ${p('region where the blocks touch')}?`, say: 'Your step. How big is the region where the blocks touch?' },
  't.c-ok': { html: `Yes: only the small block's footprint, ${p('6 × 6 = 36 in²')}. The rest of the base's top is still outside.`, say: "Yes. Only the small block's footprint, six by six, thirty-six square inches. The rest of the base's top is still outside." },
  't.c-whole': { html: "That is the base's whole top. The small block covers only its own 6 in × 6 in footprint; the rest of the top still gets varnish.", say: "That is the base's whole top. The small block covers only its own six by six footprint. The rest of the top still gets varnish." },
  't.c-no': { html: 'Look at the bottom of the small block: that is exactly the region that touches.', say: 'Look at the bottom of the small block. That is exactly the region that touches.' },
  't.total': { html: 'Now glue it back. What is the surface area of the stand?', say: 'Now glue it back. What is the surface area of the stand?' },
  't.t-ok': { html: `Yes: 528 − 2 × 36 = ${s('456 in²')}. Both copies of the footprint are inside.`, say: 'Yes. Five hundred twenty-eight minus two times thirty-six is four hundred fifty-six square inches. Both copies of the footprint are inside.' },
  't.t-none': { html: 'That still counts the two glued faces. They are inside now: take them away.', say: 'That still counts the two glued faces. They are inside now: take them away.' },
  't.t-once': { html: 'The footprint was counted on both blocks: the base\'s top and the small block\'s bottom. Take it away twice.', say: "The footprint was counted on both blocks: the base's top, and the small block's bottom. Take it away twice." },
  't.t-whole': { html: 'Only the 36 in² footprint is covered on the base. Take 36 away twice, not the base\'s whole top.', say: "Only the thirty-six square inch footprint is covered on the base. Take thirty-six away twice, not the base's whole top." },
  't.t-no': { html: 'Start from 528 and take away the touching region twice.', say: 'Start from five hundred twenty-eight, and take away the touching region twice.' },
  't.fill': { html: 'Type a number first.', say: 'Type a number first.' },
  't.cb-right': { html: 'At the start you picked 48 ft², and you were right. Now you can show why: the glued region comes off twice.', say: 'At the start you picked forty-eight square feet, and you were right. Now you can show why: the glued region comes off twice.' },
  't.cb-add': { html: `At the start you picked 60 ft²: that still counts the two glued faces. The step needs ${s('48 ft²')}.`, say: 'At the start you picked sixty square feet. That still counts the two glued faces. The step needs forty-eight.' },
  't.cb-once': { html: `At the start you picked 54 ft²: that takes the glued region off once. Both blocks lost a face there: ${s('48 ft²')}.`, say: 'At the start you picked fifty-four square feet. That takes the glued region off once. Both blocks lost a face there: forty-eight.' },
  // 4. Prove it
  'p.intro': { html: `Riley says: “Cut a ${a('block of clay')} in two. Nothing is lost, so the two pieces have the same total surface area as the block.”`, say: 'Riley says: cut a block of clay in two. Nothing is lost, so the two pieces have the same total surface area as the block.' },
  'p.test': { html: "Let's test it. Build the argument and see where it leads.", say: "Let's test it. Build the argument, and see where it leads." },
  'p.prove': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'The two pieces hold exactly the clay of the block,', say: 'The two pieces hold exactly the clay of the block,' },
  'p.c2': { html: 'but each piece now has a new face where the knife went,', say: 'but each piece now has a new face where the knife went,' },
  'p.c3': { html: `so the volume stays the same and the surface area grows by ${s('2 × the cut area')}.`, say: 'so the volume stays the same, and the surface area grows by two times the cut area.' },
  'p.x-same': { html: "That is Riley's idea, the one being tested. Volume and surface area are different things: look at what the cut does to the outside.", say: "That is Riley's idea, the one being tested. Volume and surface area are different things. Look at what the cut does to the outside." },
  'p.x-together': { html: 'Volume and surface area do not have to change together. The same clay can have more or less outside.', say: 'Volume and surface area do not have to change together. The same clay can have more or less outside.' },
  'p.x-one': { html: 'The cut surface ends up on both pieces: the left piece gets one face, the right piece gets another.', say: 'The cut surface ends up on both pieces. The left piece gets one face, and the right piece gets another.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: 'That\'s a proof. Same clay, same volume, but two new 12 in² faces: 108 + 24 = 132 in². Riley is wrong.', say: "That's a proof. Same clay, same volume, but two new twelve square inch faces. One hundred eight plus twenty-four is one hundred thirty-two. Riley is wrong." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
