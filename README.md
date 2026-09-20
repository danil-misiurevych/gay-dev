# Slice Lab

A browser game: an intergalactic bar where the player slices flying
ingredients to fill orders from alien customers. Target: Playgama, then
YouTube Playables. Monetisation through ads only.

**Project state:** the slicing mechanic works and can be tuned on the device.
The orders layer does not exist yet — that is the next milestone and the thing
meant to set the game apart from the clones. See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Start

Node 20 or newer required.

```bash
npm install
npm run dev        # http://localhost:5173, also reachable from a phone on the same network
```

```bash
npm test           # core tests, no browser
npm run build      # production bundle in dist/
npm run size       # bundle size budget
npm run preview    # preview the built version
```

In game: `P` — pause, `H` — hitbox preview. The **Tuning** button opens a live
panel for the mechanics; it exports settings as JSON to paste into
`config/tuning.js`.

To test on a phone through a tunnel (ngrok, cloudflared), the host suffixes are
already allowed in `vite.config.js` under `server.allowedHosts`.

## Structure

```
config/tuning.js       gameplay parameters — owner: gameplay
config/ingredients.js  ingredient catalog — owner: gameplay
src/core/              game logic, no Three.js and no DOM, testable in node
src/render/            Three.js: scene, objects, effects
src/input/             pointer handling (mouse, touch, stylus)
src/ui/                HUD, 2D overlay, tuning panel
src/platform/          platform adapter (web, Playgama)
src/fonts/             fonts, local — zero outside requests
tests/                 core tests
docs/                  documentation — see below
assets/                art sources and exports
scripts/check-size.mjs bundle budget check
```

## Documentation

| Document | For whom | About |
|---|---|---|
| [`CLAUDE.md`](CLAUDE.md) | every AI agent | the rules we do not break |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | dev | layer split, data flow, performance |
| [`docs/GDD.md`](docs/GDD.md) | gameplay | concept, game loop, parameters |
| [`docs/ART-SPEC.md`](docs/ART-SPEC.md) | art | the contract for models and colors |
| [`docs/UI-SPEC.md`](docs/UI-SPEC.md) | UX/UI | HUD, tokens, interface rules |
| [`docs/AGENTS.md`](docs/AGENTS.md) | everyone | how to work with your agent in your role |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | everyone | the order of work and why |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | everyone | decision log |

## How we work

The repository is the only source of truth. An agreement that is not in the
repo does not exist — four people work with four agents with separate
memories, and this is the only way not to drift apart.

1. Concept written down in `docs/GDD.md` → approved by the team.
2. A branch per change, a PR into `main`. The PR description says **what and
   why**, not how.
3. CI runs the tests, the build and the size check. Red CI = the PR does not land.
4. A merge into `main` publishes to GitHub Pages automatically.
5. Everyone plays on the published link. Conclusions go back into
   `docs/DECISIONS.md`.

The review surface is the working game behind the link, not screenshots.

## Publishing

Once GitHub Pages is enabled (Settings → Pages → Source: GitHub Actions), every
merge into `main` deploys `dist/` automatically. The build uses relative paths,
so the same bundle works in a subdirectory on Pages, at the root on Netlify and
in a zip for Playgama.
