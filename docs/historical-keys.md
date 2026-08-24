# Historical cipher keys

Real wartime cipher settings you can load into these simulators, with an
explicit note on how trustworthy each one is. Enigma keys first, then PURPLE.

## Do original key sheets survive?

Yes — but far fewer than you would hope, and mostly as **photographs rather than
transcriptions**.

Known surviving physical material includes:

- **Wehrmacht Army Staff *Maschinenschlüssel Nr. 28*** and a **Sonder-Maschinenschlüssel "BGS"** — photographed from holdings of the U.S. National Archives.
- **Kriegsmarine TRITON** inner and external settings, **Schlüssel M TRITON Offizier**, and **Sonderschlüssel M NIXE** — from Frode Weierud's collection.
- Bletchley Park's own working papers in the UK National Archives **HW** series at Kew (e.g. HW 25/8, HW 25/9, HW 25/27) — organisation of Enigma and recovery of key usage. Not digitised; readable in person only.

The catch: these are *images of paper*. Almost none of the daily rows have been
transcribed into machine-readable settings. A sheet covered a month with the
dates in reverse order down the page so each row could be torn off and burned
once used — and burning them is exactly what the operators did, so most sheets
are simply gone. Naval codebooks were printed in red water-soluble ink on pink
paper specifically so they would destroy themselves if a boat was boarded or
sunk.

So the settings below come from a different route.

## Where these settings actually come from

Almost every Enigma key you can find in machine-readable form today was
**reconstructed by modern cryptanalysis of authentic intercepted ciphertext**,
not copied off a captured sheet. The intercepts are genuine wartime traffic; the
*keys* are recovered, chiefly by Frode Weierud's Breaking German Army Ciphers
project and the M4 Message Breaking Project.

That is a real distinction, so every entry here is tagged:

| Tag | Meaning |
|---|---|
| **✅ verified** | Decrypted successfully in this repo. Machine-checked in `tests/enigma/`. |
| **☑️ consistent** | Published settings whose indicator deciphers to the published message key on this engine — a strong internal check, but no plaintext to confirm against. |
| **📄 documented** | Published settings this simulator cannot run (needs a 4-rotor M4). Reproduced for reference, unverified here. |

One encouraging cross-check: the 7 July 1941 row of the daily-key table below is
the *same* key that decrypts the Operation Barbarossa signal — two independently
published sources agreeing, and the resulting German plaintext confirms both.

---

## ✅ Operation Barbarossa, 7 July 1941

The strongest entry here: settings, ciphertext **and** plaintext, and the
decryption reproduces the documented German text exactly.

| Setting | Value |
|---|---|
| Machine | Enigma I (3 rotors) |
| Reflector | UKW-B |
| Wheel order | II IV V |
| Ringstellung | B U L (02 21 12) |
| Steckerverbindungen | AV BS CG DL FU HZ IN KM OW RX |
| Message key (window letters) | B L A |
| Kenngruppe | RFUGZ (strip before decrypting) |

Ciphertext (part 1, Kenngruppe removed):

```
EDPUD NRGYS ZRCXN UYTPO MRMBO FKTBZ REZKM LXLVE FGUEY SIOZV
EQMIK UBPMM YLKLT TDEIS MDICA GYKUA CTCDO MOHWX MUUIA UBSTS
LRNBZ SZWNR FXWFY SSXJZ VIJHI DISHP RKLKA YUPAD TXQSP INQMA
TLPIF SVKDA SCTAC DPBOP VHJK
```

Decrypts to:

```
AUFKLXABTEILUNGXVONXKURTINOWAXKURTINOWAXNORDWESTLXSEBEZXSEBEZX
UAFFLIEGERSTRASZERIQTUNGXDUBROWKIXDUBROWKIXOPOTSCHKAXOPOTSCHKAX
UMXEINSAQTDREINULLXUHRANGETRETENXANGRIFFXINFXRGTX
```

*"Reconnaissance detachment from Kurtinowa, north-west of Sebez … direction
Dubrowki, Opotschka. Moved off at 18:30. Attack. Infantry regiment."*

Note the wartime conventions: `X` for spaces and full stops, `Q` for *ch*
(`BEOBAQTET`, `AQT`), `SZ` for ß (`STRASZE`), and place names sent twice for
resilience. `UAFFLIEGERSTRASZE` is garbled in the original transmission — that is
how it came off the wire, not a decryption error.

Regression test: `tests/enigma/historical.test.ts`.

---

## ☑️ German Army daily keys, July 1941

Recovered daily keys. Reflector is UKW-B throughout. Wheel order is written in
the German style: three digits for the left, middle and right slots, so `423`
means **IV II III**.

| Date | Wheel order | Ringstellung | Steckerverbindungen | Kenngruppen |
|---|---|---|---|---|
| 1 Jul | 423 | AAV | CT EM FI GJ HK NQ OR SW UY VX | LYASO |
| 5 Jul | 354 | WHJ | BI CW EQ FX HZ JN KY MT OV PR | XTMSY, LXACA, DEROP |
| 6 Jul | 513 | IRD | AN BM DH EI KQ LS OT PV RU YZ | ABGUX, ABAHP |
| 7 Jul | 245 | BUL | AV BS CG DL FU HZ IN KM OW RX | XIVFG |
| 8 Jul | 432 | PKF | CY EL FH GS IJ KQ MW PV RZ TU | GLPTL, ABDJV, HBNVE |
| 9 Jul | 315 | NAV | AC BN FM GI JL KO PU QX RZ TV | CASBL, WEUWY, BEYWU, DESGF, TUGFI, WNFGI, SOFGI, ABUNY, NEWUY, ENIDN |
| 10 Jul | 521 | JQH | AS BG CK DZ IO LR MP QT UW VY | ANIJQ, ABNAQ, RDNAQ, BIOQN, SHNQO, TXIJQ, MVUEH, RLGRZ, NZGRZ |
| 12 Jul | 254 | YCM | AJ BD CZ EH GU IK LV MQ NX OS | MAKJH |
| 13 Jul | 423 | GTO | AD EH GY IM KN LR OZ QV TX WU | ANERF, MYFRE, GSEAN, EGERF |
| 14 Jul | 531 | LWB | BT CH DR EW FU GK JO LV MS PZ | CFYZR |
| 18 Jul | 425 | AGM | DM EP FL HI JR KY NQ OU SW TZ | HJVVS, XNRLR, LSEGB |
| 25 Jul | 325 | RVA | BE CK DL GM HZ JO NW QU RT SV | AJLJD |
| 29 Jul | 521 | MJW | AW CS DR EY FO KU LZ NV PX QT | KLDIO |

The 10 July message bearing Kenngruppe `SIPVX` used a different key that day:
wheel order **521**, Ringstellung **MRP**, Stecker **AG BJ CP DS ER FQ HV IU KT LW**.

Note **7 Jul = 245 / BUL / AV BS CG DL FU HZ IN KM OW RX** — the Barbarossa key
above, from an independent source.

---

## ☑️ Per-message keys, June–October 1941

These entries include the indicator, so they can be checked without any
plaintext: set the rotors to the **Grundstellung**, type the enciphered group,
and you should get the published **message key**. All rows below pass that check
on this engine except where noted.

*Grundstellung* was transmitted in clear; *message key* is where you actually set
the windows to read the body; *stop* is where the rotors finished.

### 27 June 1941 — UKW-B, wheel order 352, rings RGP
Stecker: `AV BG CH EN FU KO MS PX RY TW`

| Msg | Kenngruppe | Grundstellung | Enciphered key | Message key | Stop | Check |
|---|---|---|---|---|---|---|
| 45 | HXZKV | SDG | EKN | LTA | LVM | ☑️ |
| 48 | WRMKX | BPG | KGM | CSX | CXY | ☑️ |
| 51 | PLDRV | ZKT | FLP → `[HLP]` | RTZ | SCB | ⚠️ see note |

> **Message 51 does not verify.** The source flags it with a footnote and gives a
> bracketed correction, `[HLP]`, for a garble in the intercept. On this engine
> `ZKT`+`FLP` yields `APZ` and the corrected `ZKT`+`HLP` yields `RPZ`, against a
> published message key of `RTZ` — one letter out. The other two messages from
> the same day verify cleanly, so the *day key* is sound; this row's indicator or
> message key is mis-transcribed somewhere. Recorded as-is rather than quietly
> patched.

### 8 July 1941 — UKW-B, wheel order 432, rings PKF
Stecker: `CY EL FH GS IJ KQ MW PV RZ TU`

| Msg | Kenngruppe | Grundstellung | Enciphered key | Message key | Stop | Check |
|---|---|---|---|---|---|---|
| 23 | KHLPT | OKF | QLV | PIK | PMA | ☑️ |

### 13 August 1941 — UKW-B, wheel order 253, rings THE
Stecker: `AD BH FG IJ KN LZ MR OS PW QV`

| Msg | Kenngruppe | Grundstellung | Enciphered key | Message key | Stop | Check |
|---|---|---|---|---|---|---|
| 7 | KEJNQ | AMQ | LKF | BRZ | BXW | ☑️ |

### 19 August 1941 — UKW-B, wheel order 213, rings YPC
Stecker: `AK BI DG FN HL JO MT QY RV UW`

| Msg | Kenngruppe | Grundstellung | Enciphered key | Message key | Stop | Check |
|---|---|---|---|---|---|---|
| 19 | ALWOK | ALY | XQE | BGO | BLI | ☑️ |

### 28 August 1941 — UKW-B, wheel order 345, rings CWJ
Stecker: `BH CS DU EI FR GM JO KQ TX VZ`

| Msg | Kenngruppe | Grundstellung | Enciphered key | Message key | Stop | Check |
|---|---|---|---|---|---|---|
| 81 | ALQFI | DIB | TCO | ABC | AEK | ☑️ |

### 9 September 1941 — UKW-B, wheel order 342, rings KFZ
Stecker: `AZ DV ET FS GQ JP LX MY NR OW`

| Msg | Kenngruppe | Grundstellung | Enciphered key | Message key | Stop | Check |
|---|---|---|---|---|---|---|
| 38 | GEHRG | BOZ | IWD | ERT | EUP | ☑️ |

### 16 September 1941 — UKW-B, wheel order 513, rings LSB
Stecker: `AP BO CY DU ES FN GR IV JT LZ`

| Msg | Kenngruppe | Grundstellung | Enciphered key | Message key | Stop | Check |
|---|---|---|---|---|---|---|
| 59 | ADAFU | LTB | MMF | SAU | SDJ | ☑️ |
| 60 | CHAFU | AIA | XIE | FUT | FYQ | ☑️ |
| 69 | DKAFU | SDC | JKP | BOK | CSW | ☑️ |
| 70 | NOEGP | CSW | MEK | KLO | KPH | ☑️ |
| 71 | HOEPG | KPH | YNH | AFF | AIL | ☑️ |

Note how message 70 starts at `CSW`, exactly where 69 stopped, and 71 starts at
`KPH` where 70 stopped — the operator simply carried on without rewinding.

### 27 September 1941 — UKW-B, wheel order 421, rings YHO
Stecker: `AG CP DK EL HQ IT JV MX OY RW`

| Msg | Kenngruppe | Grundstellung | Enciphered key | Message key | Stop | Check |
|---|---|---|---|---|---|---|
| 103 | ARPTZ | NWH | GGP | SPE | STG | ☑️ |
| 104 | ABBHQ | STG | YTF | SAU | SCJ | ☑️ |
| 105 | ANQIX | XFG | GSM | SEE | TJI | ☑️ |
| 106 | FDTZP | GUR | JPC | HOR | HQI | ☑️ |
| 114 | DAFPX | ZIP | NDT | WAS | XGM | ☑️ |
| 115 | *(missing)* | SCJ | RWT | WAS | XHK | ☑️ |
| 116 | ITF?? | XHK | FHP | WAS | XFF | ☑️ |
| 117 | ?AQBH | TJI | KPJ | GRA | GUR | ☑️ |

Three messages keyed from `WAS` on one day — an operator reusing a favourite
word instead of choosing randomly. Exactly the habit ("cillies") Bletchley
exploited. Partial Kenngruppen are illegible in the intercept.

### 2 October 1941 — UKW-B, wheel order 452, rings DVM
Stecker: `AP BU CX DH ER FQ IW KO LZ MS`

| Msg | Kenngruppe | Grundstellung | Enciphered key | Message key | Stop | Check |
|---|---|---|---|---|---|---|
| 8 | ALGXZ | FXP | SOV | WAS | WDH | ☑️ |

### 3 October 1941 — UKW-B, wheel order 213, rings TIP
Stecker: `BC DE FG HI JK LX MQ NO ST VZ`

| Msg | Kenngruppe | Grundstellung | Enciphered key | Message key | Stop | Check |
|---|---|---|---|---|---|---|
| 4 | NKMOW | DTI | AZZ | SEE | SKJ | ☑️ |

That day's plugboard — `BC DE FG HI JK LX MQ NO ST VZ` — is almost entirely
adjacent letter pairs. A lazy operator, and precisely the kind of predictability
that made keys guessable.

---

## ✅ Enigma instruction manual, 1930

The oldest Enigma message with published settings, and the only one here needing
**UKW-A** — the original 1930 reflector, withdrawn on 2 November 1937 and
superseded by UKW-B for the rest of the war. Its wiring had to be reconstructed
cryptanalytically after the war rather than captured.

This is also the only entry that exercises the **pre-1940 doubled indicator**:
at the Grundstellung, the six-letter group deciphers to the three-letter message
key sent twice.

| Setting | Value |
|---|---|
| Machine | Enigma I |
| Reflector | **UKW-A** |
| Wheel order | II I III |
| Ringstellung | 24 13 22 (X M V) |
| Steckerverbindungen | AM FI NV PS TU WZ (only 6 cables — 1930 practice) |
| Grundstellung | 06 15 12 (F O L) |
| Enciphered indicator | `PKPJXI` → `ABLABL`, i.e. message key **ABL** twice |

```
GCDSE AHUGW TQGRK VLFGX UCALX VYMIG MMNMF DXTGN VHVRM
MEVOU YFZSL RHDRR XFJWC FHUHM UNZEF RDISI KBGPM YVXUZ
```

```
FEINDLIQEINFANTERIEKOLONNEBEOBAQTETXANFANGSUEDAUSGANG
BAERWALDEXENDEDREIKMOSTWAERTSNEUSTADT
```

*"Enemy infantry column observed. Beginning south exit Bärwalde. Ending 3 km east of Neustadt."*

Regression tests: `tests/enigma/historical.test.ts` covers both the indicator
recovery and the body.

---

# PURPLE (Type B Cipher Machine)

## ✅ The 14-part message, 7 December 1941

Japan's final memorandum to the United States — and the most consequential
PURPLE message that survives.

Worth being precise about what it was: **not a declaration of war, and not a
severing of diplomatic relations.** It notified Washington that negotiations
were over, closing with the statement that the Japanese government "cannot but
consider that it is impossible to reach an agreement through further
negotiations."

Tokyo sent roughly 5,000 words in two blocks to its Washington embassy, with
orders to deliver at **1:00 p.m. Washington time** — 7:30 a.m. in Hawaii.
American codebreakers had deciphered and translated most of it *hours before*
the deadline, while the embassy's own staff were still transcribing. Their
transcription ran so late that the memorandum was not handed to Cordell Hull
until **more than an hour after the attack on Pearl Harbor had begun**. US naval
intelligence spotted the significance of a 1:00 p.m. Sunday deadline and tried
to warn Pearl Harbor; the warning arrived too late.

So the machine below was read faster by its adversary than by its intended
recipient.

| Setting | Value |
|---|---|
| Machine | Type B Cipher Machine (PURPLE), 4 stepping switches |
| Switch key | `9-1,24,6-23` |
| Sixes switch start | 9 |
| Twenties I / II / III start | 1 / 24 / 6 |
| Fast switch | stage II |
| Middle switch | stage III |
| Slow switch | stage I (whatever is left) |
| Daily alphabet | `NOKTYUXEQLHBRMPDICJASVWGZF` |
| Sixes group | `NOKTYU` (first six letters of the alphabet) |

Part 1 opens:

```
ZTXODNWKCCMAVNZXYWEETUQTCIMNVEUVIWBLUAXRRTLVA
```

deciphering to:

```
FOVTATAKIDASINIMUIMINOMOXIWOIRUBESIFYXXFCKZZR
```

That is romaji, not English — the preamble switches to English shortly after,
via `MEMORANDUM` and `THEGOVE-NMENTOFJAPAN`. Later fragments include
`PEACEOFTHEPACIFICAREA` and `NEGOTIATIONSWITHTHEUTMOSTSINCERITY`.

Part 1 is **1,285 characters with 28 garble positions** marked `-` — damage from
the original intercept, not decryption errors. `THEGOVE-NMENTOFJAPAN` lost its
`R` in 1941 and it is still missing.

The full ciphertext and plaintext live in `tests/purple/fourteen-part-message.ts`
rather than being copied here, so the two cannot drift apart. Regression tests:
`tests/purple/historical.test.ts`.

**Why this message is the right test.** The slow switch fires for the first time
at character **623**. At 1,285 characters this message crosses that boundary, so
it cannot pass with a wrong stepping rule — which matters, because the commonly
published description of PURPLE's stepping is off by one. Any message shorter
than 624 characters would verify a broken engine. See `docs/purple-plan.md`.

### Loading it into the simulator

1. Go to `/purple`.
2. **Alphabet** — enter `NOKTYUXEQLHBRMPDICJASVWGZF` and click **Apply**. Confirm the sixes group reads `NOKTYU`.
3. **Switch speeds** — fast **II**, middle **III**. Slow shows as **I**.
4. **Dials** — sixes `09`, then `01`, `24`, `06`. The dials are 1-based, matching the shorthand.
5. **Mode** — **Decipher**.
6. Type the ciphertext. Use `-` for each garble to keep the machine in step.

The plaintext appears on the tape's **lower** line: you are typing ciphertext, so
the "Plain" line records your input and the "Cipher" line holds the recovered
text. See `docs/purple.md` for the full walkthrough.

---

## 📄 Reference messages this simulator cannot run

### Kriegsmarine M4, "Dönitz message", 1 May 1945 — needs a 4-rotor Enigma M4

The signal announcing Dönitz as Hitler's successor. Needs the **M4**: a fourth
(Greek) wheel and a thin reflector, neither of which this simulator has.

| Setting | Value |
|---|---|
| Machine | Kriegsmarine M4 |
| Reflector | C (thin) |
| Greek wheel | Beta |
| Wheel order | V VI VIII |
| Ringstellung | E P E L |
| Steckerverbindungen | AE BF CM DQ HU JN LX PR SZ VW |
| Grundstellung | N A E M |
| Message key | C D S Z |

Plaintext opens `KRKRALLEXXFOLGENDESISTSOFORTBEKANNTZUGEBENXX…`
("Urgent, to all — the following is to be made known immediately…").

---

## Loading these into this simulator

1. **Wheel order** — the three digits map left → middle → right, `1`=I … `5`=V. So `245` is II, IV, V. Set them in the sidebar.
2. **Reflector** — UKW-B unless stated. UKW-A appears only on pre-1937 traffic; UKW-C occasionally during the war.
3. **Ringstellung** — set each rotor's ring with the `−A+` row under its window. Numeric settings are 1-indexed: `02 21 12` = `B U L`.
4. **Steckerverbindungen** — click each letter pair on the plugboard.
5. **Rotor windows** — set to the **message key**, not the Grundstellung. This simulator has no separate indicator stage, so the two-step procedure is collapsed.
6. Type the ciphertext. The tape's lower line is your plaintext.

To reproduce the *full* historical procedure, do the indicator step by hand:
set the windows to the Grundstellung, type the enciphered group, read the
message key off the lamps, then wind the windows to that and type the body.

## Sources

- [Frode Weierud's CryptoCellar — Enigma keys, July 1941](https://cryptocellar.org/bgac/e-keys-july-1941.html)
- [Frode Weierud's CryptoCellar — Enigma keys, June–October 1941](https://cryptocellar.org/bgac/e-keys-jun-oct-1941.html)
- [Frode Weierud's CryptoCellar — Enigma test message from 1930](https://cryptocellar.org/enigma/e-message-1930.html)
- [Cryptomuseum — Enigma message, 1 May 1945 (M4)](https://www.cryptomuseum.com/crypto/enigma/msg/p1030681.htm)
- [Cipher Machines and Cryptology — Enigma procedures](https://ciphermachinesandcryptology.com/en/enigmaproc.htm) (photographs of original key sheets)
- [Freeman, Sullivan & Weierud, "PURPLE Revealed", *Cryptologia* 27(1), 2003](https://cryptocellar.org/pubs/purple-revealed.pdf) (PURPLE wiring, keying, and the 14-part message)
- [Wikipedia — 14-part message](https://en.wikipedia.org/wiki/14-part_message) (content, transmission and delivery timing)
- [Wikipedia — Cryptanalysis of the Enigma](https://en.wikipedia.org/wiki/Cryptanalysis_of_the_Enigma) (key sheet format, indicator procedure dates)
- Barbarossa ciphertext and settings corroborated via the July 1941 key table above and by successful decryption in this repo.
