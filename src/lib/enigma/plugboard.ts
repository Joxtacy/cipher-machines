import { ALPHABET_SIZE, charToIndex, indexToChar } from './alphabet';

export type PlugPair = [string, string];

/** A Wehrmacht Enigma shipped with 10 Steckerkabel. 13 would be physically
 *  possible, but 10 is what the machine was issued and operated with. */
export const MAX_PLUG_PAIRS = 10;

export class Plugboard {
	readonly map: number[];

	constructor(pairs: PlugPair[] = []) {
		this.map = new Array(ALPHABET_SIZE);
		for (let i = 0; i < ALPHABET_SIZE; i++) this.map[i] = i;

		if (pairs.length > MAX_PLUG_PAIRS) {
			throw new Error(`At most ${MAX_PLUG_PAIRS} plugboard pairs, got ${pairs.length}`);
		}

		const seen = new Set<number>();
		for (const [a, b] of pairs) {
			const ai = charToIndex(a.toUpperCase());
			const bi = charToIndex(b.toUpperCase());
			if (ai === bi) throw new Error(`Plugboard pair must be distinct: ${a}${b}`);
			if (seen.has(ai) || seen.has(bi)) {
				throw new Error(`Plugboard letter reused: ${indexToChar(ai)} or ${indexToChar(bi)}`);
			}
			seen.add(ai);
			seen.add(bi);
			this.map[ai] = bi;
			this.map[bi] = ai;
		}
	}

	swap(c: number): number {
		return this.map[c];
	}
}
