# PURPLE (Type B Cipher Machine) — implementation plan

**Verdict: feasible, and verifiable to the same standard as our Enigma.** The
complete internal wiring is published, and there is a real historical message
with both ciphertext and plaintext to test against.

## What PURPLE actually is

"PURPLE" is the US codename for the Japanese Foreign Ministry's **Type B Cipher
Machine** (*97-shiki ōbun inji-ki*, *Angooki Taipu B*), in service from 1939.

It is **not** a rotor machine. Almost nothing from our Enigma engine transfers:

| | Enigma | PURPLE |
|---|---|---|
| Mechanism | 3 rotating wired discs | 4 telephone **stepping switches** (uniselectors) |
| Alphabet | one 26-letter path | split into **6 letters + 20 letters**, enciphered separately |
| Reciprocal? | Yes — reflector | **No.** Separate encipher/decipher paths |
| Letter → itself? | Never (the fatal weakness) | **Possible** — no reflector, so no such crib |
| Stepping | odometer + double-step anomaly | one of three switches steps per character, driven by a fourth |
| Key material | rotor order, rings, plugboard | daily alphabet, 4 switch positions, fast/middle/slow assignment |

The 6/20 split is the defining feature, inherited from the earlier RED machine
(Type A). In RED the "sixes" were permanently the vowels `AEIOUY`; in PURPLE the
sixes group is set by the plugboard alphabet and **changed every nine days**.

That non-reciprocity matters for us: our whole Enigma test strategy leans on
"encrypt twice returns the plaintext". That property does not exist here, so
round-trip tests must explicitly run encipher and then decipher.

## Mechanism

```
              ┌──────────── 6 letters ────────────┐
keyboard ──► input     ┌─► sixes switch (25 pos) ──┴──┐   output
             plugboard │                              ├─► plugboard ──► printer
                       └─► S1 ─► S2 ─► S3 ────────────┘
                          └── 20 letters, 3 stages in series ──┘
```

- **Input plugboard** — a permutation of the 26 letters. Index `< 6` routes to the sixes switch; index `>= 6` routes (minus 6) into the twenties chain.
- **Sixes switch** — 6 layers, 25 positions. Each position is a permutation of the 6 sixes letters.
- **Twenties stages S1, S2, S3** — each 20 layers × 25 positions, in series. Each position is a permutation of the 20 twenties letters.
- **Output plugboard** — inverse of the input permutation.
- **Direction matters**: deciphering runs the twenties chain in the *opposite* stage order to enciphering. There is no reflector to make the two identical.

### Stepping

- The **sixes switch steps on every character**, always.
- **Exactly one** twenties switch steps per character. Which of S1/S2/S3 is "fast", "middle" and "slow" is part of the message key — 6 possible assignments.

The rule, with positions 0-based (so `24` is the 25th and last position):

```
latch sixes_pos and middle_pos BEFORE stepping anything
step sixes
if   sixes_pos == 23 and middle_pos == 24 → slow steps
elif sixes_pos == 24                      → middle steps
else                                      → fast steps
```

## Two traps

These are the PURPLE equivalent of Enigma's double-stepping anomaly, and both
are the kind of bug that produces *correct output for hundreds of characters*
before drifting.

**1. The slow switch fires one step early.** Wikipedia's prose says the slow
switch steps when the sixes switch is in its 25th position and the middle switch
is too. The working reference implementation instead fires the slow switch when
sixes is at the **24th** position (`23`) and middle is at the 25th — and the
middle switch then steps on the following character. These differ, and the
window where they disagree comes up roughly every 625 characters. Our test
message is ~1,900 characters, so it *will* expose the difference. Treat the
narrative description as unreliable and the message decryption as the arbiter.

**2. Latch before stepping.** The stepping decision must read the sixes and
middle positions *before* anything advances. The reference implementation
flags this as "crucial" in a comment. Stepping the sixes switch first and then
testing its position is off by one.

## Verification target

**The 14-part message of 7 December 1941** — Japan's note breaking off
negotiations, delivered in Washington after the attack on Pearl Harbor. Part 1
is published with ciphertext and plaintext aligned character for character,
including the garbles as transmitted.

Key (US codebreakers' shorthand):

```
switches: 9-1,24,6-23
alphabet: NOKTYUXEQLHBRMPDICJASVWGZF
```

Read as: sixes switch starts at 9; twenties S1/S2/S3 start at 1, 24, 6;
fast switch = 2, middle switch = 3, therefore slow = 1.

Ciphertext opens `ZTXODNWKCCMAVNZXYWEETUQTCIMNVEUVIWBLUAXRRTLVA`, deciphering to
`FOVTATAKIDASINIMUIMINOMOXIWOIRUBESIFYXXFCKZZR` — Japanese romaji preamble,
switching to English (`MEMORANDUM`, `THEGOVE-NMENTOFJAPAN`) shortly after.
1,285 characters with 28 garble positions marked `-`, which the test skips
rather than asserts. (An earlier draft of this document estimated ~1,900 — the
measured length is 1,285.) Crucially that is longer than 624, so the message
crosses the slow-switch event and cannot pass with a wrong stepping rule.

## Wiring data

Published in **Freeman, Sullivan & Weierud, "PURPLE Revealed: Simulation and
Computer-aided Cryptanalysis of Angooki Taipu B"**, *Cryptologia* 27(1), 2003 —
[PDF is public](https://cryptocellar.org/pubs/purple-revealed.pdf). 100
permutation rows total: 25 × 6 for the sixes, 25 × 20 for each twenties stage.

I validated the tables as published in the MIT-licensed Python reference
implementation: **all 100 rows are valid permutations**, no malformed data.

Two provenance caveats to carry into the code:

- That data was **OCR'd from the paper**, per its own header comment. A validation pass belongs in the test suite, not a code comment.
- **Sixes positions 5 and 8 are identical** (`[3,6,1,4,5,2]`). Every other row across all four switches is unique. This is either a genuine feature of the physical switch or an OCR artifact that happened to produce a valid permutation. It should be checked against the paper's own tables before we trust it — and it is exactly the kind of thing the 14-part message decryption would catch.

## Plan

**Phase 1 — engine — DONE.** 50 tests, verified against the 14-part message.

| File | Contents |
|---|---|
| `src/lib/purple/data.ts` | the 100 permutation rows, 1-based as published, with a source citation |
| `src/lib/purple/switch.ts` | `SteppingSwitch` — 25 positions, `step()`, `forward()`, `reverse()` |
| `src/lib/purple/plugboard.ts` | 26-letter alphabet permutation + the 6/20 routing |
| `src/lib/purple/machine.ts` | `Purple97` — wiring the four switches, the stepping rule, `encrypt`/`decrypt`, `parseKey('9-1,24,6-23')` |
| `tests/purple/*.test.ts` | table validation (all rows are permutations), switch mechanics, stepping-sequence unit tests, and the 14-part message decryption |

Built as `data.ts` + `machine.ts` + `index.ts` — the `SteppingSwitch` class is
small and has no independent use, so it lives in `machine.ts` rather than its own
file. Tests are split across `data`, `stepping`, `machine` and `historical`.

Both traps are pinned. `tests/purple/stepping.test.ts` derives the first
slow-switch character independently of the implementation — the middle switch
reaches position 24 at character 599, so the slow switch fires at character
**623** (0-based), not 624 as the common description implies — and asserts the
middle switch takes its step on the character after.

**Phase 2 — UI — DONE.**

PURPLE shares almost no controls with Enigma. No lampboard (it drove a printing
typewriter), no rotor windows, no cable plugboard — instead: an alphabet entry
field, four switch-position dials, a fast/middle/slow selector, and an
encipher/decipher mode toggle, because it is not reciprocal.

Built as a single `PurpleMachine.svelte` — switch dials, role selectors, the
alphabet field and the mode toggle are all small enough to live inline rather
than as four more components. It reuses `Keyboard`, `Tape` and `PresetManager`
(now generic via `<script lang="ts" generics="T">`), plus the theme tokens.

Nav lives in `+layout.svelte`; routes are `/` and `/purple`.

Storage from phase 2 of the decision above landed first: `purplePresets` is a
`PresetsStore<PurpleKey>` on the `purple` namespace, so preset names cannot
collide between machines.

**Phase 3 — docs — DONE.**

`docs/purple.md` is the usage and mechanism guide, with its concrete claims
pinned in `tests/purple/guide.test.ts`. `docs/historical-keys.md` gained the
14-part message as a verified entry; its full ciphertext stays in
`tests/purple/fourteen-part-message.ts` rather than being copied into the doc,
so the two cannot drift.

## The one decision I need from you

Phase 1 is self-contained and I can start now. Phase 2 forks:

**(a) One app, machine switcher.** A route or toggle picking Enigma or PURPLE, shared theme and Tape. The repo becomes a cipher-machine collection — which means renaming it, since `enigma-machine` stops describing it.

**(b) Separate app, shared engine package.** Keep this repo Enigma-only; PURPLE gets its own UI, importing a shared cipher core. Cleaner separation, more scaffolding.

**(c) Engine only, no UI.** Build and verify the cipher, drive it from tests and
maybe a small CLI. Cheapest path to "we implemented PURPLE", and defers the UI
question until you know whether you actually want to operate it interactively.

### Decided: (a), built in the order of (c)

Initial recommendation here was (c)-then-decide, calling (a) a trap on the
grounds that it drags in a rename plus navigation plus two divergent UIs. That
reasoning was wrong on two counts:

- **The rename is free.** No VCS, no remote, no CI in this project — it is `mv` and a `package.json` field.
- **The two divergent UIs are a wash.** PURPLE needs its own component tree under *every* option, so it cannot discriminate between them.

Remove those and (a) is strictly less machinery than (b) for the same outcome:
one build, one Tauri shell, one deploy, one theme, one storage layer. (b) would
only win if the engine were to be published as a reusable library, or if the two
apps needed different dependencies or deploy targets. Neither applies here.

Measured coupling that (a) has to clear:

| Location | Enigma-specific references |
|---|---|
| `storage/driver.ts` | 3 × `MachineConfig` |
| `storage/localStorage.ts` | 1, plus the `enigma:presets` key |
| `storage/tauriFs.ts` | 1 |
| `state/presets.svelte.ts` | 3 |

About 20 lines: make `PresetDriver` generic over its config type and namespace
the storage key per machine. Worth doing on its own merits — the storage layer
has no business knowing what a rotor is.

Build order stays (c)-first, because Phase 1 is identical under any option:

1. `src/lib/purple/` engine, verified against the 14-part message.
2. Generic-ise the storage layer.
3. Machine switcher and PURPLE UI.

## Sources

- [Wikipedia — Type B Cipher Machine](https://en.wikipedia.org/wiki/Type_B_Cipher_Machine) (architecture, sixes/twenties split, service history)
- [Freeman, Sullivan & Weierud, "PURPLE Revealed", *Cryptologia* 27(1), 2003](https://cryptocellar.org/pubs/purple-revealed.pdf) (wiring tables, keying procedure, 14-part message)
- [Frode Weierud's CryptoCellar — PURPLE machine](https://cryptocellar.org/simula/purple/index.html)
- [gremmie/purple](https://github.com/gremmie/purple) — MIT-licensed Python reference implementation; source of the validated tables and the working stepping rule
