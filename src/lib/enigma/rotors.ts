import { ALPHABET_SIZE, charToIndex, mod26 } from "./alphabet";

export type RotorId = "I" | "II" | "III" | "IV" | "V";

interface RotorSpec {
	wiring: string;
	notch: string;
}

export const ROTOR_SPECS: Record<RotorId, RotorSpec> = {
	I: { wiring: "EKMFLGDQVZNTOWYHXUSPAIBRCJ", notch: "Q" },
	II: { wiring: "AJDKSIRUXBLHWTMCQGZNPYFVOE", notch: "E" },
	III: { wiring: "BDFHJLCPRTXVZNYEIWGAKMUSQO", notch: "V" },
	IV: { wiring: "ESOVPZJAYQUIRHXLNFTGKDCMWB", notch: "J" },
	V: { wiring: "VZBRGITYUPSDNHLXAWMJQOFECK", notch: "Z" },
};

export const ROTOR_IDS = Object.keys(ROTOR_SPECS) as RotorId[];

export class Rotor {
	readonly id: RotorId;
	readonly forwardMap: number[];
	readonly reverseMap: number[];
	readonly notchIndex: number;
	position: number;
	ring: number;

	constructor(id: RotorId, position: number = 0, ring: number = 0) {
		this.id = id;
		const spec = ROTOR_SPECS[id];
		if (!spec) throw new Error(`Unknown rotor: ${id}`);
		this.forwardMap = new Array(ALPHABET_SIZE);
		this.reverseMap = new Array(ALPHABET_SIZE);
		for (let i = 0; i < ALPHABET_SIZE; i++) {
			const out = charToIndex(spec.wiring[i]);
			this.forwardMap[i] = out;
			this.reverseMap[out] = i;
		}
		this.notchIndex = charToIndex(spec.notch);
		this.position = mod26(position);
		this.ring = mod26(ring);
	}

	atNotch(): boolean {
		return this.position === this.notchIndex;
	}

	advance(): void {
		this.position = mod26(this.position + 1);
	}

	forward(c: number): number {
		const offset = mod26(this.position - this.ring);
		return mod26(this.forwardMap[mod26(c + offset)] - offset);
	}

	reverse(c: number): number {
		const offset = mod26(this.position - this.ring);
		return mod26(this.reverseMap[mod26(c + offset)] - offset);
	}
}
