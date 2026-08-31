# CLAUDE.md — Something's Different

**Read [GDD.md](GDD.md) first. It is the authority on this project.**

Suburban alien-gaslighting stealth game. Single self-contained HTML file, Three.js
r128, offline, served over http. Separate project from the Chameleon game in
`..\Chameleon\` — do not mix them, but *do* reuse Chameleon's proven code (OTS camera,
AABB colliders, canvas-texture materials, WebAudio SFX, crash banner). See GDD §9.

**Before writing any non-trivial system, check [`..\INDEX.md`](../INDEX.md)** — the
Dev-wide catalog of what already exists and where to copy it from.

## Status
- 2026-08-06 — GDD v0.1 written.
- 2026-08-06 — **M1 DONE.** Boot + crash banner, title/pause screens, greybox of two
  rooms joined by a doorway, OTS camera with occlusion, walk/sneak/run + jump, AABB
  colliders, debug readout (F3). 47 assertions.
- 2026-08-06 — **M2 DONE.** The Doubt Curve: `SPEC` (axisDist/specDelta, placement as
  ordinary axes), `PROP_KINDS` data half (8 kinds), `RESIDENTS` (7), `DOUBT`
  (perceived / bands / resolve / commit / bandMap / histogram). 75 assertions.
  `resolve()` is **pure** — no scene, no GL, no mutation.
- 2026-08-06 — **M3 DONE.** `build()` for all 8 prop kinds (primitives + canvas
  textures), `variantNear` targeted-similarity generation, offscreen thumbnails with
  fixed per-kind framing, and the montage. 33 assertions + `docs/m3-props.png`.
- 2026-08-06 — **M4 DONE.** 12 Ardsley Ct: yard + planters + locked door + three
  rooms + six owned objects; interaction targeting, focus inspection camera, scan →
  requisition → swap/nudge/turn → morning report. 52 assertions + `docs/m4-*.png`.
- 2026-08-06 — **M5 DONE.** Night clock + curfew, noise (distance + wall attenuation),
  Walt & June asleep in a real bedroom with stir→wake escalation, light zones, line of
  sight, being seen. Plus a full look pass: night lighting rig, shadow maps, ACES tone
  mapping, canvas-texture surfaces, windows, roof, picket fence, CSS vignette.
  45 assertions + `docs/m5-*.png`.
- 2026-08-06 — **M6 DONE.** The day: five blocks with a 2-action budget, Wife
  Suspicion with a 7-tier ladder that shortens the night, wages/bills/cash, Bulwark
  Mart with HK-gated forecasts, dialogue in three registers, Human Knowledge, public
  reaction beats. 54 assertions + `docs/m6-*.png`. **The full day↔night loop closes.**
- 2026-08-06 — **M7 DONE.** Her ladder acts during the night (checks the bed at tier
  2, follows you out at tier 4 with a 66-second grace); fractures at Doubt
  25/50/75/100 that mark possessions, wreck sleep, move objects and spread between
  spouses; marking is visible, collapses the doubt window, and is defeated by the
  identical special order. 37 assertions + `docs/m7-fracture.png`.
- 2026-08-06 — **M8 DONE — THE SLICE IS PLAYABLE END TO END.** Four lots on Ardsley
  Court, six residents asleep in three furnished houses, per-house keys, fractures
  for the whole cast, Collapse Index + five endings, save/load, Esc menu.
  46 assertions + `docs/m8-*.png`. A seven-night run is verified **won and lost**
  through the real systems.
  ⚠ Scoped down: 12 prop kinds not 40. ⚠ Grace is still unreachable by shop stock
  (GDD §15).
- 2026-08-10 — **M9 DONE.** Audio, the gap M8 called the largest one left. WebAudio
  synthesised end to end (no files, **still zero external requests**): footsteps,
  doors, soil, the alien scanner, eight handling materials, a night bed of crickets /
  AC / distant dog / per-house fridge hum, outcome stingers, the 1960s-advert day cue,
  and a mixer on the title and pause screens. 76 assertions + `docs/m9-sound.png`.
- 2026-08-10 — **M10 DONE.** Three stores (Bulwark / Second Chances / Ardsley
  Antiques), each stocking a different, non-overlapping slice of the similarity
  spectrum. Closes the oldest defect in the GDD — **Grace was unplayable**, 0 of her 4
  objects had a doubt rung at any similarity Bulwark stocks — plus a Grace retune
  (attention 0.7 → 1.0, the Walt bug again). Measured over 12 weeks × 18 objects:
  every resident is playable and every object can be made to create doubt.
  39 assertions + `docs/m10-thrift.png`.
- 2026-08-10 — **M11 DONE.** Onboarding, chosen because nobody had ever played the
  game end to end. A premise card, a nine-step objective rail driven by real game
  state, band glosses in the morning report, a controls panel, and a GUIDE ON/OFF
  toggle. Plus a pile of stale copy fixed (the title screen still said "Milestone 4").
  48 assertions + `docs/m11-intro.png`, `docs/m11-guide.png`.
- 2026-08-11 — **M12 DONE.** Content: **12 prop kinds → 30**, the street 18 objects →
  30 (ten per neighbour house), and the run 7 nights → **10**. No systems code moved —
  the registry took 18 new kinds without the Doubt Curve, shops, audio or placement
  changing. The win threshold was re-measured against the new shape rather than
  assumed. 27 assertions + `docs/m12-props.png`, `docs/m12-*.png`.
- 2026-08-11 — **M13 DONE.** Kyle's first two notes from playing it. `ROOM_SCALE`
  (1.55) spreads the floorplan out — walkable floor 14 → **79 m²**, median clearance
  0.24 → 0.40m — and mouse look is now **pointer-locked** instead of click-drag.
  ⚠ This uncovered that **the lounge and bedroom were unreachable on foot** (a 1cm gap
  at the lounge door) and had been for twelve milestones, invisible because every test
  teleports the player. 32 assertions + `docs/m13-bedroom.png`.
- 2026-08-12 - **M14 DONE.** The street hardens: five tiers that install themselves as
  Alertness climbs and stay installed - motion lights, dogs in the yards, a
  neighbourhood watch who ends your night, doorbell cameras, and couples sleeping in
  shifts. Before this, night 8 played exactly like night 1.
  GDD 5.8 keyed this to Neighbourhood Suspicion; MEASURED, a careful player holds that
  at 0.0 for a whole run, so all five tiers would have been dead content. Keyed to
  Alertness (mostly Doubt) instead, so **succeeding is what makes it harder**.
  35 assertions + `docs/m14-street.png`.
- 2026-08-13 - **M15 DONE.** A run you can read and a difficulty you can turn, chosen
  because M14 shipped a curve I could not validate. GENTLE/STANDARD/HARSH presets scale
  the win bar and the hardening ladder together (STANDARD is byte-for-byte what
  shipped); a state-of-the-street readout on the day screen shows Collapse vs the bar,
  nights left, both losing meters and what the street has installed; and a mouse
  sensitivity slider. 29 assertions + `docs/m15-day.png`.
- 2026-08-13 - **M16 DONE - PHASE 2 BEGINS.** Ray Pittman gets the fifth lot (10 Ardsley
  Ct, ten possessions, his own fracture ladder, asleep alone) and gossip ships: a
  CERTAINTY event travels one hop along RELATIONS scaled by the SPEAKER'S credibility.
  Measured: the same mistake spread 29.7 through Marisol (0.9) and 2.2 through Ray
  (0.1), so his house is the cheap place to be sloppy. Ray is the hardest person on the
  street by measurement - 9.7% of shop rungs usable vs Walt's 23.0% - and five of his
  ten things are antique-only, which finally makes that shop load-bearing.
  36 assertions + `docs/m16-gossip.png`.
- 2026-08-17 - **M17 DONE - THE INHABITED STREET.** Playtest note: "the world is still
  mostly empty feeling - there is still nothing interactable, should be observable and
  replaceable items". Measured first: 694 meshes for the whole world, the outdoors was
  ONE mesh stamped over five identical lots, and 7 finished prop kinds had never been
  placed. FIXED FOUR REAL BREAKS: the road ran through the front gardens (raw metres vs
  layout units); the garden gate was a picture (one collider across the frontage - you
  could only get in by jumping it); M13 had detached every fixture from its wall (up to
  1.16m); and the sleeper sat up INTO the mattress (found by arithmetic - negative
  rotation.x with the head at -z). THEN the content: 40 -> 80 possessions, all 30 kinds
  in use, a fixture pass that finally builds the fridge/TV/shelf the fiction has claimed
  since M9, a cul-de-sac with a far side and a horizon, per-house palettes driven by
  `def.wall` (authored since M8, read by nothing), dressing keyed to the keeper's
  noticeFloor, a scenery class that never steals E from a possession, a seeded passing
  car whose headlights are a real light zone, and a dawn ramp. Paid for up front with a
  shared unit box + material cache: 1,965 meshes on 703 geometries / 691 materials.
  Walkable floor went UP, 77.3 -> 84.1 m2. 44 assertions + `docs/m17-court.png`.
- 2026-08-19 - **M18 DONE - THE FENCE.** Playtest note: "still a pretty bare and
  unplayable game". The second word was LITERAL. MEASURED with the till open for the
  first time ever: $475 of income across a ten-night slice against a median doubt rung
  of $29 buys 15 swaps and reaches collapse 32.0 against a bar of 40 - THE GAME COULD
  NOT BE WON. Every balance measurement in this project's history opens with
  bank=1000000 (_balance.js:20, _escalate.js:21), so nobody had ever asked the
  question. Fix is the loop the fiction already described - swapWith printed "the mark
  goes in your pocket with the old one" while the original ceased to exist - so YOU NOW
  KEEP WHAT YOU TOOK and can fence it. Only the two specialists buy: Second Chances
  pays 25% and is two towns over, Ardsley Antiques pays 55% and is ON THIS STREET,
  where anything with attachment >= 1.2 goes in the window and its owner walks past it
  (+14 Suspicion, reported in the morning). The good money and the real risk are the
  same item. With fencing a competent run reaches 43.9 and ends the slice with $8 in
  its pocket. Also: the night now HAS things in it - a phone, a light going on, a fox
  in the bins, and somebody getting up for a glass of water who becomes a roving pair
  of eyes (canSee reads the sleeper's own x/z, so walking one costs no new systems).
  Seeded per night, never the same event twice running. 48 assertions.
- 2026-08-19 - **M19 DONE - THE THREATS HAVE BODIES.** Four of the five things the
  street installs to stop you had NO PHYSICAL FORM. The worst: the neighbourhood watch
  was `{x,z,dir,minX,maxX,seen}` - a man who patrols at 2.3 m/s and ENDS YOUR NIGHT
  from 11m, with no mesh, no torch and no footsteps, while the text announcing him
  described "a torch and no dog ... a jacket with a word on it". Dogs were four numbers.
  Cameras were a 2.6m bubble with no lens. Porch lights emitted from thin air at y=2.5.
  A stealth game whose threats are invisible is not hard, it is UNFAIR. Now: he has a
  body, a hi-vis jacket, footsteps, and a torch that is a REAL light zone - litAt()
  reads it, so the beam you can see coming is the thing that catches you. Dogs have
  dogs and kennels and lift their heads to bark; doorbells have a lens and a blinking
  LED; porch lamps have a housing. His fairness rules (range, cannot see behind
  himself, does not work indoors) were always in the code and are now assertable.
  ALSO FIXED A LEAK: hardenNight() runs every night and never tore down the night
  before - MEASURED 30 -> 34 -> 38 -> 42 -> 46 -> 50 light zones over six nights, so by
  night ten every porch was lit ten times over. HARD_FX tracks and disposes everything.
  26 assertions + `docs/m19-watchman.png`.
- 2026-08-20 - **M20 DONE - DAYLIGHT.** `setLighting()` had only ever been called with
  'greybox' and 'night': a 146m street carrying ~2000 meshes, five dressed houses, eight
  facades, a cul-de-sac and a tree line, and NO PLAYER HAD EVER SEEN ANY OF IT IN LIGHT.
  The day was fourteen text actions across five blocks, and `walk` - the only one that
  touches the social layer - resolved the WHOLE street in one click: every resident's
  reaction beat into a log at once, +3 HK each, nobody seen. GDD 5.4 says watching a
  neighbour come apart is how you learn to be human, and RESIDENTS had never had bodies
  anywhere except asleep in a bed. Now the afternoon happens on the street: a real day
  rig (warm key, thin fog, day sky, exposure 0.86 - the first pass at 1.05 bleached the
  houses to white), everybody who lives here standing out on their own lot, and beats
  paid on APPROACH, once each, by walking up to somebody. Esc goes back inside.
  31 assertions + `docs/m20-daylight.png`.
- 2026-08-20 - **M21 DONE - THE LOOK.** MEASURED first (`tools/_look.js`): 684
  materials, 610 Lambert / 74 Basic and **zero with a specular term** - wood, ceramic,
  glass and painted plaster all returned light identically. 39% of the palette sat
  above luminance 0.75 against 4% true darks, which is why daylight bleached and night
  went grey. The upgrade was PRICED, not assumed: every Lambert to Standard costs 2.13x
  the frame, to Phong 2.60x, so a wholesale swap was rejected. Shipped instead: a tone
  curve on the world applied in TWO places - `mat()`/`matL()` for colours AND a grading
  proxy over the 2d context, because every big surface is `new MeshLambertMaterial({map})`
  with a WHITE base colour and its whole palette in the canvas; specular only on
  glass/metal/ceramic via the `mtl` taxonomy `PROP_KINDS` has declared since M2; and a
  tighter shadow box (24m/1024 = 2.3cm texels, finer than before) instead of a bigger
  map. Bright share 39% -> 11%. 24 assertions + `docs/m21-daylight.png`.
- 2026-08-20 - **M22 DONE - PEOPLE.** Everybody had been the same body since M1: a box
  torso, a sphere head, a cone nose, one colourway. Fine while the only person on
  screen was you, from behind, in the dark - and then M20 turned the lights on and put
  the whole street outside in the afternoon. One builder now: `makePerson(look)`, where
  a LOOK is a parameter vector (height, build, skin, hair + style, top, legs, shoes)
  derived deterministically from a person's id, so Walt is the same Walt every night.
  Across the seven residents: 4 skin tones, 4 hair colours, 6 tops. It keeps the exact
  part NAMES `animBody` has driven since M1, so the walk cycle is untouched - asserted
  by actually walking the player and watching the legs swing in opposition. Everybody
  is one of these: player, neighbours, watchman, and the sleepers you stand over all
  night (who had a beige sphere for a head). They shift their weight rather than
  standing like statues. 22 meshes each, 1980 on the street, 315 draw calls.
  ⚠ Caught by an M1 test: the first shin ran 2.5cm below the sole and the player walked
  with their feet through the floor. 33 assertions + `docs/m22-people.png`.
- 2026-08-20 - **M23 DONE - WINDOWS.** Every window was a SEALED CARD: `windowPane`
  built a tinted pane and then an opaque MeshBasic box filling the whole wall
  thickness behind it. From inside a house you could never see the yard, the
  streetlight or a neighbour; from the street you could never see a room. A stealth
  game where you cannot look through a window before opening the door is missing a
  pillar - recon is the quiet half of the loop. The panes are real glass now, plus a
  glazing bar and a sill, and `WINDOWS[]` records each opening as a world rectangle.
  **THE ASYMMETRY IS THE DESIGN: glass stops a voice and does not stop a look.** Sound
  still uses `wallsBetween`; sight uses the new `sightBlocked`, which forgives a wall
  crossing that lands inside an opening. Measured through the lounge window: sound 1
  wall, sight 0; through the solid stretch beside it, 1 and 1. Which cuts both ways -
  a sleeper who is awake and facing can now see you through their own bedroom window,
  and so can the watchman. 17 assertions + `docs/m23-street.png`.
- 2026-08-20 - **M24 DONE - THE SCANNER.** The only way to learn anything about a room
  was to walk within INTERACT_RANGE (2.0m) of a thing and face it. A house holds twenty
  possessions and ~107 scenery points, in the dark, so the player swept it with their
  face. `Q` now pulses: every possession you can SEE gets a mark colour-coded by state
  - never recorded / on file / **you already have a copy in the bag** / they have
  marked it. Two things make it a mechanic rather than a cheat. It uses `sightBlocked`,
  so it reads through glass and not through walls - **you can stand in the garden and
  case a room through the window**, which is what M23 was for (measured: 5 of their
  things from outside the lounge window). And it is LOUDER than reading one thing by
  hand (2.6 vs 0.6 in sleeper-noise units) with a 4s cooldown, so walking over and
  looking is still worth doing when somebody is stirring.
  22 assertions.
- 2026-08-20 - **M25 DONE - FAMILIARITY.** The afternoon walk paid Human Knowledge and
  nothing else, so spending a day action on your neighbours was charity. GDD Phase 2
  has listed "social camouflage" since the start; this is it. Standing near somebody in
  daylight raises `familiar` (+22, once each per afternoon, -3/day if you stop showing
  your face). A familiar face costs less when it turns up at 3am: a sighting by a
  stranger costs 34 Suspicion, by somebody who knows you 15.3. **The two limits are the
  design.** It never reaches zero - being seen always hurts, or the night stops
  mattering. And it does almost nothing INSIDE their house (31.2 of 34), because no
  amount of chat over a fence explains why Steve is in your bedroom at three in the
  morning. So the day now buys insurance for the night, and shopping competes with it
  for the same action budget. 20 assertions.
- 2026-08-20 - **M26 DONE - A RUN, PLAYED.** Every other suite either drives systems
  directly or teleports the player. That blind spot has hidden three separate walls -
  two sealed rooms (M13), a garden gate that was a picture (M17) and an economy that
  could not fund a win (M18) - each invisible to dozens of green assertions because
  nothing ever WALKED. This one routes over the real collider set (BFS on a 0.35m
  grid), holds W and lets collision arbitrate: your doorstep -> a neighbour's door
  (332 steps) -> a planter for the key -> in at the front door -> **all four rooms** ->
  a scan pulse -> **all 20 possessions**, 19 examinable from where you stand -> home ->
  the shop -> back out -> the swap -> the original in your pocket.
  ⚠ Two "failures" on the first run were the TEST's fault and worth remembering: it
  aimed at the middle of the kitchen, which is the kitchen table, and it picked
  purchases by forecast when night-one Human Knowledge is 0 and there IS no forecast.
  MEASURED as a result: on night one $140 buys 264 shelf items, 59 of which would
  create doubt - a 22% blind hit rate, which is what HK is sold against.
  18 assertions.
- 2026-08-20 - **M27 DONE - HIDING.** The game has had detection since M5 and never had
  COUNTERPLAY: a sleeper sits up, a man with a torch comes round the corner, somebody
  gets out of bed for water - and all you could do was walk away and hope. 30 hiding
  places on real furniture (wardrobes, under beds, behind sofas, sheds, the hedges by
  the path), 6 per lot, half indoors. Two rules keep it honest: **you cannot climb into
  a wardrobe while somebody is already looking at you** (`watchedNow()`), or it is just
  an escape key; and **the clock runs while you are in there**, so it costs the one
  thing the night is short of. 26 assertions.
  ⚠ AND M26 IMMEDIATELY EARNED ITS KEEP: putting HIDES in the main `findTarget` pass
  let a wardrobe outbid the picture frame on the nightstand beside it, and the
  playthrough's "walked to 20, could examine 19" fell to 17. Twenty-six other suites
  missed it. **HIDES now obey the same `if(!best)` rule as SCENERY.**
- 2026-08-20 - **M28 DONE - HOME.** Wife Suspicion has driven this game since M6: it
  shortens the night, wakes her at tier 2, sends her out after you at tier 4, and ends
  runs. **And in twenty-seven milestones Dana had never been on screen** - a number and
  a paragraph of text, in a game whose whole subject is a man failing to convince the
  people in his house that he is a person. The evening is now your own lounge with the
  lamps on and her in it, and **where she is standing IS the meter**: on the sofa with
  her feet up at 0, in the kitchen doing something she already did at 45, in the hall
  at 65, at the front window with the light off behind her at 85. Walk up and press E
  and it is the same SCENES dialogue the menu used to open. 22 assertions.
  **1048 assertions across twenty-eight suites.**

- 2026-08-21 - **M29 DONE - THE RAIL TELLS THE TRUTH.** The guide was written at M11
  and the game moved on without it for eighteen milestones. It still told players the
  residents were **"asleep upstairs"** in a single-storey house, and it never once
  mentioned the scanner, hiding, the afternoon, Dana - or **fencing, which the economy
  requires**: measured at M18, a whole slice on wages alone affords fifteen swaps and
  reaches collapse 32 against a bar of 40, so a player following the old rail exactly
  ran out of money and lost. The chain is now twelve steps. `read` is satisfied by
  cataloguing as well as by pulsing, because Q is optional and a step that blocks on
  something optional strands the player. New `m29` is mostly a **drift detector**:
  every key the game binds must appear in a controls panel, and no guide string may
  promise a room the house does not have. 22 assertions.
- 2026-08-21 - **M30 DONE - THE DAY SCREEN KEEPS ITS PROMISES.** The warning above was
  right, and this is what it was hiding. `doAction()` ended with an unconditional
  `showDay()`, which repainted the day screen **one statement after** `openShop()`
  drew the shop. The shop, the afternoon walk (M20) and the evening with Dana (M28)
  were each opened and then buried by the screen you clicked them from - **five
  milestones of content behind buttons that undid themselves**, including the only
  honest route to the guide's `shop` step. Twenty-nine suites missed it because every
  one of them called `SD.openShop()` directly instead of clicking the button. Escape
  was the second half: `s-day`, `s-report` and `s-end` fell through to `closeMenu()`,
  so **one keypress on the final ending card** left you in a frozen 3am street with
  the run gone. Those three are now modal; Escape in the shop is LEAVE. `m30` touches
  nothing through the API - it dispatches real clicks on **visible** elements, because
  the first draft clicked buy buttons sitting in the DOM underneath the day screen and
  reported the shop as reachable, which is the same mistake the game was making.
  **11 failures before the fix, 0 after.** 27 assertions.
- 2026-08-21 - **M31 DONE - THE WORLD IS THE WORLD YOU LEFT.** Four bugs of one shape:
  state outliving its owner, none of them throwing, all of them changing where you can
  be **seen**. (1) A `light` event's 6.4m zone at i=0.72 was removed only by
  `eventTick`'s expiry branch, so a night ending early welded it to the map with no
  lamp on it - one per night, cumulative; `canSee` and the watchman agreed you stood in
  a lit patch that did not exist. (2) `loadGame()` ran `startHouse()` **first**, so
  `nightReset()` fired against day 1 and an empty hardened list and the saved ids
  landed on top - **every loaded save carried the hardening ids with none of the
  bodies**, and `fireHardening` skips anything already listed, so they could never
  re-install: loading permanently disarmed M14 and M19. (3) `hardClear()` had one
  caller, so the afternoon was four dogs frozen mid-turn and a motionless watchman with
  a lit torch cone at 15:00. (4) `startHouse` never cleared `S.evening`, so RUN IT
  AGAIN from an evening ending began night 1 already in the evening. 26 assertions.
  
  WARNING: nine milestones have now shipped without a verified human playthrough -
  and M30 is exactly what that costs.

- 2026-08-23 - **M32 DONE - THE ENDING SCREEN.** The last thing you saw in a ten-night
  run was six abstract meters, in silence, under a headline that contradicted the panel
  printed directly beneath it, reached by a button that still said CONTINUE. The win
  text claimed *"Nobody on Ardsley Court trusts what they remember"* sitting above
  **"Fractured past 75: 0"** - because `winBar()` is a credibility-weighted MEAN of
  40/100 and a run crosses it with nobody past 75 at all. It now describes the win it
  actually had. **The win is checked FIRST**: every loss test used to precede it and
  short-circuit it, so crossing the bar on the same morning Dana opened the folder was
  reported as a flat failure with a winning Collapse Index under the word INSUFFICIENT
  - that morning now has its own ending, `pyrrhic`. `GAME.stats` records what you DID
  (swaps, catalogue, pulses, nights out, hides, sold, earned) and the screen prints it
  next to what it did to them; the whole M18 fence economy used to leave no trace at
  all. Plus `win`/`lose` cues - the bank had neither, so the last sound of a winning
  run was the `doubt` ping that fires when a neighbour pauses at a mug. 32 assertions.
- 2026-08-23 - **M33 DONE - THE STREET MAKES SENSE.** Two things the game said that
  were untrue and one thing it let you do that made the rest pointless. **The map:**
  the opening objective read *"Cross the street to 12 Ardsley Ct"* - there is nothing
  across the street, all five houses sit in one row along x at z=0; the Hoyts were
  *"two doors down"* (next door); *"any of the three will do"* (there are four); the
  closing card said *"Six neighbours"* while `activeResidents()` counts **seven**. And
  the addresses ran **10, 14, 12, 16, 18** west to east, so your own house sat between
  number 10 and number 12. They now run **8, 10, 12, 14, 16**, with the tutorial house
  keeping 12 so every doc that names it stays true. **The cheat:** `R` in focus mode
  handed you three matched variants (97/92/80%) free, in the victim's house, at 03:00.
  Its own comment called it an M6 stub; M6 shipped nineteen milestones earlier. It made
  money, the three shops, the weekly stock roll, the card-or-cash decision and the
  entire M18 fence **optional**, and it satisfied the guide's `shop` step without the
  player ever seeing a shop. It could not be removed until M30 made the shop reachable
  - before that it was the only reason the game was completable. `requisition()` itself
  stays; m4 has tested its scan-gate since the first house. 28 assertions.

- 2026-08-23 - **M34 DONE - THE LAST NIGHT.** Crossing the collapse bar used to end the
  run **that morning** - and CONST's own measurement says the intended-strength player
  crosses on **night 5 of 10**, so playing well deleted half the game: nights 6-10, the
  late hardening tiers and the back half of the fence economy were content only a
  *losing* player ever saw. The assignment now runs its full length and the player gets
  the decision instead: a **CALL IT IN** button appears on the morning report the day
  you cross, labelled with the number you would be stopping at. Stay out and the number
  climbs - so does everything that can take it off you. A loss still ends the run the
  same morning, because a loss is not a choice. Night ten also no longer opens with the
  same line as night one, and **Dana's number is on the day screen** - she has ended
  runs since M6 and the ending screen was the first time you ever saw the meter.
  **AND ONE THING THAT WAS NOT BROKEN.** Two separate audits concluded that
  `LOSE_STREET: 70` was unreachable dead content, both reasoning from CONST's own note
  that *"even sloppy play peaks near 33"*. `tools/_street.js` measured it against the
  real street and the real economy: four objects a night - the measured *winning* pace -
  always buying the worst match on the ladder reaches **17.5 / 47.2 / 82.9** on nights
  one to three, past the bar by night **three**; at eight a night it is **75.1 on night
  one**. The note was stale (written at 30 objects, not 80); the number was right. The
  constant stands, the comment is corrected, and m34 pins the measurement so nobody
  lowers it on the strength of a comment again. 23 assertions.


- 2026-08-23 - **M35 DONE - THE NIGHT STOPS WHEN THE NIGHT DOES.** Four defects living
  in the gap between what the simulation thought was happening and what the player
  could hear or get away with. **(1) No key-repeat guard in focus mode.** Every
  mutating key runs `nudgeObject -> applyChange -> emitNoise(N_HANDLE 3.5)`, and the OS
  repeats a held key ~30x/sec: **~86 noise units a second against a wake threshold near
  45**. The signature verb of the whole game - lining a mug up exactly - silently lost
  you the night while you were being careful with it. Measured after the fix: a held
  arrow costs **3.28**, exactly what one press costs. **(2) The night bed never
  stopped.** The gate was `S.phase!=='house'`, which is true only on the title and the
  greybox - so the tension drone held at whatever heat the night ended on all through
  the report and the day, and crickets played at three in the afternoon (M20) and over
  dinner with Dana (M28). The rule is now `audibleNight()`, a plain predicate pulled
  OUT of the audio module because `SFX.update()` returns early without an AudioContext
  and headless never has one - the same reason collider/Doubt/noise math is kept free
  of a live scene. **(3) Eight of nine voices took `mag` and ignored it**, so a scanner
  pulse (2.6) was indistinguishable from cataloguing one object (0.6) in a game whose
  entire risk model is *how loud was that*. `world()` now scales on `p.g` against a
  per-voice reference, reaching all of them in one place. **(4) Leaving a hiding place
  was free** while entering cost `N_HANDLE*0.6`, so hide-wait-walk-out was strictly
  dominant. Both ends now cost **1.861**. 20 assertions.


- 2026-08-23 - **M36 DONE - THE GAME EXPLAINS ITSELF.** The screens a first-time player
  reads were teaching them to lose. The intro's statement of the rules said *"Every
  night, change **one** thing in somebody's house"* - which CONST records, from its own
  measurement, as the losing line: one object a night reaches Collapse **19.3** against
  a bar of **40**. Two lines later it promised the scanner *"will tell you which one you
  are about to cause, before you buy it. **It does not lie**"* - while `predict()`
  returns `???` below Human Knowledge 20 and **every run starts at 0**, so a new
  player's first shop trip shows nothing but `???` immediately after being told the
  instrument is honest. Both rewritten: change a few things in different houses, and
  the scanner reads `???` until watching people calibrates it.
  **Two CSS classes were written and never defined.** `rp-row`, on the fence's one
  moment of consequence, rendered as flush unpadded text with no spine. And `.hot` -
  added to `#wife-pill` since M6, the pill that says **Dana is outside right now** -
  only ever had a `#noise-pill.hot` rule, so the most urgent thing the HUD can say
  rendered in the calm colour. Keyed to `.pill` now. m36's last section is a permanent
  **drift detector**: every class the page uses must have a rule behind it.
  Plus: the MODE pill read WALK while you were shut in a wardrobe with movement forced
  to zero (now HIDING…/HIDDEN, marked urgent); the SEEN pill's `/3` was typed into the
  markup and is now written from `CONST.SEEN_LIMIT`; the controls screen never
  mentioned hiding, described Esc as only "pause", and never said **a swap leaves you
  holding their original** - which is why the fence exists and why the run is
  unaffordable without it. And `E` was listed twice on the title grid with `Q` between
  the rows, and `Z / X` twice on the controls screen - the second one added by M33's
  own edit. 23 assertions.


- 2026-08-23 - **M37 DONE - THE WORLD KEEPS THE PROMISES THE FICTION MAKES.** `FRACTURES`
  says in its own header that *"Every entry is a WORLD CHANGE, not a cutscene"*. Two
  entries move a body or an object by writing coordinates, and neither had ever been
  checked against the world it writes into. **Grace @100** - *"started sleeping in the
  front room, facing the door"* - was `moveSleeper('grace',0,-0.8)`, and **dx=0 is the
  centre of the house, which is exactly where the partition runs**. Measured
  (`tools/_fractures.js`): she landed inside a collider 0.76m wide and 8.66m deep. A
  body in a wall is a pair of eyes that can never look at anything, so *collapsing
  Grace silently deleted a threat*. Scanned the front room (`tools/_gracespot.js`) and
  moved her to dx=-1.5, which is clear in every house on the street. **June @50** - the
  family photo - was `relocate('pictureFrame',[...])`: a KIND with no owner, taking
  `objects.filter(kind)[0]`, the first of that kind **on the whole street**. There are
  three pictureFrames - June's, Marisol's and Grace's - and it picked June's *only by
  the order the houses happen to be built in*. `relocate` now takes the owner and
  treats the position as local to their house, the way every other authored coordinate
  in the file does. The destination was also wrong: 3.63m across the room, where the
  bed is 2.34m wide and "the other nightstand" is 2.13m.
  Plus two pieces of state that described nothing: `CONST.HIDE_R` documented a 1.6m
  reach rule **nothing ever read**, and `GAME.watched` had been set by the afternoon
  walk since M20 and read nowhere. Both deleted. 21 assertions.
  **A note on method.** The first pass of this measurement reported that *no sleeper
  could see a man standing a metre away* and I nearly filed it as a bug. Two things
  were wrong with the probe, not the game: it stood in an unlit bedroom (invisible
  beyond 2.2m is the rule, not a fault), and it called `canSee(s)` when the signature
  is `canSee(s,px,pz)` - so every comparison ran against NaN. The same pass also called
  all seven sleepers "buried in geometry" because it counted **the beds they were lying
  in** as solids. Three false alarms in one diagnostic, before one real bug.


- 2026-08-23 - **M38 DONE - THE CUES THAT WERE NEVER THERE.** The game spends a whole
  audio system on a creaking floorboard and then said nothing at all when the things
  that can end your run happened. **Dana's ladder had exactly one sound on it, and it
  fires when the run is already lost** - her tier-2 (she wakes and checks the bed) and
  tier-4 (she comes out of the front door after you, on a `FOLLOW_GRACE` countdown)
  were text-only, an invisible timer counting down to a loss. Both have cues now.
  **The `light` event** drops a 6.4m zone at intensity 0.72 into `LIGHTS` - well over
  `LIT_SEEN_MIN` - and made no sound whatsoever; it is the one event that changes where
  you can be seen, and it arrived in silence. It is a **VOICE**, not a cue, so it is
  positioned: a window two doors down is quieter than the one next to you, which is
  exactly the information you want from it. **The fence paid with the shop's till
  beep** - the same bright two notes as buying a mug in Bulwark Mart, for selling
  somebody's possession two towns over. **The WORLD mixer slider previewed `CUES.ui`,
  which is on the FOLEY bus**, directly underneath a comment saying each slider
  previews its own bus - no cue in the bank routed to `world` at all. And M20's
  afternoon, M25's familiarity payoff and M28's entire evening contained no `SFX` call
  of any kind. Plus a refused `Q`, which was silent and so indistinguishable from a
  dropped keypress on a four-second cooldown with no meter. 27 assertions, green first
  run.


- 2026-08-27 - **M39 DONE - THE LOOP CLOSES BEFORE DAWN.** *Playtest feedback: "it's
  still a pretty unplayable game."* I drove the live build and measured why. Buying
  anything requires a prior scan, and the shops are a **daytime** action - so the loop
  was **scan tonight, buy tomorrow midday, swap tomorrow night, learn the result the
  morning after**. Two full cycles and about twenty-six minutes of night between
  touching an object and finding out whether anybody noticed, in a game whose entire
  subject is whether anybody noticed. On night one you could not play the game at all;
  you could only take inventory.
  **The scanner prints now.** Scan a thing, run off a rough match on the spot, swap it
  the same night. Measured after: **1 night from first touch to answer** (was 2), **$0
  spent** (a shop trip was mandatory before), and a full night of printing produces
  **12 swaps landing 6 DOUBT / 5 MISSED / 1 CERTAINTY**, collapse 17.6 of 40.
  **What keeps the shops alive is that the printer cannot aim.** It lands somewhere in
  `FAB_SIM` and you do not choose where - measured across forty prints: **75.3 to 94.0,
  mean 83.6**. Against Walt's keys his DOUBT window is similarity 80-93, so it lands
  inside often, overshoots sometimes, and sometimes prints something he walks straight
  past. Shops sell **precision**: a chosen rung, a known number, a forecast to read it
  against, and an antique-shop ceiling of 99%. That is what money is for now.
  `variantNear` aims and misses - the first version delivered **98.0%**, within a point
  of a $48 antique-shop match, which would have made the shops pointless. It now
  retries up to eight times for a result inside the band.
  **THIS DELIBERATELY REVERSES PART OF M33**, and the terms are the whole design:
  M33 removed a key giving **three matched variants (97/92/80%), chosen, free, silent,
  unlimited**. This gives **one copy, a similarity you do not choose, paid for in
  noise, once per object per night, capped below anything a shop sells**. m33's suite
  still asserts the thing it always asserted - that R cannot hand you a free shortcut
  past the economy.
  The rail was restructured to match: `fab` after `scan`, `swap` and `out` moved ahead
  of `shop`, and `home` ("nothing else can happen tonight") retired, because it stopped
  being true. m4, m11, m29 and m33 all encoded the old contract and were updated to
  state the new one. 32 assertions.


- 2026-08-27 - **M40 DONE - DOUBT IS SOMETHING YOU WATCH.** The best moment in this
  design is somebody standing in their own kitchen not trusting a mug, and for forty
  milestones that moment has been **a sentence on a report screen**. Doubt existed only
  as a number: you swapped a thing, went home, read a paragraph, and the number moved.
  Now the person who doubted something spends the next afternoon **indoors, standing
  over it** - stooping to it, lifting it in both hands, looking down at it, putting it
  back, stepping off, coming back - and M23 made sight pass through **glass**, so you
  can stand on the street and watch it through their front window. **The loop is the
  tell**: somebody tidying does a thing once; somebody who no longer trusts their own
  memory of a room does it, walks away, and comes back. Measured: they stand **0.75m**
  from the object, their arms travel **1.15 radians** against **0.12** for a neighbour
  with nothing on their mind, and they step **0.30m** back and return.
  Walking up to one is worth **+6 Human Knowledge against +1** for small talk over a
  fence - GDD 5.4 says watching a neighbour come apart is how you learn to be human,
  and until now every approach paid the same regardless of what you walked up to.
  `doMorning` increments `GAME.day` *after* its loop, so a worry recorded in the loop
  was dated to the night rather than the morning and nobody ever fretted. It is
  promoted to `fretting` after the increment now, and anything older than today is
  cleared - yesterday's worry is not today's. 21 assertions.

  **A mistake worth recording:** the first attempt at this milestone terminated a perl
  heredoc with the wrong marker, and **the script's own source got written into the
  game file** - three `DAYFOLK.push` sites where there should be one. Caught by reading
  the result rather than the exit code. Restored from the M39 commit and redone. The
  retry then failed to match anything, because `git checkout` had restored the file
  with **CRLF** and the anchors were LF; normalise line endings before anchoring.

- 2026-08-27 - **M41 DONE - THE NIGHT HAS A PULSE.** *And a correction: I told the user
  to shrink the street.* 99m wide, 24.8m lots, 83 seconds to sneak across - it sounded
  like dead time. Then I measured the footprints. **The gaps between neighbouring
  houses are 2.4 metres.** The street is 99m because the houses and their yards are
  21.6m wide and 39.7m deep - 108m of building across a 99m street - not because the
  lots are spread out. There is no slack to remove, and moving `LOT_PITCH` would push
  the houses into each other. Crossing is not the problem either: a lot is **10s at a
  walk**, and a sneaked round trip to the farthest house is **16% of a night**. m41
  pins all of that so nobody acts on the advice I gave.
  **What the same measurement did find is that the night is empty of TIME.** Two to
  four events across a 780-second night left gaps of **117s, 143s, 249s, 200s**, and
  there is nothing else out there: no porch lights until night three, no dogs until
  four, no watchman until five. The first two nights - the ones a new player forms
  their whole opinion on - were four silent houses and a walk.
  `EVENT_COUNT` is 6-8 now, and **the scheduler was the real fault**: it walked forward
  from `EVENT_FIRST` adding a random step, so a night that drew small steps put
  everything in the first half and left the tail silent - across ten nights the worst
  stretch was **321s**, almost always at the end. Events are dealt into even slots
  across the whole budget now and jittered inside the slot, so coverage is guaranteed
  by construction. Measured across ten nights: worst silent stretch **249s -> 150s**,
  mean **96s**.
  **And a room with somebody asleep in it is no longer an empty room.** A sleeper did
  nothing at all until *you* made a noise. They turn over now, on their own rhythm,
  and the bed complains - 39 sounds in two minutes of standing still. It deliberately
  touches neither `s.noise` nor `s.sinceStir`: being woken by something you did not do
  would be unfair, and the point is **presence, not difficulty**. Asserted: five
  minutes of a player doing nothing leaves noise at 0.0000 and the sleeper asleep.
  15 assertions.


- 2026-08-31 - **M42 DONE - THE FRAME IS PART OF THE CONTRACT.** *Playtest feedback: "I
  need to see some real progress", and "couldn't see what was going on".* Forty-one
  milestones, 1,373 assertions, and **not one of them had ever looked at a pixel**. The
  last screenshots in `docs/` were M21. I finally rendered the thing and the images
  said what no state assertion could.
  **MEASURED** (`tools/_frame.js`, off the real framebuffer): every night scene lived
  entirely in the bottom two fifths of the histogram - street `64/36/0/0/0`, bedroom
  `48/51/0/0/0`, kitchen `43/56/0/0/0`. **Not one pixel anywhere in the top three
  fifths**, and 13-25% of every frame pure black. The rig's own comment says the plan
  is that "a low exposure crushes the ambient toward black while letting the practicals
  hold their highlights". The practicals were holding nothing.
  **Swept both levers** (`tools/_tone.js`). **Exposure is the wrong one**: at 1.35 the
  street reaches 2.4% highlight while black collapses 21% -> 1%, which is the "flat
  grey-blue" the rig itself warned about. **The practicals are the right one.** All
  eight now route through `practical()` and `CONST.PRACTICAL_GAIN` (2.5). Result:
  bedroom `48/51/0/0/0` -> `39/13/48/0/0`, kitchen `43/56/0/0/0` -> `23/33/44/0/0`,
  hall mean 0.209 -> 0.344. Still a night: brightest scene mean 0.385, deepest 24%
  black.
  **`CAM_OCC_PULL` was dimensionally wrong** - a *fraction* of the camera distance, so
  6% of 3.4m parked the camera 20cm off a wall. It is 0.45 **metres** now.
  **THREE OF MY OWN CLAIMS WERE WRONG AND THE MEASUREMENT CAUGHT THEM.** I told the
  user the camera was "inside the walls" everywhere: it is 0% near-geometry in four of
  five scenes and only bad in the lounge (34%). I said prompts were orphaned off
  screen: **52 of 52** prompted objects are on screen; the fault is placement at the
  bottom of the frame, not visibility. And I told them to shrink the street, which M41
  had already disproved.
  **AND ONE FIX I COULD NOT MAKE.** The lounge camera goes cleanly through a doorway,
  ends up 3.8m away in the next room with its nose 0.74m from a partition; `occlude()`
  passes it because the *line* was never blocked. I added a clearance solve that walked
  the camera in until it had room - it made things **worse** (lounge 34% -> 64%, hall
  9% -> 49% black), because pulling in just presses the camera against nearer things.
  Reverted. `PHYS.clearance` survives as the query that measures it, and m42 pins 34%
  so it cannot quietly get worse. **Still open.**
  17 assertions, including that quadrupling every lamp leaves `litAt` at 0.700
  unchanged - `PRACTICAL_GAIN` is a look control and must never become a difficulty
  one. **1390 assertions across forty-two suites.**

- 2026-08-31 - **M43 DONE - SODIUM.** The art direction, chosen off rendered
  comparisons rather than description: `tools/artdir.ps1` put the same two scenes
  through a moonlit control, a hard-contrast noir and this (`docs/ad-*.png`). Sodium
  won on **legibility** - under the old cool rig the house was a near-black slab with
  no readable door, window or roofline - and on one argument the other two could not
  make: **warm outdoors, cool indoors, so the colour of the light tells you which side
  of a window you are standing on.** In a game about being seen through glass that is
  a mechanic, not decoration.
  **The option image was not the right implementation of its own pitch.** Applying
  sodium to *everything* - which is what the rendered option actually did - gave a
  pale pink lounge with **0% pure black**, reading like dawn. The shipped rig is the
  pitch instead: ambient dropped to `NIGHT_HEMI 0.17` so houses stay dark, and
  everything bright outdoors comes from a lamp you can see and walk around. Six
  practicals are sodium, twenty stay cool; a street lamp and a window pool differ by
  **0.96** in red-minus-blue.
  Measured, all five scenes: street `18/49/16/17/0` at 7% black, bedroom
  `33/17/39/11/0` at 24%, kitchen `19/19/54/8/0` at 12%. Every one now has shadow, a
  midtone mass and a highlight - against `64/36/0/0/0` with nothing above the second
  fifth before M42.
  **AND IT CAUGHT A REGRESSION I CAUSED.** `dawnTick` hardcoded the *entire* old cool
  rig - hemi 0.34, moon 0.40, exposure 0.52, blue hue ramp - so the moment the night
  went to 0.86, **first light made the sky darker than the night it was ending**.
  Night exposure, hemi and moon now have one home in `CONST` and dawn ramps from
  them, with the hue travelling amber-to-blue the way a dawn actually does.
  m20's `DAYLIGHT IS BRIGHTER THAN NIGHT` compared the **exposure setting**, and the
  sodium night raised it to the same 0.86 the day uses - so it went red against a
  correct game. It measures the **frame** now: at identical exposure the day renders
  **1.78x** brighter than the night, which is both the true claim and a stronger one.
  17 assertions.
  **STILL OPEN:** a magenta shape at the left edge of the street shot that I twice
  failed to identify - two raycast probes both missed it. Not a sofa by name, not a
  parked car by position. Worth another look with a working probe.

- 2026-08-31 - **M44 DONE - THE OBJECTIVE HAS A PLACE.** *Playtest: "didn't know what
  to do."* The rail has twelve steps and every one is a **paragraph**. It tells you to
  search the planters by the porch while you stand in a dark street looking at four
  identical dark shapes, and never once points at one. Reading is not knowing where to
  go. The current step now gets a **place**: a slow amber beacon over whatever the rail
  is asking about - the planter, the door, the object to record, the one to swap, home.
  Sodium, because that is the language the street already speaks (M43).
  Deliberately **not** on everything: one at a time, only while the guide is on, only
  for steps that have a place. `read` is a key and `shop` is a screen, and standing a
  beacon somewhere for those would be a lie. 24 assertions.
  **AND THE MAGENTA THING WAS A CAR.** Three probes to find it, and I missed it twice
  by searching **the wrong side of the street** - the camera looks north, so world +x
  maps to screen LEFT and I had been scanning -x. `parkedCar` took `rng()*360`: a hue
  from **anywhere on the colour wheel**, at a flat 0.34 saturation. So the street could
  and did park a magenta car in a front garden, and it was the first thing in frame on
  the opening shot. Cars now draw from `CAR_PAINT`: silver, white, near-black,
  graphite, navy, maroon, bottle green, beige, weighted toward the boring ones because
  a cul-de-sac at 3am is mostly grey.
  The beacon needed `toneMapped:false` - ACES at exposure 0.86 washed a `#ffb45e` cone
  to near-white, and an indicator that cannot hold its own colour is not an indicator.
  **1431 assertions across forty-four suites.**

- 2026-08-31 - **M45 DONE - THE RUN HAS A SHAPE.** Forty-four milestones, 1,431
  assertions, and **nobody had ever played this game from night one to the end**. Every
  measurement had been of a MOMENT. The first end-to-end playthrough
  (`tools/_arc.js`) found three compounding faults no per-moment test could see:
  **(1) The forecast never came online.** `predict()` returns a band at Human Knowledge
  **50**; a player who goes out every afternoon and stands with three neighbours
  reaches **46 by night seven**. So across an entire run the scanner never once said
  what a purchase would do - the thing the intro promises and the guide tells you to
  use. **(2) So every swap came off the unaimed printer**, and `FAB_SIM`'s low end sat
  under the DOUBT window for most residents: **twelve CERTAINTY results in the first
  twenty swaps**, and street suspicion went 3.7 -> 51.5 in a single night. **(3) And
  the street finished hardening on night three** - every `HARDEN_AT` threshold sat
  below night two's alert reading, so all five defences installed at once and nothing
  changed for seven nights. A ladder that finishes before the game does is a prologue.
  The run **lost on night 7** to THEY COMPARED NOTES with collapse at 18.2 of 40.
  Fixed: HK tiers re-cut to the measured earn rate (~6.6/night) so the band arrives
  **night three**; `FAB_SIM` narrowed at the bottom to `[82,94]`; and - the real one -
  **`ALERT_SUSP` was 1.5, a HIGHER weight than collapse**, while `streetAlert()`'s own
  note says *"ALERTNESS is deliberately mostly Doubt"*. It was mostly Suspicion by a
  wide margin. **My first re-cut of `HARDEN_AT` was tuned against that inflated curve
  and broke the CAREFUL player** - who keeps suspicion near zero and would have seen
  the street react once in ten nights. Weighting alertness to match its own
  description (0.35) fixed both playstyles at once.
  **After: ten nights played, WON on night 10 at collapse 45.9**, street suspicion
  finishing at **69.1 against a bar of 70** - a photo finish on two meters - money down
  to $41 at its lowest, **24 bought against 20 printed**, 23 DOUBT against 11
  CERTAINTY, and hardening arriving on nights **2, 4, 6, 8, 10**. 20 assertions.
  **1453 assertions across forty-five suites.**

- 2026-08-31 - **M46 DONE - READING A PERSON.** The first thing off the GDD roadmap
  proper (**Phase 3: person-scanning and trait reveal**), and the one that pays for the
  rest of the game. Human Knowledge has been an **abstract number** since M6: one
  global counter unlocking the forecast for everybody at once. That is backwards for a
  game about people - knowing that Walt forgets things should not teach you anything
  about Marisol, who photographs her rooms before bed.
  The scanner reads **people** now. Press **Q** in the afternoon next to somebody and
  you get one reading a day: their **attention**, then their **notice floor**, then
  their **doubt band** - which is precisely what the Doubt Curve runs on. `predict()`
  takes `readTier(owner) = max(hkTier(), r.read)`, so studying somebody makes *their*
  shelf legible and tells you nothing about anybody else's.
  Measured: at **Human Knowledge 0**, three readings of Walt make his objects forecast
  a real band while June's still read `???`. A global counter could never do that.
  It costs the afternoon - the resource M20 built, M25 gave a job, and M40 made worth
  watching - and a new run knows nobody, so you learn the street from scratch every
  time. 22 assertions.
  **1475 assertions across forty-six suites.**

- 2026-08-31 - **M47 DONE - THE PROMPT GOES TO THE THING, AND THE CAMERA WAS NEVER
  BROKEN.** The prompt sat pinned at the bottom of the screen saying *"E examine her
  mother's vase"* while the vase was somewhere else. M42 had already measured that all
  **52 of 52** prompted objects were on screen - visibility was never the fault,
  nothing connected the words to the object. It is projected onto the thing now, with a
  stem pointing down at it, clamped so it can never leave the frame. Measured: **0px**
  between the prompt and its object.
  **AND THE CAMERA. I was wrong about it for three milestones.** One authored
  screenshot pose in the lounge showed a third of the frame filled by a wall, so I
  called the camera broken. M42 walked it in until it had clearance and made it
  **worse** (34% -> 64%). M47 capped the indoor distance - first scaled off clearance,
  which put the camera on the back of the player's head, then flat.
  Then I measured it properly (`tools/_cam.js`): **456 poses** on a grid across a whole
  house, eight headings each, sweeping the cap from 1.5m to none.
  `cap: none 3.6 3.0 2.6 2.4 2.1 1.8 1.5` -> `badly blocked: 13 13 13 14 13 13 13 14%`
  **Identical at every value.** Distance was never the lever. The bad poses are ones
  where you stand in a corner facing the corner, and then you see the corner. Median
  across a house is **0%**. The cap is gone; m47 pins the measurement so nobody re-adds
  it after looking at one bad screenshot. 16 assertions.
  **1491 assertions across forty-seven suites.**

- 2026-08-31 - **M48 DONE - STEVE MAREK IS DRESSED ON PURPOSE.** `makeBlockout` called
  `personLook('steve-marek')` - a random draw seeded off a string. Deterministic, but
  nobody chose it, and what it drew was `TOPS #7b4289`: **a magenta shirt**. Under the
  M43 sodium rig that made the man breaking into houses at three in the morning **the
  single brightest object in the frame** - and he is the one body you look at, from
  behind, for the entire game.
  Fixed dark look now: slate jacket, near-black trousers. Measured luminance **0.20**
  against a wardrobe average of 0.35 and a darkest-available of 0.25 - he is darker
  than every shirt on the street - and saturation **0.19** against the 0.35 he drew.
  Against a sodium-lit wall that is a gap of **0.50**: he reads as a silhouette, which
  is the fiction (*you do not burgle a cul-de-sac in fuchsia*) and the mechanic, since
  the whole game is about which side of the light you are standing on.
  Everybody else keeps the random wardrobe - 6 different tops among 7 people - because
  an afternoon street should have colour in it and a 3am porch should not.
  14 assertions. **1505 assertions across forty-eight suites.**

## Structures worth knowing
- **The night ledger** (`PENDING`): a change alters the world immediately but is
  *perceived* at `doMorning()`. Repeated edits to one object collapse into a single
  before/after — the resident sees the end state, not each keystroke.
- **`applyChange` is the only writer.** Nothing may move without being on the ledger.
- **`requisition()` returns null for an uncatalogued object.** That one gate is what
  makes observe→acquire→execute a loop instead of a menu.
- **Colliders are pre-inflated by `PLAYER_R`.** Anything reading them for something
  other than collision (sight, sound) must subtract it back out — see `wallsBetween`.
- **Light is two lists on purpose:** `LIGHTS` zones (gameplay, `litAt`) and THREE
  lights (presentation). The seeing check must never depend on renderer state.
- **Night look is controlled by EXPOSURE** (`toneMappingExposure`), not by light
  intensities — sRGB gamma makes dimming produce flat grey. See GDD §8.
- **Adding a system means adding its constants to `CONST` FIRST.** Six day-loop
  constants existed only in the GDD table; the code ran on `undefined` and failed
  silently (`NaN` prices you could "afford"). GDD §11 is the contract.
- **`predict()` forecasts against the object's CURRENT spec**, not your catalog entry
  — they diverge after the first swap. "The shelf does not lie" is a tested property.
- **Object ids must stay stable across rebuilds** (`clearWorld` resets `_objId`).
  `CATALOG` and the save file are both keyed by them, and `loadGame()` replays the
  builder before restoring state.
- **`OX` is the lot origin**, applied inside `box`/`placeObject`/`bed`/`addLight` so
  one authored house stamps down the street. Always restored to 0.
- **`emitNoise(x,z,mag,snd,mtl)` is the ONLY place sound and noise meet.** The voice
  the player hears and the noise a sleeper accumulates are emitted by one call, so
  they cannot drift into "loud to them, silent to you". Adding a new noise source
  means naming its sound in the same call — m9 drives the real code paths to check it.
- **Audio may read the simulation and must never write to it.** m9 replays a scripted
  60-step night with the graph dead and live and demands bit-identical sleeper traces.
- **`SFX` is inert until `arm()`**, which only runs on a real user gesture (browsers
  refuse an AudioContext before one). Every public method is a safe no-op meanwhile —
  the game must behave identically with the whole layer dead.
- **A resident's reachability is `floor` vs `attention × attach`, never `floor` alone.**
  This bug has now bitten twice (Walt in M2, Grace through M9): a high floor and a low
  attention MULTIPLY, and on a low-attachment object the required raw delta can exceed
  what `variantNear` can even produce. Whenever you add or retune a resident, run
  `tools\_reach.js` — it sweeps every (resident, object, store, week) through the real
  shelves and the real `DOUBT.resolve` and prints who is unplayable.
- **`SHOP_RAW_MAX` is NOT the shop's range.** It is read only by the histogram tooling.
  The shop's actual range is each store's `ladder` in `STORES`.
- **Stores differ ONLY by the range they stock** (plus price and reliability). Do not
  add gates, unlock conditions or per-store kind lists — the Doubt Curve already makes
  each shop specialise, because "more different" cannot help against someone who
  notices everything.
- **A guide step asserts the STATE it wanted, never the route you took.** `GUIDE_STEPS`
  predicates read live game state, so unexpected play order collapses the chain forward
  instead of stalling. "Find the key" is satisfied by already being inside.
- **`startHouse()` must never put a screen in front of the world it just built** —
  every suite calls it directly. The intro card hangs off `beginRun()`, which is what
  the title button calls. Keep that split.
- **A prop kind is DATA plus a `build()`, and nothing else.** 18 were added in M12 with
  zero systems changes. Adding one means: a `PROP_KINDS` entry (axes + salience + `mtl`
  + `plaus` + `price`), a `PROP_BUILD` function, and placing it in `HOUSES`. `kindFrame`
  derives thumbnail framing from the geometry, so there is no per-kind table to update.
- **"It builds" is not "the axes work."** Run `tools\_kinds.js` after adding kinds: it
  checks every declared axis actually changes the object, which needs world matrices
  (transform-only axes), absolute vertex values (scale on a symmetric box) AND
  `map.uuid` (texture-only axes like a brand name). Miss any one and you get false
  greens or 47 false positives — both happened. See GDD §15.
- **A test that teleports an actor is not testing whether the actor could get there.**
  Every suite sets `player.position` directly, which is why nobody noticed for twelve
  milestones that the lounge and bedroom could not be walked into. `tools\_space.js`
  and m13 flood-fill from the front door through the real colliders — run them after
  ANY change to furniture, colliders or the floorplan.
- **`CONST.ROOM_SCALE` scales DISTANCES, never sizes or heights.** The floorplan is
  authored in layout units and `_p()` converts inside `buildHouse`; `HOUSES` object
  `at` coordinates are converted at the placement call, which is why 30 placements
  needed no edits. Furniture sizes and Y heights are real-world and stay put.
- **ANYTHING BUILT PER-NIGHT MUST BE TORN DOWN PER-NIGHT.** `hardenNight()` is called
  from `nightReset()`, which runs every night, and the world is NOT rebuilt between
  nights - only on `startHouse()`. It pushed a light zone and a PointLight per porch
  every night and emptied only its bookkeeping arrays. `HARD_FX` + `hardClear()`
  now track, remove AND dispose. Never dispose `UNIT_BOX`; it is shared.
- **`findTarget` HAS A PRIORITY ORDER AND IT IS LOAD-BEARING.** Possessions, planters
  and doors compete first; HIDES and SCENERY are only offered `if(!best)`. Anything
  added to the main pass will silently steal **E** from the object beside it, which is
  the worst bug this game can have - the examine loop IS the game. M27 did exactly
  that and m26 caught it.
- **GRADE THE WORLD, NEVER THE EVIDENCE.** The game is judging whether two objects are
  the same object, and a compressive tone curve pulls colours toward each other -
  exactly what the player is trying to do. Applying it to props turned three declared
  hue axes into dead axes and broke m12's axis gate and m3's 150-degree assertion at
  once. `GRADE_ON` is switched OFF for the duration of every `buildProp()`.
- **`Write-Host` output is NOT captured by `> file 2>&1`.** It goes to the information
  stream, so every suite reads as NO OUTPUT - which looks exactly like a crashed page.
  Use `*> file`. This cost a full debugging pass.
- **Keep `.ps1` files ASCII-only.** PS 5.1 reads them as ANSI, so an em-dash or a
  multiplication sign in a heredoc becomes mojibake and the script dies with a parse
  error. Write prose into the markdown with an editor, not through a PowerShell script.
- **The harness flakes about one run in twenty** (Chrome startup noise), producing NO
  OUTPUT for a suite that passes on retry. Retry once before believing a failure.
- **The smoketest virtual-time budget is 200s.** A suite that drives many ticks across
  many sections will blow through it and hang the page with no output at all (m12 hit
  this, m19 hit it again). If a new suite produces "No test output", bisect it by
  section before assuming a crash - each section may pass perfectly on its own.
- **A DIAGNOSTIC THAT CHEATS CANNOT ANSWER THE QUESTION IT WAS BUILT FOR.** `_balance.js`
  and `_escalate.js` both open with `bank=1000000`, so for seventeen milestones "is
  this winnable" was measured for a player with infinite money - and the honest answer
  was NO. `tools\_economy.js` and m18 section 6 run the slice with the till open and
  are now gates. If you add a cost or a price, run them.
- **A TEST THAT TELEPORTS AN ACTOR IS NOT TESTING WHETHER THE ACTOR COULD GET THERE.**
  Learned in M13 (two sealed rooms), and it hid a wall again in M17: the garden gate
  was a PICTURE. The pickets skip the path, but the rail underneath was one collider
  across the whole frontage - you could only enter a front garden by JUMPING it, and
  jumping works, so it stayed invisible for nine milestones. `m17-tests.js` now
  flood-fills the estate from HOME, WALKING ONLY, and asserts every front door and
  every planter is reachable. Run it after touching any outdoor collider.
- **`box()` applies OX; `ground`/`tree`/`parkedCar`/`wheelieBin` do not.**
  Getting that backwards double-offsets a whole lot. `scenery()` applies OX too.
- **Two units in one file will eventually be added together.** The road was authored
  in raw metres while the yards were in ROOM_SCALE layout units, so it was drawn
  inside the front gardens for four milestones. Object placements now declare which
  they are: `at:` layout, `m:` metres. Fixtures are positioned from a WALL FACE.
- **Decor rng must be its own generator.** The street rng is consumed in order by
  `keyIn` and then every `randomSpec()`; one extra draw inside `buildHouse`
  shifts every object spec on every later lot, silently, after the balance was tuned.
  `dressInterior`/`dressLot` seed from `hashStr(def.id)`.
- **Adding possessions renumbers object ids and therefore invalidates saves.** Ids
  are `'o'+counter` in build order and the save is keyed by them. M17 bumped
  SAVE_KEY to v2 rather than let an old file restore the wrong spec onto the wrong
  object in silence.
- **`HOUSES` order is an ID-STABILITY CONTRACT, not a spatial one.** Object ids are
  minted in array order and `shopStock` seeds its rng from them, so inserting a lot at
  the front renumbers everything and silently repoints every `filter(...)[0]` in the
  older suites - it broke 22 assertions in one go. APPEND the entry; position the lot
  with its `x`.
- **A report must quote what LANDED, not what was computed.** Suspicion clamps at 100;
  gossip summed what was said and claimed +408 while its listeners sat at the cap.
- **Difficulty is a MULTIPLIER over `CONST`, never an assignment to it.** `winBar()`
and `hardenAt(i)` are the only readers; STANDARD is x1.0 so the shipped numbers are
the default. Mutating `CONST` would silently invalidate every suite that reads it.
- **`go()` releases the mouse lock.** It is the single funnel for every screen, so it
  is the one correct place — a menu you cannot point at is worse than no menu.
- **When you measure a mean, check your sampler covers the population.** `objects` is
  in house order, so "the first N objects" is one household. A balance sweep written
  that way reported an unbeatable ceiling that did not exist.
- **A test that drives a HUD system by hand proves nothing about whether it is wired.**
  m11 opens by moving the player and leaving the game alone under a live rAF loop,
  because every other assertion in it would pass with the rail frozen. Any future
  always-on UI wants the same treatment.

## Run it
```
play.bat                    # serves on http://localhost:8341/somethingsdifferent.html
tools\test.ps1              # all suites (760 assertions), exit 0 = green
tools\test.ps1 -Only m17    # one suite

# diagnostics (not suites — they measure, they don't gate):
tools\smoketest.ps1 -Tests tools\_reach.js   # who is playable, per store, per week
tools\smoketest.ps1 -Tests tools\_range.js   # what similarities variantNear can hit
tools\smoketest.ps1 -Tests tools\_probe.js   # does the page boot + is audio wired
tools\smoketest.ps1 -Tests tools\_kinds.js   # do all prop kinds build, are axes live
tools\smoketest.ps1 -Tests tools\_balance.js # what each effort level reaches in a run
tools\smoketest.ps1 -Tests tools\_space.js   # walkable floor + clearance, per room
tools\smoketest.ps1 -Tests tools\_escalate.js # what the street meters do over a run
tools\montage.ps1           # re-render docs\m3-props.png
tools\shot.ps1 -Scene court # screenshot a named scene headless
tools\build-share.ps1       # build share.html: one self-contained file, no wrapper

# PUBLISH. Build, test the SHIPPED bytes, push dist\, then poll the live URL until
# it serves THIS build - compared by git BLOB HASH, never by byte count (working copy
# is CRLF, Pages serves LF, so bytes are off by one per line and can never match).
# Adapted from C:\Dev\BedroomRacers\tools\publish.sh - see Dev\INDEX.md -> Publishing.
bash tools/publish.sh                 # build, test, push, wait, verify, print both links
bash tools/publish.sh --no-tests      # only when you have just run the suites
```

## Sharing a playtest build
**Live: https://dumb-tony.github.io/somethings-different/**

`tools\build-share.ps1` inlines the vendored three.min.js and emits three files of the
same game — the whole thing with **zero external requests**, so it runs from a static
host, an Artifact, or straight off disk:
- `share.html` — no doctype/html/head/body wrapper (an Artifact host supplies its own;
  a second one would nest documents).
- `dist\index.html` — a complete document for ordinary static hosts. **This is the
  deploy artifact**; `dist\` is its own git repo, remote
  `github.com/Dumb-Tony/somethings-different` (**public** — Pages requires it on a
  free plan), Pages serving `main` at root.
- `_share-test.html` — identical bytes to `dist\index.html` at the project root, **so
  the suite runs against exactly what ships**:
```
foreach ($s in @("m1","m2","m3","m4","m5","m6","m7","m8")) {
  tools\smoketest.ps1 -Tests "tools\$s-tests.js" -Game "_share-test.html" }
```
To redeploy: `tools\build-share.ps1`, re-run the suites above, then commit and push
from `dist\`. Pages takes ~45s to rebuild. **Only the built page and a playtester
README are in that repo** — GDD, source and tooling are deliberately not published.
The old Artifact URL (d415f536…) is superseded; the user wanted an external link.
In the browser console: `__SD.doubt()` prints the band maps + histogram;
`__SD.montage()` overlays the prop montage.

## Two rules that are easy to break
- **Salience models human noticing, not pixel area** (GDD §5.1). A brand-name swap is
  a 23% spec delta and a 1.7/255 pixel change — that is correct and tested.
- **Thumbnails use fixed per-kind framing.** Auto-fitting per instance hides every
  size axis and makes the shop lie about what you're buying.

## Gotchas already paid for
- `chrome.exe` is a GUI-subsystem binary: `$x = & chrome --dump-dom` captures **nothing**
  under PowerShell. Redirect to a file (`Start-Process -RedirectStandardOutput`).
- PS 5.1 `Get-Content -Raw` defaults to **ANSI** — always pass `-Encoding UTF8` or a
  UTF-8 file round-trips into mojibake.
- `THREE.REVISION` is the string `'128'`, not the number.
- Screenshots need the render loop **live**: `preserveDrawingBuffer` is false, so a
  canvas that isn't actively rendering composites as black.
- **Never assert on a Web Audio value synchronously after setting it.** `applyMix`
  uses `setTargetAtTime` (an instant jump clicks), so `gain.value` still reads the old
  level. Assert `SFX.busGain(k)`, then prove it reaches the graph by rebuilding it
  (`_reset()` → `arm()`, where gains are assigned outright).
- An **inline** probe script is useless with `--dump-dom`: its own source appears in
  the dumped DOM *before* the result it appends, so a sentinel regex matches the
  source. Load probes as external files — which is why `smoketest.ps1` uses
  `<script src>`. `tools/_probe.js` is a standing load-check that follows this rule.
- `smoketest.ps1` passes `--autoplay-policy=no-user-gesture-required`; without it a
  headless AudioContext stays `suspended` forever.


- **The live frame-rate assertions are invalid while agents are running.** m11's
  "the render loop is actually running" counts real `requestAnimationFrame` ticks. With
  a 5-agent workflow saturating the CPU it reported **3 frames, fps 0** three runs in a
  row - and the *previous commit*, checked out to a temp file and run under the same
  load, failed identically. "A real failure fails twice" is not enough on its own here:
  when a timing assertion goes red, re-run the LAST GREEN BUILD before believing the
  diff caused it. Cheap: `git show HEAD:somethingsdifferent.html > _prev.html` then
  `smoketest.ps1 -Game "_prev.html"`.

## Non-negotiables (full list in GDD §14)
- Doubt (win) and Suspicion (lose) are separate meters. Never merge them.
- Props are parametric; a "variant" is a diff of a spec's parameter vector (GDD §5.1).
- Houses are authored, not procgen — the opposite of the Chameleon project, on purpose.
- Solo game. No multiplayer.


- **LOOK AT THE GAME.** Forty-one milestones shipped without a single rendered frame
  being inspected, while the player kept saying it was unplayable. State assertions
  cannot see a black screen, a camera in a wall, or a prompt in the wrong corner.
  Every visual milestone ends with `tools/shot.ps1` and actually reading the image,
  and `m42` measures the framebuffer so a regression goes red.

## Testing (binding — GDD §16)
No Node.js on this box. Serve over http (`play.bat` → localhost:8341), smoke-run in a
real browser tab before delivering anything. Batch edits atomically. Verify numbers,
not vibes.

**Headless Chrome renders WebGL here** (verified 2026-08-06): `--headless=new
--disable-gpu` falls back to ANGLE/D3D11 WARP and renders correctly, so automated tests
can assert on real pixels via `readPixels`. Don't inherit the Chameleon project's
"headless rendering is impossible" note — that was the swiftshader path.

Keep collider/Doubt/noise/spec math pure (plain objects, no live `THREE` scene) so it
stays testable without a GL context.
















## M49 — the screens fit, and the tools still work

Screenshotted the morning report — the screen you read every night — and got a crash
banner over it: `SD.requisition is not a function`. M33 deleted `requisition()` sixteen
milestones earlier; three of `shot.ps1`'s scenes have thrown ever since, and nobody
noticed because nobody re-ran those scenes.

Under the banner the report ran off the bottom: the last swap of the night cut in half,
CONTINUE sitting on top of it. `#report-body` was capped at 58vh, but a **centred flex
column clips at BOTH ends** when it overflows, so the cap could never have saved it.
`.screen` now scrolls (`overflow-y:auto`, `.screen>*{flex-shrink:0}`) and the two long
bodies are sized against the chrome around them, not against the viewport alone.

`m49` carries an **API drift detector**: 137 `SD.*` names harvested from every
`tools/*.js` and `tools/*.ps1`. That is what would have caught the crash the day M33
landed, instead of sixteen milestones later in a screenshot.

Two false alarms had to be designed out of the key-row check before it measured
anything real — `querySelectorAll('b')` swept up the `<b>` tags descriptions use for
emphasis, and "a label with no letters in it" failed the nudge row, which is
legitimately four arrows. The rule is "nothing but a connector", the shape the
`<b>F</b> / <b>R</b>` bug actually had.

  report body 324px · button at 489px · viewport 624px · 30 key rows well formed

## M50 — the houses stop being the same house, and the street learns to forget

`tools/_plans.js` fingerprinted the five lots. The answer was worse than "similar":
they were the **same building** — 941 walkable cells in every house, one window
layout, one furniture layout, the same wardrobe to hide in at the same coordinate.
Only the paint and the objects on the surfaces differed. `buildHouse`'s own comment
argued that was enough ("suburban houses on one road ARE the same developer's
floorplan"), and it is not, because **the floorplan IS the stealth puzzle**.

A developer stamping a cul-de-sac mirrors the plan on alternate lots — the true thing
and the cheap thing at once. `MIR`/`MX()` threads one sign flip through the 26 places
that turn a house coordinate into a world one, so 14 and 8 come out handed the other
way: walls, windows, wardrobe, driveway, light zones, and the props on the shelves.

**The invariant that proves it is a mirror and not a break: reflection preserves
area.** All five houses still measure exactly 941 walkable cells. Wall layouts went
2 distinct → 4, hiding places 2 → 4, windows 1 → 2.

`addLight` was the near-miss: it sets a gameplay ZONE *and* a THREE light on two
separate lines. Mirroring one and not the other would light a house down one side and
have it *read* as lit down the other — the worst stealth bug available here.

### The second half, which the first half found

The mirror moved m45's competent run from 69.1 to 70.0 against `LOSE_STREET` 70, and
flipped a win into a loss. Chasing that turned up the real defect: **every write to a
resident's suspicion in the whole file is `+=` and clamped.** It was a ratchet. One bad
night on night two was still being paid for on night ten, there was no way back, and no
reason to ever lay low — so any change at all was a coin flip on the ending.

It cools now (`SUSP_COOL`), cancelled for anyone who noticed something that morning.
The meter finally moves both ways: 34 → 33 → 28 → 27 → 23, a bad patch to 64, recovery
to 56. Swept in `tools/_cool.js` against two bars — and **only one of them binds**:

      cool | competent finishes | sloppy peaks | sloppy crosses 70
      0.00 |  67.9 (margin  2.1)|     99.8     |  night 3
      0.12 |  56.3 (margin 13.7)|     94.8     |  night 3
      0.32 |  38.2 (margin 31.8)|     86.5     |  night 3

The sloppy run crosses on night three at every rate, so cooling cannot rescue a bad
player and THEY COMPARED NOTES was never at risk. I had asserted otherwise from a
first sweep whose "worst match" selector read `v.similarity` where the shelf calls
that field `v.sim` — so it silently bought nothing and fabricated everything. Both the
constant's comment and the m50 assertions carry the corrected numbers.

### Found while photographing it, NOT caused by it

`docs/m50-front16.png` — an **unmirrored** lot 49.6m from the world origin — shows the
same black wedge across the top-left as the mirrored `front14`. It tracks distance from
the origin, not the hand, so it predates M50. The rays through it miss every collider
and land ~54m out on a white-based material. Next milestone.

## M51 — the camera was standing inside a tree

M50's evidence shots came back with a third of the sky covered by a hard-edged dark
wedge at 14 and 16 Ardsley. Three guesses, all wrong, and each wrong in a way worth
recording:

1. **The mirror.** No — 16 Ardsley is *unmirrored* and had the same wedge, so it
   tracked distance from the world origin, not the hand of the plan.
2. **A shadow on the sky.** No — the sky is a `MeshBasicMaterial` and cannot receive
   one.
3. **The raycast.** It reported the sky sphere at 28.9m when that sphere has radius
   70, which is impossible. **The harness stops the render loop, so `matrixWorld` is
   stale while `.position` already reads the new value. Raycasts lie in a stopped
   world** — measure by position there, not by ray.

Positions gave it up immediately. Nearest thing overhead, camera at each front gate:

      10 Ardsley 9.0m    12 Ardsley 7.4m    8 Ardsley 5.3m
      14 Ardsley 2.0m    16 Ardsley 1.6m   <-- inside the canopy

The verge trees step on a fixed 11.6m grid down a 146m street while the lots sit on a
24.8m pitch; the two rhythms drift in and out of phase, and at two lots in five a
street tree landed on the front path. Standing at your own gate is the single most
common thing the player does.

**Nudged, not skipped.** Dropping a tree changes how many times that loop draws from
the street's shared generator, and this file carries a standing warning that one extra
draw silently repaints everything after it. Moving one costs no randomness — and m51
proves it: 59 canopies before and after, identical across two builds.

`VERGE_CLEAR` is 4.5 and not 4.0 because the constant places the **trunk**, while a
tree is several canopy blobs offset around it — at 4.0 the trunk cleared and a blob
still sat 3.7m off vance's path. The suite asserts foliage against a fixed 4.0m rather
than against `VERGE_CLEAR`, which would have been circular and passed at any value.

  every gate now clears 4.9m or better · 0% of the upper frame within 3m at all five

## M52 — a mirrored house must be the exact mirror of its twin

m50 asserted the things I thought to check — wall layouts differ, walkable area is
preserved, light zones and lamps agree. All true, all green, and all blind to three
real handedness bugs that only turned up when I **looked at the frames**:

- **The front door opened the wrong way.** `setDoor` wrote a fixed `+0.48π` for every
  door in the game. M50 moved the hinge to the other jamb on a mirrored lot, so the
  door swung backwards through its own doorway and into the hall, where it filled the
  camera. Invisible to every assertion, because **a closed door is symmetric and every
  test looked at closed doors**.
- **The door knob was on the wrong side** — the panel was mirrored, the handle wasn't.
- **The guard dog stood in the driveway.** Hardening fires long after `buildHouse` has
  returned, so the global `MIR` is back to 1; dog and kennel were placed at a hardcoded
  `+2.6` from the lot centre and never learned about the mirror.

All three are one mistake: a quantity with a handedness that never asked which hand
its house is. Enumerating them one at a time is how the first two got missed, so m52
asserts the **general property** — take every mesh on an unmirrored lot and every mesh
on a mirrored one, flip the local x and the yaw of the mirrored set, and require the
two to pair. **160 meshes, 0 unpaired, doors shut and doors open.** A handedness bug
anywhere fails here whether or not I thought of it.

Four things had to be designed out before it measured anything real, and each was a
lesson about what "the same" means:

- **Props are excluded.** Every house authors its own twenty objects, so comparing
  them compares two different set-dressings.
- **Colour is excluded.** Keying on it took the mismatch count 7 → 29, because every
  house has had its own palette since M17.
- **Actors are excluded** — sleepers stir and turn their heads, scan marks spin on a
  clock. Two houses hold two different people in two different states.
- **Matched by tolerance, not by a hash of the coordinates.** Quantising a position
  into a key is tidy and wrong: two meshes 3mm apart straddle a rounding boundary and
  hash to different buckets. It reported five phantom mismatches that were all pairs
  exactly 0.25 apart. **M50 hit this same trap comparing wall fingerprints.**
  Snap-to-grid cannot express "close enough"; a tolerance can.

Also fixed: `fireHardening()` only *adds a tier* when the alert level earns it — the
bodies are built by `hardenNight()`. Calling the wrong one gave zero dogs and an
assertion that passed because it had nothing to look at.

## M53 — two plans, not one

M50 gave the street two **hands** of a single floorplan. That doubled the variety and
then stopped: 14 Ardsley is 12 Ardsley backwards, and once you have learned 12 you have
learned both. A hand is not a plan.

A plan changes **which walls have gaps in them**, and nothing else — not one stick of
furniture, not one prop, not one window. The furniture is placed from the fixtures and
the twenty objects per house are authored in metres *against* those fixtures, so moving
a room would strand every one of them. Moving a doorway costs nothing and changes the
only thing that matters, which is the route to the bed.

      PLAN A   two doors off the hall. hall -> lounge -> bedroom, 12.4m of walking,
               straight across the lounge past the television.
      PLAN B   ONE door off the hall, into the kitchen; the kitchen opens into the
               lounge. hall -> kitchen -> lounge -> bedroom, 20.0m, past the fridge
               AND the television, with the hall a dead end behind you.

With M50's two hands that gives the four houses you burgle **four distinct buildings** —
A-plain, A-mirrored, B-plain, B-mirrored. It was one before M50 and two after.

### The first plan B did not work, and the flood fill caught it

I opened the divider at its **north** end, to put the bedroom off the kitchen. Every
other measurement stayed green — walls differed, rooms had clearance, hiding places
existed — and the bed was **unreachable in two of the four houses**. A clearance probe
beside a bed proves there is standing room; it says nothing about whether you can *get*
there. Only a real flood fill from the front door does, and it read 2325 cells against
2828.

`tools/_gap.js` said why in one pass: the **wardrobe** stands hard against that divider
from z 1.0 to 3.5, so there is no doorway to be had there without moving a hiding
place. The same probe showed the divider is clear on both sides from z −2.0 to 0.8. So
plan B opens at the *south* end and closes the hall's second doorway instead — which is
a better change anyway, because what now separates the two plans is **how many ways
there are out of the hall**.

### Two assertions had to be restated, not deleted

- m50 asserted "every house has exactly the same walkable area". The invariant was
  never that every house is the same size — it is that **a reflection preserves area**,
  so a mirrored house must match its *same-plan* twin. Per plan: A 941/941/941,
  B 939/939.
- m50 also asserted that the two unmirrored target houses fingerprint identically,
  which proved the M50 variation was a mirror rather than noise. No two target houses
  share both a plan and a hand any more, so the stronger claim replaces it: all four
  are distinct, and m52 still proves the mirror is exact by pairing 160 meshes.
- m52 picked its pair by array order and *happened* to get two plan A houses. That is
  luck, not a test; it now selects a same-plan pair explicitly.

## M54 — Temporal Freeze: the verb that is actually alien

GDD 5.10 specifies that the vertical slice ships exactly two abilities — Night Vision
and Temporal Freeze. It shipped one. Everything the game asks of you is slow and
deliberate — scan, print, swap, hide, wait — and every one of those is the work of a
careful burglar. **Nothing in the verbs was alien at all;** the premise lived entirely
in the prose.

**G holds the world for four seconds.** The implementation is one number, because
`tick()` already ran the player's simulation and the world's as separate calls — they
only ever needed separate clocks. `wdt` is zero while time is held, so the night clock
stops, sleepers stop stirring, the watchman stops walking and the car stops coming,
while `movePlayer` and the camera keep the real `dt`.

### The cost is being seen doing it

Everything else on this street has a mundane reading available: a noise is the boiler,
a moved mug is your own forgetfulness, a man in the dark at 3am is a burglar. Time
stopping has no mundane reading, so a witness does not get *more* frightened of a
burglar — **they stop believing in one**. Certainty is the thing this assignment must
never produce, which makes an unwitnessed freeze free and a witnessed one the most
expensive mistake available (+22, against a `LOSE_STREET` of 70).

**Is that cost reachable, or is it theatre?** Chasing a test failure I found that a
sleeper who *sees* you ends the night on the very next `nightTick` — so if "watched"
and "caught" were the same instant, the cost would be dead content, which is exactly
what this project keeps having to dig out of its own constants. They are not the same
instant: a sleeper goes asleep → **stirring** → awake; `watchedNow()` counts anybody
not asleep with a line of sight, and `onSeen` only fires from the *awake* branch. So
there is a window of seconds in which somebody is watching and the night is not over —
precisely when `enterHide()` refuses to let you into the wardrobe, and precisely when a
player reaches for a panic button. **The power is most useful exactly where it is most
expensive.** m54 measures the window rather than assuming it.

### Three things caught by looking rather than by asserting

- The HUD pill said `HELD 33s` while the world was running normally — one label for
  two states, so it described the *cooldown* in the words of the ability. `HELD` while
  held, `TIME` while it recharges.
- The first veil was a vignette alone and photographed as "slightly different
  lighting" — true, and for a four-second window as good as absent. It uses
  `backdrop-filter` now to pull the colour out of the rendered frame itself.
- `cue()` lives inside the SFX closure; the global handle is `SFX.cue`. And
  `updateHUD(dt)` *decrements a throttle with its argument*, so calling it bare would
  have set `hudT` to NaN and stopped the entire HUD updating for the rest of the run.

## M55 — a power nobody presses is worth nothing

M54 built Temporal Freeze and documented it in exactly one place: the controls screen,
which a player reads once, before they know what any of it means. Nothing in the
running game ever mentioned it. On the evidence of every milestone in this file that
shipped a mechanic nobody could reach, that is the same as not building it.

Two places, chosen for when a person actually looks:

- **The moment somebody sits up.** The stir line has always said "go still". The first
  time it fires in a run it now says what else there is — and never again, and never at
  all to somebody who has already used it. That is the moment the power exists for, and
  the same moment `enterHide()` starts refusing you the wardrobe.
- **The dossier.** It held three columns about *them* — residents, catalog, what you
  are carrying — and not one line about you, in a game whose whole premise is that you
  are not a person. Tab is the key a curious player presses. It reads live state:
  ready / holding / recharging / not in daylight.

Deliberately **not** a `GUIDE_STEPS` entry: that is a linear rail, and a panic button
taught at step seven of twelve is taught while there is nothing to panic about. The
suite asserts it stays off the rail.

### The harness could hand back a green result for a suite that never ran

`smoketest.ps1` hard-coded **port 8399 and `_smoketest.html`** — both fixed. Two runs
at once therefore shared one server and overwrote each other's page. Running m55 while
`publish.sh` was working through its own fifty-odd suites returned **`ALL-PASS pass=23`
for m36's assertions**: a green result for a file that had never been loaded.

A false pass is far worse than a collision that errors. The port is now `8400 + (PID %
900)` and the scratch file is `_smoketest-$PID.html`, so concurrent runs cannot see
each other. m55 was then re-run *during* a publish and came back with its own
assertions, which is the proof.
