import {
	SIXES_LEVELS,
	SWITCH_POSITIONS,
	TWENTIES_LEVELS,
	decryptTables,
	encryptTables,
} from "./data";

/**
 * PURPLE — the Japanese Type B Cipher Machine (Angooki Taipu B), 1939.
 *
 * Not a rotor machine. Four telephone stepping switches, and the 26-letter
 * alphabet is split into a group of 6 and a group of 20 which take entirely
 * separate paths. There is no reflector, so unlike Enigma the machine is NOT
 * reciprocal: encipher and decipher are different operations, and a letter can
 * encipher to itself.
 *
 * See docs/purple-plan.md for the mechanism and docs/purple.md for usage.
 */

/** A single stepping switch: 25 positions, one permutation per position. */
export class SteppingSwitch {
	readonly positions: number;
	readonly levels: number;
	position: number;

	constructor(
		private readonly decWiring: readonly (readonly number[])[],
		private readonly encWiring: readonly (readonly number[])[],
		position = 0,
	) {
		this.positions = decWiring.length;
		this.levels = decWiring[0].length;
		if (!decWiring.every((row) => row.length === this.levels)) {
			throw new Error("Ragged decrypt wiring table");
		}
		if (encWiring.length !== this.positions) {
			throw new Error("Encrypt/decrypt position count mismatch");
		}
		this.position = 0;
		this.setPosition(position);
	}

	setPosition(position: number): void {
		if (!Number.isInteger(position) || position < 0 || position >= this.positions) {
			throw new Error(`Switch position out of range: ${position}`);
		}
		this.position = position;
	}

	/** Advance one position, wrapping. Returns the new position. */
	step(): number {
		this.position = (this.position + 1) % this.positions;
		return this.position;
	}

	decrypt(level: number): number {
		return this.decWiring[this.position][level];
	}

	encrypt(level: number): number {
		return this.encWiring[this.position][level];
	}
}

/** Which twenties stage plays which role. 1, 2 or 3. */
export type SwitchRole = 1 | 2 | 3;

export interface PurpleKey {
	/** Starting positions, 0-based: [sixes, twenties I, twenties II, twenties III]. */
	switches: [number, number, number, number];
	/** Which twenties stage steps fastest. */
	fastSwitch: SwitchRole;
	/** Which twenties stage is the middle. The remaining one is the slow switch. */
	middleSwitch: SwitchRole;
	/** Daily alphabet: 26 distinct letters. First 6 are the sixes group. */
	alphabet: string;
}

/**
 * Default alphabet. The sixes group is the vowels, as it permanently was on the
 * earlier RED machine; on PURPLE the group was set by the daily key and rotated
 * every nine days.
 */
export const STRAIGHT_PLUGBOARD = "AEIOUYBCDFGHJKLMNPQRSTVWXZ";

/** Marks a garble in intercepted traffic: passed through, but still steps. */
export const GARBLE = "-";

export const DEFAULT_KEY: PurpleKey = {
	switches: [0, 0, 0, 0],
	fastSwitch: 1,
	middleSwitch: 2,
	alphabet: STRAIGHT_PLUGBOARD,
};

/** True if `s` is a usable daily alphabet: 26 distinct letters. */
export function isValidAlphabet(s: string): boolean {
	try {
		validateAlphabet(s);
		return true;
	} catch {
		return false;
	}
}

export function validateAlphabet(alphabet: string): string {
	const upper = alphabet.toUpperCase();
	if (upper.length !== 26) {
		throw new Error(`Alphabet must be 26 letters, got ${upper.length}`);
	}
	if (!/^[A-Z]{26}$/.test(upper)) {
		throw new Error("Alphabet must contain only the letters A-Z");
	}
	if (new Set(upper).size !== 26) {
		throw new Error("Alphabet must contain each letter exactly once");
	}
	return upper;
}

/**
 * Parse the shorthand US codebreakers used for a PURPLE key.
 *
 * Format `a-b,c,d-ef`, all 1-based:
 *   a  starting position of the sixes switch (1-25)
 *   b  starting position of twenties stage I (1-25)
 *   c  starting position of twenties stage II
 *   d  starting position of twenties stage III
 *   e  which stage is the fast switch (1-3)
 *   f  which stage is the middle switch (1-3)
 *
 * e.g. `9-1,24,6-23` — the key of the 14-part message of 7 December 1941.
 */
export function parseKey(switches: string, alphabet: string = STRAIGHT_PLUGBOARD): PurpleKey {
	const match = /^(\d+)-(\d+),(\d+),(\d+)-(\d)(\d)$/.exec(switches.trim());
	if (!match) {
		throw new Error(`Malformed switch key "${switches}" (expected e.g. 9-1,24,6-23)`);
	}
	const positions = match.slice(1, 5).map((n) => {
		const v = Number(n);
		if (v < 1 || v > SWITCH_POSITIONS) {
			throw new Error(`Switch position ${v} out of range 1-${SWITCH_POSITIONS}`);
		}
		return v - 1;
	}) as [number, number, number, number];

	const fastSwitch = Number(match[5]) as SwitchRole;
	const middleSwitch = Number(match[6]) as SwitchRole;

	return { switches: positions, fastSwitch, middleSwitch, alphabet: validateAlphabet(alphabet) };
}

function isRole(v: unknown): v is SwitchRole {
	return v === 1 || v === 2 || v === 3;
}

/**
 * Validate untrusted JSON into a PurpleKey, or throw explaining why not.
 *
 * Same contract as the Enigma side's parseConfig: presets are user-editable, so
 * nothing reaches the machine unchecked.
 */
export function parsePurpleKey(raw: unknown): PurpleKey {
	if (typeof raw !== "object" || raw === null) throw new Error("Key must be an object");
	const k = raw as Record<string, unknown>;

	if (!Array.isArray(k.switches) || k.switches.length !== 4) {
		throw new Error("switches must be an array of 4 positions");
	}
	const switches = k.switches.map((v, i) => {
		if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v >= SWITCH_POSITIONS) {
			throw new Error(
				`switches[${i}] must be an integer 0-${SWITCH_POSITIONS - 1}, got ${JSON.stringify(v)}`,
			);
		}
		return v;
	}) as [number, number, number, number];

	if (!isRole(k.fastSwitch)) {
		throw new Error(`fastSwitch must be 1, 2 or 3, got ${JSON.stringify(k.fastSwitch)}`);
	}
	if (!isRole(k.middleSwitch)) {
		throw new Error(`middleSwitch must be 1, 2 or 3, got ${JSON.stringify(k.middleSwitch)}`);
	}
	if (k.fastSwitch === k.middleSwitch) {
		throw new Error(`fastSwitch and middleSwitch cannot both be ${k.fastSwitch}`);
	}
	if (typeof k.alphabet !== "string") throw new Error("alphabet must be a string");

	return {
		switches,
		fastSwitch: k.fastSwitch,
		middleSwitch: k.middleSwitch,
		alphabet: validateAlphabet(k.alphabet),
	};
}

export class Purple97 {
	readonly sixes: SteppingSwitch;
	/** Twenties stages I, II, III in fixed order. */
	readonly twenties: [SteppingSwitch, SteppingSwitch, SteppingSwitch];
	readonly alphabet: string;
	readonly fastSwitch: SwitchRole;
	readonly middleSwitch: SwitchRole;
	readonly slowSwitch: SwitchRole;

	/** letter -> index into the daily alphabet. The input plugboard. */
	private readonly plugboard: Map<string, number>;

	constructor(key: PurpleKey = DEFAULT_KEY) {
		const { switches, fastSwitch, middleSwitch } = key;

		if (switches.length !== 4) throw new Error("Expected 4 switch positions");
		if (fastSwitch === middleSwitch) {
			throw new Error(`Fast and middle switch cannot both be ${fastSwitch}`);
		}
		for (const role of [fastSwitch, middleSwitch]) {
			if (![1, 2, 3].includes(role)) throw new Error(`Switch role out of range: ${role}`);
		}

		this.fastSwitch = fastSwitch;
		this.middleSwitch = middleSwitch;
		this.slowSwitch = ([1, 2, 3] as SwitchRole[]).find(
			(r) => r !== fastSwitch && r !== middleSwitch,
		)!;

		const dec = decryptTables();
		const enc = encryptTables();
		this.sixes = new SteppingSwitch(dec[0], enc[0], switches[0]);
		this.twenties = [
			new SteppingSwitch(dec[1], enc[1], switches[1]),
			new SteppingSwitch(dec[2], enc[2], switches[2]),
			new SteppingSwitch(dec[3], enc[3], switches[3]),
		];

		this.alphabet = validateAlphabet(key.alphabet);
		this.plugboard = new Map([...this.alphabet].map((c, i) => [c, i]));
	}

	/** Current positions, 0-based: [sixes, I, II, III]. */
	get positions(): [number, number, number, number] {
		return [
			this.sixes.position,
			this.twenties[0].position,
			this.twenties[1].position,
			this.twenties[2].position,
		];
	}

	private role(r: SwitchRole): SteppingSwitch {
		return this.twenties[r - 1];
	}

	/**
	 * Advance the switches by one character.
	 *
	 * The sixes switch always steps. Exactly one twenties stage steps, chosen
	 * from the positions as they were BEFORE anything moved — latching first is
	 * load-bearing, not defensive style. Stepping the sixes and then reading its
	 * position puts every subsequent decision off by one.
	 *
	 * Note the slow switch fires when the sixes switch is on its 24th position
	 * (index 23) and the middle is on its 25th (index 24) — not when both are on
	 * their last, as the machine is often described. The middle switch then takes
	 * its step on the following character. This is PURPLE's equivalent of
	 * Enigma's double-stepping anomaly: get it wrong and output stays correct for
	 * hundreds of characters before silently drifting.
	 */
	step(): void {
		const sixesPos = this.sixes.position;
		const middlePos = this.role(this.middleSwitch).position;

		this.sixes.step();

		if (sixesPos === SWITCH_POSITIONS - 2 && middlePos === SWITCH_POSITIONS - 1) {
			this.role(this.slowSwitch).step();
		} else if (sixesPos === SWITCH_POSITIONS - 1) {
			this.role(this.middleSwitch).step();
		} else {
			this.role(this.fastSwitch).step();
		}
	}

	private index(c: string): number {
		const n = this.plugboard.get(c);
		if (n === undefined) throw new Error(`Invalid input character "${c}"`);
		return n;
	}

	/** Encipher one letter and step. Throws on anything outside A-Z. */
	encryptChar(c: string): string {
		const n = this.index(c.toUpperCase());
		let x: number;
		if (n < SIXES_LEVELS) {
			x = this.sixes.encrypt(n);
		} else {
			const level = n - SIXES_LEVELS;
			x =
				SIXES_LEVELS +
				this.twenties[2].encrypt(this.twenties[1].encrypt(this.twenties[0].encrypt(level)));
		}
		this.step();
		return this.alphabet[x];
	}

	/**
	 * Decipher one letter and step. The twenties chain runs in the opposite
	 * stage order to encipherment — there is no reflector to make them equal.
	 *
	 * A GARBLE marker is passed straight through, but still steps the machine,
	 * so that the rest of an intercept stays aligned.
	 */
	decryptChar(c: string): string {
		if (c === GARBLE) {
			this.step();
			return GARBLE;
		}
		const n = this.index(c.toUpperCase());
		let x: number;
		if (n < SIXES_LEVELS) {
			x = this.sixes.decrypt(n);
		} else {
			const level = n - SIXES_LEVELS;
			x =
				SIXES_LEVELS +
				this.twenties[0].decrypt(this.twenties[1].decrypt(this.twenties[2].decrypt(level)));
		}
		this.step();
		return this.alphabet[x];
	}

	encrypt(plaintext: string): string {
		let out = "";
		for (const c of plaintext) out += this.encryptChar(c);
		return out;
	}

	decrypt(ciphertext: string): string {
		let out = "";
		for (const c of ciphertext) out += this.decryptChar(c);
		return out;
	}
}

export { SWITCH_POSITIONS, SIXES_LEVELS, TWENTIES_LEVELS };
