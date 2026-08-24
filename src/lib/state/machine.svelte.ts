import { DEFAULT_CONFIG, Enigma, type MachineConfig, type Triple } from "$lib/enigma/machine";
import { MAX_PLUG_PAIRS, type PlugPair } from "$lib/enigma/plugboard";
import type { ReflectorId } from "$lib/enigma/reflectors";
import type { RotorId } from "$lib/enigma/rotors";
import { mod26 } from "$lib/enigma/alphabet";
import type { RecentKey } from "./tape";

export type { RecentKey };

export class MachineStore {
	rotors: Triple<RotorId> = $state([...DEFAULT_CONFIG.rotors] as Triple<RotorId>);
	rings: Triple<number> = $state([...DEFAULT_CONFIG.rings] as Triple<number>);
	positions: Triple<number> = $state([...DEFAULT_CONFIG.positions] as Triple<number>);
	reflector: ReflectorId = $state(DEFAULT_CONFIG.reflector);
	plugboard: PlugPair[] = $state([]);
	recentKeys: RecentKey[] = $state([]);
	lampLit: string | null = $state(null);

	/**
	 * Where the rotors stood when the current message began — captured on the
	 * first keypress after the tape empties, so `rewind()` can put them back
	 * without the operator having to remember the Grundstellung.
	 */
	messageStart: Triple<number> = $state([...DEFAULT_CONFIG.positions] as Triple<number>);

	private nextId = 0;

	snapshot(): MachineConfig {
		return {
			rotors: [...this.rotors] as Triple<RotorId>,
			rings: [...this.rings] as Triple<number>,
			positions: [...this.positions] as Triple<number>,
			reflector: this.reflector,
			plugboard: this.plugboard.map((p) => [...p] as PlugPair),
		};
	}

	pressKey(c: string): string | null {
		const upper = c.toUpperCase();
		const isLetterKey = /[A-Z]/.test(upper);
		// Latch the message's starting position before the first key advances
		// anything. Non-letters never step, so they never open a message.
		if (isLetterKey && this.recentKeys.length === 0) {
			this.messageStart = [...this.positions] as Triple<number>;
		}
		// Always create a fresh Enigma from the latest config — guarantees that
		// any ring/rotor/reflector/plugboard change since the last keypress
		// takes effect. Encryption is fast enough that caching is pointless.
		const engine = new Enigma(this.snapshot());
		const out = engine.encryptChar(upper);
		// Sync the advanced rotor positions back into reactive state.
		this.positions = [...engine.positions] as Triple<number>;
		// A letter can never encrypt to itself (the reflector guarantees it), so
		// out !== upper needs no check — only "was this actually a letter".
		if (isLetterKey) {
			this.lampLit = out;
			// ponytail: transcript grows unbounded, deliberately. It is the message
			// the operator is composing, so silently dropping the head would
			// corrupt copy-to-clipboard. Measured cost per keypress (store spread
			// + Tape re-derive): ~28us at 500 letters, ~230us at 10k, ~530us at
			// 20k; memory 2.3MB at 20k. Wartime messages were capped at 250
			// letters, so this is imperceptible at any realistic length.
			// The spread below is O(n) per press, i.e. O(n^2) per message. Only
			// visible past ~20k letters, where it is ~30us of a ~530us keypress.
			// If that ever matters: switch to push() (159x faster at 5k, 1387x at
			// 20k) but verify in a browser that the Tape $derived still updates —
			// the Node suite cannot see reactivity regressions.
			this.recentKeys = [...this.recentKeys, { input: upper, output: out, id: this.nextId++ }];
		}
		return out;
	}

	releaseKey(): void {
		this.lampLit = null;
	}

	setRotor(slot: 0 | 1 | 2, id: RotorId): void {
		// Prevent duplicates — a real Enigma takes distinct rotors per slot.
		const existing = this.rotors.indexOf(id);
		if (existing !== -1 && existing !== slot) {
			this.rotors[existing] = this.rotors[slot];
		}
		this.rotors[slot] = id;
	}

	setRing(slot: 0 | 1 | 2, value: number): void {
		this.rings[slot] = mod26(value);
	}

	setPosition(slot: 0 | 1 | 2, value: number): void {
		this.positions[slot] = mod26(value);
	}

	advancePosition(slot: 0 | 1 | 2, delta: number): void {
		this.setPosition(slot, this.positions[slot] + delta);
	}

	advanceRing(slot: 0 | 1 | 2, delta: number): void {
		this.setRing(slot, this.rings[slot] + delta);
	}

	/**
	 * Wind the rotor windows back to where this message started and clear the
	 * tape. The daily key — rotor choice, rings, reflector, plugboard — is left
	 * alone, so you can immediately decipher what you just enciphered.
	 */
	rewind(): void {
		this.positions = [...this.messageStart] as Triple<number>;
		this.recentKeys = [];
		this.lampLit = null;
	}

	/**
	 * Start a fresh message from wherever the rotors now stand. This is what a
	 * real operator did for consecutive messages — see the 16 September 1941
	 * keys in docs/historical-keys.md, where each message begins where the last
	 * one stopped.
	 */
	newMessage(): void {
		this.recentKeys = [];
		this.lampLit = null;
	}

	setReflector(r: ReflectorId): void {
		this.reflector = r;
	}

	addPlug(a: string, b: string): void {
		const A = a.toUpperCase();
		const B = b.toUpperCase();
		if (A === B) return;
		const filtered = this.plugboard.filter(([x, y]) => x !== A && x !== B && y !== A && y !== B);
		if (filtered.length >= MAX_PLUG_PAIRS) return;
		this.plugboard = [...filtered, [A, B]];
	}

	removePlug(letter: string): void {
		const L = letter.toUpperCase();
		this.plugboard = this.plugboard.filter(([a, b]) => a !== L && b !== L);
	}

	clearPlugboard(): void {
		this.plugboard = [];
	}

	plugPartner(letter: string): string | null {
		const L = letter.toUpperCase();
		for (const [a, b] of this.plugboard) {
			if (a === L) return b;
			if (b === L) return a;
		}
		return null;
	}

	/** Expects an already-validated config — see parseConfig for untrusted input. */
	loadConfig(cfg: MachineConfig): void {
		this.rotors = [...cfg.rotors] as Triple<RotorId>;
		this.rings = [...cfg.rings] as Triple<number>;
		this.positions = [...cfg.positions] as Triple<number>;
		this.reflector = cfg.reflector;
		this.plugboard = cfg.plugboard.map((p) => [...p] as PlugPair);
		this.messageStart = [...cfg.positions] as Triple<number>;
		this.recentKeys = [];
		this.lampLit = null;
	}

	reset(): void {
		this.loadConfig(DEFAULT_CONFIG);
	}
}

export const machine = new MachineStore();
