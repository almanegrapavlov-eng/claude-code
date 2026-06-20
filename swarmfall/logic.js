// Solo game: all gameplay runs client-side in index.html / src/.
// The platform still requires a code module at the zip root, so this is the
// minimal stub rules module (no imports, no timers) per the apps-engine contract.
export const meta = { game: "swarmfall", minPlayers: 1, maxPlayers: 1 };
export function setup() { return {}; }
export function validateAction() { return { ok: true }; }
export function applyAction(state) { return state; }
export function isGameOver() { return { over: false }; }
export function viewFor(state) { return state; }
