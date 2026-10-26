# Release notes

## 2026-10-26: Consistent play speed and shake recovery

Physics, collisions, score animation and effects now follow the original 60 Hz
update rate on 30, 60, 90, 120 and 144 Hz displays. Rendering no longer advances
particle rotation, divider wobble or the shared random sequence. Short frame
gaps catch up by at most six updates; gaps over 250 ms and hidden-tab transitions
discard elapsed-time debt so a returning ball is not fast-forwarded.

Screen shakes now draw inside a balanced canvas scope. Finishing or retriggering
a shake cannot leave the board permanently translated or leak saved canvas
states. The board, scoring rules, art, controls, credits and About content remain
unchanged. Rendering shows the latest resolved state; 60 Hz game-state and random
sequence parity are tested against the prior public runtime.
