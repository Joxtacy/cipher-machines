/**
 * The key layouts are presentation data, but a dropped or duplicated letter
 * would make a key unreachable by mouse — which no engine test would catch.
 */
import { describe, expect, it } from "vitest";
import {
	ENIGMA_ROWS,
	ENIGMA_STAGGER,
	TYPEWRITER_ROWS,
	TYPEWRITER_STAGGER,
} from "../../src/lib/keyboard-layout";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

describe("key layouts", () => {
	const layouts = [
		["Enigma", ENIGMA_ROWS, ENIGMA_STAGGER],
		["typewriter", TYPEWRITER_ROWS, TYPEWRITER_STAGGER],
	] as const;

	it.each(layouts)("%s covers all 26 letters exactly once", (_name, rows) => {
		const letters = rows.flat();
		expect(letters).toHaveLength(26);
		expect([...letters].sort().join("")).toBe(ALPHABET);
	});

	it.each(layouts)("%s has one stagger value per row", (_name, rows, stagger) => {
		expect(stagger).toHaveLength(rows.length);
		for (const v of stagger) expect(v).toBeGreaterThanOrEqual(0);
	});

	it("Enigma uses the German QWERTZU order, not QWERTY", () => {
		// Z sits where an English keyboard has Y. Getting this backwards is the
		// classic Enigma-simulator tell.
		expect(ENIGMA_ROWS[0].join("")).toBe("QWERTZUIO");
		expect(ENIGMA_ROWS[0]).not.toContain("Y");
	});

	it("Enigma uses its own 9/8/9 split, which is not a typewriter's", () => {
		expect(ENIGMA_ROWS.map((r) => r.length)).toEqual([9, 8, 9]);
	});

	it("PURPLE uses a standard QWERTY typewriter layout", () => {
		// PURPLE had no cipher keyboard: it was driven by ordinary electric
		// typewriters using the 26-letter English alphabet.
		expect(TYPEWRITER_ROWS[0].join("")).toBe("QWERTYUIOP");
		expect(TYPEWRITER_ROWS[1].join("")).toBe("ASDFGHJKL");
		expect(TYPEWRITER_ROWS[2].join("")).toBe("ZXCVBNM");
		expect(TYPEWRITER_ROWS.map((r) => r.length)).toEqual([10, 9, 7]);
	});

	it("the two layouts are genuinely different", () => {
		// Guards the point of the split: PURPLE must not silently inherit
		// Enigma's German layout again.
		expect(TYPEWRITER_ROWS).not.toEqual(ENIGMA_ROWS);
	});
});
