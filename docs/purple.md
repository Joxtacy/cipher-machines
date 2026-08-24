# PURPLE — guide

Two parts:

1. [How the Type B Cipher Machine works](#how-the-type-b-cipher-machine-works) — the mechanism and the cipher.
2. [How to use this simulator](#how-to-use-this-simulator) — every control, and a worked example.

If you have read `docs/guide.md`, expect almost nothing to carry over. PURPLE and
Enigma solve the same problem with completely different hardware.

---

## How the Type B Cipher Machine works

### One sentence

Pressing a key sends current through a plugboard that splits the alphabet into a
group of 6 letters and a group of 20, through a stepping switch for the sixes or
three stepping switches in series for the twenties, back out through a second
plugboard, and onto a printing typewriter — and one switch advances per
keystroke, chosen by where the other switches happen to be standing.

### The names

The machine was Japanese: **97-shiki ōbun inji-ki** ("Type 97 European-letter
printing machine"), commonly **Angooki Taipu B**, "Type B Cipher Machine". Its
predecessor was Type A, which Allied codebreakers called RED; Type B they called
**PURPLE**, and that is the name that stuck in English. It entered service in
1939 and carried Japanese Foreign Ministry traffic, not military traffic.

### Not a rotor machine

|                   | Enigma                        | PURPLE                                               |
| ----------------- | ----------------------------- | ---------------------------------------------------- |
| Mechanism         | 3 rotating wired discs        | 4 telephone **stepping switches**                    |
| Alphabet          | one 26-letter path            | split **6 + 20**, separate paths                     |
| Reciprocal?       | yes, via the reflector        | **no**                                               |
| Letter to itself? | never                         | **possible**                                         |
| Output            | 26 lamps                      | printing typewriter                                  |
| Key material      | rotor order, rings, plugboard | daily alphabet, 4 switch positions, speed assignment |

A **stepping switch** (or uniselector) is a telephone-exchange part: a wiper arm
sweeping a semicircle of contacts, advanced one contact at a time by an
electromagnet and ratchet. PURPLE used them as its cryptographic core. Nothing
rotates continuously; everything clicks between 25 discrete positions.

### The sixes and the twenties

This is the machine's defining feature, inherited from RED. The input plugboard
splits the 26 letters into two groups which never mix:

- **6 letters** go to a single stepping switch of 25 positions, each position a permutation of those 6 letters.
- **20 letters** go through three stages in series — I, II, III — each 25 positions, each position a permutation of those 20.

On RED the six were permanently the vowels `AEIOUY`, which was itself a
weakness: vowel-heavy romaji stayed vowel-heavy in the ciphertext. PURPLE made
the group part of the daily key, **changed every nine days**.

A letter from the sixes group can only ever come out as one of the six. That
partition holds absolutely, and it is easy to observe in the simulator.

### The signal path

```
              ┌──────────── 6 letters ────────────┐
keyboard ──► input     ┌─► sixes switch (25 pos) ──┴──┐   output
             plugboard │                              ├─► plugboard ──► printer
                       └─► I ──► II ──► III ──────────┘
                          └── 20 letters, in series ──┘
```

### No reflector, and what that costs

Enigma's reflector bought reciprocity — one operation both enciphers and
deciphers — at the price of guaranteeing no letter ever maps to itself, which is
exactly the crib Bletchley built its attacks on.

PURPLE made the opposite trade. Deciphering runs the twenties chain in the
**reverse stage order**, so encipher and decipher are genuinely different
operations and the machine needs a mode switch. In exchange, a letter _can_
encipher to itself, and the no-fixed-point crib simply does not exist.

That is a real cryptographic improvement over Enigma. PURPLE was broken anyway —
by Frank Rowlett's team at the US Army's Signal Intelligence Service, who
reconstructed the machine without ever seeing one, and built working analogues
from telephone parts.

### Stepping

The sixes switch steps on **every** character. Exactly **one** twenties stage
steps per character. Which stage plays which role is part of the key: one is
**fast**, one **middle**, one **slow** — six possible assignments, and the
message header said which.

With positions numbered 1–25:

- Normally the **fast** switch steps.
- When the sixes switch stands at 25, the **middle** switch steps instead.
- When the sixes switch stands at **24** and the middle switch stands at 25, the **slow** switch steps — and the middle switch takes its step on the following character.

That third rule is worth staring at, because it is commonly written down wrong
(including on Wikipedia, which says the slow switch fires when the sixes and
middle switches are _both_ at 25). The difference only shows up around character
624, so a wrong implementation looks perfect on any short message. It is
PURPLE's counterpart to Enigma's double-stepping anomaly.

Concretely, from all switches at position 1: the middle switch reaches position
25 on the **600th** character, and the slow switch first fires on the **624th**.
Under the misreading above it would fire on the 625th.

### The key

A daily key specified:

- The **alphabet**: how the 26 keyboard letters map to plugboard positions, which also determines the sixes group. Changed every nine days.
- The **starting positions** of all four switches.
- The **speed assignment**: which twenties stage is fast, which middle.

US codebreakers wrote the switch part in a shorthand this simulator accepts:

```
9-1,24,6-23
│ │  │ │  ││
│ │  │ │  │└── middle switch = stage 3
│ │  │ │  └─── fast switch   = stage 2
│ │  │ └────── stage III starts at 6
│ │  └───————— stage II starts at 24
│ └─────────── stage I starts at 1
└───────────── sixes switch starts at 9
```

All positions are 1-based, matching the dials in the simulator.

---

## How to use this simulator

Open `/purple`, or the **PURPLE** tab at the top.

### The screen

```
┌──────────────── machine ────────────────┐  ┌───── sidebar ─────┐
│  PURPLE          [Encipher] [Decipher]  │  │  Daily alphabet   │
│                                         │  │  Switch speeds    │
│  Sixes    I      II     III             │  │  Reset            │
│   09     01      24      06             │  │  Tape             │
│                                         │  │  Presets          │
│  printer:  J                            │  └───────────────────┘
│  keyboard                               │
└─────────────────────────────────────────┘
```

### Settings

1. **Daily alphabet** — sidebar. 26 distinct letters. Type it and click **Apply**; the field stays draft until then, so a half-typed alphabet never reaches the machine. Confirm the **sixes group** shown above the field is what you expect. **Apply** is disabled until the alphabet is valid.
2. **Switch speeds** — sidebar. Three rows, one per speed. Pick the fast and middle stages; the **slow** row is read-only, showing whichever stage is left over — it is derived, and choosing it directly would be ambiguous about which of the other two becomes fast. Picking a stage that already holds the other role swaps them rather than producing an impossible setting.
3. **Dials** — the four windows, `▲`/`▼` to advance. 1-based, so the shorthand `9-1,24,6-23` means `09`, `01`, `24`, `06`.
4. **Mode** — top right. **Encipher** or **Decipher**. There is no reciprocity here, so this genuinely matters.

### Typing

Mouse or physical keyboard. The **printer** strip shows the last output
character. The **Tape** records input on top and output below.

When deciphering, `-` enters a **garble**: it passes through to the output and
still steps the switches, which is what keeps the rest of a damaged intercept in
alignment. It is rejected in Encipher mode, where it would be meaningless.

### Reading the tape

The tape labels are literal: **Plain** is what you typed, **Cipher** is what came
out. When you are deciphering, that means your recovered plaintext is on the
**Cipher** line. The tape does not know which direction you are running.

### Message, rewind and reset

| Button                    | Dials                            | Alphabet & speeds | Tape    |
| ------------------------- | -------------------------------- | ----------------- | ------- |
| **Rewind to NN NN NN NN** | back to where this message began | untouched         | cleared |
| **New message**           | left where they are              | untouched         | cleared |
| **Reset machine**         | back to `01`                     | back to defaults  | cleared |

Mode is left alone by Rewind: direction is an operator choice, not key material.

### Presets

Saved under their own namespace, so a PURPLE preset and an Enigma preset can
share a name without colliding. A preset stores the key — alphabet, switch
positions, speed assignment — but **not** the mode, which is an operator choice
rather than key material.

Presets are validated on load: a bad alphabet, an out-of-range dial or an
impossible speed assignment is refused with an explanation, and the machine is
left as it was.

### Worked example

1. Load `/purple` fresh, or click **Reset machine**.
2. Set the alphabet to `NOKTYUXEQLHBRMPDICJASVWGZF` and click **Apply**. The sixes group should now read `NOKTYU`.
3. Leave the dials at `01 01 01 01`, speeds at fast **I** / middle **II**, mode **Encipher**.
4. Type `MEMORANDUM`. The tape reads:

   ```
   Plain   MEMOR ANDUM
   Cipher  QWBKB VYATJ
   ```

   The dials will now read `11 11 01 01` — the sixes and the fast switch each
   advanced ten times.

5. To decipher it back: click **Rewind to 01 01 01 01**, switch to **Decipher**, and type `QWBKBVYATJ`. The **Cipher** line reads `MEMORANDUM`.

> **Getting the dials back.** Use **Rewind** in the _Message_ group — it winds all
> four dials to where the message started and clears the tape, while keeping the
> daily alphabet and the speed assignment. **Reset machine** would also reset the
> alphabet, which is the classic way to end up with correct dials and the wrong
> key.
>
> If your output starts correct and then drifts, it is a dial problem. If it is
> wrong from the first character, it is the alphabet, the mode or the speeds.

### Tips

- **Watch the partition.** Type letters from the sixes group (`NOKTYU` with the alphabet above) and the output is always one of those six. Type anything else and the output is never one of them.
- **See the non-reciprocity.** Encipher a word, then encipher the _ciphertext_ from the same starting position. On Enigma that returns the plaintext; here it returns nothing useful. You must switch to Decipher.
- **A letter can encipher to itself.** Type a long run of one letter and it will eventually come out unchanged. On Enigma that is impossible, and that impossibility is what sank it.
- **Find the slow switch.** Set fast **I** / middle **II**, watch stage **III**, and hold down a letter. It sits still for 623 characters and moves on the 624th.

---

## References

- [Wikipedia — Type B Cipher Machine](https://en.wikipedia.org/wiki/Type_B_Cipher_Machine)
- [Freeman, Sullivan & Weierud, "PURPLE Revealed: Simulation and Computer-aided Cryptanalysis of Angooki Taipu B", _Cryptologia_ 27(1), 2003](https://cryptocellar.org/pubs/purple-revealed.pdf) — the reconstructed wiring, keying procedure, and the 14-part message
- [Frode Weierud's CryptoCellar — PURPLE machine](https://cryptocellar.org/simula/purple/index.html)
- [Wikipedia — 14-part message](https://en.wikipedia.org/wiki/14-part_message)
- `docs/purple-plan.md` — implementation notes, including the two stepping traps
- `docs/historical-keys.md` — the 14-part message settings
