import { describe, expect, it } from "vitest";
import { Rotor, ROTOR_SPECS } from "../../src/lib/enigma/rotors";
import { charToIndex } from "../../src/lib/enigma/alphabet";

describe("Rotor", () => {
	it("forward and reverse are inverses (position 0, ring 0)", () => {
		for (const id of ["I", "II", "III", "IV", "V"] as const) {
			const r = new Rotor(id);
			for (let i = 0; i < 26; i++) {
				expect(r.reverse(r.forward(i))).toBe(i);
				expect(r.forward(r.reverse(i))).toBe(i);
			}
		}
	});

	it("forward and reverse are inverses for arbitrary positions and rings", () => {
		const r = new Rotor("II", 7, 13);
		for (let i = 0; i < 26; i++) {
			expect(r.reverse(r.forward(i))).toBe(i);
		}
	});

	it("reflects the published wiring on rotor I at position 0, ring 0", () => {
		const r = new Rotor("I");
		// A → E per wiring 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'
		expect(r.forward(charToIndex("A"))).toBe(charToIndex("E"));
		expect(r.forward(charToIndex("B"))).toBe(charToIndex("K"));
		expect(r.forward(charToIndex("Z"))).toBe(charToIndex("J"));
	});

	it("atNotch reflects spec", () => {
		expect(ROTOR_SPECS.I.notch).toBe("Q");
		const r = new Rotor("I", charToIndex("Q"));
		expect(r.atNotch()).toBe(true);
		r.advance();
		expect(r.atNotch()).toBe(false);
	});
});
