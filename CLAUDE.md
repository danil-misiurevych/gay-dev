# Instructions for AI agents

**Every** agent reads this file, whoever's session it is. If you are working on
this project, read it in full before your first change.

## Why this file exists

Four people work on this project, each with their own agent. Every agent has
its own separate memory, and after a few days each one "knows" something
different from the other three. The repository is the only shared source of
truth — not somebody's conversation, not an agreement in a chat, not what you
remember from a previous session.

The practical consequence for you: **read the repo instead of asking for
context.** The answer to "why is this done this way" is almost always in
`docs/DECISIONS.md` or in a comment above the code.

## What the project is

A browser game: an intergalactic bar where the player slices flying
ingredients (swipe, a mechanic related to Fruit Ninja) to fill orders from
alien customers. Publication target: Playgama, then YouTube Playables.
Monetisation: ads only.

State: the slicing mechanic works. The orders layer — the thing meant to set
the game apart from the clones — does not exist yet. See `docs/ROADMAP.md`.

## Architecture rules we do not break

**1. `src/core/` knows nothing about Three.js or the DOM.**
No importing `three`, `window` or `document` in `src/core/`. The core is pure
logic and must run in node without a browser — that is what the tests stand
on. The camera reaches the core only through an injected `project()` function.

**2. No new objects are created in the game loop.**
Meshes, halves and particles are pooled. Allocation in the loop is not a
matter of microseconds — it is a garbage collector hitch, which on a phone is
visible exactly at the moment of the cut, the worst possible one. If you add
an effect, add its pool too.

**3. Feel parameters live in `config/tuning.js`.**
Do not write numbers that regulate gameplay into the code. That file is owned
by the gameplay person and they have to be able to change it without a
developer.

**4. Platform code only in `src/platform/`.**
No `if (playgama)` outside that directory. The game ships to two platforms and
this is the only way to avoid maintaining two versions.

**5. Do not fill in `src/platform/playgama.js` from memory.**
SDK method names change between versions, and a broken ad integration is a
common reason for a game to be rejected during review. Open the current
documentation, copy from there, and record in `docs/DECISIONS.md` which SDK
version it refers to.

## Before you say you are done

```bash
npm test          # core tests, no browser
npm run build     # must pass
npm run size      # bundle size budget
```

Do not report a task as finished if any of these three fails. If you raised
the size limit in `scripts/check-size.mjs`, justify it with an entry in
`docs/DECISIONS.md` — bundle growth is meant to be a decision, not an accident.

## We write decisions down

Every decision somebody could ask "why this way" about goes into
`docs/DECISIONS.md`. An entry is three lines: date, decision, rationale.
This looks like bureaucracy right up to the moment a third person asks the
same question for the third time.

Do not change a decision that has already been recorded without a human's
agreement. If you believe a decision was wrong — say so, give your arguments,
and wait.

## What not to do

- Do not add gameplay features "while you are in there". Scope comes from
  `docs/ROADMAP.md` and from an approved entry in `docs/GDD.md`.
- Do not polish slice effects until the orders layer works. The rationale is
  in `docs/ROADMAP.md` and it is the most important product decision in the
  project.
- Do not add dependencies without need. Every library is bundle size, and the
  platform limit is hard.
- Do not rewrite whole files when changing a few lines is enough. Large diffs
  are unreadable in review and waste everyone's tokens.
- Do not commit `showHit: true` or any other debug setting.

## Token economy

The team works on personal limits. Three habits that genuinely save:

1. Start by reading the relevant document in `docs/` instead of reconstructing
   context in conversation.
2. One long session per area rather than a new session per question.
3. Small, precise changes instead of regenerating large files from scratch.

## Who handles what

| Area | Document | Files |
|---|---|---|
| Code, architecture | `docs/ARCHITECTURE.md` | `src/`, `tests/`, `scripts/` |
| Gameplay, tuning | `docs/GDD.md` | `config/tuning.js`, `config/ingredients.js` |
| 3D art, models | `docs/ART-SPEC.md` | `assets/`, `src/render/palette.js` |
| UI, HUD, UX | `docs/UI-SPEC.md` | `src/styles.css`, `src/ui/`, `index.html` |
| Process, order of work | `docs/ROADMAP.md` | `docs/DECISIONS.md` |

Detailed instructions for the agent in each role: `docs/AGENTS.md`.
