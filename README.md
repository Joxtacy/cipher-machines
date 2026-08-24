# Cipher Machines

Simulators of two WWII cipher machines — the German **Enigma I** and the Japanese **PURPLE** (Type B Cipher Machine) — sharing one app shell, verified against real intercepted messages.

## Enigma

A digital simulator of the Wehrmacht **Enigma I** (the 3-rotor army/air-force machine) — built once, runs as both a web app (SvelteKit static SPA) and a desktop app (Tauri 2). Historically accurate rotor wirings, ring settings, plugboard, and the famous **double-stepping anomaly**.

Scope: rotors **I-V** and reflectors **UKW-A / UKW-B / UKW-C**, which is the Enigma I / army M3 configuration. Not modelled: the naval M3 rotors **VI-VIII** (two notches each, turnover at Z and M) and the 4-rotor **M4** with its thin reflectors and Greek wheel.

## Features

- 3 rotor slots, choose from **I, II, III, IV, V**
- Reflectors **UKW-A**, **UKW-B** and **UKW-C**
- Up to 10 plugboard pairs (Steckerbrett)
- Ring settings (Ringstellung) and starting positions (Grundstellung)
- Live lampboard, mechanical-feeling keyboard (mouse + physical keys)
- Tape view with copy-to-clipboard for plaintext and ciphertext
- Named presets:
  - **Web** — saved to `localStorage`
  - **Desktop** — saved as JSON files in the OS-appropriate app data directory (exportable, shareable)
- Skeuomorphic theme by default, with a CSS-token theming layer designed for additional skins

## Stack

- **SvelteKit** (Svelte 5 runes mode), `@sveltejs/adapter-static` in SPA mode (`fallback: index.html`, `ssr = false`)
- **Tauri 2** wrapping the same static build for desktop
- **Vitest** for the engine and state layer — including the canonical reference vector `AAAAAAAAAA → BDZGOWCXLT` and full decrypts of two real messages: the **Operation Barbarossa** signal of 7 July 1941 (non-zero Ringstellung, 10 Steckern) and the 1930 instruction-manual message (UKW-A, doubled indicator)
- Pure TypeScript engine — no Rust required for the cipher logic; Tauri's Rust side is only the app shell + `tauri-plugin-fs` for preset files

## Running it

This project uses **pnpm** (pinned via `packageManager` in `package.json`).

```sh
# Install
pnpm install

# Web (browser, http://localhost:5173)
pnpm run dev

# Desktop (Tauri window)
pnpm run tauri:dev

# Production builds
pnpm run build           # static web build → ./build
pnpm run tauri:build     # desktop installer for the host OS

# Tests, types, formatting
pnpm test
pnpm run check
pnpm run format          # write
pnpm run lint            # check only
```

## Project layout

```
src/
├── lib/
│   ├── enigma/            Enigma engine: alphabet, rotors, reflectors, plugboard, machine
│   ├── purple/            PURPLE engine: switch wiring data, stepping switches, machine
│   ├── state/             Svelte 5 stores: machine (Enigma), purple, presets, tape
│   ├── storage/           preset drivers, namespaced per machine
│   ├── platform/          isTauri() detection
│   ├── theme/             tokens.css + skeuomorphic.css (theme contract)
│   ├── styles/            global.css — shared .bezel and .card classes
│   ├── keyboard-layout.ts key rows, shared by both keyboards and the lampboard
│   └── components/        EnigmaMachine, PurpleMachine, and the pieces they share
│                          (Keyboard, Tape, PresetManager) plus Enigma-only
│                          Lampboard, Rotors, Plugboard, Settings
├── routes/                / (Enigma) and /purple, machine switcher in +layout.svelte
└── app.html               data-theme="skeuo" baked in

src-tauri/                 Tauri 2 shell + fs plugin
tests/enigma/              engine, stepping, config validation, guide claims,
                           Barbarossa 1941 and the 1930 manual message
tests/purple/              wiring tables, stepping, guide claims,
                           the 14-part message of 7 December 1941
tests/state/               reactive store behaviour for both machines
tests/storage/             preset namespacing and validation
```

## Adding a new theme

The theming contract is CSS custom properties declared in
`src/lib/theme/tokens.css`, plus two shared classes in
`src/lib/styles/global.css`:

- `.bezel` — the recessed-panel look, used by rotor windows, PURPLE switch dials, lampboard, keyboard, plugboard and the printer strip.
- `.card` — sidebar panels, including `.card h3`, `.card .group` and `.card .hint`.

Both machines pull from these, so a panel looks the same whichever machine you
are on. To add another skin:

1. Create a new file like `src/lib/theme/minimal.css` defining values under `[data-theme="minimal"]`.
2. Import it from `src/routes/+layout.svelte`.
3. Add a switcher that updates `<html data-theme>`.

Skins that change colours/materials only need this. Skins that change layout (e.g. an entirely minimal flat UI) will need component variants behind the existing prop interfaces.

## PURPLE (Type B Cipher Machine)

The Japanese Foreign Ministry's _Angooki Taipu B_, 1939 — at `/purple`. Not a
rotor machine: four telephone stepping switches, the alphabet split into a group
of 6 and a group of 20 on separate paths, and **no reflector**, so unlike Enigma
it is not reciprocal and a letter can encipher to itself.

- Sixes switch plus three twenties stages, 25 positions each
- Daily alphabet (26 letters), fast/middle/slow stage assignment, encipher/decipher modes
- Garble markers (`-`) pass through on decipher while still stepping the switches
- Verified by decrypting **part 1 of the 14-part message of 7 December 1941**

Wiring comes from Freeman, Sullivan & Weierud, _"PURPLE Revealed"_, Cryptologia
27(1), 2003. See `docs/purple.md` for the guide and worked example, and
`docs/purple-plan.md` for implementation notes and the two stepping traps.

## Historical keys

`docs/historical-keys.md` collects real wartime Enigma settings you can load
straight into the simulator — recovered German Army daily keys from 1941, the
Operation Barbarossa signal with its full plaintext, and reference messages that
need hardware this build does not model. Every entry is tagged by how strongly
it is corroborated, and the verifiable ones are machine-checked in
`tests/enigma/historical-keys.test.ts`.

## References

- [Wikipedia — Enigma rotor details](https://en.wikipedia.org/wiki/Enigma_rotor_details) (wirings, notches, double-stepping)
- [Tauri 2 — SvelteKit setup](https://v2.tauri.app/start/frontend/sveltekit/)
- [palloks JS Enigma simulator](https://palloks.2ix.de/enigma/index_en.html) (independent reference for test vectors)
