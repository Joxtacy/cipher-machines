# Enigma — guide

Two parts:

1. [How an Enigma machine works](#how-an-enigma-machine-works) — the physics and the cipher.
2. [How to use this simulator](#how-to-use-this-simulator) — every control on the screen, and a worked example.

---

## How an Enigma machine works

### One sentence

Pressing a key advances a rotor, _then_ sends current through a plugboard, through three rotating wired discs, off a reflector, back through the discs and plugboard, and lights up a different letter — so every keypress is enciphered with a different alphabet, and holding down one key spells out a non-repeating stream rather than a block of the same letter.

(Careful: that does **not** mean consecutive outputs are always different. Typing `AA` from rotor position `ADB` on the default machine gives `BB`. What is guaranteed is narrower and more useful: a letter never encrypts to _itself_.)

### The pieces

| Component   | German name          | What it does                                                                                                             |
| ----------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Keyboard    | Tastatur             | 26 letter keys in the German QWERTZU order, 9/8/9 across three rows; pressing one closes a circuit.                      |
| Plugboard   | Steckerbrett         | Up to 10 cables swap pairs of letters before and after the rotors.                                                       |
| Entry wheel | Eintrittswalze (ETW) | Fixed alphabet-to-rotor mapping. On army Enigmas it's the identity: A→A, B→B…                                            |
| Rotors      | Walzen               | Three rotating discs, each with internal wiring that scrambles the alphabet. The operator picks 3 from a set of 5 (I–V). |
| Reflector   | Umkehrwalze (UKW)    | Fixed disc that pairs every letter with one other letter — it's _its own inverse_.                                       |
| Lampboard   | Lampenfeld           | 26 small lamps; the one that lights is the encrypted letter.                                                             |

### The signal path (one keypress)

Read this twice — the second pass is the reverse of the first:

```
key ──► plugboard ──► right rotor ──► middle rotor ──► left rotor
                                                          │
                                                          ▼
                                                       reflector
                                                          │
lamp ◄── plugboard ◄── right rotor ◄── middle rotor ◄── left rotor
```

The reflector is what makes Enigma reciprocal: with the same machine settings, **encryption and decryption are the same operation**. Type the ciphertext, get the plaintext.

It also has a side effect that helped break Enigma: a letter can never encrypt to itself. (Because the path is symmetrical and the reflector pairs distinct letters, A can never come out as A.)

### Rotor wirings (Enigma I, I through V)

Each rotor is a permutation of A–Z plus one notch position:

| Rotor | Wiring (A→Z)               | Notch |
| ----- | -------------------------- | ----- |
| I     | EKMFLGDQVZNTOWYHXUSPAIBRCJ | Q     |
| II    | AJDKSIRUXBLHWTMCQGZNPYFVOE | E     |
| III   | BDFHJLCPRTXVZNYEIWGAKMUSQO | V     |
| IV    | ESOVPZJAYQUIRHXLNFTGKDCMWB | J     |
| V     | VZBRGITYUPSDNHLXAWMJQOFECK | Z     |

Reflectors:

| Reflector | Wiring (A→Z)               | In service                          |
| --------- | -------------------------- | ----------------------------------- |
| UKW-A     | EJMZALYXVBWFCRQUONTSPIKHGD | 1930 until 2 November 1937          |
| UKW-B     | YRUHQSLDPXNGOKMIEBFZCWVJAT | November 1937 to the end of the war |
| UKW-C     | FVPJIAOYEDRZXWGCTKUQSBNMHL | occasional wartime use              |

UKW-A was withdrawn before the war, so wartime traffic is almost all UKW-B. It
is included here because the published 1930 test message needs it — and because
its wiring had to be _reconstructed_ post-war rather than captured.

### Stepping

On each keypress the rotors advance _before_ the circuit closes, like an odometer — so the letter you type is enciphered by the machine's new state, never the state you saw. There is a quirk:

- The **right rotor** steps every keypress.
- When the right rotor passes its notch (e.g. III's notch is V — so when it goes V→W), it kicks the **middle rotor** forward one step.
- When the middle rotor passes its notch, it kicks the **left rotor** forward one step.

That gives a period of 26 × 26 × 26 = 17,576… except for the **double-stepping anomaly**:

> When the middle rotor is sitting on its notch, the next keypress advances the middle rotor again _and_ the left rotor — instead of holding still as a normal odometer would.

So the actual period is **26 × 25 × 26 = 16,900**, not 17,576.

A common way of putting this is that the middle rotor "skips a position" — it doesn't. It visits all 26. What it loses is _dwell time_. Normally the middle rotor sits on one letter for 26 consecutive keypresses, a full revolution of the right rotor. But the moment it lands on its own notch, the next press moves it straight on. Counting presses across one full 16,900-press cycle with rotors I-II-III:

| Middle rotor shows      | Presses per visit | Visits | Total presses |
| ----------------------- | ----------------- | ------ | ------------- |
| E — rotor II's notch    | **1**             | 26     | 26            |
| F — the letter after it | 25                | 26     | 650           |
| the other 24 letters    | 26                | 26     | 676 each      |

`24 × 676 + 650 + 26 = 16,900`. The two disturbed letters account for exactly `17,576 − 16,900 = 676` missing presses. So the machine is not missing a rotor position — it is missing one letter's worth of dwell, twice over.

A canonical demonstration with rotors I-II-III at position ADU:

```
ADU → ADV → AEW → BFX → BFY
              ↑
              middle rotor is on its notch (E),
              so it steps again — and drags the left rotor with it.
```

### Position (Grundstellung) vs ring (Ringstellung)

These two settings are easy to confuse — they're independent.

- **Position / Grundstellung** is _where the rotor currently is_. It's the letter showing in the rotor window. It changes every keypress as the rotor steps. The operator sets the starting position at the beginning of a message.

- **Ring setting / Ringstellung** is the offset between the alphabet ring on the outside of the rotor and the wiring core inside. On a real machine you set it once by lifting the rotor, rotating the ring against the core, and snapping it back. It doesn't move while you type.

The ring setting matters because the notch is cut into the alphabet ring, not the wiring core. That has a consequence people usually get backwards:

- The **turnover letter never moves**. Rotor III always kicks its neighbour when the window goes V→W, whatever the Ringstellung is. The notch and the window letters are on the same ring, so they cannot drift apart.
- What moves is the **wiring**, relative to that turnover point and relative to the window letter. Same visible letter in the window, different permutation behind it.

So changing the Ringstellung does not change _which window letter_ triggers a step — it changes what the machine is wired to do at each step, and therefore where the turnovers fall relative to the message.

In short: **position changes every press; ring is a daily-key setting that doesn't move during operation**.

### The plugboard (Steckerbrett)

10 cables, each connecting two of the 26 sockets, swap those two letters before they enter the rotors and again on the way out. With 10 pairs, 6 letters remain unswapped. The plugboard alone has on the order of 10¹⁴ configurations, and contributed by far the most key space of any component.

### Operating procedure (15 September 1938 – 1 May 1940, simplified)

A unit's daily key (Tagesschlüssel) was a sheet of paper distributed in advance for, say, a month. It specified:

- Which 3 rotors to use, in which order
- Ring setting for each rotor
- Plugboard cable layout
- Reflector

To send a message the operator:

1. Set up the machine per the daily key.
2. Picked an arbitrary starting position (Grundstellung) for _this message_ — say, "QWE".
3. Set the rotors to QWE.
4. Typed a 3-letter message key — say, "ABC" — twice. Wrote down the six letters that lit up.
5. Reset the rotors to ABC (the message key).
6. Typed the actual plaintext, writing down each lit letter as ciphertext.
7. Transmitted **QWE in the clear**, followed by the six-letter enciphered indicator, followed by the ciphertext.

The receiver, with the same daily key, read QWE from the clear indicator, set their machine to QWE, typed the six-letter indicator to recover ABC, set rotors to ABC, then typed the ciphertext to recover plaintext.

Two dates bound this procedure:

- **Until 15 September 1938** the Grundstellung came from the key sheet rather than the operator's choice.
- **On 1 May 1940** the doubling was abandoned — from then on the message key was enciphered only once. The change landed nine days before the offensive against France and the Low Countries, and it cost Bletchley the method it had been leaning on.

(The "type the message key twice" practice was the weakness Polish cryptanalysts exploited from the early 1930s, and what Bletchley inherited — which is why the May 1940 change hurt so much.)

### Why it was breakable

- **No letter encrypts to itself.** This single fact eliminated huge swaths of candidate plaintexts and powered Bletchley's "crib" attacks.
- **Predictable plaintext.** Weather reports often started "WETTERVORHERSAGE", messages ended "HEILHITLER", call signs were standardized.
- **Procedural mistakes.** Repeated message keys, lazy plugboard reuse, sending the same message on Enigma and a weaker cipher.
- **Industrial-scale automation** — the bombe at Bletchley tested rotor positions in parallel, finding settings consistent with a known crib.

The cipher itself was strong; the operating procedures and the no-self-encryption property were what cracked it.

---

## How to use this simulator

### The screen at a glance

```
┌──────────── machine ────────────┐  ┌──── sidebar ────┐
│                                 │  │                 │
│  rotors  (three windows)        │  │  Rotors         │
│  POS letter ▲▼   RING −X+       │  │  (which I–V    │
│                                 │  │   in each slot) │
│  lampboard                      │  │                 │
│  keyboard                       │  │  Reflector B/C  │
│                                 │  │                 │
│  plugboard                      │  │  Reset / clear  │
│                                 │  │                 │
└─────────────────────────────────┘  │  Tape           │
                                     │  Presets        │
                                     └─────────────────┘
```

### Settings you change once per message (the daily key)

1. **Rotors** — sidebar. Choose which of I–V goes in the left, middle, and right slot. The simulator prevents duplicates (real Enigmas had distinct rotors).
2. **Reflector** — sidebar. UKW-B (the standard wartime choice), UKW-C, or UKW-A (pre-1937, needed only for the 1930 message).
3. **Ring (Ringstellung)** — on each rotor in the machine view, the small `−A+` row below the position window. Set it to the daily-key letter for that slot.
4. **Plugboard** — front panel of the machine. Click a letter, then click its pair. Click an already-paired letter to remove it. Up to 10 cables.

### Settings you change per message (the message key)

5. **Position (Grundstellung)** — on each rotor in the machine view, the big window showing a letter, with `▲` and `▼` to advance it. Set this to the starting letters for _this_ message.

### Encrypting

- Click the keys with your mouse, **or** just type letters on your physical keyboard.
- The lamp above the keyboard lights up the cipher letter for each press. The right-side **Tape** records the running plaintext (top) and ciphertext (bottom), grouped in 5-letter blocks. Click either tape to copy it.
- The rotors visibly step on each press — watch the right rotor advance every time.

### Decrypting

Same setup, same starting position, type the ciphertext, get the plaintext back. Enigma is reciprocal — there is no "decrypt" mode, just type with the same configuration.

### Message, rewind and reset

The sidebar separates three things a real operator kept separate:

| Button            | Rotor windows                    | Daily key        | Tape    |
| ----------------- | -------------------------------- | ---------------- | ------- |
| **Rewind to XXX** | back to where this message began | untouched        | cleared |
| **New message**   | left where they are              | untouched        | cleared |
| **Reset machine** | back to AAA                      | back to defaults | cleared |

**Rewind** is what you want after enciphering something: it puts the windows back
so you can immediately type the ciphertext and read your plaintext. The button
label tells you which position it will return to, and it is disabled when no
message is in progress.

**New message** carries on from wherever the rotors now stand. That is not a
convenience invention — look at the 16 September 1941 keys in
`docs/historical-keys.md`, where messages 69, 70 and 71 each begin exactly where
the previous one stopped. The operator did not rewind between them.

**Reset machine** is a new day and a new key sheet.

### Presets

Bottom of the sidebar. Save the current configuration (rotor choice and order, ring settings, reflector, plugboard, and current rotor positions) as a named preset. Load a preset to restore everything in one click. On the desktop app these are real JSON files in your OS app-data directory; in the browser they live in localStorage.

Because those files are editable by hand, every preset is validated on load. A preset with an unknown rotor, an out-of-range ring, a duplicated plugboard letter or more than 10 cables is refused with an explanatory message, and the machine is left exactly as it was.

### Worked example

A small reproducible round trip:

1. **Reset machine** (sidebar) so everything is at defaults. Note this restores the _whole_ machine — rotor choice, rings, reflector and plugboard included. To move only the rotor windows, use **Rewind** instead.
2. Default config: rotors **I–II–III**, rings AAA, plugboard empty, reflector **B**, positions AAA.
3. Type **HELLO** on your keyboard. The tape will read:

   ```
   Plain   HELLO
   Cipher  ILBDA
   ```

4. Click **Rewind to AAA** in the sidebar's _Message_ group. This winds the rotor windows back to where the message started and clears the tape, leaving the daily key — rotors, rings, reflector, plugboard — untouched.
5. Type the ciphertext **ILBDA**. The tape's lower line will read **HELLO**.

That round trip — same machine state going in, same plaintext coming back — is the reciprocity of the reflector at work.

### Tips

- **Want to test ring setting?** Set position to A on every rotor, type A, note the lamp letter. Reset, change the right rotor's ring from A to B, type A again — different lamp letter. The cipher genuinely depends on ring setting even though the visible letter in the window didn't change.
- **No letter to itself.** Type the same letter many times — the lamp will never light that same letter. This is a deliberate property, not a bug.
- **Spaces and digits pass through unchanged.** Real Enigmas only had A–Z and used "X" as a separator; this simulator just leaves anything non-letter alone.

---

## Another machine

`docs/purple.md` covers the Japanese **PURPLE** simulator on the other tab —
stepping switches instead of rotors, a 6/20 alphabet split, and no reflector, so
it is not reciprocal and a letter _can_ encipher to itself. Reading the two side
by side is the quickest way to see which of Enigma's properties were inherent to
rotor machines and which were choices.

## References

- [Wikipedia — Enigma machine](https://en.wikipedia.org/wiki/Enigma_machine)
- [Wikipedia — Enigma rotor details](https://en.wikipedia.org/wiki/Enigma_rotor_details) (wirings, notches, double-stepping)
- [Wikipedia — Cryptanalysis of the Enigma](https://en.wikipedia.org/wiki/Cryptanalysis_of_the_Enigma)
- [palloks JS Enigma simulator](https://palloks.2ix.de/enigma/index_en.html) — useful for cross-checking the cipher with another implementation.
