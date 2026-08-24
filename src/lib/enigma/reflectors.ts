import { ALPHABET_SIZE, charToIndex } from "./alphabet";

export type ReflectorId = "A" | "B" | "C";

const REFLECTOR_WIRINGS: Record<ReflectorId, string> = {
	// UKW-A was the original 1930 reflector, withdrawn from service before the
	// war. Included so the published 1930 test message can be decrypted.
	A: "EJMZALYXVBWFCRQUONTSPIKHGD",
	B: "YRUHQSLDPXNGOKMIEBFZCWVJAT",
	C: "FVPJIAOYEDRZXWGCTKUQSBNMHL",
};

export const REFLECTOR_IDS = Object.keys(REFLECTOR_WIRINGS) as ReflectorId[];

export class Reflector {
	readonly id: ReflectorId;
	readonly map: number[];

	constructor(id: ReflectorId) {
		this.id = id;
		const wiring = REFLECTOR_WIRINGS[id];
		if (!wiring) throw new Error(`Unknown reflector: ${id}`);
		this.map = new Array(ALPHABET_SIZE);
		for (let i = 0; i < ALPHABET_SIZE; i++) {
			this.map[i] = charToIndex(wiring[i]);
		}
	}

	reflect(c: number): number {
		return this.map[c];
	}
}
