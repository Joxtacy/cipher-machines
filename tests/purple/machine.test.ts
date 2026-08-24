import { describe, expect, it } from "vitest";
import {
	DEFAULT_KEY,
	GARBLE,
	Purple97,
	STRAIGHT_PLUGBOARD,
	SteppingSwitch,
	parseKey,
} from "../../src/lib/purple/machine";
import { decryptTables, encryptTables } from "../../src/lib/purple/data";

const KEY = "9-1,24,6-23";
const ALPHABET = "NOKTYUXEQLHBRMPDICJASVWGZF";

describe("parseKey", () => {
	it("reads the codebreakers’ shorthand", () => {
		expect(parseKey(KEY, ALPHABET)).toEqual({
			switches: [8, 0, 23, 5],
			fastSwitch: 2,
			middleSwitch: 3,
			alphabet: ALPHABET,
		});
	});

	it("defaults to the straight plugboard and uppercases the alphabet", () => {
		expect(parseKey("1-1,1,1-12").alphabet).toBe(STRAIGHT_PLUGBOARD);
		expect(parseKey("1-1,1,1-12", ALPHABET.toLowerCase()).alphabet).toBe(ALPHABET);
	});

	it.each([
		["empty", ""],
		["missing speeds", "9-1,24,6"],
		["two twenties", "9-1,24-23"],
		["position 0", "0-1,24,6-23"],
		["position 26", "9-26,24,6-23"],
		["non-numeric", "x-1,24,6-23"],
		["three speed digits", "9-1,24,6-231"],
	])("rejects %s", (_label, key) => {
		expect(() => parseKey(key)).toThrow();
	});

	it.each([
		["too short", "ABC"],
		["repeated letter", "AACTYUXEQLHBRMPDICJASVWGZF"],
		["a digit", "N0KTYUXEQLHBRMPDICJASVWGZF"],
		["27 letters", STRAIGHT_PLUGBOARD + "A"],
	])("rejects alphabet: %s", (_label, alphabet) => {
		expect(() => parseKey("1-1,1,1-12", alphabet)).toThrow();
	});
});

describe("SteppingSwitch", () => {
	it("applies the permutation for its current position", () => {
		const dec = decryptTables();
		const enc = encryptTables();
		const s = new SteppingSwitch(dec[0], enc[0], 0);
		expect(s.decrypt(0)).toBe(dec[0][0][0]);
		s.step();
		expect(s.decrypt(0)).toBe(dec[0][1][0]);
	});

	it("encrypt undoes decrypt at any position", () => {
		const dec = decryptTables();
		const enc = encryptTables();
		const s = new SteppingSwitch(dec[1], enc[1], 7);
		for (let level = 0; level < s.levels; level++) {
			expect(s.encrypt(s.decrypt(level))).toBe(level);
		}
	});

	it("wraps and rejects out-of-range positions", () => {
		const dec = decryptTables();
		const enc = encryptTables();
		const s = new SteppingSwitch(dec[0], enc[0], 24);
		expect(s.step()).toBe(0);
		expect(() => s.setPosition(25)).toThrow();
		expect(() => s.setPosition(-1)).toThrow();
		expect(() => new SteppingSwitch(dec[0], enc[0], 99)).toThrow();
	});
});

describe("Purple97", () => {
	const machine = () => new Purple97(parseKey(KEY, ALPHABET));

	it("constructs from the default key", () => {
		const m = new Purple97();
		expect(m.positions).toEqual([0, 0, 0, 0]);
		expect(m.alphabet).toBe(STRAIGHT_PLUGBOARD);
		expect(DEFAULT_KEY.fastSwitch).toBe(1);
	});

	it("rejects the same stage as both fast and middle", () => {
		expect(() => new Purple97({ ...DEFAULT_KEY, fastSwitch: 2, middleSwitch: 2 })).toThrow();
	});

	it("round-trips a message: encipher then decipher", () => {
		// PURPLE is NOT reciprocal, so this needs both directions explicitly —
		// unlike Enigma, running the ciphertext back through in the same
		// direction does not give the plaintext.
		const plaintext = "MEMORANDUMTHEGOVERNMENTOFJAPAN";
		const cipher = machine().encrypt(plaintext);
		expect(cipher).not.toBe(plaintext);
		expect(machine().decrypt(cipher)).toBe(plaintext);
	});

	it("is not reciprocal: re-encrypting does not recover the plaintext", () => {
		const plaintext = "ATTACKATDAWNXX";
		const cipher = machine().encrypt(plaintext);
		expect(machine().encrypt(cipher)).not.toBe(plaintext);
	});

	it("can encipher a letter to itself, unlike Enigma", () => {
		// No reflector, so the no-fixed-point weakness simply does not exist.
		const m = machine();
		let fixedPoints = 0;
		const text = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".repeat(20);
		const out = m.encrypt(text);
		for (let i = 0; i < text.length; i++) if (out[i] === text[i]) fixedPoints++;
		expect(fixedPoints).toBeGreaterThan(0);
	});

	it("keeps the sixes and twenties groups separate", () => {
		// A letter from the sixes group can only ever come out as one of the six;
		// the twenties likewise. That partition is the machine's defining feature.
		const m = machine();
		const sixes = new Set([...ALPHABET.slice(0, 6)]);
		const twenties = new Set([...ALPHABET.slice(6)]);
		for (let i = 0; i < 200; i++) {
			for (const c of ALPHABET) {
				const out = m.encryptChar(c);
				if (sixes.has(c)) expect(sixes.has(out), `${c} -> ${out}`).toBe(true);
				else expect(twenties.has(out), `${c} -> ${out}`).toBe(true);
			}
		}
	});

	it("advances one character per letter in both directions", () => {
		const enc = machine();
		enc.encrypt("HELLO");
		const dec = machine();
		dec.decrypt("HELLO");
		expect(enc.positions).toEqual(dec.positions);
		expect(enc.positions[0]).toBe((8 + 5) % 25);
	});

	it("passes a garble through on decrypt and still steps", () => {
		const withGarble = machine().decrypt(`AB${GARBLE}CD`);
		expect(withGarble[2]).toBe(GARBLE);
		expect(withGarble).toHaveLength(5);

		// The characters after the garble must match a run where the garble was a
		// real letter — i.e. the machine stayed in step.
		const aligned = machine().decrypt("ABXCD");
		expect(withGarble.slice(3)).toBe(aligned.slice(3));
	});

	it("rejects invalid input", () => {
		expect(() => machine().encrypt("HELLO WORLD")).toThrow();
		expect(() => machine().encrypt("ABC1")).toThrow();
		expect(() => machine().encrypt(GARBLE)).toThrow();
	});
});
