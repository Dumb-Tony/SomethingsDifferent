# CLAUDE.md — Something's Different

**Read [GDD.md](GDD.md) first. It is the authority on this project.**

Suburban alien-gaslighting stealth game. Single self-contained HTML file, Three.js
r128, offline, served over http. Separate project from the Chameleon game in
`..\Claude\` — do not mix them, but *do* reuse Chameleon's proven code (OTS camera,
AABB colliders, canvas-texture materials, WebAudio SFX, crash banner). See GDD §9.

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
  **715 assertions across sixteen suites.**
  WARNING: six milestones have now shipped without a verified human playthrough.
  WARNING: five milestones have now shipped without a verified human playthrough.

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
tools\test.ps1              # all suites (715 assertions), exit 0 = green
tools\test.ps1 -Only m16    # one suite

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

## Non-negotiables (full list in GDD §14)
- Doubt (win) and Suspicion (lose) are separate meters. Never merge them.
- Props are parametric; a "variant" is a diff of a spec's parameter vector (GDD §5.1).
- Houses are authored, not procgen — the opposite of the Chameleon project, on purpose.
- Solo game. No multiplayer.

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







