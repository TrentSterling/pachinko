# Cadence and canvas regressions

`node --test tests/gameplay/timing.cjs` runs seven CPU tests against the original
page script with a deterministic DOM/canvas mock and local-only closure access.
The canvas model records affine transforms, stack depth and empty restores.
Tests cover seeded complete drops at 30/60/90/120/144 Hz, pure rendering,
retriggered shakes, frame gaps, visibility/clock reset, collisions and repeated
prizes. Audio initialization throws in the mock and is never invoked.

`node tests/gameplay/browser.cjs` runs the additive scene-method browser gate
with Playwright Chrome. CI installs Playwright alongside the existing About
gate. Five cadence cases each check complete play, repeated shakes, canvas
identity, long stalls, hidden/resume state, rendering purity and locked audio.
Set `PACHINKO_LIVE_URL` to exercise the deployed page with the same local-only
test access. No pointer/keyboard input or audio actions are used by this gate.

Browser instrumentation exposes the existing game closure when its normal
DOMContentLoaded callback is registered; production functions are unchanged.
It counts native canvas saves/restores and uses controlled callback timestamps.
It is not native display-refresh or physical-input qualification. Tests wait
for complete document initialization before comparing equal seeded state: the
shared About component also consumes random draws during startup. Starting at
the earlier game-hook readiness marker produced an inconsistent fixture and
was corrected; source behavior and assertions were not weakened.

The timing policy is explicit: original fixed 60 Hz ticks, at most six ticks
for a moderate frame gap, discard gaps greater than 250 ms, and reset elapsed
debt on visibility transitions. One original startup update is preserved.
The existing About contract and browser gates remain in place unchanged.
