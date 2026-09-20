# How to work with your agent

Four people, four agents, four separate memories. This document describes how
to work so that the team does not drift apart and does not burn its limits.

## Rules shared by every role

**Start from the repo, not from narrating context.** The first instruction in
a new session sounds roughly like this:

> Read CLAUDE.md and docs/ARCHITECTURE.md, then tell me what you intend to do
> about <task> before you start writing code.

An agent that has read the documents does not need forty messages of
explanation. That is at once the biggest token saving and the strongest
protection against the team drifting apart.

**One long session per area, not a new session per question.** Context the
agent already has is free. Rebuilding it costs every single time.

**Ask for a plan before implementation.** "Tell me what you will do before you
do it" costs a few hundred tokens and saves generating a file that goes
straight in the bin.

**Small diffs.** An agent you allow to rewrite a whole file will do exactly
that — and review becomes impossible. Ask for changes to specific fragments.

**Do not let the agent close open decisions.** If `DECISIONS.md` says
something is open, the agent is to ask about it, not pick a variant and move
on.

**Verify that the tests pass.** An agent can write that it is finished without
having run anything. `npm test && npm run build && npm run size` is the
minimum before a task counts as closed.

---

## Role: code

**Your files:** `src/`, `tests/`, `scripts/`, `vite.config.js`
**Your document:** [`ARCHITECTURE.md`](ARCHITECTURE.md)

Opening a session:

> Read CLAUDE.md, docs/ARCHITECTURE.md and docs/ROADMAP.md. We are working on
> <milestone>. Propose a breakdown into steps, each ending with passing tests.

Watch on every change:

- whether anything leaked from Three.js into `src/core/`,
- whether a new effect has a pool or allocates in the loop,
- whether a new number regulating gameplay went into `config/tuning.js` (or
  `config/ingredients.js`) rather than into the code,
- whether `npm run size` still passes.

For changes in `src/platform/playgama.js`, give the agent the **current SDK
documentation**, not the instruction "integrate Playgama". The agent will fill
it in from memory and it will probably come out wrong.

---

## Role: gameplay

**Your files:** `config/tuning.js`, `config/ingredients.js`, `docs/GDD.md`
**Your document:** [`GDD.md`](GDD.md)

You do not have to write code. Your workflow:

1. Open the published game on a phone → **Tuning**.
2. Tune live while playing. Press `H` to see what the code actually tests.
3. **Copy** → paste the numbers into `config/tuning.js` → commit.
4. In the commit message write **what changed in the feel**, not which numbers.

To the agent:

> Read docs/GDD.md and config/tuning.js. I want <description of the feel>.
> Which parameters control that and which way should I move them?

Describe the feel, not the solution. "Objects fall too fast, I cannot get
ready for a second cut in time" is useful. "Lower gravity by 3" takes away the
agent's chance to tell you the problem is somewhere else.

---

## Role: art

**Your files:** `assets/`, `src/render/palette.js`, `src/styles.css`, `src/ui/`
**Your documents:** [`ART-SPEC.md`](ART-SPEC.md), [`UI-SPEC.md`](UI-SPEC.md)

The 2D layer is entirely yours and you can work on it right away. The 3D layer
is waiting for decision D-006 to be settled.

To the agent when working on the interface:

> Read docs/UI-SPEC.md and src/styles.css. I am designing <element>.
> Tell me which tokens to use and where to hook it in before you write CSS.

To the agent when working on models:

> Read docs/ART-SPEC.md. Check whether this model meets the contract:
> <description or file>. List specifically what does not comply.

Before handing a model over, check it yourself: render at 120 px, three random
rotations, background `#070912`. If you cannot tell it apart from another
ingredient, the silhouette is too weak — and no agent will tell you that.

---

## Role: process

**Your files:** `docs/ROADMAP.md`, `docs/DECISIONS.md`
**Your documents:** all of them

Your job is making sure the repo still matches reality. Three concrete things:

1. **Read PR descriptions, not code.** A description has to say what and why.
   If it does not — send it back.
2. **Catch decisions nobody wrote down.** Every conversation that ends in an
   agreement goes into `DECISIONS.md` the same day. After a week nobody
   remembers the rationale, and an agreement without its rationale is
   worthless.
3. **Guard the gates in `ROADMAP.md`.** Especially the M2 gate — it is the
   only safeguard against the team spending three weeks polishing a clone.

To the agent:

> Read docs/DECISIONS.md and docs/ROADMAP.md, then look through the recent
> commits. Which changes introduced decisions that are not in the log?
