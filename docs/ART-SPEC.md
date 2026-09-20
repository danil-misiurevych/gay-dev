# Art specification

The contract between art and code. A document for the art person and their
agent.

> **Open decision (D-006).** It has not been settled yet whether the 3D models
> are made in-house in Blender or whether we take CC0 assets and style them
> with color. The "3D models" section applies in both cases — the only
> difference is who produces the mesh. Close this before the first model, not
> after the tenth.

## Division of roles in graphics

Ten years in UX/UI is not the same as art for a 3D game. These are two
different crafts and it is better to separate them deliberately.

**The 2D layer** — HUD, order screens, onboarding, icons, typography, visual
feedback. The natural territory of the UI designer, who can take it whole.
Specification: [`UI-SPEC.md`](UI-SPEC.md).

**The 3D layer** — sliced ingredients and the bar background. Requires tools
and habits from gamedev, not from interface design. Below.

## The most important rule: silhouette, not detail

An object crosses a phone screen in about a second, rotating, against a dark
background. The player reads it by **outline and color**. Texture detail is
invisible and is pure cost — in memory, in bundle size and in time.

The acceptance gate for a model is:

> Does it read at 120 px, in motion, while rotating?

not "does it look nice in a preview at 100%". That is a habit you have to
change deliberately when coming from interface design.

A practical test: render the model at 120 px, in three random rotations,
against `#070912`. If in any of those rotations it cannot be told apart from
another ingredient — the silhouette is too weak.

## Requirements for a sliceable ingredient model

A model that does not meet these points **cannot be sliced** — and that only
surfaces at integration time, after a week of your work.

| Requirement | Value | Why |
|---|---|---|
| Split into halves | two separate meshes, cut axis = local Z | the code rotates halves so local +Z lines up with the cut direction |
| Cut face cap | a separate mesh and a separate material | the cut face gets its own emissive term; it is the "the cut landed" signal |
| Origin | centre of mass of the whole object, the same for both halves | otherwise the halves "jump" sideways on the cut |
| Scale | longest dimension = 1.0 units | the code scales an object with a single number (`radius`) |
| Triangle budget | up to 400 for the whole object (both halves together) | there can be 4–8 objects on screen plus halves |
| Textures | none, ideally; if necessary — one 512×512 atlas | bundle size and draw call count |
| Shading | flat shading, no normal maps | the style is stylised, and flat facets read the rotation |
| Format | glTF 2.0 binary (`.glb`), Y up, metres | the only format loaded without extra plugins |
| Naming | `<ingredient>_half_a.glb`, `<ingredient>_half_b.glb` | the code pairs halves by name |

Export from Blender: **Apply Modifiers** on, **+Y Up** on, cameras and lights
off, animations off (at this stage).

Source files (`.blend`) → `assets/source/`. Exports (`.glb`) → `assets/models/`.

## Colors

The ingredient palette lives in `src/render/palette.js` and that file belongs
to art. A color index is what the game logic stores — the core knows nothing
about hex values, so swapping the palette does not touch code.

The rule for picking them, more important than aesthetics: **colors must
differ in brightness, not only in hue.** An object is visible for a fraction
of a second against a dark background and is read by contrast. Two colors of
the same brightness but different hue blur into one in motion.

Palette index 6 is reserved: it is the decoys' grey, the one colourless entry.
Nothing real may use it, and it should stay mid-brightness — a decoy darker
than the background stops being a fair thing to avoid. See `DECISIONS.md`,
D-020.

The cut face color is derived automatically: the skin color lightened by
`FLESH_MIX`. If an ingredient needs different flesh, that is a change in
`palette.js`, not in the model.

## What not to do

- Do not model detail that is invisible at 120 px.
- Do not add normal maps or PBR — the style is flat, on purpose.
- Do not raise texture resolution "just in case". The bundle budget is hard
  and checked by CI.
- Do not change scale or origin after a model has gone into the code without
  an entry in `DECISIONS.md` — it silently breaks gameplay tuning.
- Do not hand over a model you have not looked at rotating against the target
  background.

## Bar background and atmosphere

Not designed yet. A constraint set up front: the background must not compete
in contrast with the flying ingredients. Anything bright and contrasty in the
background takes readability away from what the player is actually aiming at.
The safe direction is a dark, low-contrast environment with point highlights.
