# SOMETHING'S DIFFERENT — Game Design Document

**Version 0.1 — 2026-08-06**
Working title: *Something's Different*
Target: single self-contained HTML file, Three.js r128, offline, Steam-ready later.

---

## 0. How to use this document

This GDD is written **for the implementer** (Claude), not as a pitch. It commits to
numbers, schemas, and function names so that any section can be turned directly into
code without re-deciding the design.

Rules for editing this doc:

- **Every tunable number lives in §11 (Constants).** Body text refers to constant
  names (`NOTICE_FLOOR`, `NIGHT_SCALE`), never bare numbers, so tuning is one edit.
- Sections marked `> **EXPANSION HOOK**` are deliberate empty sockets. New content
  (houses, residents, prop kinds, abilities, stores, neighborhoods) plugs into an
  existing table or registry — **adding content must never require restructuring
  systems.** If a proposed addition can't fit an existing socket, that's a signal the
  socket is wrong; fix the socket, don't special-case the content.
- **Design decisions log (§14) is append-only.** Don't silently reverse an entry.
- Anything genuinely undecided goes in §15 (Open questions), not into the body as a
  vague hedge.

---

## 1. Executive summary

You are an extraterrestrial researcher assigned to a single suburban cul-de-sac. Your
species considers violence primitive; it studies **psychological collapse**. Your task
is to make every resident lose their grip on reality *without anyone ever being able to
prove that anything happened*.

To operate on Earth you swapped consciousness with an average suburban father. His
wife and children have no idea. So you are playing two interlocking games at once:

- **By night**, a stealth-puzzle game: enter homes, catalogue their contents, and
  replace objects with almost-but-not-quite-identical duplicates.
- **By day**, a social simulation: be Steve. Take the kids to school. Talk to your
  wife. Buy the almost-identical cereal at the supermarket without anyone wondering
  why you bought cereal you already have.

The weapon is not fear. The weapon is doubt.

**The fantasy:** not *"be an alien"* — *be the invisible cause of a neighborhood
unravelling, one plausible change at a time.*

---

## 2. High concept

> A stealth game where the objective is to be **wrong by 3%**.

The joke and the mechanic are the same thing: a change too small to notice does
nothing, a change big enough to prove does the *opposite* of what you want (it creates
a witness, not a victim), and the entire skill of the game is finding the narrow band
between them — **for each individual person**, because that band is different for
everyone.

---

## 3. Design pillars

1. **Doubt, not fear.** The success state is a person who distrusts *themselves*. If a
   resident becomes certain something happened, you have failed at that object — even
   though you "succeeded" at changing it. This inverts normal stealth-game intuition
   and must be taught early and hard.
2. **People are the puzzle, objects are the tools.** You are not solving a house. You
   are solving a person. The same swapped mug is devastating to one resident and
   invisible to another. Recon on *people* matters more than recon on *rooms*.
3. **Every night has a next morning.** No action resolves in isolation. What you do at
   03:00 you must stand next to at the mailbox at 15:00. The two halves of the game
   must constantly cash cheques written by the other half.
4. **Plausible deniability is a resource.** Money, time, noise, and *believability* are
   all budgets. The most expensive currency is the number of things that can be
   explained away.
5. **Comedy is deadpan and structural.** The humour comes from the seriousness of the
   alien's clinical framing applied to breakfast cereal — never from jokes in dialogue.
   The scanner's UI is the game's primary comedian.

---

## 4. The Doubt Curve — the spine of the game

Everything in §5 exists to feed this one function. **Build this first, before any
content.** If this isn't fun in a grey-box room with three objects, nothing else will
save the game.

### 4.1 Perceptual delta

Every object is a **spec**: a named parameter vector (§5.1). Each parameter carries a
**salience** weight — how loudly that axis shouts at a human eye.

```
rawDelta(a, b) = Σ_axes ( axisDist(axis, a[axis], b[axis]) × salience[axis] )
                 ─────────────────────────────────────────────────────────────
                                     Σ_axes salience[axis]

  → 0.0 (identical) … 1.0 (nothing in common)
```

`axisDist` is per-type: hue = shortest arc / 180; numeric = |Δ| / range; enum = 0 or 1;
boolean = 0 or 1; position = |Δ| / PROP_POS_SCALE; rotation = |Δ°| / 45.

### 4.2 Perceived delta (per resident, per object)

```
Δ = rawDelta × 100
    × attention(resident)          // Observant trait, 0.5 … 1.6
    × attachment(resident, prop)   // 0.3 (a spoon) … 2.0 (her wedding photo)
    × (1 + SEED_BONUS × seedMatch) // does this change hit their fixation?
    × freshness(prop)              // 1.0, decaying to 0.6 if hit repeatedly and ignored
    × alertness(resident)          // 1 + K_ALERT × (Stress/100)
```

### 4.3 The three bands

```
        Δ  <  floor              →  MISSED      nothing happens
floor ≤ Δ  ≤  ceiling            →  DOUBT       ★ the win zone
        Δ  >  ceiling            →  CERTAINTY   they know. Suspicion, not Doubt.
```

- `floor` = resident's `noticeFloor` (low = observant).
- `ceiling` = `noticeFloor + doubtBand × plausibility(prop, context)`.

**Plausibility** is the object's capacity to be self-explained. Cereal: 0.9 ("I must
have grabbed the wrong box"). A rotated picture frame: 0.7 ("the cleaner? the kids?").
A wedding ring: 0.1 ("nobody swaps a ring"). A moved fence: 0.05. High-Δ changes to
low-plausibility objects go straight to CERTAINTY no matter how observant the target
isn't — **this is the system's main safety rail against "just change everything."**

### 4.4 Outcomes

```js
MISSED    → nothing; money and a night spent. freshness -= 0.1 (they're acclimatising)
DOUBT     → Doubt     += K_DOUBT × Δ
            Stress    += K_STRESS × Δ
            emits a REACTION beat the next morning (§5.4)
CERTAINTY → Suspicion += K_SUSPICION × (Δ - ceiling) × (2 - plausibility)
            Doubt     += a small amount (they're still rattled) — but the resident
            now MARKS the object (§5.3.5) and tells someone (§5.8 gossip)
```

### 4.5 Why the conspiracy theorist is immune — expressed as data, not a special case

He isn't scripted to be immune. He has `noticeFloor: 2, doubtBand: 3`. His DOUBT zone
is three points wide. Essentially every change you make lands in CERTAINTY. He is
correct about everything and generates Suspicion instead of Doubt. The design goal is
that the player *derives* "don't touch that house" from the numbers, and later derives
the counter-play: he's the neighborhood's least-believed man, so his CERTAINTY converts
into **other people's** Doubt when he tells them (§5.8).

Conversely, forgetful Grandpa Hoyt: `noticeFloor: 34, doubtBand: 40`. Enormous floor
(hard to affect at all) but an enormous band (almost impossible to alarm). He is the
safe grinding target and the tutorial's second lesson.

> **EXPANSION HOOK — new resident psychologies** are just new `(noticeFloor, doubtBand,
> attention, seed)` tuples. No new code should ever be needed for a new personality.

---

## 5. Systems

### 5.1 Props & specs (the parametric object system)

**This is the technical keystone of the project.** Objects are not modelled; they are
*generated from a spec*, so a near-identical variant is a cheap parameter diff rather
than a second hand-built asset.

```js
PROP_KINDS = {
  cerealBox: {
    alienName : 'GRAIN NUTRITION UNIT',
    cat       : 'kitchen',
    plaus     : 0.90,                 // plausibility (§4.3)
    price     : [4, 9],               // shop price range
    axes: {
      hue     : { t:'hue',                       sal:0.90 },
      brand   : { t:'enum', v:['CRUNCH-O','FLAKEE','SUGRZ','BRAN!'], sal:0.85 },
      mascot  : { t:'enum', v:['bird','tiger','clown','none'],       sal:1.00 },
      pattern : { t:'enum', v:['solid','stripe','dots'],             sal:0.40 },
      h       : { t:'num',  min:0.24, max:0.34,                      sal:0.50 },
    },
    build(spec, mats) { /* returns THREE.Group; label art drawn to a 128² canvas */ }
  },
  // …
}
```

Rules for `build()`:

- Geometry from primitives (Box/Cylinder/Sphere/Lathe/Extrude) + **canvas textures**.
  Canvas textures are where cheap visual variety comes from: labels, patterns, photo
  prints, book spines, wallpaper.
- Deterministic: `build(spec)` must always produce identical **vertex data**. (Note:
  THREE's `Object3D` constructor calls `Math.random` for UUIDs, so "no Math.random
  during build" isn't assertable — geometry determinism is, and is tested.)
- Must set `group.userData.spec`, `group.userData.kind`, and `userData.size`.
- Must be centred on its footprint with its base at y=0 (`finishProp` enforces this).
- Must read **only** from `spec`. A builder that reads global state breaks the shop
  preview, which renders specs that don't exist in the world.

**⚠ Salience models HUMAN NOTICING, not pixel area. Never "calibrate" salience against
measured pixel difference** — it would gut the design. The two diverge on purpose:

| | example | spec delta | pixel change |
|---|---|---|---|
| **Appearance axes** | hue, size, pattern, length | tracks pixels closely | large |
| **Semantic axes** | brand name, photo subject, slogan | high | *tiny* |

A brand-name swap is a 23% spec delta and a 1.7/255 pixel change — and a human reading
"FLAKEE" where "CRUNCH-O" used to be notices instantly. That case *is* the pitch's
opening example. Measured and pinned by a test so a future pixel-based "fix" fails loudly.

**Thumbnails are framed at a fixed per-kind scale**, not auto-fitted per instance.
Auto-fitting normalizes away every size axis — a cereal box 3 cm taller renders
identically framed — which would make the shop's compare card silently lie about the
exact axis being bought. The reference frame is the kind's largest possible spec, like
a shelf.

**Placement spec** (separate from the object spec, and separately swappable — moving an
object *is* a change):

```js
{ kind, spec, pos:[x,y,z], rotY, surface:'counter_1', owner:'marisol', attach:0.8 }
```

`pos`/`rotY` participate in `rawDelta` with their own saliences, so "moved 4 cm left"
and "rotated 2°" are ordinary changes handled by the same math as swapping the object.
No separate "move furniture" system exists — **this is important; do not add one.**

> **EXPANSION HOOK — new prop kinds** are a new entry in `PROP_KINDS`. Everything
> (catalog, shop, scanner, doubt math, thumbnails) picks them up automatically.

### 5.2 The Scanner & the Catalog

**Scanning** (night, hold `F` on a prop, ~1.2s): records the exact spec into the
Catalog. **You cannot buy a replacement for an object you haven't scanned** — this is
what forces the Observe → Research → Acquire → Execute loop instead of letting the
player skip to shopping.

Scan also captures: owner, room, attachment estimate, and (for some kinds) whether the
object is marked.

**The Catalog** is the mission planner: a grid by house / room / category. Each entry
shows a rendered thumbnail (offscreen render-target of `build(spec)`, cached as a data
URL), the alien name, the spec axes, known shop variants, and the *predicted* Δ and
band outcome for the owner — **but only as accurately as your Human Knowledge allows
(§5.6).**

Early game the readout is honest but unintelligible:

```
GRAIN NUTRITION UNIT
  Sugar Level ......... EXCESSIVE
  Emotional Attachment  HIGH (unexplained)
  Predicted outcome ... ???
```

Late game:

```
CEREAL — "CRUNCH-O", Marisol
  Similarity to shelf variant #3 ....... 94%
  Difference: mascot bird → tiger
  Predicted Δ 22   ▸ DOUBT (floor 6 · ceiling 41)
  Expected: +9 Doubt, +4 Stress
```

> **EXPANSION HOOK — scanner modes.** Reserve `scanMode: 'object' | 'person' | 'record'`.
> Person and record scanning are Phase 3/4 (§12).

### 5.3 Residents

```js
{
  id, name, house, bed:[x,y,z],
  // ── Doubt Curve inputs ──────────────────────────────
  noticeFloor, doubtBand, attention, seed:'order'|'memory'|'precision'|'tech'|…,
  // ── traits (0..1; drive everything else) ────────────
  observant, stubborn, forgetful, superstitious, paranoid, narcissistic,
  organised, embarrassable, sleepQuality,
  // ── live meters ─────────────────────────────────────
  doubt:0, suspicion:0, stress:0,
  // ── behaviour ───────────────────────────────────────
  schedule:[…], relationships:{…}, fractures:[…], marked:Set()
}
```

**5.3.1 The three meters.**
- **Doubt (0–100)** — "I'm losing my mind." *The win currency.*
- **Suspicion (0–100)** — "Someone is doing this." *The lose currency.* Drives
  neighborhood hardening (§5.8).
- **Stress (0–100, decays ~4/day)** — fast-moving modifier. High Stress lowers
  `sleepQuality` (good for you at night: deeper sleep is wrong — *stressed people sleep
  worse and wake more*, so high Stress makes their house **harder** to enter). This
  tension is deliberate: the more you work a house, the harder it becomes.

**5.3.2 The Seed.** Each resident has one fixation. Changes in that category get
`SEED_BONUS` to Δ and, more importantly, chain into a coherent personal narrative
(their fracture text references it). Seeds: `order`, `memory`, `precision`, `tech`,
`nature`, `provision`, `identity`.

**5.3.3 Attachment.** Per-object, authored on placement (0.3–2.0), modified by seed
category match. Her mug: 1.7. A fork: 0.3. The wedding photo: 2.0.

**5.3.4 Fractures (breaking points).** At Doubt 25 / 50 / 75 / 100 a resident fires the
next entry in their authored `fractures` list. A fracture is a **world change**, not a
cutscene: it alters their schedule, their house, their dialogue, and often the
difficulty of infiltrating them.

| Doubt | Example fracture (Marisol) | Mechanical effect |
|---|---|---|
| 25 | Starts photographing rooms before bed | Objects gain `marked` (§5.3.5) |
| 50 | Sleeps in the living room | Sleeper moved; bedroom now free, lounge now hot |
| 75 | Accuses her husband of moving things | Husband's Doubt +, marriage meter drops |
| 100 | **COLLAPSE** — she stops trusting her own memory entirely | Locked in; counts toward win |

**5.3.5 Marking (the counter-play).** A rattled resident marks objects: pen dots on the
cereal box, tape on the frame edge, a phone photo of the shelf. A marked object's
`plausibility` drops by `MARK_PLAUS_PENALTY`, which collapses its doubt band — so the
same swap that used to yield Doubt now yields Suspicion. **Counter-counter-play:**
buy the *identical* variant (100% similar, expensive) and reproduce the mark, or steal
the marking implement, or swap the photo on their phone (late game). This is where the
"replace with an identical object" idea from the pitch becomes mechanically load-bearing
rather than a curiosity.

> **EXPANSION HOOK — fractures** are authored per resident as an ordered list of
> `{atDoubt, text, apply(world)}`. Adding a resident = adding four `apply` closures.

### 5.4 Reactions — the morning payoff

The whole game exists to produce these. The morning after a DOUBT result, the affected
resident plays a **reaction beat** during a day block, visible if you're in position to
watch (window, yard, mailbox). Beats escalate with cumulative Doubt on that object:

| Cumulative | Beat |
|---|---|
| 1st | Pause. Look. Look again. Continue. (no dialogue) |
| 2nd | Asks a family member: *"Didn't we buy Frosted Flakes?"* — "No." |
| 3rd | Says it aloud to no one. Starts checking other things. |
| 4th+ | *"I KNOW it was Frosted Flakes."* Argument. Marking. |

Watching a reaction grants **Human Knowledge** (§5.6) — the player is rewarded for
literally studying humans, which is also the fiction. Beats are data:
`{objectRef, tier, lines[], anim, witnesses[]}`.

### 5.5 Night infiltration

**Camera:** third-person over-the-shoulder for movement (reuse the `chameleon3d` OTS
rig: dist 4.4, pitch 0.22, shoulder 0.45), snapping to a **focused inspection view**
when you interact with a prop (ease camera to ~0.6 m from the object, unlock a
manipulation panel). Precision work needs a close view; traversal needs a wide one.

**The night clock.** Bed at `NIGHT_START` (23:00), must be back in bed by
`NIGHT_CURFEW` (05:30). `NIGHT_SCALE` compresses this to ~13 real minutes. A visible
clock is always on the HUD; the last 30 game-minutes tint it.

**Entry.** Every house has authored entry points, each gated by recon knowledge:
spare key (found by searching the yard/planter/frame), unlocked window (varies by night
and by weather), pet door, garage code (seen being typed during a day block), unlocked
back door on bin night. **You cannot break in** — forced entry is instant, permanent
Suspicion. Locks are information puzzles, not lockpicking minigames.

**Detection channels (all three run simultaneously):**

1. **Noise.** Every action has a noise value (walking 1, running 6, opening a drawer 4,
   dropping something 30). Noise accumulates in a per-room meter, decays at
   `NOISE_DECAY`/s, and propagates to adjacent rooms at `NOISE_WALL` attenuation. A
   sleeper wakes when their room's meter exceeds `wakeThreshold` (derived from
   `sleepQuality` and current Stress).
2. **Light.** Streetlights, window spill, motion-sensor floods (installed as Suspicion
   rises), and any light you turn on. Being lit while a waking or awake NPC has line of
   sight = seen. Torches are for the *seeker* fantasy; here you have alien night vision
   and never need one.
3. **Sleepers & wanderers.** Residents are physical bodies in beds with a wake cycle:
   random bathroom trips, insomniac patrols at high Stress, pets that roam. A woken
   NPC first sits up (grace period — freeze or hide), then walks their route with a
   phone torch.

**Being seen** = catastrophic, not instant-fail: you flee, that resident's Suspicion
jumps to near-max, and the neighborhood hardens. Three sightings = run over (§10).

**Carrying and disposal.** Inventory has slots (`CARRY_SLOTS`). Every original you
remove must be *disposed of*: stashed in your garage (safe until your wife finds it —
she searches at high Wife Suspicion), buried in the yard (takes time, leaves a mound),
or binned on bin night (safe, but only Tuesdays). **An original object found is the
single worst outcome in the game** — it converts a whole neighborhood's Doubt into
Suspicion at once.

> **EXPANSION HOOK — traversal abilities.** Wall-climbing and vent/crawlspace routes
> are Phase 3. The collider format (`{minX,maxX,minZ,maxZ,top}`, below-top = wall,
> above-top = standable) is inherited from `chameleon3d` specifically so its proven
> gecko wall-crawl code can be ported later without redesigning the world.

### 5.6 Day simulation

**Structure: blocks, not minutes.** A continuous suburban day-sim is a scope trap. The
day is five blocks; each grants `ACTIONS_PER_BLOCK` actions, and every meaningful thing
costs one.

| Block | Time | Available |
|---|---|---|
| MORNING | 07:00 | Family obligations (kids to school, breakfast, wife) |
| WORK | 09:00 | Job (minigame-free: choices + coworker scenes) or a sick day (costs money + Wife Suspicion) |
| MIDDAY | 12:00 | Stores open. Travel. Errands. |
| AFTERNOON | 15:00 | Neighborhood: mailbox, lawn, walking, watching reactions |
| EVENING | 18:00 | Family, chores, TV, wife conversation. Bed at 22:00 |

Skipping a family obligation is always *possible* and always costs Wife Suspicion —
that's the daytime tension in one sentence.

**Dialogue.** Scenes are data:

```js
{ id, npc, trigger:{block, day, cond}, lines:[…],
  choices:[ { text, register:'NORMAL'|'ODD'|'ALIEN', warmth:+2, weird:+0, hkGate:0, fx(){} } ] }
```

`ODD` and `ALIEN` choices are the comedy ("I also enjoy consuming hotdogs") and they
cost Suspicion with that NPC — but `ALIEN` choices sometimes *teach* you something an
honest answer wouldn't, so they aren't strictly dominated.

**Human Knowledge (HK, 0–100)** replaces a sanity meter. It is the game's legibility
progression, and it's shown by **the UI itself becoming readable**:

| HK | Effect |
|---|---|
| 0–19 | Dialogue choices show text only. Scanner output is clinical gibberish. |
| 20–49 | Previously-used choices show their remembered outcome. Scanner names objects properly. |
| 50–79 | All choices show predicted `warmth`/`weird` icons. Scanner predicts Δ and band. |
| 80–100 | Scanner predicts the *reaction beat*. Residents' seeds are displayed outright. |

HK is gained by: watching reaction beats (+3), successful `NORMAL` conversations (+1),
reading things found in houses — mail, diaries, homework, prescriptions (+2), and
attending social events (+4).

**Social camouflage.** A per-location familiarity counter. The first time you buy a
doorknob you're a stranger and it registers; by week three the hardware clerk greets you
by name and identical purchases stop generating attention. Familiarity is earned by
routine visits and is a real reason to shop *before* you need to.

### 5.7 Money & the stores

Steve is paid `WAGE` on Fridays. Bills auto-deduct. Discretionary income is the real
budget, and **an unexplained spending pattern is itself evidence** — the wife reviews
the account (§5.8), so cash withdrawals (which cost a fee and an action) exist as
laundering.

Store UI: aisles → shelf of generated variants of a kind. If the original is in your
Catalog, each variant shows live **Similarity %** and, at sufficient HK, predicted band.
Variants are generated per-store per-week from a seeded RNG, so **stock rotates** —
the perfect 94% match may not be there next week, which makes buying opportunistically
a real decision.

The **identical variant** (100%) is always available by special order at
`IDENTICAL_MULT` × price and a 2-day delay. It is useless for creating doubt and
essential for defeating marks (§5.3.5).

**Slice store:** Bulwark Mart (grocery + home + hardware aisles).
> **EXPANSION HOOK — stores** are `{id, name, aisles:[kindIds], priceMult, familiarity}`.
> Thrift store (random high-similarity stock, cheap), antique shop (heirloom-class
> props), pet store, furniture warehouse (needs a truck) are Phase 2/3.

**Implemented 2026-08-10 (M10) — three stores, and the only real difference between
them is the RANGE they stock.**

| Store | Stocks | Price | Its real cost | For |
|---|---|---|---|---|
| Bulwark Mart | 66–97% | ×1.00 | — | the middle of the street |
| Second Chances (thrift) | 22–64% | ×0.35 | **+4 Wife Suspicion per visit**, and it only has your kind of thing ~62% of weeks | people who barely look up |
| Ardsley Antiques | 97.3–99.2% | ×3.60 | money | people who notice everything |

The bands do not overlap, so each shop owns a slice of the spectrum outright and
"which shop" is a clean read rather than a coin toss between two shelves.

**Why this had to exist.** `perceived` multiplies raw delta by attention *and*
attachment, so one shelf cannot serve this cast: Marisol's doubt window on her lounge
clock is raw 0.027–0.097 while Grace's on her curtains runs to 0.87. That is a 15×
spread. Bulwark's widest rung is 66% similar, so **every rung read MISSED to Grace and
she was unplayable for eight milestones** (§15, open since M2 — measured at 0 of her 4
objects). Nothing gates the stores except the maths: a 42%-similar curtain is CERTAINTY
to Marisol and invisible to Grace, so the shop you drive to *is* the read you have taken
on the person. It balances itself — buying "more different" cannot help you against
someone who already notices everything.

The identical special order stays **Bulwark-only**: a second-hand shop cannot order a
perfect copy, and putting it everywhere would quietly halve the cost of defeating a
mark, which §5.3.5 balances around.

### 5.8 The neighborhood as a system

- **Gossip.** Residents talk during day blocks along `relationships` edges. A CERTAINTY
  event propagates Suspicion to neighbours *scaled by the speaker's credibility*. The
  conspiracy theorist has credibility 0.1 — which is why he's survivable, and why
  routing your loud mistakes *through* him is a legitimate strategy.
- **Hardening.** Neighborhood Suspicion (mean of residents, weighted by `paranoid`)
  crosses thresholds and permanently changes the world: motion lights (25), dogs left
  outside (40), a neighborhood watch patrol on a route (55), doorbell cameras (70),
  couples sleeping in shifts (85). Each is a concrete new obstacle at night.
- **Agency Attention (0–100).** A separate global meter fed *only* by anomalies that
  can't be explained by a human agent: alien ability traces, impossible entries, an
  object appearing in two places. At 100 the government arrives and the run ends.
  This meter is why the mundane path is the main path.

### 5.9 Your wife — the daytime boss

**Wife Suspicion (0–100)** is its own meter with its own ladder. She is not an obstacle
with a detection cone; she is a person who knows your habits better than you do.

| Rises from | Falls from |
|---|---|
| Leaving the bed at night (scales with how long) | Full nights asleep |
| Being visibly tired at breakfast | Doing chores you weren't asked to do |
| Dirt/grass on clothes, mud by the door | Good `NORMAL` dialogue in EVENING block |
| Unexplained purchases on the account | Remembering dates (anniversary, birthdays) |
| Missing family obligations | Gifts (costs money — the honest sink for cash) |
| Being contradicted on a shared memory | Time spent with the kids |

**Escalation ladder** (each tier is a real night-game modifier):

| Tier | Wife Susp. | Behaviour |
|---|---|---|
| 0 | 0–19 | Sleeps through. Free exit. |
| 1 | 20–39 | Light sleeper: exiting the bedroom has a noise check. |
| 2 | 40–59 | Wakes to check ~1 night in 3. You must be back by a random early time. |
| 3 | 60–74 | Stays up reading. You must wait for a window, losing night time. |
| 4 | 75–89 | Follows you outside once per week. Must be lost, or the night is a bust. |
| 5 | 90–99 | Checks receipts and the account; searches the garage (finds stashes). |
| 6 | 100 | **Private investigator / confrontation → run over (§10).** |

She is the game's clock on your ambition. The design intent: the player should regularly
choose to *waste a good night* being a good husband.

> **EXPANSION HOOK — children.** Kids are Phase 3: less observant, but they *tell the
> truth* and are believed by no one — a natural inversion of the conspiracy theorist.

### 5.10 Alien abilities

Powers are shortcuts that trade a mundane cost for **Agency Attention**. Every power
leaves a trace; using powers is admitting you couldn't do it as a human.

| Ability | Effect | Cost | Trace |
|---|---|---|---|
| **Temporal Freeze** | ~4 s world pause; you still move | Long cooldown | +2 Attention if witnessed |
| Night Vision | Passive; see in the dark | none | none (Phase 1, free) |
| Short Teleport | ~6 m blink through one wall | Cooldown + HK gate | +4 Attention |
| Object Duplication | Clone an object you're holding (identical variant, free) | 1/night | +6 Attention |
| Memory Blur | Erase the last ~20 s from one witness | 1/night | +10 Attention, −Doubt on that person |
| Mimicry | Perfectly answer one dialogue check | HK gate | +3 Attention |
| Limited Mind Reading | Reveal one hidden trait/seed instantly | cooldown | +1 Attention |

**Slice ships Night Vision + Temporal Freeze only.** The rest are §12 sockets.

---

## 6. Content — the vertical slice

One cul-de-sac. Four houses. Seven nights.

### 6.1 Houses

| # | House | Residents | Seed | Role in the slice |
|---|---|---|---|---|
| 0 | **Your house** — 10 Ardsley Ct | You (Steve Marek), Dana (wife), 2 kids (background) | — | Home base, garage stash, the exit puzzle |
| 1 | **The Hoyts** — 12 Ardsley Ct | Walt (78) & June (75), retired | `precision` (Walt) / `memory` (June) | **Tutorial house.** Huge floors, huge bands — safe. Teaches the loop. The keys-on-the-hook chain. |
| 2 | **Marisol Vance** — 16 Ardsley Ct | Marisol (34), Aaron (36), infant | `order` | **The meat.** Low floor, wide band — the ideal victim. Photos, symmetry, sleep-deprivation. |
| 3 | **The Okonkwos** — 18 Ardsley Ct | Dev (16), his mother Grace (nights shift) | `tech` (Dev) | **Comedy + low risk.** Empty house half the night. Wallpaper, keycaps, cable colours. Dev blames malware; nobody investigates a teenager. |

**Deliberately held back for Phase 2:** the conspiracy theorist (house 5). The slice
must teach the safe cases before it teaches the trap.

### 6.2 Slice residents — Doubt Curve values

| Resident | noticeFloor | doubtBand | attention | sleepQuality | Notes |
|---|---|---|---|---|---|
| Walt Hoyt | 16 | 55 | 0.8 | 0.5 | Forgetful ≠ unobservant: he SEES it and blames himself. Retuned 2026-08-06 from 34/40/0.6 — see §15 |
| June Hoyt | 18 | 30 | 0.9 | 0.4 | Sharper than Walt; the couple *argue*, which is the payoff |
| Marisol | 6 | 35 | 1.5 | 0.35 | Notices everything, distrusts herself completely |
| Aaron | 26 | 22 | 0.8 | 0.8 | Dismisses Marisol → drives her Doubt up for free |
| Dev | 12 | 30 | 1.2 | 0.9 | Notices, but attributes to software |
| Grace | 30 | 25 | **1.0** | 0.3 | Night shift — home at unpredictable hours. Attention was 0.7; retuned 2026-08-10 because floor×attention×attach made her literally unreachable — see §15 |
| Dana (wife) | — | — | — | 0.6 | Uses the Wife Suspicion ladder, not the Doubt Curve |

*(These are first-pass values. Expect a full tuning pass after the slice is playable —
log changes in §15.)*

### 6.3 Slice prop kinds (~40)

`cerealBox, coffeeMug, pictureFrame, wallClock, keyring, keyHook, toothpasteTube,
soapBar, towel, curtains, doormat, houseNumber, lampShade, tableLamp, remoteControl,
bookRow, throwPillow, blanket, potPlant, gardenGnome, steppingStone, flowerPatch,
mailbox, dogBowl, catToy, alarmClock, slippers, hairbrush, spiceJar, saltShaker,
fridgeMagnet, cuttingBoard, dishSoap, teaBox, medicineBottle, keyboard, mousePad,
posterPrint, cableSet, deskFigurine`

Each needs: `alienName`, `plaus`, `price`, 3–6 axes, and a `build()`. Budget ~25 lines
each. **Build 8 first** (cereal, mug, frame, clock, keyring, curtains, gnome, keyboard)
and prove the loop before authoring the rest.

### 6.4 Slice win/lose

- **Win:** Collapse Index ≥ 40 by end of night 7, with Neighborhood Suspicion < 60,
  Wife Suspicion < 100, Agency Attention < 100.
- Full-game targets are in §10.

---

## 7. UI / UX

**Diegetic split:** everything alien is a cold cyan/white vector overlay in a
monospaced face; everything human is the warm suburban palette. The player should be
able to tell at a glance which of the two games they're in.

Screens:

1. **HUD (night)** — clock, noise ring around the reticle, carry slots, ability cooldowns.
2. **Focus panel (night)** — on interacting with a prop: SCAN / MOVE / ROTATE / SWAP /
   TAKE, with a live Δ preview when a bought variant is in inventory.
3. **Catalog** — grid by house/room, thumbnails, spec readouts, prediction (HK-gated).
4. **Dossier** — one page per resident: portrait, known traits (revealed by observation),
   Doubt/Suspicion/Stress bars, seed (HK-gated), fracture history, marked objects.
5. **HUD (day)** — block, remaining actions, money, Wife Suspicion (shown as *her mood*,
   not a bar — the only meter deliberately kept fuzzy).
6. **Store** — aisle → shelf → variant compare card.
7. **Night summary / morning report** — the alien's field log for the previous 24 h.
   This is the game's main comedy delivery vehicle and the main feedback channel.

**Style tokens** (inherited from the Chameleon project for consistency and because they
already work): Quicksand + 'Baloo 2'; panels `--panel:#171522`, `--line:#332f47`;
accents lime `#a8d93a`, violet `#8a7ff0`, coral `#ff5a5a`, paper `#f2ead9`. Alien
overlay accent: cyan `#5ce1e6`.

---

## 8. Art & audio direction

**Art.** Flat-shaded low-poly with strong silhouettes and a saturated, slightly-too-clean
suburban palette by day; heavily desaturated with a single cool moonlight key by night.
The visual joke is that everything looks *catalogue-perfect* — the environment should
read like a furniture ad, which makes a 2° rotation legible.

**Implemented 2026-08-06 (the night rig).** Two switchable lighting modes — `greybox`
(flat, neutral, for physics work) and `night` (the game):
- Cool hemisphere + a low moon key, **real shadow maps** (PCF soft, 1024²).
- **⚠ The ceiling and roof must NOT cast shadow.** Physically the moon is blocked and
  the interior becomes a black box; letting it leak keeps the house readable while the
  *walls* still cast the shadow bars that sell it.
- **Exposure is the night control, not light intensity.** sRGB output gamma lifts
  midtones hard, so turning lights down just produces flat grey-blue. ACES filmic tone
  mapping at exposure 0.52 crushes ambient toward black while the practicals keep their
  highlights — which is the right read, because *light is where you can be seen*.
- Warm streetlight + cool moonlight pools through each window. These are **both** a
  THREE light (presentation) and a gameplay light **zone** (`litAt`), kept as separate
  lists on purpose: the seeing check must never depend on renderer state.
- CSS vignette + cold grade over the canvas (`#grade`, `body.night`) — cheaper than a
  post pass and it survives the headless screenshot path.
- Canvas-texture surfaces (floorboards, kitchen tile, wall paint, grass, concrete),
  skirting boards, picket fence, windows with frames, roof + ridge + chimney.

Two asset routes, in priority order:

1. **Parametric primitives + canvas textures (primary).** All small objects. Covered in §5.1.
2. **Generated GLB hero props** for a small number of large, silhouette-defining objects
   (car, couch, fridge, bed, wardrobe, tree) via the existing pipeline: concept image →
   Meshy `image_to_3d` → `tools/shrinkglb.ps1`. Style prompt locked to *matte flat-shaded
   cartoon, single centred object, light-grey backdrop*. Hero props do **not** need
   variants, which is exactly why they're the ones worth modelling.

**Audio.** WebAudio-synthesised throughout (no files), reusing the Chameleon SFX approach.
Night bed: crickets, distant dog, AC compressor cycling, a fridge hum that is *slightly
different* in each house. Interaction SFX are the tension: cloth, drawer, floorboard,
and one horrible ceramic clink. Music: near-absent at night (a single sustained low tone
that rises with room noise); a bright, wrong, 1960s-advert cue for day transitions.

**Implemented 2026-08-10 (M9).** All of the above, synthesised from oscillators, filters
and one shared noise buffer — the page still makes **zero external requests**.

- **The coupling rule.** `emitNoise(x,z,mag,snd,mtl)` plays `snd` at `(x,z)` scaled by
  the same `mag` it adds to the sleepers' meters. Sound and consequence are *one call*,
  so they cannot drift into the worst bug a stealth game can have: something that is
  loud to them and silent to you. There is no second list of "also play a sound here".
- **The tension tone is `loudestHeat()` made audible**, not music. 0 = everyone deep
  asleep, `AUD_DRONE_MAX` at exactly someone's wake threshold, and past that a tremolo
  opens up — which makes the stir grace period *hearable*. This is the one thing the HUD
  percentage could never tell you in peripheral vision, which is exactly when you need
  it, because you are looking at a sleeping man and not at the HUD.
- **Materials are data.** Every `PROP_KINDS` entry carries `mtl` (ceramic / glass /
  metal / cloth / paper / soil / card / plastic), so handling the mug is the horrible
  clink and handling the curtains is not. Eight distinct materials across 12 kinds.
- **Every fridge on the street hums at a different pitch, and the whole street fits
  inside one semitone** (62 cents end to end). Deterministic per house, so it is a fact
  you can learn rather than noise. It is the premise of the game in one sound.
- **Loudness is measured from the player, the stereo image from the camera**, and walls
  both attenuate and dull using the *same* `wallsBetween` count the noise model uses.
- **Audio is a read-only observer of the simulation.** m9 replays a scripted 60-step
  night with the graph dead and again with it live and asserts the sleeper traces are
  bit-identical.
- Mixer (mute + Music/World/Foley) on both the title and pause screens, persisted under
  its **own** localStorage key so a new game cannot reset your volume.

---

## 9. Technical architecture

**Stack:** Three.js **r128** vendored locally, single self-contained HTML file, fully
offline, **served over http** (`file://` blocks module/texture loads — ship the same
friendly banner `chameleon3d.html` uses).

**Directly reusable from `chameleon3d.html`** (read it before starting; do not
re-derive):

| Reuse | Where it comes from |
|---|---|
| OTS third-person camera rig + steering contract | `chameleon3d` camera section |
| AABB colliders with `top` (below = wall, above = standable) | physics section |
| Room shell builder (walls/floor/ceiling + textured planes) | `buildShell` |
| Canvas-texture material generation, per-material samplers | `prepSampler` |
| WebAudio SFX synthesis + Esc menu with sound sliders | audio section |
| `window.onerror` crash banner (keeps first error) | keep verbatim |
| Serve-over-http workflow + `serve.ps1` | project root |
| Wall-crawl / gecko traversal | **Phase 3 only** — keep collider format compatible |

**Module layout inside the single file** (comment-banner sections, in load order):

```
  CONST          all tuning values (§11) — one place
  RNG            mulberry32, seeded; every generator takes a seed
  SPEC           axisDist, rawDelta, similarity, variant generation
  PROP_KINDS     the registry + build() functions
  WORLD          house floorplans, placement lists, colliders, shell builder
  RESIDENTS      resident table, schedules, fractures
  DOUBT          perceivedDelta, resolveChange, band logic  ← build & test first
  NIGHT          movement, noise, light, sleepers, interaction, focus camera
  DAY            blocks, actions, dialogue scenes, HK, reactions
  SHOP           store stock generation, compare UI
  CATALOG        scan storage, thumbnails, dossier
  WIFE           suspicion ladder
  META           save/load, win/lose, morning report
  UI             DOM panels, HUD
  BOOT           loader, error banner, title screen
```

**House data format** (authored, not procedural — see §14).
⚠ **Not yet implemented.** 12 Ardsley Ct is authored imperatively in `buildHoyt()`
using the `wallSeg`/`box`/`placeObject` helpers. Extracting a format from a sample of
one would be guesswork; it gets extracted at M8 when houses 2–4 arrive and the
repeated structure is actually visible. The sketch below is the intent:

```js
{ id:'hoyt', origin:[x,z], rot:0,
  rooms:[ {id:'kitchen', x,z,w,d, floor:'lino', wall:'cream'} … ],
  walls:[ {x1,z1,x2,z2, door:0.4} … ],
  entries:[ {type:'sparekey', at:[x,z], hint:'under the third planter'} … ],
  props:[ {kind, spec, pos, rotY, surface, owner, attach} … ],
  sleepers:[ {resident:'walt', bed:[x,y,z]} … ] }
```

**Save:** whole-world JSON in `localStorage` (`sd_save_v1`), written at each night→day
transition. Include a schema version integer from day one.

**Performance budget:** ≤ 400 draw calls, ≤ 250k triangles per scene. Props are
instanced where identical. Only the current house's interior is built at full detail;
others use exterior shells until entered.

---

## 10. Win & lose (full game)

**Collapse Index** = Σ(resident.doubt × weight) / Σ(weight), where weight rises with the
resident's social credibility (collapsing the *believed* people matters more).

**Win:** Collapse Index ≥ `WIN_COLLAPSE` (70) with at least `WIN_MIN_FRACTURED` (4)
residents past Doubt 75, while Agency Attention < 100 and Wife Suspicion < 100. Ending:
the neighborhood is formally classified as an unexplained psychological event; your
species logs the experiment as a success; you are recalled — and the last scene is Steve
waking up in his own body with no idea where the last four months went.

**Lose (each is a distinct ending, not a fail screen):**
- Wife Suspicion 100 — exposure, or divorce, or a PI's photographs.
- Agency Attention 100 — extraction; the experiment is aborted as contaminated.
- Neighborhood Suspicion 100 — the watch catches you; a human explanation is found,
  which is the *worst* outcome for your species: nobody doubts anything ever again.
- Seen three times in houses — as above, accelerated.

---

## 11. Constants (single source of truth)

```js
// ── Doubt Curve ────────────────────────────────────────────────
SEED_BONUS          = 0.80    // Δ multiplier when a change hits a resident's seed
K_DOUBT             = 0.42    // Doubt per point of Δ in the doubt band
K_STRESS            = 0.30
K_SUSPICION         = 0.90    // Suspicion per point of Δ above the ceiling
K_ALERT             = 0.50    // alertness = 1 + this * (Stress/100)
CERTAIN_DOUBT_FRAC  = 0.25    // fraction of Doubt still paid on a CERTAINTY result
MARK_PLAUS_PENALTY  = 0.55    // plausibility multiplier once an object is marked
FRESH_DECAY         = 0.10    // freshness lost per MISSED change on the same object
FRESH_MIN           = 0.60
PROP_POS_SCALE      = 0.25    // metres of positional change = full positional delta
PROP_ROT_SCALE      = 45      // degrees of rotation      = full rotational delta
PLACE_SAL_POS       = 0.75    // salience of "it moved"   (appended to every kind)
PLACE_SAL_ROT       = 0.45    // salience of "it turned"
SHOP_RAW_MAX        = 0.35    // most-different variant a shop stocks of the same kind
                              // (65% similar). Was 0.16 — too narrow to reach half
                              // the cast at all. See §15.
// ── Night ──────────────────────────────────────────────────────
NIGHT_START         = 23.0    // game hours
NIGHT_CURFEW        =  5.5
NIGHT_SCALE         = 30      // game seconds per real second (~13 min night)
NOISE_DECAY         = 3.5     // noise units per second
NOISE_WALL          = 0.35    // attenuation through one wall
WAKE_BASE           = 45      // noise units to wake a sleeper at sleepQuality 1.0
CARRY_SLOTS         = 4
SEEN_LIMIT          = 3
ABILITY_FREEZE_T    = 4.0     // seconds
// ── Audio (M9, §8) ─────────────────────────────────────────────
// Its own block, and nothing in it is read outside SFX: audio is a read-only
// observer of the simulation. m9 asserts a scripted night runs bit-identically
// with the audio graph live, so this stays true.
AUD_RANGE           = 20.0    // metres to silence for a one-shot. DELIBERATELY wider
                              // than NOISE_RANGE (11): you hear yourself from further
                              // away than a sleeper can, so sound is a warning, not a tell
AUD_PAN             = 0.85    // max stereo displacement (1.0 is a headphone gimmick)
AUD_WALL_HZ         = 5200    // lowpass corner through ONE wall; halves per extra wall
AUD_FOLEY_REF       = 0.55    // reference peak for a one-shot at zero distance
AUD_DRONE_HZ        = 48      // the tension tone's fundamental
AUD_DRONE_MAX       = 0.30    // its gain at heat 1.0 — a sleeper exactly at threshold
AUD_AMB_GAIN        = 0.34    // the outdoor bed (crickets, AC, dog)
AUD_HUM_GAIN        = 0.11    // per-house fridge hum
AUD_HUM_HZ          = 108     // ...its base pitch
AUD_HUM_SPREAD      = 0.018   // ± per house. Was 0.055 — see §15
// ── Movement (inherited from chameleon3d, re-tuned for a human body) ──
CH_H                = 1.78    // character height — every camera number derives from it
WALK_SPEED          = 2.6
SNEAK_SPEED         = 1.2
RUN_SPEED           = 4.8
GRAV                = 18      // was 16 — see the 2026-08-06 entry in §15
JUMP_V              = 4.6     // was 6.0. apex = 4.6^2/(2*18) = 0.588 m
PLAYER_R            = 0.32
STEP_UP             = 0.30    // free step-up; also sets the mount ceiling:
                              //   reach = apex + STEP_UP = 0.888 m
ACC_ON              = 15      // velocity smoothing while a key is held
ACC_OFF             = 11      // ...and while releasing
VEL_DEAD            = 0.02
// ── Camera (OTS) ───────────────────────────────────────────────
CAM_DIST            = 3.6     // min 1.6, max 7.0
CAM_PITCH0          = 0.22    // clamp -0.25 .. 1.15
CAM_SHOULDER        = 0.42    // applied to BOTH position and look-at
CAM_LOOK_F          = 0.62    // look-at height = CH_H * this (chest)
CAM_LERP_P          = 9       // position follow (dt*n)
CAM_LERP_L          = 14      // look-at follow — faster, so framing snaps
CAM_CEIL_PAD        = 0.18    // keep the camera below a 2.6m ceiling
CAM_OCC_MIN_TOP     = 0.50    // shorter colliders never push the camera
DRAG_YAW / DRAG_PITCH = 0.005 / 0.004   // rad per CSS pixel
BODY_ALIGN          = 12      // shortest-arc turn toward camera-forward
// ── World ──────────────────────────────────────────────────────
WALL_H              = 2.60    // interior ceiling height
WALL_T              = 0.12
DT_MAX              = 0.10    // the ONLY bound on a fall step
// ── Day ────────────────────────────────────────────────────────
ACTIONS_PER_BLOCK   = 2
WAGE                = 780     // per week, Friday
BILLS               = 445     // per week, automatic
IDENTICAL_MULT      = 3.0     // price multiplier for a 100%-similar special order
CASH_FEE            = 3
HK_MAX              = 100
// ── Meters / endings ───────────────────────────────────────────
STRESS_DECAY        = 4.0     // per day
WIN_COLLAPSE        = 70
WIN_MIN_FRACTURED   = 4
SLICE_WIN_COLLAPSE  = 40
SLICE_NIGHTS        = 7
```

---

## 12. Roadmap

### Phase 1 — Vertical slice *(current target)*

Eight milestones, each independently verifiable. **Do not start a milestone before the
previous one runs in a browser.**

1. ~~**Boot & shell.**~~ **DONE 2026-08-06.** Single HTML, vendored r128, crash banner,
   http-only notice, title screen, greybox rooms, OTS camera, walk/sneak/run, colliders.
   *Verified: 47/47 headless assertions (`tools\smoketest.ps1`), plus a rendered
   screenshot.* Three things were promoted out of "later" because a house cannot be
   expressed without them:
   - **Walls are first-class colliders**, not the Chameleon's four room clamps —
     doorways are gaps between wall segments.
   - **`groundHeightAt` returns the highest top at or below the feet**, not the global
     max, so you don't stand on a table you're walking under. Also the prerequisite
     for storeys/stairs.
   - **Camera ceiling clamp** — 2.6 m interiors, not 5.5 m warehouses.
2. ~~**DOUBT module, headless-testable.**~~ **DONE 2026-08-06.** `axisDist` →
   `specDelta` → `perceived` → `resolve`/`commit`, plus `PROP_KINDS` (data half) and
   the `RESIDENTS` table. `__SD.doubt()` prints two band maps and a 200-sample
   histogram. *Verified: 75 assertions, every expected value hand-computed from the
   constants.* `resolve()` is pure — it mutates nothing, so the whole curve is
   testable with no scene and no GL.
   ⚠ **Both of this milestone's predicted outcomes were wrong, and the maths is
   right.** See §15 — "Marisol doubts more often than Walt" and "the conspiracy stub
   never doubts" were pre-maths guesses; the real properties are sharper.
3. ~~**Props.**~~ **DONE 2026-08-06.** `build()` for all 8 kinds (primitives + canvas
   textures), `variantNear` targeted-similarity generation, offscreen thumbnails, and
   the montage. *Verified: 33 assertions + the montage artefact at
   [docs/m3-props.png](docs/m3-props.png) — every kind × original/97%/92%/80%,
   each labelled with its computed similarity and the axis that moved most.*
   All 8 kinds total 1872 triangles; worst single prop 724.
   **The parametric bet is confirmed**: on appearance axes, computed similarity
   predicts visible difference cleanly (hue ladder: raw 0.007→0.206 gives mean
   channel diff 4.0→16.6→49.1→124.6). Two calibration traps found and fixed — see
   the salience note in §5.1 and the log in §15.
4. ~~**One house + scan + swap.**~~ **DONE 2026-08-06.** 12 Ardsley Ct: yard, fence,
   path, three planters (one hides the spare key), locked front door, three rooms,
   fixtures, and six owned objects. Interaction targeting, the focus inspection view,
   scan → requisition → swap/nudge/turn → **the morning report**.
   *Verified: 52 assertions + [docs/m4-report.png](docs/m4-report.png).* The loop
   lands: a 79.7% keyring swap on Walt's dish gives Δ 49.6 in his 16–60 window →
   DOUBT, Doubt 0 → 20.8. A 97.4% cereal swap on June → MISSED. Moving his mug 21 cm
   → DOUBT.
   **The night ledger is the key structure**: a change alters the world immediately
   but is *perceived* at morning, and repeated edits to one object collapse into a
   single before/after comparison — the resident sees the end state, not each step.
5. ~~**Night pressure.**~~ **DONE 2026-08-06.** The night clock (23:00→05:30, ~13 real
   minutes) with a hard curfew; noise accumulating per sleeper, attenuated by distance
   and by walls; Walt and June asleep in a real bedroom with a stir→wake escalation;
   light zones and line of sight; being seen. Plus a full **look pass** — see §8.
   *Verified: 45 assertions.* You can cross the bedroom sneaking without waking Walt
   and cannot cross it running. Stirring is a genuine grace period: go still and he
   settles in ~3 s; carry on and he is up in 0.4 s. Being seen costs **+34 Suspicion
   and zero Doubt** — a night's work converted into the wrong currency.
6. ~~**Day loop.**~~ **DONE 2026-08-06.** Five blocks with a 2-action budget, family
   obligations vs Wife Suspicion, wages/bills/cash, Bulwark Mart with live similarity
   and HK-gated forecasts, dialogue scenes in three registers, Human Knowledge, and
   public reaction beats. *Verified: 54 assertions +
   [docs/m6-shop.png](docs/m6-shop.png).*
   **The headline property is stronger than this milestone originally asked for: THE
   SHELF DOES NOT LIE.** Every rung's forecast was bought, planted and checked against
   the next morning — 7/7 matched. A scanner that mispredicts would make every
   purchase a coin flip, so this is the assertion to keep.
   Her suspicion is a real modifier: at 95 the usable night drops 6.50 h → 2.93 h.
7. ~~**Wife ladder + reactions + fractures.**~~ **DONE 2026-08-06.** Her ladder now
   *acts* during the night; fractures fire at Doubt 25/50/75/100 and change the world;
   marking is visible, collapses the window, and is defeatable.
   *Verified: 37 assertions + [docs/m7-fracture.png](docs/m7-fracture.png).*
   At tier 2 she wakes and checks the bed (+9 if you're not in it); at tier 4 she
   follows you out and you have **66 real seconds** to be back on your own path.
   Both outcomes tested — escaped, and caught.
   **The arms race closes end to end:** a 79.3% swap on Walt's keys reads DOUBT →
   he fractures at 25 and starts marking his things → the *same* swap now reads
   CERTAINTY → the identical special order takes the mark with it, creates no doubt,
   and the window reopens tomorrow.
8. ~~**Slice content pass.**~~ **DONE 2026-08-06 (with two scoped-down items, below).**
   Four lots on Ardsley Court, the whole six-person cast asleep in three furnished
   houses, per-house keys, fractures for everyone, the Collapse Index and five
   endings, save/load. *Verified: 46 assertions +
   [docs/m8-ending.png](docs/m8-ending.png) — including **a complete seven-night run
   played twice through the real systems, won and lost**. Doing nothing → `timeout`.
   Working every object every night → `win` at Collapse 51.2 on day 4, with 9
   fractures fired along the way.*

   **Scoped down, deliberately:**
   - **12 prop kinds, not ~40.** Enough to furnish three houses distinctly
     (`potPlant`, `alarmClock`, `bookRow`, `tableLamp` added). 40 is a content-grind
     number and the GDD itself says prove the loop first; the registry takes new
     kinds without touching systems.
   - ~~**No audio.**~~ **Closed by M9, below.**

9. ~~**Audio.**~~ **DONE 2026-08-10.** The gap M8 called "the largest remaining one in
   the slice". WebAudio synthesised end to end — no files, no fetches, the page still
   makes zero external requests. Full detail in §8; the headline is that it is a
   *gameplay* system, not a coat of paint:
   - **`emitNoise` gained a voice**, so the sound a thing makes and the noise it adds
     to a sleeper's meter are emitted by the same call and cannot drift apart.
   - **The tension tone is `loudestHeat()`**, so the stir grace period is audible and
     you can hear yourself getting away with it.
   - Materials (`mtl`) are prop data — the mug clinks, the curtains do not.
   - Every house's fridge hums a different note, all inside one semitone.
   - Mixer on the title and pause screens, persisted separately from the save.

   *Verified: 76 assertions + [docs/m9-sound.png](docs/m9-sound.png).* The two that
   matter most: **every action that makes noise names a sound** (driven through the
   real `useDoor`/`searchPlanter`/`scanObject`/`nudgeObject`/movement code, not by
   inspecting source), and **a scripted 60-step night runs bit-identically with the
   audio graph dead and live** — audio may listen to the simulation, never write to it.

   **Still open:** no footstep variation by floor surface (carpet vs boards vs grass);
   the day is scored only by transition stings, so the five blocks all sound alike.

10. ~~**The stores.**~~ **DONE 2026-08-10.** Closes the oldest open defect in this
    document — *"Grace is unreachable by shop stock"*, flagged in M2 and still true at
    M9. Measured before: **0 of her 4 objects had a single DOUBT rung in any week**, so
    a sixth of the cast was decoration. Three stores stocking three non-overlapping
    ranges (§5.7) plus one resident retune (§15).
    *Verified: 39 assertions + [docs/m10-thrift.png](docs/m10-thrift.png).*

    The headline is coverage, measured over 12 weeks × 18 objects through the real
    shelves and the real `DOUBT.resolve`: **every resident who owns something is
    playable, and every object on the street can be made to create doubt.** Grace is
    4/4, and the thrift store is the *only* way into two of her objects. Each shop is
    the sole option somewhere, so none of the three is a decorative menu entry.

    Two bugs fell out of building it, both caught by numbers rather than by eye:
    the shelf could show **two rungs at the same similarity** at different prices, and
    the shop screen's `<h1>` was the hard-coded string "BULWARK MART" — silently wrong
    at the other two shops.

11. ~~**Onboarding.**~~ **DONE 2026-08-10.** Eleven milestones in, nobody had played
    this end to end, and everything a new player needed — that a spare key is under a
    planter, that you cannot order a copy of something you have not scanned, that
    DOUBT is the thing you are trying to cause and CERTAINTY is how you lose — existed
    only in a README on GitHub. This moves that knowledge into the game.
    *Verified: 48 assertions + [docs/m11-intro.png](docs/m11-intro.png),
    [docs/m11-guide.png](docs/m11-guide.png).*

    - **A premise card** before the first night, stating all three bands by name and
      which one wins. It is the only place the game has ever explained itself.
    - **A nine-step objective rail** covering the whole loop — cross the street, find
      the key, get in, scan, go home, shop, come back, swap, get out before dawn.
      Each step is a `done()` predicate read off **real game state**, never a script
      that fires on keypresses, so playing out of order collapses the chain forward
      instead of stalling it. (Tested: a player who gets in without touching a planter
      skips four steps in one tick.)
    - **Band glosses** in the morning report — the first time each band happens to
      you, once per run, it says what that band *means*. A similarity percentage and a
      delta are meaningless until somebody tells you which direction is winning.
    - A **controls panel** in the pause menu documenting focus mode, which the title
      screen never has.
    - The whole thing is skippable from the title (GUIDE: ON/OFF) and the preference
      lives in localStorage, not the save.

    **The assertion that matters most is the one that nearly wasn't there.** Every
    other test in the suite drives the chain by calling `GUIDE.tick()` directly — and
    all of them would still pass if `updateHUD` had never been wired to the guide,
    i.e. if the rail were permanently frozen in the actual game. m11 therefore opens
    by moving the player and then *leaving the game alone* under a live
    `requestAnimationFrame` loop. It caught nothing, but only because the wiring
    happened to be right.

12. ~~**Content: 30 prop kinds, and a ten-night run.**~~ **DONE 2026-08-11.**
    12 kinds → **30**, and the street went 18 objects → **30** (ten per neighbour
    house). The run went 7 nights → **10** at Kyle's direction.
    *Verified: 27 assertions + [docs/m12-props.png](docs/m12-props.png).*

    New kinds: `spiceJar saltShaker cuttingBoard dishSoap teaBox fridgeMagnet
    remoteControl throwPillow posterPrint lampShade coasterSet vase slippers blanket
    hairbrush doormat houseNumber mailbox`. **No systems code moved.** A kind is a
    parameter vector plus a `build()`, and the registry was designed to take new ones
    without touching the Doubt Curve, the shops, the audio materials or the placement
    code — that claim had never actually been tested at scale, and it held.

    **The assertion that earns this milestone is "every declared axis actually changes
    the object".** An axis a builder ignores is a change the player *pays money for and
    cannot perceive* — in a game about noticing, the worst bug available, and one that
    is completely invisible to a build-succeeds test. 138 axes across 30 kinds are
    checked by building each kind twice and comparing a signature of world matrices,
    absolute vertex positions and texture identity. All three parts are load-bearing;
    see §15 for the two false-negative classes that got past weaker versions.

    **The win threshold was re-measured, not assumed.** Both changes here make doubt
    easier to accumulate, so leaving `SLICE_WIN_COLLAPSE` at 40 would have quietly
    turned a target into a formality — or, as it turned out, the reverse. See §15.

13. ~~**Playtest fixes: room to move, and mouse look.**~~ **DONE 2026-08-11.**
    Kyle's first two notes from actually playing it.
    *Verified: 32 assertions + [docs/m13-bedroom.png](docs/m13-bedroom.png).*

    - **`CONST.ROOM_SCALE` (1.55)** multiplies the DISTANCES in the authored floorplan
      and nothing else — furniture sizes and every Y height stay real-world, so a sofa
      is still 2.1m wide and a counter still 0.92m high. Authored coordinates stay in
      the original layout units and `_p()` converts them, which is why 30 hand-written
      object placements needed no editing at all.
    - **Mouse look is pointer-locked.** Click the canvas, the cursor is captured, the
      mouse turns the camera with no button held. `go()` — the single funnel for every
      screen — releases the lock, because a menu you cannot point at is worse than no
      menu. The click-drag path survives only as a fallback for a browser that refuses
      the lock. The M1 OTS contract is untouched and still tested: looking while idle
      does not turn the body.

    **What this uncovered is more serious than the request.** Measured before the fix:
    14.0 m² of walkable floor in a 63 m² interior, median clearance 0.24m — and **the
    lounge and bedroom were unreachable on foot.** The sofa's inflated collider
    overlapped the lounge doorway and left a **one-centimetre** gap. The bedroom holds
    the sleepers and June's photo; the game was not completable by walking. Twelve
    milestones of green suites never saw it because **every test that "goes" to the
    bedroom teleports the player there.** After: 79 m² walkable, median clearance
    0.40m, all four rooms reachable — now asserted by a flood fill through the real
    colliders, so furniture can never quietly seal a room again.

14. ~~**The street hardens.**~~ **DONE 2026-08-12.** Before this, night 8 played exactly
    like night 1 — the neighbours' *minds* changed but the world never did, which is a
    real hole in a ten-night game. Five tiers now install themselves and stay installed.
    *Verified: 35 assertions + [docs/m14-street.png](docs/m14-street.png).*

    | at | tier | what it actually does |
    |---|---|---|
    | 12 | motion lights | a real light **zone** over every neighbour porch, dark until you step onto the path — so the seeing checks pick it up with no new plumbing |
    | 22 | dogs left out | entering a yard sets one off: a flat noise to that household (see §15) plus a positional bark, on a 14s cooldown |
    | 32 | neighbourhood watch | a man walking the street who ends your night if he picks you out — **outdoors only**, which makes the yards the dangerous part of a hardened street rather than the rooms |
    | 42 | doorbell cameras | standing at a front door costs that household Suspicion, once per night, **whether or not anyone is awake** |
    | 55 | sleeping in shifts | one of each couple starts the night already sitting up |

    Everything reuses machinery that existed — light zones, `emitNoise`, `canSee`, the
    sleeper state machine — rather than inventing a parallel system. The escalation is
    keyed to **Alertness**, not to Suspicion as §5.8 proposed; see §15 for the
    measurement that forced that, and for why a dog bypasses the noise model.

    At most one tier per morning: a street that installs three things overnight reads
    as a bug rather than as escalation.

15. ~~**A run you can read, and a difficulty you can turn.**~~ **DONE 2026-08-13.**
    Chosen because M14 shipped a difficulty system I could not validate — the balance
    sweep drives the systems directly and never walks the world, so it is never
    actually caught by the watchman or lit up on a porch — and because "am I winning?"
    was unanswerable until the ending screen said so.
    *Verified: 29 assertions + [docs/m15-day.png](docs/m15-day.png).*

    - **Difficulty presets** on the title: GENTLE / STANDARD / HARSH, scaling the win
      bar and the hardening ladder together (×0.80/×1.70, ×1.00/×1.00, ×1.20/×0.65).
      **STANDARD is byte-for-byte the shipped numbers**, so every measurement in §15
      still describes the default game. They are **multipliers over `CONST`, and
      nothing mutates `CONST`** — rewriting it would silently invalidate every
      assertion that reads it, which is a tested property.
    - **A state-of-the-street readout** on the day screen: Collapse against the bar
      you are actually playing for, nights remaining, both *losing* meters
      (sightings, street Suspicion), and a line naming what the street has installed.
      Every number already existed; none had ever been shown mid-run.
    - **A mouse sensitivity slider**, in the panel formerly called SOUND and now
      OPTIONS. Doubling it doubles the turn, which is asserted.

    **The point is recoverability.** An unvalidated curve is now a menu change rather
    than a code change, so a playtester who finds night 7 brutal can finish the run
    instead of filing a bug and stopping.

### Phase 2 begins

16. ~~**Ray Pittman, and gossip.**~~ **DONE 2026-08-13.** The first Phase 2 milestone.
    *Verified: 36 assertions + [docs/m16-gossip.png](docs/m16-gossip.png).*

    **Ray gets a house.** 8 Ardsley Ct (10 when this was written; renumbered in M33), the fifth lot, at the dead end next door to
    yours — ten possessions, his own fracture ladder, asleep alone. He has been a row
    in `RESIDENTS` since M2 with nowhere to live, and he is the design's own argument
    that *a personality is a tuple, never a special case* (§4.5): nothing in the Doubt
    Curve knows he is the conspiracy theorist. Measured consequences:
    - His doubt band is **3 points** and his floor **2** — the narrowest window and the
      lowest threshold on the street. **9.7% of shop rungs are usable on him**, against
      23.0% for Walt and 19.5% for June.
    - **Five of his ten possessions cannot be touched from the supermarket at all.**
      Ardsley Antiques is finally load-bearing: the shop nobody had a reason to drive
      to is the only way into half of Ray's house.
    - He fractures **inward**. Everyone else starts doubting themselves; Ray was already
      certain the world was being interfered with, so being *right* is what breaks him.
      At 75 he stops telling people and his credibility drops to 0.04.

    **Gossip.** A CERTAINTY event travels one hop along `RELATIONS` and lands as
    Suspicion **scaled by the speaker's credibility**. That one multiplier is the whole
    design: the same mistake spread **29.7** through Marisol (0.9) and **2.2** through
    Ray (0.1). Being caught in *his* house is the cheap mistake, and routing your loud
    work through the man nobody believes is a real strategy rather than a joke — which
    is exactly what §5.8 promised and what his credibility number was always for.
    One hop only; a cascade would turn a single loud night into a street-wide loss.

17. ~~**The inhabited street.**~~ **DONE 2026-08-17.** Answering one playtest note:
    *"the world is still mostly empty feeling — there is still nothing interactable,
    should be observable and replaceable items, per the game design."*
    *Verified: 44 assertions + [docs/m17-court.png](docs/m17-court.png).*

    **Measured first.** 694 meshes and 17,438 triangles for the entire world; the
    outdoors was ONE mesh (a road plane) stamped over five identical lots; a 145 m²
    house held 21 furniture boxes and 10 swappable things; and 7 finished prop kinds
    had never been placed anywhere.

    **Four things were broken, not merely thin.**
    - **The road ran through the front gardens.** `road.position.z=-10.4` was in raw
      metres while the yards were in layout units scaled by `ROOM_SCALE` — 3 m of
      lawn, a 4 m concrete band, more lawn, then the fence. The object format now
      says which unit it is in: `at:` is layout, `m:` is metres.
    - **The garden gate was a picture.** The pickets have skipped the path since M8,
      but the rail beneath was one collider across the whole frontage. You could only
      enter a front garden by *jumping* it (apex 0.588 + step-up 0.30 clears 0.62),
      which is why nobody noticed.
    - **M13 detached every piece of furniture from its wall** — positions scaled,
      depths did not: 0.26 m for the sideboard, 0.37 for the counter, 1.16 for the
      shoebench. Fixtures are now placed *from a wall face* and cannot drift again.
    - **The sleeper sat up into the mattress.** The torso is driven to negative
      `rotation.x`, and with the head at −z, `y' = y·cosθ − z·sinθ` is negative. Head
      at +z makes the same angles raise it — and puts it against the new headboard,
      so *"on the nightstand beside her head"* is true for the first time.

    **Then the content.** 40 → **80 possessions**, every one observable and
    replaceable; all 30 prop kinds now in the world. A fixture pass (fridge, oven,
    hob, sink, extractor, cabinets, TV, bookshelf, dresser, headboard, radiators,
    mirrors) gives them surfaces to sit on and closes three fiction-vs-geometry
    holes: the fridge the audio has hummed at since M9, the TV three remotes have
    commanded since M12, the shelf the bookRows floated 0.40 m clear of.

    **A cul-de-sac, not a corridor.** Ground everywhere, a road between real kerbs,
    pavements, a turning circle west of Ray (the fiction has called him "at the dead
    end" since M16), eight non-enterable facades, poles and wires, trees, bins,
    driveways, back gardens, and a horizon for three draw calls.

    **`def.wall` is finally read.** Authored on every lot since M8 and consumed by
    nothing — five houses identical to the pixel. Five numbers each now, plus a
    `keeper` whose `noticeFloor` dresses the place: Walt's hall is squared off, and
    Grace's still has the post on the mat. **Readable, not decorative.**

    **A scenery class** so nothing is dead to look at — offered only when no
    possession is in reach, because the player's learned rule is "hand-sized thing on
    a surface = swappable", and a fixture stealing **E** from the mug beside it would
    be the worst bug in the milestone. Asserted over all 80 objects.

    **Motion.** A seeded car whose headlights are a real light zone (`litAt` reads
    them, so it is a difficulty change and tuned as one), and a dawn ramp — 05:29
    used to look exactly like 23:00.

    **Paid for up front.** Draw calls are 1:1 with meshes on r128 here, and `box()`
    minted a new geometry and material per call: 694 meshes carried 614 materials and
    694 geometries. One shared unit box and a material cache went in *before* the
    content: **1,965 meshes now on 703 geometries and 691 materials.** Walkable floor
    went *up*, 77.3 → 84.1 m².

18. ~~**The fence, and a night with things in it.**~~ **DONE 2026-08-19.** Playtest
    note: *"it's still a pretty bare and unplayable game."* The second word was
    literal. *Verified: 48 assertions.*

    **THE GAME COULD NOT BE WON.** Measured with the till open for the first time:
    $140 to start and one $335 payday inside a ten-night slice, against a median
    doubt rung of $29, buys **15 swaps** and reaches collapse **32.0** against a bar
    of **40** — and you stand in a shop unable to afford anything **729 times**.
    Every balance measurement in this project's history opens with
    `bank=1000000` (`_balance.js:20`, `_escalate.js:21`), so *"four a night wins
    on night five"* was only ever true for a player with infinite money. **A
    diagnostic that cheats cannot answer the question it was built for.**

    **The fix was already in the fiction.** `swapWith` printed *"the mark goes in
    your pocket with the old one"* while the original ceased to exist. Now you keep
    it, and you can sell it. Only the two specialists buy — a supermarket does not
    buy your mug — and which one is the decision:

    | | pays | where | costs you |
    |---|---|---|---|
    | Second Chances | 25% | two towns over | the drive; Dana notices |
    | Ardsley Antiques | 55% | **on this street** | it goes in the window |

    Anything with attachment ≥ 1.2 is recognisable, and the antique shop's window is
    on the road its owner lives on: they walk past, and it costs them +14 Suspicion,
    reported in the morning with the figure that **landed** rather than the one
    charged. So the best money and the real risk are the same item, the rule is
    deterministic, and you can work it out before you hand it over.

    **Measured after:** a competent run reaches **43.9** and ends the slice with
    **$8** in its pocket — funded, not rich, still short 49 times. `_economy.js`
    and m18 §6 are now permanent gates.

    **And the night has things in it.** It used to be thirteen minutes in which
    nothing happened that the player did not cause. Two to four seeded events a
    night, never the same one twice running, each a world change routed through a
    system that already existed: a phone ringing in somebody else's kitchen
    (`emitNoise`), a light going on two doors down (`addLight`, so `litAt` and
    every seeing check agree you are standing in it), something in the bins, and
    **somebody getting up for a glass of water** — which cost no new systems at all,
    because `canSee` reads the sleeper's own x/z, so walking one to the kitchen
    turns them into a roving pair of eyes inside a house you may be standing in.

19. ~~**The threats have bodies.**~~ **DONE 2026-08-19.** *Verified: 26 assertions +
    [docs/m19-watchman.png](docs/m19-watchman.png).*

    **Four of the five tiers in §5.8 had no physical form at all.** The neighbourhood
    watch was `{x,z,dir,minX,maxX,seen}`: a man who patrols at 2.3 m/s and **ends
    your night from eleven metres**, with no mesh, no torch, no footsteps and no
    sound — while the card announcing him said *"a torch and no dog … a jacket with a
    word on it"*. Dogs were four numbers with a 5 m radius. Doorbell cameras were a
    2.6 m bubble with no lens. The porch lights emitted from thin air at y=2.5.

    **A stealth game whose threats are invisible is not difficult, it is unfair** —
    and the fairness rules were all already there. He has a range. He cannot see
    behind himself. He does not work indoors. None of that is playable information
    until you can see the man it applies to.

    Now he has a body, a hi-vis jacket, footsteps, and **a torch that is a real light
    zone**: `litAt()` reads it, so the moving patch of light you can watch coming
    down the street is the same patch that gets you caught. Dogs have dogs, kennels,
    and heads that come up when they bark. Doorbells have a lens and an LED you can
    see from the gate. Porch lamps have a housing for the light to come out of.

    **And a leak, found while fixing it.** `hardenNight()` is called from
    `nightReset()` — every night — and the world is only rebuilt on
    `startHouse()`. It pushed a fresh zone and a fresh `PointLight` per porch
    every night while emptying only its own arrays. Measured: **30 → 34 → 38 → 42 →
    46 → 50** zones across six nights, so by the end of a run every porch was lit ten
    times over. `HARD_FX` now tracks, removes and disposes.

20. ~~**Daylight.**~~ **DONE 2026-08-20.** *Verified: 31 assertions +
    [docs/m20-daylight.png](docs/m20-daylight.png).*

    `setLighting()` had been called with exactly two arguments in twenty
    milestones: `'greybox'` at boot, and `'night'`. **The street has never been
    seen in light.** 146 metres, ~2,000 meshes, five dressed houses, eight facades, a
    turning circle, a tree line — all of it rendered at `toneMappingExposure` 0.52
    through `FogExp2(0.038)`, and nothing else.

    Meanwhile the day was fourteen text actions across five blocks, and `walk` —
    the only one that touches the social layer at all — resolved the entire street in
    a single click: every resident's reaction beat printed into a log at once, +3
    Human Knowledge each, nobody actually seen. §5.4 says watching a neighbour come
    apart in public is how you learn to be human. You could not watch anybody, and
    you could not see anybody: **`RESIDENTS` have never had bodies** anywhere in
    this game except asleep in a bed.

    So the afternoon happens outdoors now. Same world, same collision, same camera, a
    different rig on the lights and everybody home from work. Beats are paid **on
    approach**, once each, for standing next to somebody — which is what they were
    always for.

    *Tuning:* the first day rig used exposure 1.05 with a 0.95 hemisphere and a 1.45
    key, and ACES bleached the house walls to near-white and the lawns to mint. 0.86
    with a 0.55 ambient keeps the midtones where the textures actually live.

21. ~~**The look.**~~ **DONE 2026-08-20.** *Verified: 24 assertions +
    [docs/m21-daylight.png](docs/m21-daylight.png).*

    **Measured before touching anything.** 684 materials: 610 Lambert, 74 Basic,
    **zero with a specular term** — wood, ceramic, glass and painted plaster all
    return light identically. 39% of the palette above luminance 0.75 against 4%
    true darks: a palette with no floor, which bleaches in daylight and goes
    uniformly grey at night.

    **The upgrade was priced, not assumed.** Swapping every Lambert for Standard
    costs **2.13×** the frame; for Phong, **2.60×**. Neither is worth paying for
    shininess. Value structure costs nothing, so that is where the milestone spent.

    - **A tone curve on the world**, `Y' = Y·(1 − 0.42·Y²)` plus saturation, applied
      in *two* places. Colours go through `mat()`/`matL()`. But every large surface —
      walls, floors, lawns, the road, the facades — is `new MeshLambertMaterial({map})`
      with **no colour argument**, so its `material.color` is white and its entire
      palette lives in a canvas. Grading colours alone moved the bright share only
      39% → 30%; a grading proxy over the 2d context did the rest. **Bright share is
      now 11%.**
    - **Specular where the eye expects it.** `PROP_KINDS` has declared what everything
      is made of since M2 and the audio system has read it since M9 — the same word
      now decides whether a thing can glint. 130 specular materials out of 2,065.
    - **Tighter shadows, not bigger ones.** 2048² looked better and made all twenty
      suites time out on the software renderer the harness uses. The box has followed
      the player since M17, so shrinking it to ±12 gives 2.3 cm texels — finer than
      the 3.1 cm it had — for free.

    **The rule this milestone turns on: grade the world, never the evidence.** A
    compressive curve pulls colours toward each other, which is precisely what the
    player is trying to do. Applied to props it turned three declared hue axes dead
    and broke both m12's axis gate and m3's 150-degree assertion. Grading is off for
    the duration of every prop build.

22. ~~**People.**~~ **DONE 2026-08-20.** *Verified: 33 assertions +
    [docs/m22-people.png](docs/m22-people.png).*

    Everybody in this game had been the same body since M1 — a box torso, a sphere
    for a head, a cone for a nose, in one colourway. That was fine while the only
    person on screen was you, seen from behind, in the dark. M20 turned the lights
    on and put the whole street outside in the afternoon, and the bodies became the
    most-looked-at thing in the game.

    **One builder for all of them.** A *look* is a small parameter vector — height,
    build, skin, hair and style, top, legs, shoes — derived deterministically from a
    person's id, so Walt is the same Walt every night and in every rebuild. That is
    exactly the trick the props have used since M2, applied to people. Across the
    seven residents it yields 4 skin tones, 4 hair colours and 6 tops.

    `makePerson()` keeps the **exact part names** `animBody` has driven since M1 —
    `legL`, `legR`, `armL`, `armR`, `torso`, `head`, `nose` — so the walk cycle is
    untouched. The suite proves it by walking the player and watching the legs swing
    in opposition rather than by inspecting the code.

    Everybody is one of these now: the player, the seven neighbours in their gardens,
    the watchman under his hi-vis, and the sleepers you stand over all night — who
    until now had a beige sphere for a head. And they shift their weight instead of
    standing like statues, for two sine waves each.

    *22 meshes per person; 1,980 on the street; 315 draw calls.*

    ⚠ **Caught by an M1 test.** The first version's shin ran 2.5 cm below the sole,
    so the player walked around with their feet through the floor. `m1` has asserted
    *feet sit at y=0* since the first milestone and fired immediately.

23. ~~**Windows.**~~ **DONE 2026-08-20.** *Verified: 17 assertions +
    [docs/m23-street.png](docs/m23-street.png).*

    Every window in this game was a **sealed card**. `windowPane` built a tinted pane
    and then an opaque `MeshBasicMaterial` box filling the entire wall thickness
    behind it. From inside a house you could never see the yard, the streetlight or a
    neighbour; from the street you could never see a room. A stealth game in which you
    cannot look through a window before you open the door is missing a pillar — the
    recon is the quiet half of the loop, and glass is the cheapest recon there is.

    The panes are real glass now (plus a glazing bar and a sill, so a hole in a wall
    still reads as a window), and `WINDOWS[]` records every opening as a world-space
    rectangle.

    **The asymmetry is the whole design: glass stops a voice and does not stop a
    look.** Sound keeps using `wallsBetween`. Sight uses the new `sightBlocked`,
    which is the same slab test except that a wall crossing landing inside an opening
    does not count. Measured through the lounge window: **sound 1 wall, sight 0**.
    Through the solid stretch beside it: **1 and 1**.

    And it cuts both ways, which is what stops it being a free gift. A sleeper who is
    awake and facing can see you through their own bedroom window, and so can the man
    with the torch.

24. ~~**The scanner.**~~ **DONE 2026-08-20.** *Verified: 22 assertions.*

    Until now the only way to learn anything about a room was to walk within
    `INTERACT_RANGE` — 2.0 m — of a thing and face it. A house holds twenty
    possessions and about a hundred pieces of scenery, in the dark. The player swept
    the room with their face. The alien has an instrument; it ought to be able to
    read a room.

    **Q** pulses. Every possession you can see gets a mark, colour-coded by the state
    it is in: never recorded, on file, **a copy already in your bag**, or marked by
    them. That last pair is the point — the thing a player actually wants to find in
    a dark room is *the object I am carrying the replacement for*.

    Two properties keep it a mechanic rather than a cheat:

    - **It reads only what it can see.** `sightBlocked`, so it goes through glass and
      never through walls — which means you can stand in the front garden and case a
      lounge through the window before you ever open the door. That is what M23 was
      for, and it measures: 5 of their things read from outside the window, while 6
      others in range but behind a wall stayed dark.
    - **It is loud.** 2.6 against a single hand-scan's 0.6 in sleeper-noise units,
      with a four-second cooldown. Walking over and looking is still the quiet option
      when somebody is stirring.

25. ~~**Familiarity.**~~ **DONE 2026-08-20.** *Verified: 20 assertions.*

    The afternoon walk paid Human Knowledge and nothing else, so spending one of the
    day's two actions on your neighbours was charity. Phase 2 has listed **social
    camouflage** since this document was written; this is it. A man they *know* is a
    man they explain away.

    Standing next to somebody in daylight raises their familiarity with you (+22,
    once each per afternoon). It decays 3 a day if you stop showing your face, so it
    is something you maintain rather than a switch you flip on night one.

    **Both limits are the design.**

    - It **never reaches zero cost.** A sighting by a stranger costs 34 Suspicion; by
      somebody who knows you, 15.3. Being seen always hurts, or the night stops
      mattering.
    - It does **almost nothing inside their house** — 31.2 of 34. No amount of
      chatting over a fence explains why Steve is standing in your bedroom at three
      in the morning.

    Which finally makes the day cost something to spend: social insurance for the
    night now competes with the shops for the same two actions per block.

26. ~~**A run, played.**~~ **DONE 2026-08-20.** *Verified: 18 assertions.*

    Every other suite in this project either drives systems directly or teleports
    the player to whatever it wants to test. That single blind spot has hidden three
    separate walls — two sealed rooms (M13), a garden gate that turned out to be a
    picture (M17), and an economy that could not fund a win (M18). Each was invisible
    to dozens of green assertions, because **nothing ever walked**.

    This one walks. It routes over the real collider set (BFS on a 0.35 m grid),
    holds `W`, and lets collision arbitrate — from your own doorstep to a
    neighbour's front door (332 steps), through a planter for the spare key, in at
    the door, round **all four rooms**, a scan pulse, up to **all twenty
    possessions** (19 examinable from where you stand), home, into the shop, back
    out, and the swap — with their original in your pocket at the end of it.

    ⚠ **Both of the first run's failures were the test's own fault**, and both are
    worth remembering. It aimed at "the middle of the kitchen", which is the kitchen
    table. And it picked purchases by reading the shop's *forecast* — when Human
    Knowledge is 0 on night one and there is no forecast at all.

    That second mistake turned into the useful measurement. **On night one, $140 buys
    264 of the things on the shelves, and 59 of them would create doubt: a 22% blind
    hit rate.** A good first purchase exists and is not a needle in a haystack — you
    simply cannot see which one it is, which is precisely what Human Knowledge is
    sold against.

27. ~~**Hiding.**~~ **DONE 2026-08-20.** *Verified: 26 assertions.*

    This game has had **detection** since M5 and never had **counterplay**. A sleeper
    sits up. A man with a torch comes round the corner. Somebody gets out of bed for
    a glass of water. And the only thing you could do about any of it was walk away
    and hope. Every stealth game is a conversation between hiding and looking, and
    this one only ever had half of it.

    Thirty hiding places, registered on real furniture rather than sprinkled about as
    invisible volumes — wardrobes, under beds, behind sofas, the garden shed, the two
    hedges either side of the path (which is where the streetlight is, and where the
    watchman walks). Six per lot, half of them indoors.

    **Two rules keep it honest.**

    - **You cannot climb into a wardrobe while somebody is already looking at you.**
      Without that it is an escape key: get caught, press E, be fine.
    - **The clock runs while you are in there,** and you cannot move. Hiding spends
      the one thing the night is actually short of.

    ⚠ **And M26 earned its keep one milestone after it was written.** Putting `HIDES`
    into the main `findTarget` pass let a wardrobe outbid the picture frame on the
    nightstand beside it — the playthrough's *walked to 20, could examine 19* fell to
    **17**, and twenty-six other suites saw nothing wrong. Hiding places now obey the
    same `if(!best)` rule as scenery, for the same reason: the examine loop is the
    game.

28. ~~**Home.**~~ **DONE 2026-08-20.** *Verified: 22 assertions.*

    Wife Suspicion has driven this game since M6. It shortens the night. It wakes her
    at tier 2 and sends her out after you at tier 4. It ends runs. **And in
    twenty-seven milestones Dana has never been on screen** — a number and a
    paragraph of text, in a game whose entire subject is a man failing to convince
    the people in his own house that he is a person.

    The evening happens at home now: your own lounge, the lamps on, and her in it.
    **Where she is standing is the meter.**

    | Suspicion | Where she is |
    |---|---|
    | 0 | on the sofa with her feet up |
    | 25 | on the sofa, not really watching it |
    | 45 | in the kitchen, doing something she already did |
    | 65 | in the hall. She was not going anywhere |
    | 85 | at the front window with the light off behind her |

    You can read the room before she says a word. Walk up to her and press **E**, and
    it is the same `SCENES` dialogue the menu used to open — the difference is that
    you had to cross the room to get to it.


- **M29 — the rail tells the truth.** `GUIDE_STEPS` 9 → 12. The chain now teaches the
  scanner, fencing and the afternoon, and no longer claims the house has an upstairs.
  `read` accepts a catalogue entry as well as a pulse: Q is optional, and a step that
  blocks on an optional ability strands the player. `m29` is a drift detector — every
  bound key must be documented, no guide string may name a room that does not exist.

- **M30 — the day screen keeps its promises.** `doAction()` repainted `s-day`
  unconditionally, covering the shop, the afternoon and the evening one statement after
  they opened; an action that opens a screen now owns the frame. `s-day`, `s-report`
  and `s-end` are modal — Escape used to drop the player into a frozen street with the
  run gone. `m30` drives real click events on visible elements only.

- **M31 — the world is the world you left.** `eventFxClear()` puts out a light event
  the night ended on top of; `loadGame()` re-derives the night after the saved state
  lands, so a loaded save keeps its dogs, watchman and cameras; `startWalk`/
  `startEvening` tear down last night's installations; `startHouse` clears
  `S.daytime`/`S.evening`/`scanCd`/`lastWindow`.


- **M32 — the ending screen.** The win is evaluated before the losses, and a run that
  crosses the bar on a losing morning gets its own `pyrrhic` ending instead of being
  reported as a flat failure. `GAME.stats` records what the player did and the screen
  prints it beside what it did to them. Win and lose cues added to `CUES`; the prose
  reads its numbers out of `CONST` rather than restating them.

- **M33 — the street makes sense.** Addresses renumbered to run in order (8, 10, 12,
  14, 16 west to east), with the tutorial house keeping 12. The guide describes the row
  that exists rather than a street with something across it, and counts the seven
  residents `activeResidents()` returns. The `R` free-variants key is retired — it made
  the shops, the money and the whole fence economy optional, and it could not go until
  M30 made the shop reachable.


- **M34 — the last night.** The win resolves at the deadline, or when the player
  chooses to end the assignment (CALL IT IN on the morning report); crossing the bar
  no longer deletes nights 6–10. The last night is marked as the last night, and
  Dana's suspicion is visible during the run rather than only on the ending screen.
  `LOSE_STREET` re-measured and **kept** at 70 — `tools/_street.js` shows four a night
  at the worst rung passes it by night three, so the ending is reachable and the old
  "peaks near 33" note was stale, not the constant.


- **M35 — the night stops when the night does.** `e.repeat` guard in focus mode (a
  held arrow was emitting ~86 noise units/sec against a threshold near 45);
  `audibleNight()` extracted as a pure predicate so the night bed ends with the night
  instead of playing through the report, the afternoon and the evening; `world()`
  scales every voice by `mag` against a per-voice reference; leaving a hiding place
  costs the same noise as entering one.


- **M36 — the game explains itself.** The intro no longer teaches one-a-night (the
  measured losing line) or promises a forecast `predict()` withholds until HK 20. The
  MODE pill admits you are hidden; the SEEN pill reads `CONST.SEEN_LIMIT`; the controls
  screen documents hiding, Esc, and the fact that a swap leaves you holding the
  original. `.hot` keyed to `.pill` so Dana-is-outside renders urgent, and `rp-row`
  (defined nowhere) replaced with `rp-item`. m36 asserts every class in use has a rule
  behind it, and that no key list repeats a key.

### Phase 2 — Neighborhood
Houses 4–8 including the conspiracy theorist; gossip and credibility; hardening tiers;
specialty stores (thrift, hardware, antique); social camouflage/familiarity; the full
fracture set; children as observers.

### Phase 3 — The alien
Full ability set with Agency Attention; person-scanning and trait reveal; wall-crawl and
crawlspace traversal (port from `chameleon3d`); pets; weather affecting entries; the
truck and large-furniture heists.

### Phase 4 — Records & memory
Late-game record manipulation: photos, yearbooks, licences, certificates, the
neighborhood's social feed. Changing *history* rather than *objects*. This is the
strongest late-game idea in the pitch and deserves its own phase rather than being
crammed in.

### Phase 5 — Ship
Electron or Tauri wrapper, settings persistence, resolution/fullscreen, key rebinding,
pause-on-focus-loss, then Steamworks. Windows first.

---

## 13. Expansion sockets — the explicit list

Add content by filling these; none should require touching systems code.

| Socket | Shape | Examples pending |
|---|---|---|
| `PROP_KINDS[id]` | axes + `build()` | ~200 household objects |
| `HOUSES[id]` | floorplan + props + entries | houses 4–10, second neighborhood |
| `RESIDENTS[id]` | traits + seed + fractures | conspiracy theorist, widow, engineer, new parents, the copycat |
| `SCENES[id]` | dialogue + choices | work, BBQ, PTA, block party, police doorstep |
| `ABILITIES[id]` | cost + trace + effect | the six unbuilt powers |
| `STORES[id]` | aisles + price mult | thrift, antique, pet, furniture, pharmacy |
| `FRACTURES` | `{atDoubt, apply(world)}` | the full fracture library |
| `EVENTS[id]` | scheduled world beats | bin night, power cut, a funeral, a heatwave |
| `SEEDS[id]` | fixation category | new psychological weak points |

> **EXPANSION HOOK — second neighborhood / campaign.** The world is authored per-house,
> so a new neighborhood is a new `HOUSES` set plus a new `RESIDENTS` set. Keep every
> global meter on a per-neighborhood object from the start so this stays possible.

---

## 14. Design decisions log *(append-only — don't silently reverse)*

- **2026-08-06 — 3D, Three.js r128, single HTML file.** (Kyle's call.) Affordable only
  because props are parametric (§5.1); hand-modelled variants are explicitly out.
- **2026-08-06 — Houses are authored, not procedurally generated.** Each house is a
  handcrafted puzzle about a specific person; procgen would destroy the premise. (Note:
  this is the *opposite* of the Chameleon project's decision, and deliberately so.)
- **2026-08-06 — Doubt and Suspicion are separate meters.** Doubt wins, Suspicion loses.
  Never merge them into one "awareness" bar; the whole game is the gap between them.
- **2026-08-06 — Moving an object is not a special system.** Position and rotation are
  spec axes like any other (§5.1).
- **2026-08-06 — No lockpicking, no forced entry.** Locks are information puzzles.
- **2026-08-06 — Alien powers cost Agency Attention.** The mundane route must always be
  the optimal route; powers are for recovering from mistakes.
- **2026-08-06 — Getting seen is not instant failure.** It converts progress into
  Suspicion, which is worse and more interesting.
- **2026-08-06 — Day is five discrete blocks with an action budget**, not a continuous
  clock. Continuous suburban sim is a scope trap.
- **2026-08-06 — Wife Suspicion is never shown as a bar.** It's read off her behaviour.
  Every other meter is explicit; this one deliberately isn't.
- **2026-08-06 — Solo game.** No multiplayer plans; unlike the Chameleon project, MP is
  not a design consideration and shouldn't constrain architecture.

---

## 15. Open questions & tuning log

*(Resolve by playing, not by arguing. Record answers here with dates.)*

**Tuning log**

- **2026-08-19 — INVISIBLE IS NOT THE SAME AS DIFFICULT.** Four of the five hardening
  tiers could end a run without ever being rendered. The watchman's rules were already
  fair — 11m range, a forward-facing check, outdoors only — but a player cannot use a
  rule about a thing they cannot see, so the whole tier read as an arbitrary loss. The
  fix was almost entirely presentation, and the only mechanical change was making his
  torch a real light zone so the visible beam and the seeing check are the same object.
- **2026-08-19 — Anything built per-night must be torn down per-night.** `hardenNight`
  runs every night; the world is only rebuilt on `startHouse`. Six nights of porch
  lights went 30 → 50 zones. Tracked in `HARD_FX`, and DISPOSED, not just detached —
  `makeDog`/`makeWalker` build their own geometry rather than sharing `UNIT_BOX`.

- **2026-08-19 — THE GAME WAS NOT WINNABLE, AND THE TOOL BUILT TO CHECK THAT WAS
  CHEATING.** `_balance.js` and `_escalate.js` both open with `GAME.bank=1000000`.
  Every difficulty number in this document — including `SLICE_WIN_COLLAPSE` — was
  therefore tuned for a player with infinite money. With the real wallet: 15 swaps,
  collapse 32.0 against a bar of 40, and 729 occasions of standing in a shop unable to
  buy. The lesson is not "tune the economy"; it is that **a diagnostic which grants
  itself a resource cannot answer any question about that resource**, and this one had
  been quietly answering the most important question in the game for seventeen
  milestones. `_economy.js` runs the same slice with the till open and is a gate.
- **2026-08-19 — Fencing rates, measured not guessed.** Thrift 0.25 / antique 0.55.
  At 0.85 the loop became a money printer (buy a $10 thrift variant, fence the
  original for $21) which removes the constraint the milestone existed to create; at
  0.35 a competent run still fell short of the bar. 0.55 lands a competent run at 43.9
  and ends the slice with $8 — funded, never rich.
- **2026-08-19 — Never roll the same event twice running.** The first seeded night
  produced *fox, light, light, light*, which reads as a bug in the world rather than
  as a night. Drawing from the kinds that did NOT just happen costs one line.

- **2026-08-17 — A TEST THAT TELEPORTS AN ACTOR IS NOT TESTING WHETHER THE ACTOR
  COULD GET THERE. Learned twice now, and the second time it hid a wall.** M13 found
  two sealed rooms this way. M17 found that the front garden gate was a *picture*:
  the pickets have skipped the path since M8, but the rail underneath was one
  collider across the whole frontage, 0.62 m high against a 0.30 m step-up. Every
  suite calls `startHouse()` and then teleports the player to the thing it wants to
  test, so for nine milestones nobody walked in — and you *could* get in, by jumping
  it, because apex 0.588 + step-up 0.30 clears 0.62. The bug was invisible precisely
  because it was survivable. `m17-tests.js` now flood-fills the whole estate from
  `HOME` at 0.25 m using the real collider set, **walking only**, and asserts every
  front door and every spare-key planter is reachable without a jump.
- **2026-08-17 — Two units in one file will eventually be added together.** The road
  was authored in raw metres (`z=-10.4`) while the yards were in layout units scaled
  by `ROOM_SCALE` (fence at `_p(-9.0)` = −13.95), so the carriageway was drawn
  *inside the front gardens* and the path was painted across it. The same class of
  mistake put a 7 m kitchen counter through the divider wall and out into the
  bedroom. The object format now names its unit — `at:` layout, `m:` metres — and
  fixtures are positioned from a wall face rather than from a scaled coordinate.
- **2026-08-17 — Arithmetic found a bug that looking never did.** `updateSleepers`
  drives the torso to negative `rotation.x` (−0.42 stirring, −1.15 awake). With the
  head at −z, `y' = y·cosθ − z·sinθ` is **negative**: the sleeper sat up by driving
  its head down through the mattress and out through the floor. Nobody had ever
  watched a sleeper stir. Head at +z makes the same angles raise it, and puts it
  against the headboard the bed had just grown.
- **2026-08-17 — Pay for the content pass before taking it.** `box()` minted a new
  `BoxGeometry` and a new material per call, so 694 meshes carried 694 geometries and
  614 materials, and draw calls are 1:1 with meshes on r128 (no instancing, no
  merging). A shared unit box plus a material cache keyed by colour went in *first*;
  the world then grew to 1,965 meshes on 703 geometries and 691 materials. Also added
  a draw-call readout to F3: `renderer.info` was read nowhere in the file, so an
  expansion would have been flown blind.
- **2026-08-17 — More possessions did not break the win bar, because Collapse is a
  MEAN.** The street went 40 → 80 objects. Measured: four-a-night still reaches 43.0
  (was 43.4), two-a-night 36.6 (unchanged), one-a-night 18.8 (unchanged) against a
  threshold of 40. Doubling the objects bought *choice*, not an easier win. Swapping
  all 80 in one night reaches 83.7 — and street Suspicion 54.0 with five people past
  75, a near-loss. Greed is still punished. ⚠ `_balance.js` had `30` hard-coded as
  the object count in both its cap and its header, so it silently sampled 30 of 80
  and printed a number that had not been true for two milestones. **A diagnostic that
  misreports its own inputs is worse than no diagnostic** — same lesson as the
  M16 gossip figure.
- **2026-08-17 — The kind has to suit the PERSON, not just the room.** Two new
  objects failed the reachability gate's "2+ viable weeks" rule. Grace's vase:
  plausibility 0.45 against her notice floor of 30 leaves an 11-point window, and
  the shops stocked something inside it in one week out of six. A picture frame is
  0.60 and it passes. Aaron's slippers failed the other way — attachment 0.8 against
  a floor of 26 meant the perceived delta rarely cleared the floor at all; 1.1 fixed
  it. Perceived delta scales *by attachment*, so low attachment helps against a low
  ceiling (Ray) and hurts against a high floor (Aaron).
- **2026-08-06 — GRAV 16 → 18, JUMP_V 6.0 → 4.6.** The inherited values gave a 1.13 m
  standing jump, which is superhuman and made every worktop trivially mountable. Now
  apex = 0.588 m, and `reach = apex + STEP_UP = 0.888 m` is the mount ceiling. The
  greybox furniture ladder is authored around it: 0.28 lip walks on, 0.45 stool needs a
  hop, 0.75 table is the last mountable thing, 0.92 counter and 2.0 wardrobe refuse.
  ⚠ Jumping is provisional — for suburban stealth a **mantle** (animated, costs time,
  makes noise) reads far better than a hop, and would let 0.9 m worktops be climbed
  deliberately rather than accidentally. Decide by M5.
- **2026-08-06 — camera derived from `CH_H` rather than hard-coded.** In the Chameleon
  the look-at height (+0.6) and shoulder offset (0.28) were literals, and they silently
  drifted out of sync with the documented values. Here they're `CH_H * CAM_LOOK_F` etc.

**M2 findings — what the band map and histogram actually showed**

- **2026-08-06 — Walt retuned 34/40/0.6 → 16/55/0.8. This was a real bug in the
  design, not the code.** The old numbers put his effective floor at raw 0.567: he
  could not be affected by anything more than 43% similar, so the *tutorial house*
  was unplayable and the authored keys chain ("Night 1: move keys, he blames
  himself") could never fire. Root cause: I encoded **"forgetful" as
  "unobservant"**. Walt's character is that he *sees* the keys moved and concludes
  he moved them — that is a moderate floor with an enormous band. He now reads
  `M M M M M M M M D D D D` across 99%→50% similarity: reachable with a visibly
  different object, and he never alarms on a plausible one (4.7% alarm rate across
  the shop range). Kyle: overrule this if you want him blanker.
- **2026-08-06 — `SHOP_RAW_MAX` 0.16 → 0.35.** At 0.16 (84% similar) *five of seven
  residents were completely unreachable by anything purchasable*. The shop has to
  stock a real ladder of difference, because different people need different
  similarity targets — that spread IS the game.
- **2026-08-06 — the milestone's own prediction was wrong, twice.**
  1. *"Marisol should land DOUBT far more often than Walt."* Their DOUBT **rates**
     are comparable (31% vs 45% of shop stock). The real contrast is **kind**, not
     frequency: Marisol is reachable with subtle cheap changes (doubts from 96%
     similar) but overshoots into CERTAINTY 11× as often as Walt; Walt needs a
     visibly different object but almost never alarms. Sensitive-and-punishing vs
     blunt-and-safe. That is a better distinction than "more often" and it is what
     the tests now assert.
  2. *"The conspiracy stub should never land DOUBT."* Ray lands DOUBT on 7.5% of
     random changes. He is **not** immune — his window is simply so low that the
     only changes he doubts are ones **beneath everyone else's notice floor**
     (verified as an invariant: 0 violations in 400 samples on neutral objects).
     That is a much better property than immunity: *you cannot work Ray and work
     anybody else with the same object.*
- **2026-08-06 — Marisol's fixation makes her nearly as sensitive as the conspiracy
  theorist.** On `order`-category objects her effective floor (raw 0.022) slides
  under Ray's ceiling (raw 0.029), so their doubt windows overlap in a ~0.7-point
  band — 2.3% of order-category changes are doubted by both. Small, measured, and
  worth knowing before Ray becomes real content in Phase 2.
- **⚠ OPEN — Grace is unreachable.** Floor 30 at attention 0.7 = effective floor raw
  0.43, outside `SHOP_RAW_MAX` entirely (shop-range M/D/C = 107/0/0). She's a
  Phase-2 background character so nothing is blocked, but she needs a pass before
  she carries content. Aaron (96/11/0) is borderline for the same reason — though
  for him "hard to move, dismisses his wife" is arguably correct characterisation.
**M3 findings — what building the geometry showed**

- **2026-08-06 — thumbnails must use FIXED per-kind framing.** Auto-fitting each
  variant to its own bbox made every size axis invisible: a cereal box at h=0.24 and
  one at h=0.34 rendered identically. Caught by a variant that scored 80% similar but
  measured 1.2/255 of visible change. The shop's compare card would have been silent
  about exactly the axis the player was paying for. Now framed against the kind's
  largest possible spec; a size-only change measures 46/255. Regression-guarded.
- **2026-08-06 — salience is a model of noticing, not of pixels.** See the table in
  §5.1. Do not calibrate one against the other. The temptation is real and the test
  suite now blocks it.
- **2026-08-06 — `variantNear(kind,spec,rng,targetSimilarity)` added.** Shop stock is
  a ladder of *similarities*, not a ladder of mutation strengths, because different
  residents need different targets. Hits its target to within 2.0 points on average
  (worst 7.3) across 32 kind×target combinations. The montage uses it, so the QC
  artefact shows 97/92/80% — the range the game is about — instead of whatever a
  random strength produced.
- **2026-08-06 — the keyboard's key grid is a texture, not 70 meshes.** At prop scale
  it reads identically and keeps the draw-call budget sane; the whole keyboard is 24
  triangles. Same trick will apply to bookshelves, spice racks, and blinds.
- ⚠ **Open — the picture-frame photo is small.** The "one child isn't smiling" tell is
  the marquee gag and it is legible at catalog size but not *punchy*. Figures were
  enlarged once already. May need a dedicated close-up inspection view (which the
  focus camera in §5.5 will provide anyway) rather than more texture resolution.

**M4 findings — what wiring the loop together showed**

- **2026-08-06 — the focus inspection camera was missing and is essential.** §5.5
  specified it; I had built focus mode as "freeze movement, show a panel" and the
  first screenshot showed the player editing an object they could not see. Now the
  camera orbits the OBJECT at ~2.8× its size, hides the player body, and forces a
  steeper pitch (≥0.48) — walking pitch views a mug or a keyring edge-on, which is
  useless when the whole action is judging a 3 cm nudge. Drag still steers, so a
  swap can be inspected from every angle.
- **2026-08-06 — descriptions must be derived from the DIFF, not from an action
  log.** Seven 3 cm nudges first reported as "moved 30mm, moved 30mm, moved 30mm…"
  seven times. `describeDiff`/`describeDiffs` now render the net result — "moved
  21cm", "fob none → leather", "colour shifted" — which is also exactly what the
  scanner needs to say (§5.2). Regression-guarded.
- ⚠ **2026-08-06 — Walt's keys are in a DISH by the door, not on a hook.** The GDD
  says hook. The keyring model is built lying flat, and placement specs carry **yaw
  only** — hanging it vertically needs a pitch/roll axis, and adding one changes the
  delta maths for every kind. The dish-by-the-door is the same beat and just as
  suburban. Revisit if placement ever gains a full orientation (wall-mounted objects
  — the clock, the photo, mirrors — will eventually force this).
- **2026-08-06 — acquisition is gated on recon, and that gate is real.**
  `requisition()` returns null for an uncatalogued object. It is the single line that
  makes the observe→acquire→execute loop a loop rather than a menu.
- **2026-08-06 — the exterior needs a sky and a roof.** Not cosmetic: without them
  the first screenshot of the house read as a wall floating in a void, which makes it
  impossible to judge whether the space works. `scene.background` is now dusk.

**M5 findings — what the night showed**

- **2026-08-06 — sight and sound must DE-INFLATE the colliders.** Colliders are stored
  pre-inflated by `PLAYER_R` (a physics convenience that makes the player a point).
  Using them raw for line-of-sight made every wall 32 cm thicker, so a sleeper could
  not see someone standing 1.2 m away — the segment ended *inside* the inflated wall.
  `wallsBetween` now subtracts `PLAYER_R`. Any future system that reads colliders for
  something other than collision has to do the same.
- **2026-08-06 — the stirring grace period has to key on noise heard SINCE stirring,
  not on the accumulated level.** With the level test, noise decays far too slowly to
  fall back under the escalation threshold, so "go still and they settle" was
  literally unreachable and every stir became a wake. Now: sit up, and only *fresh*
  noise gets them out of bed. Measured — 3.02 s of silence settles Walt; carrying on
  wakes him in 0.37 s.
- **2026-08-06 — exposure, not intensity, is the night control.** Three rounds of
  turning lights down produced progressively flatter grey. sRGB gamma is the culprit;
  filmic tone mapping with a low exposure is the fix. Recorded in §8 because it is the
  kind of thing that gets "fixed" back.
- **2026-08-06 — Stress→sleep→difficulty is live and it bites.** Walt's wake threshold
  drops 45 → 33.8 at full Stress. Working a resident makes their house measurably
  louder to enter, which is exactly the pressure the design wants: you cannot grind one
  target forever.
- ⚠ **Open — noise has no player-facing directionality.** The HUD shows one number
  (loudest sleeper as a fraction of their threshold). That is enough to play, but it
  doesn't say *who* is close to waking or *where* they are. The GDD's "noise ring
  around the reticle" (§7) is still unbuilt.
- ⚠ **Open — sleepers never leave the bed.** They sit up and sweep the room; they don't
  get up, walk a route, or turn on a lamp. Bathroom trips and insomniac patrols (§5.5)
  are unimplemented, so the bedroom is the only dangerous room.

**M6 findings — what the day showed**

- **⚠ 2026-08-06 — six constants in §11 were never in the code, and it failed
  silently.** `ACTIONS_PER_BLOCK`, `WAGE`, `BILLS`, `IDENTICAL_MULT`, `CASH_FEE`,
  `HK_MAX` were all in the constants table but absent from `CONST`, so the whole day
  loop ran on `undefined` — action budgets never decremented, payday paid `NaN`, and
  the special order cost `$NaN` (which then compared falsely against your money and
  let you "buy" it for nothing). **Adding a system means adding its constants to
  `CONST` first.** The table is the contract, not documentation of one.
- **2026-08-06 — the forecast must be against the object's CURRENT state, not your
  catalog entry.** They diverge the moment you have swapped something once. The shelf
  shows similarity-to-your-record (that is what you have on file); the *prediction*
  has to be similarity-to-reality or it silently drifts wrong exactly when you are
  working an object hard.
- **2026-08-06 — `SHOP_LADDER` widened to 6 rungs (97/94/90/84/76/66).** With five
  rungs a low-attachment object like June's cereal had exactly one viable purchase,
  which is not a choice. Residents differ enormously in what they can perceive, so the
  shelf has to span the whole band map.
- **2026-08-06 — this milestone's own verification was wrong.** "Buy a 94% cereal,
  plant it, see the morning beat" — 94% on June's cereal is Δ 3.3 against a floor of
  18, i.e. MISSED. That is not a bug; a low-attachment object owned by a moderate
  noticer genuinely needs a bigger change. **The shop's forecast is what makes this
  legible**, and it is why the HK gate matters: at HK 0 you are guessing.
- **2026-08-06 — cash is the laundering path and it works.** A card purchase adds
  Suspicion proportional to price; cash adds none. Withdrawing costs an action and a
  fee, so hiding your spending is a real budget of time as well as money.

**M7 findings — the arms race**

- **2026-08-06 — her ladder had to buy her ACTIONS, not just a shorter night.**
  Shrinking the night budget (M6) is a number; waking to check the bed and coming out
  after you are *events you experience*. Tier 2+ schedules a check, tier 4+ a follow,
  both seeded per night so a given night is reproducible. Across 24 nights at tier 4
  she follows on 15 — often enough to matter, rare enough that you gamble.
- **2026-08-06 — marking narrows the window from the TOP, and that is the right
  shape.** Marking multiplies plausibility by 0.55, which drops Walt's keyring
  ceiling 60 → 40.2. So a 97% swap stays safe and a 79% swap becomes a witness: being
  marked *degrades your options* rather than removing them. Worth stating because the
  first version of the test picked the safest DOUBT rung and "failed" — the maths was
  right and the test was aimed wrong.
- **2026-08-06 — fractures are world changes and they compound.** Walt at 25 marks
  every object he owns; at 50 his sleep quality drops 0.50 → 0.35, which makes his
  own house measurably louder to enter; at 75 the argument spreads +9 Doubt to June.
  June at 50 physically **moves the family photo to the other nightstand** — the mesh
  moves with the spec, so the world you memorised stops being the world.
- **2026-08-06 — the identical special order finally has a job.** It creates zero
  Doubt by construction, so until marking existed it was dead weight on the shelf. It
  is now the only counter to a marked object, at 3× price. That is the shape the GDD
  wanted: a purchase that buys you nothing except the right to keep working.
- ⚠ **Open — fractures exist only for Walt and June.** Marisol, Dev, Aaron, Grace and
  Ray have entries in `RESIDENTS` but no `FRACTURES` list, so they can reach Doubt 100
  with nothing happening. Fine while the slice is one house; blocking for M8.

**M8 findings — the slice**

- **2026-08-06 — the house data format got extracted, as planned, at four houses.**
  `HOUSES[]` carries `{id,x,name,wall,beds,objects}` and `buildHouse` stamps one
  floorplan down the street. Suburban houses on one road ARE the same developer's
  plan; the variation that matters is whose things are in it. A **lot-origin offset
  (`OX`) applied inside the world primitives** was the low-risk way to do this —
  far safer than threading an offset through sixty coordinates, and it kept Hoyt at
  x=0 so every earlier milestone's coordinate assertions still hold.
- **⚠ 2026-08-06 — object ids must be STABLE across rebuilds.** `_objId` ran on
  monotonically, so `loadGame()` (which replays the builder and then restores state)
  looked up `o1` in a world whose keyring was now `o19`. `CATALOG` is keyed by object
  id too, so every catalogued entry would have dangled after a load. `clearWorld`
  now resets the counter.
- **2026-08-06 — the shop shelf was not actually a ladder.** `variantNear` only
  approximates its target, so rungs crossed over (97/92/94/85…). The UI presents a
  descending ladder, so `shopStock` now sorts. It had been passing on luck.
- **2026-08-06 — keys are per house.** One spare key opening the whole street was
  the obvious wrong default once there were three doors.
- **2026-08-06 — Grace's night shift is the best mechanic in the content pass.**
  Half her nights the bed is half empty — learnable recon, and the reason the
  Okonkwo house is where you practise. Her Doubt-50 fracture is *"Grace has swapped
  her shifts"*, which ends the free nights permanently.
- **2026-08-06 — the Collapse Index is a MEAN, so a win can arrive with nobody past
  75.** The observed win was Collapse 51.2 with one resident fractured past 75 and 9
  fractures fired in total. That is consistent with the slice spec (Collapse ≥ 40),
  but the full-game target in §10 additionally requires `WIN_MIN_FRACTURED` — worth
  keeping, because a win where nobody actually broke would read as hollow.
- ~~⚠ **Open — Grace is still unreachable by shop stock**~~ **CLOSED 2026-08-10 (M10),
  eight milestones after it was first flagged.** The measurement that should have been
  taken in M2: **0 of her 4 objects had a DOUBT rung at any similarity Bulwark stocks.**
  Two causes, both fixed:
  1. *Structural.* One shelf cannot serve a cast whose doubt windows span raw
     0.027–0.87, because `perceived` multiplies by attention AND attachment. Fixed by
     three stores stocking three non-overlapping ranges (§5.7) — not by widening
     Bulwark, which would have flattened everyone else.
  2. *Tuning.* Grace at floor 30 **and** attention 0.7 was **exactly the Walt bug two
     rows up**: a high floor and low attention multiply, so on her lowest-attachment
     object she needed raw 0.61 before noticing anything at all — past what the variant
     generator can even produce for some kinds. Her identity is a HIGH FLOOR (she
     misses small things completely), not blindness. Attention 0.7 → **1.0**; she is
     still the hardest person on the street (highest floor in the cast), and the thrift
     store now reaches her. **Lesson worth generalising: whenever a resident's floor
     goes up, check it against `attention × attach`, not against the floor alone.**
- **2026-08-10 — `SHOP_RAW_MAX` was never used by the shop.** It is read only by the
  analysis/histogram tooling; the real constraint was always `SHOP_LADDER`'s lowest
  rung. Two milestones of notes reasoned about reachability in terms of a constant the
  shop does not consult. It is still meaningful for the histogram, but do not treat it
  as the shop's range.
- **2026-08-10 — a fixation can close a doubt window completely.** `SEED_BONUS` (×1.8)
  narrows a resident's window in *raw* terms by that factor, and it stacks with
  attachment. June's family photo (fixation `memory`, attach 1.9) ends up with a window
  ~6 percentage points wide — and `pictureFrame.photo` has salience 1.00, so the
  producible spectrum jumps 86% → 92%: you either keep the picture or you change it.
  Measured: **1 in 400 random mutations lands in her window, versus 111 without the
  fixation.** It is now buyable in 2 weeks of 6 and **only at the antique shop**, which
  is the right answer — the thing she treasures most is the hardest thing to fake, and
  `predict()` warns you at every other shop rather than letting you walk into it.
- **2026-08-10 — the shelf could show two rungs at the same similarity.** `variantNear`
  only approximates, so two targets could land on the same value — two identical-looking
  options at two different prices, which is worse than mis-ordering (M6 already sorts).
  `shopStock` now re-draws a colliding rung against a *shifted* target, moving both the
  rng stream and the goal so it converges. Incidentally this generates the intermediate
  rungs that made June's photo reachable at all.
- ~~⚠ **Open — no audio at all.**~~ **Closed 2026-08-10 (M9).**
- **2026-08-10 — the fridges were nearly two semitones apart.** `AUD_HUM_SPREAD` at
  0.055 put the end houses 11% apart in pitch, which reads as *"a different fridge"* —
  the opposite of the intended joke. Tightened to 0.018, so the whole street spans 62
  cents and sits inside one semitone: near enough to doubt yourself, far enough to
  tell apart. The assertion is now written in **cents**, not in a fraction of the base
  frequency, because ears measure pitch logarithmically and the old test could have
  passed at any absurd spread if the base had changed.
- **2026-08-10 — you cannot read an AudioParam you just set.** `applyMix` ramps with
  `setTargetAtTime` (an instant jump clicks audibly), so `gain.value` still holds the
  *old* level for tens of milliseconds. Three mixer assertions failed against a
  perfectly working mixer. The fix is a two-level test: assert the intended value via
  `busGain()`, then prove it reaches the graph by **rebuilding** the graph (`_reset()`
  → `arm()`), where gains are assigned outright. Generalises: *never assert on a
  scheduled Web Audio value synchronously.*
- **2026-08-10 — stereo has no front and no back.** A test expected a hard pan after a
  90° camera turn; the source had ended up directly *behind* the player, where centre
  is the correct answer. Accepted limitation of `StereoPannerNode`, now documented in
  the suite rather than worked around — an HRTF `PannerNode` per one-shot would cost
  far more than the information is worth here.
- **2026-08-10 — audio is a read-only observer, and that is now enforced.** m9 records
  a 60-step scripted night before the context exists, replays it with the graph live,
  and requires the sleeper traces to be bit-identical. Cheap to run, and it is the
  assertion that stops the audio layer ever quietly becoming a gameplay input.
- **2026-08-11 — the Collapse Index is a MEAN, so SPREADING is the whole strategy.**
  Measured over 10 nights: working one object a night reaches collapse 19.3 (loses
  badly), two a night 37.5 (a near miss), and **four a night spread across the street
  42.5, winning on night 5**. The threshold stays at 40 because that gradient is the
  right shape. ⚠ The first version of this sweep took objects in array order, and the
  first four all belong to the Hoyts — so it worked two residents and left four at
  zero, and reported a hard ceiling of 37.5 that no amount of effort could pass. I
  nearly retuned the game against that number. **When measuring a mean, check the
  sampler covers the population before believing the plateau.**
- **2026-08-11 — the M8 "verified win" was always the degenerate path.** The auto-play
  has no night clock, so "work every object every night" actually does all 30 in the
  *first* night and wins immediately (collapse 46.2 on night 1). That is not a strategy
  a human can execute — the night is ~13 real minutes. The M12 sweep plays a bounded
  number per night specifically to measure something reachable.
- **2026-08-11 — a "does it build?" test says nothing about whether an axis is live.**
  18 kinds were authored in one pass; every one built, and a naive dead-axis detector
  still reported 47 false positives, because it read only local vertex buffers. Three
  distinct classes of axis are invisible to that: **texture-only** ones (a brand name
  moves no geometry — compare `map.uuid`, which is exact because `canvasTex` caches by
  a key that captures every spec value the draw reads), **transform-only** ones (a
  tipped board, a raised mailbox flag — read `matrixWorld`), and **scale on a
  symmetric primitive** (a box is symmetric about its origin, so a *signed* vertex sum
  barely moves — use absolute values). With all three, 138/138 axes are live.
- **2026-08-13 — array order is load-bearing, and inserting a house at the FRONT broke
  four suites.** Ray's lot went in as `HOUSES[0]`, which renumbered every object id —
  so `objects.filter(o=>o.kind==='keyring')[0]` started returning *Ray's* keys instead
  of Walt's, `PLANTERS[0]` became Ray's planter, and every shop shelf changed because
  `shopStock` seeds its rng from the object id. Twenty-two assertions failed for one
  cause. Ray is now **last in the array and first on the street**: `HOUSES` order is an
  id-stability contract, not a spatial one, and `buildStreet` takes min/max over all
  lots rather than first-and-last. **Generalises: if ids are positional, the order of
  the list that mints them is API.**
- **2026-08-13 — the gossip report inflated its own numbers.** Suspicion clamps at 100,
  and the first version summed what was *said* rather than what *landed* — reporting
  "+408.4 across the street" while its three listeners sat pinned at 100. Fixed to
  record `after − before` per listener, and a listener already at the cap is dropped
  from the line entirely. **A report that overstates itself is the same defect as a
  shop shelf that lies about a forecast**, and this project already treats that as
  cardinal.
- **2026-08-12 — GDD §5.8's hardening thresholds could never have fired.** The doc
  keys hardening to Neighbourhood Suspicion at 25/40/55/70/85. Measured over a full
  run: **a careful player's street suspicion sits at exactly 0.0 for all ten nights**
  (suspicion only accrues from CERTAINTY events and sightings, and a good player
  causes neither), sloppy play peaks near 33, and `LOSE_STREET` is 70 — so the run is
  already over at the fourth tier. All five would have been dead content.
  **Alertness is therefore `collapse + streetSuspicion×1.5 + sightings×8`** — mostly
  Doubt, which is the meter that actually moves (8.8 → 41.2 across a winning run),
  with suspicion and sightings worth more per point so a sloppy night escalates the
  street faster. The consequence is the right kind of pressure: **the better you are
  doing, the harder the street gets.** Thresholds 12/22/32/42/55, at most one per
  morning — measured to fire on nights 2, 3, 4, 6, 7 of a diligent run.
- **2026-08-12 — a front-yard dog cannot wake a back bedroom, and that is arithmetic.**
  After M13 the house is ~10.8m deep and `NOISE_RANGE` is 11m, so a bark run through
  the distance-and-wall model reaches a sleeper at strength ~0. The dog's bark
  therefore adds a FLAT amount to its own household, deliberately bypassing that
  model: the model exists to attenuate *your* movements, and applying it to an alarm
  makes the alarm useless. One bark is a warning; staying in the yard is what wakes
  them. **Generalises: a model tuned for one actor is not automatically right for a
  different one.**
- **2026-08-11 — THE HOUSE WAS IMPASSABLE, and every suite was green.** A flood fill
  through the real colliders found 14.0 m² walkable in a 63 m² interior and **zero**
  reachable floor in the bedroom: the sofa's inflated collider overlapped the lounge
  doorway, leaving a 1cm gap. The bedroom is where the sleepers and the highest-value
  object are, so the game could not be completed on foot. **The reason no test caught
  it is that every test that needs the player somewhere sets `player.position`
  directly.** Teleporting past your own movement system means the movement system is
  never asked whether the destination is reachable. There is now a permanent assertion
  (m13) that flood-fills from the front door and requires all four rooms to have real
  walkable area. **Generalises: if a test puts an actor somewhere, it is not testing
  whether the actor could get there.**
- **2026-08-11 — scale the DISTANCES, never the sizes.** `ROOM_SCALE` multiplies
  authored floorplan coordinates only. Furniture sizes and Y heights are real-world
  measurements and must stay put, or a "bigger house" turns into a giant's house with
  the same cramped ratios. The one exception is a run LENGTH (a counter spanning a
  wall), which is a distance wearing a size's clothing.
- **2026-08-11 — the montage had been silently cropping to eight kinds since M3.**
  `tools/montage.ps1` hard-coded the row count at 8 back when there were 8 kinds, so
  the artefact whose entire job is "show me every prop" had been showing the first
  eight ever since. It now reads the count out of the file.
- ⚠ **Open — footsteps do not know what they are walking on.** Carpet, floorboards,
  tile and grass all produce the same step. The surface is known at the collider, so
  this is a data pass rather than a system, but it is the most obvious next gain.

- **2026-08-06 — two GDD corrections found by implementing it.** §4.4 applied
  `attachment` a second time on top of §4.2, making it quadratic and near-untunable;
  it is now applied once, inside Δ. §4.2's alertness note contradicted itself
  ("rises with Stress; tired people notice less"); Stress now raises alertness, and
  `sleepQuality` governs night infiltration only — one variable, one job.

**Open questions**

- Is a 13-minute night the right length? Too long and the day feels like an interruption;
  too short and infiltration becomes rushed rather than careful.
- Does `ACTIONS_PER_BLOCK = 2` make the day feel meaningful or restrictive?
- Should MISSED changes refund anything? Right now a wasted night is a hard punishment;
  it may need a partial consolation (e.g. `freshness` decay grants recon info instead).
- Is the Marisol seed (`order`) too obviously "the good target"? The slice may need her
  to be *harder* so Walt isn't strictly worse.
- How legible is the doubt band to a player who can't see the numbers? The HK progression
  may need to expose band edges *earlier* than HK 50.
- Does the Stress→worse sleep→harder infiltration loop read as clever or as punishing?
- Reaction beats: are 4 tiers enough escalation, or does it need per-object memory
  ("she now checks the cereal every morning")?
- First-person for inspection vs. a close OTS — decide by feel in milestone 4.

---

## 16. Conventions & testing *(binding)*

Carried over from the Chameleon project because they were learned the hard way:

- **Single self-contained HTML file by design.** Serve over http for all testing.
- **⚠ This machine has no Node.js.** Verify with a headless-Chrome harness: inject a
  test `<script>` into a scratch copy, run
  `chrome --headless=new --disable-gpu --virtual-time-budget=45000 --dump-dom`, and
  grep the dump for a marker string.
- **✅ Headless Chrome DOES render WebGL here — verified 2026-08-06.** With
  `--disable-gpu` Chrome falls back to **ANGLE / D3D11 WARP** (Microsoft Basic Render
  Driver), not swiftshader, and it renders correctly: `THREE.REVISION === 128`, exact
  background pixel readback, lit `MeshStandardMaterial`, and working `CanvasTexture`.
  **So tests may assert on real pixels**, via
  `renderer.getContext().readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf)`.
  This is a stronger capability than the Chameleon project's notes claim — that project
  hit crashes on the swiftshader path and concluded headless rendering was impossible.
  Do not inherit that pessimism; assert on pixels wherever it's cheaper than a proxy.
  (Chrome: `C:\Program Files\Google\Chrome\Application\chrome.exe`.)
- **Keep simulation pure.** Collider resolution, the Doubt Curve, noise propagation and
  spec math must operate on plain objects and never require a live `THREE` scene, so
  they stay unit-testable even if a GL context is unavailable. This is a hard
  architectural rule, not a preference — GDD §12 milestone 2 depends on it.
- **Before delivering any change:** syntax-check the main `<script>` **and** smoke-run
  it — load over http, wait for boot, enter both a night and a day, assert no error
  banner. Syntax-checking alone has shipped real bugs on this project's sibling twice.
- **Batch text edits atomically** — assert every anchor is unique and present, write only
  if all match. A partial batch once applied nothing while tests "passed" on the old file.
- **Verify numbers, not vibes.** Jump heights, Δ histograms, mesh integrity, prop scale
  after load. §12 milestone 2 exists specifically to make the core math measurable.
- **Test in a real browser tab**, never an embedded preview (CSP kills local assets).
- Ship a `serve.ps1` + a localhost link with every delivered build.

---

*End of v0.1. Sections are sockets — extend, don't restructure.*





