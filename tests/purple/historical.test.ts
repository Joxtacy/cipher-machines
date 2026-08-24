import { describe, expect, it } from "vitest";
import { GARBLE, Purple97, parseKey } from "../../src/lib/purple/machine";
import {
	PART1_ALPHABET,
	PART1_CIPHERTEXT,
	PART1_KEY,
	PART1_PLAINTEXT,
} from "./fourteen-part-message";

/**
 * The real test of the engine. 1,285 characters is long enough to cross the
 * slow-switch event at character 623, so a wrong stepping rule cannot survive
 * this even though it would survive any short message.
 */
describe("14-part message, 7 December 1941", () => {
	const machine = () => new Purple97(parseKey(PART1_KEY, PART1_ALPHABET));

	it("has aligned fixture data", () => {
		expect(PART1_CIPHERTEXT).toHaveLength(PART1_PLAINTEXT.length);
		expect(PART1_CIPHERTEXT.length).toBeGreaterThan(700);
	});

	it("decrypts part 1, ignoring the garbles as received", () => {
		const actual = machine().decrypt(PART1_CIPHERTEXT);
		expect(actual).toHaveLength(PART1_PLAINTEXT.length);

		const mismatches: string[] = [];
		for (let i = 0; i < PART1_PLAINTEXT.length; i++) {
			const expectedChar = PART1_PLAINTEXT[i];
			// Garbles sit in either stream; neither side is meaningful there.
			if (expectedChar === GARBLE || PART1_CIPHERTEXT[i] === GARBLE) continue;
			if (actual[i] !== expectedChar) {
				mismatches.push(`${i}: expected ${expectedChar}, got ${actual[i]}`);
			}
		}
		expect(mismatches).toEqual([]);
	});

	it("recovers the opening romaji and the English body", () => {
		const actual = machine().decrypt(PART1_CIPHERTEXT);
		expect(actual.startsWith("FOVTATAKIDASINIMUIMINOMOXIWOIRUBESI")).toBe(true);
		expect(actual).toContain("MEMORANDUM");
		expect(actual).toContain("THEGOVERNMENTOFTHEUNITEDSTATES");
		expect(actual).toContain("PEACEOFTHEPACIFICAREA");
		expect(actual).toContain("NEGOTIATIONSWITHTHEUTMOSTSINCERITY");
		// Garbles survive in place: the R of GOVERNMENT was lost in transmission.
		expect(actual).toContain("THEGOVE-NMENTOFJAPAN");
	});

	it("crosses the slow-switch event partway through the message", () => {
		// Guards the point of this fixture: if the message were shorter than 624
		// characters it would pass with a wrong stepping rule.
		const m = machine();
		const before = m.positions[m.slowSwitch];
		m.decrypt(PART1_CIPHERTEXT);
		expect(PART1_CIPHERTEXT.length).toBeGreaterThan(623);
		expect(m.positions[m.slowSwitch]).not.toBe(before);
	});

	it("re-enciphers the recovered plaintext back to the ciphertext", () => {
		// Skips garbled positions: those cannot round-trip by definition.
		const recovered = machine().decrypt(PART1_CIPHERTEXT);
		const clean = [...recovered].map((c, i) =>
			c === GARBLE || PART1_CIPHERTEXT[i] === GARBLE ? null : c,
		);
		const reEnciphered = machine().encrypt(
			clean
				.map((c, i) => c ?? recovered[i])
				.join("")
				.replaceAll(GARBLE, "A"),
		);
		for (let i = 0; i < clean.length; i++) {
			if (clean[i] === null) continue;
			expect(reEnciphered[i], `position ${i}`).toBe(PART1_CIPHERTEXT[i]);
		}
	});
});
