import {
	DEFAULT_KEY,
	GARBLE,
	Purple97,
	SWITCH_POSITIONS,
	parsePurpleKey,
	validateAlphabet,
	type PurpleKey,
	type SwitchRole
} from '$lib/purple/machine';
import type { RecentKey } from './tape';

export type PurpleMode = 'encrypt' | 'decrypt';

/** Index into the switch array: 0 is the sixes, 1-3 are twenties stages I-III. */
export type SwitchSlot = 0 | 1 | 2 | 3;

export const SWITCH_LABELS = ['Sixes', 'I', 'II', 'III'] as const;

/**
 * Reactive state for the PURPLE machine.
 *
 * Mirrors MachineStore's approach: a fresh Purple97 per keypress, built from the
 * current settings, with the advanced switch positions synced back afterwards.
 * That keeps mid-message setting changes honest and costs nothing measurable.
 *
 * `mode` lives here rather than in PurpleKey because it is an operator choice,
 * not key material — PURPLE is not reciprocal, so which direction you are
 * running is a property of the session, not of the day's settings.
 */
export class PurpleStore {
	switches: [number, number, number, number] = $state([...DEFAULT_KEY.switches]);
	fastSwitch: SwitchRole = $state(DEFAULT_KEY.fastSwitch);
	middleSwitch: SwitchRole = $state(DEFAULT_KEY.middleSwitch);
	alphabet: string = $state(DEFAULT_KEY.alphabet);
	mode: PurpleMode = $state('encrypt');
	recentKeys: RecentKey[] = $state([]);
	lastOutput: string | null = $state(null);

	/**
	 * Where the four switches stood when the current message began. Captured on
	 * the first keypress after the tape empties so `rewind()` can restore them
	 * without disturbing the daily alphabet or the speed assignment.
	 */
	messageStart: [number, number, number, number] = $state([...DEFAULT_KEY.switches]);

	private nextId = 0;

	/** The remaining stage, derived rather than stored so it cannot go stale. */
	get slowSwitch(): SwitchRole {
		return ([1, 2, 3] as SwitchRole[]).find(
			(r) => r !== this.fastSwitch && r !== this.middleSwitch
		)!;
	}

	snapshot(): PurpleKey {
		return {
			switches: [...this.switches] as [number, number, number, number],
			fastSwitch: this.fastSwitch,
			middleSwitch: this.middleSwitch,
			alphabet: this.alphabet
		};
	}

	/** The sixes group: the first six letters of the daily alphabet. */
	get sixesLetters(): string {
		return this.alphabet.slice(0, 6);
	}

	pressKey(c: string): string | null {
		const upper = c.toUpperCase();
		const isGarble = upper === GARBLE;
		if (!isGarble && !/^[A-Z]$/.test(upper)) return null;
		// A garble marker only means something when reading an intercept.
		if (isGarble && this.mode !== 'decrypt') return null;

		// Latch the message's starting positions before anything advances.
		if (this.recentKeys.length === 0) {
			this.messageStart = [...this.switches] as [number, number, number, number];
		}

		const machine = new Purple97(this.snapshot());
		const out = this.mode === 'encrypt' ? machine.encryptChar(upper) : machine.decryptChar(upper);

		this.switches = [...machine.positions] as [number, number, number, number];
		this.lastOutput = out;
		this.recentKeys = [...this.recentKeys, { input: upper, output: out, id: this.nextId++ }];
		return out;
	}

	setSwitch(slot: SwitchSlot, value: number): void {
		this.switches[slot] = ((value % SWITCH_POSITIONS) + SWITCH_POSITIONS) % SWITCH_POSITIONS;
	}

	advanceSwitch(slot: SwitchSlot, delta: number): void {
		this.setSwitch(slot, this.switches[slot] + delta);
	}

	/**
	 * Assign the fast and middle roles. The slow switch is whatever is left, so
	 * picking a stage that already holds the other role swaps them rather than
	 * leaving the machine in an impossible state.
	 */
	setRole(role: 'fast' | 'middle', stage: SwitchRole): void {
		if (role === 'fast') {
			if (this.middleSwitch === stage) this.middleSwitch = this.fastSwitch;
			this.fastSwitch = stage;
		} else {
			if (this.fastSwitch === stage) this.fastSwitch = this.middleSwitch;
			this.middleSwitch = stage;
		}
	}

	/** Throws if the alphabet is not 26 distinct letters — callers validate first. */
	setAlphabet(alphabet: string): void {
		this.alphabet = validateAlphabet(alphabet);
	}

	setMode(mode: PurpleMode): void {
		this.mode = mode;
	}

	/** Expects an already-validated key — see parsePurpleKey for untrusted input. */
	loadConfig(key: PurpleKey): void {
		const valid = parsePurpleKey(key);
		this.switches = [...valid.switches] as [number, number, number, number];
		this.fastSwitch = valid.fastSwitch;
		this.middleSwitch = valid.middleSwitch;
		this.alphabet = valid.alphabet;
		this.messageStart = [...valid.switches] as [number, number, number, number];
		this.recentKeys = [];
		this.lastOutput = null;
	}

	/**
	 * Wind the four dials back to where this message started and clear the tape.
	 * The daily alphabet and the fast/middle assignment survive — which is the
	 * whole point, since resetting the machine would wipe the alphabet too.
	 * Mode is left alone: direction is an operator choice, not key material.
	 */
	rewind(): void {
		this.switches = [...this.messageStart] as [number, number, number, number];
		this.recentKeys = [];
		this.lastOutput = null;
	}

	/** Start a fresh message from wherever the switches now stand. */
	newMessage(): void {
		this.recentKeys = [];
		this.lastOutput = null;
	}

	reset(): void {
		this.loadConfig(DEFAULT_KEY);
		this.mode = 'encrypt';
	}
}

export const purple = new PurpleStore();
