import { describe, expect, it } from "vitest";
import { Enigma, type MachineConfig } from "../../src/lib/enigma/machine";
import { charToIndex } from "../../src/lib/enigma/alphabet";

const baseConfig: MachineConfig = {
	rotors: ["I", "II", "III"],
	rings: [0, 0, 0],
	positions: [0, 0, 0],
	reflector: "B",
	plugboard: [],
};

function clone(c: MachineConfig): MachineConfig {
	return JSON.parse(JSON.stringify(c));
}

describe("Enigma", () => {
	// Canonical reference: rotors I-II-III, all rings A, all positions A,
	// reflector B, no plugs. Verified against the palloks reference simulator.
	it('encrypts "AAAAAAAAAA" → "BDZGOWCXLT"', () => {
		const e = new Enigma(clone(baseConfig));
		expect(e.encryptString("AAAAAAAAAA")).toBe("BDZGOWCXLT");
	});

	it('encrypts "A" → "B" with default config', () => {
		const e = new Enigma(clone(baseConfig));
		expect(e.encryptChar("A")).toBe("B");
	});

	it("round-trips: encrypt then decrypt with same starting state", () => {
		const plaintext = "THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG";
		const enc = new Enigma(clone(baseConfig));
		const ciphertext = enc.encryptString(plaintext);
		expect(ciphertext).not.toBe(plaintext);
		const dec = new Enigma(clone(baseConfig));
		expect(dec.encryptString(ciphertext)).toBe(plaintext);
	});

	it("respects the plugboard (involution under any plug pairs)", () => {
		const cfg: MachineConfig = {
			...clone(baseConfig),
			plugboard: [
				["A", "B"],
				["C", "D"],
				["E", "F"],
				["G", "H"],
				["I", "J"],
				["K", "L"],
			],
		};
		const plaintext = "SECRETMESSAGE";
		const enc = new Enigma(clone(cfg));
		const ciphertext = enc.encryptString(plaintext);
		const dec = new Enigma(clone(cfg));
		expect(dec.encryptString(ciphertext)).toBe(plaintext);
	});

	it("honours non-default ring settings (involution holds)", () => {
		const cfg: MachineConfig = {
			...clone(baseConfig),
			rings: [3, 7, 11],
			positions: [charToIndex("M"), charToIndex("C"), charToIndex("K")],
		};
		const plaintext = "HELLOWORLD";
		const enc = new Enigma(clone(cfg));
		const ciphertext = enc.encryptString(plaintext);
		const dec = new Enigma(clone(cfg));
		expect(dec.encryptString(ciphertext)).toBe(plaintext);
	});

	it("honours rotor selection (V/IV/I, reflector C)", () => {
		const cfg: MachineConfig = {
			rotors: ["V", "IV", "I"],
			rings: [0, 0, 0],
			positions: [0, 0, 0],
			reflector: "C",
			plugboard: [],
		};
		const plaintext = "ENIGMA";
		const enc = new Enigma(clone(cfg));
		const ciphertext = enc.encryptString(plaintext);
		const dec = new Enigma(clone(cfg));
		expect(dec.encryptString(ciphertext)).toBe(plaintext);
	});

	it("a letter never encrypts to itself", () => {
		const e = new Enigma(clone(baseConfig));
		const plaintext = "A".repeat(500);
		const ciphertext = e.encryptString(plaintext);
		for (let i = 0; i < plaintext.length; i++) {
			expect(ciphertext[i]).not.toBe(plaintext[i]);
		}
	});

	it("passes non-letter characters through unchanged", () => {
		const e = new Enigma(clone(baseConfig));
		expect(e.encryptChar(" ")).toBe(" ");
		expect(e.encryptChar("1")).toBe("1");
	});
});
