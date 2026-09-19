import { v3 } from './vec3.js';

/** Rodzaje obiektow. BOMB i pozostale trafia tu, gdy powstana — patrz docs/ROADMAP.md. */
export const KIND = {
  INGREDIENT: 'ingredient',
};

let nextId = 1;
export const resetIds = () => { nextId = 1; };

export function createEntity({ kind = KIND.INGREDIENT, radius = 0.7, colorIndex = 0 } = {}) {
  return {
    id: nextId++,
    kind,
    radius,
    colorIndex,
    pos: v3(),
    vel: v3(),
    rot: v3(),
    spin: v3(),
    alive: true,
  };
}
