/**
 * Every concrete claim docs/purple.md makes about this machine. If one of these
 * fails, the guide is lying to the reader — fix the guide or fix the engine.
 */
import { describe, expect, it } from 'vitest';
import { Purple97, parseKey, type PurpleKey } from '../../src/lib/purple/machine';

const ALPHABET = 'NOKTYUXEQLHBRMPDICJASVWGZF';
const example = (): PurpleKey => parseKey('1-1,1,1-12', ALPHABET);

describe('docs/purple.md', () => {
	it('worked example: MEMORANDUM -> QWBKBVYATJ', () => {
		const m = new Purple97(example());
		expect(m.encrypt('MEMORANDUM')).toBe('QWBKBVYATJ');
		// The guide says the dials then read 11 11 01 01 (1-based).
		expect(m.positions.map((p) => p + 1)).toEqual([11, 11, 1, 1]);
	});

	it('worked example round trip: dials back to 01, Decipher', () => {
		expect(new Purple97(example()).decrypt('QWBKBVYATJ')).toBe('MEMORANDUM');
	});

	it('the sixes group is the first six letters of the alphabet', () => {
		expect(ALPHABET.slice(0, 6)).toBe('NOKTYU');
	});

	it('sixes letters never leave the sixes group, and vice versa', () => {
		const m = new Purple97(example());
		const sixes = new Set([...ALPHABET.slice(0, 6)]);
		for (let i = 0; i < 300; i++) {
			for (const c of ALPHABET) {
				const out = m.encryptChar(c);
				expect(sixes.has(out), `${c} -> ${out}`).toBe(sixes.has(c));
			}
		}
	});

	it('a repeated letter does eventually encipher to itself', () => {
		// The guide invites the reader to try exactly this. On Enigma it can never
		// happen; here the absence of a reflector makes it inevitable.
		const m = new Purple97(example());
		let firstFixedPoint = -1;
		for (let i = 0; i < 2000; i++) {
			if (m.encryptChar('A') === 'A') {
				firstFixedPoint = i;
				break;
			}
		}
		expect(firstFixedPoint).toBeGreaterThanOrEqual(0);
	});

	it('re-enciphering does not undo encipherment', () => {
		const cipher = new Purple97(example()).encrypt('MEMORANDUM');
		expect(new Purple97(example()).encrypt(cipher)).not.toBe('MEMORANDUM');
	});

	it('the slow switch moves on the 624th character and not before', () => {
		// fast = I, middle = II, so stage III is slow.
		const m = new Purple97(example());
		expect(m.slowSwitch).toBe(3);
		const start = m.positions[3];

		for (let i = 0; i < 623; i++) m.encryptChar('A');
		expect(m.positions[3], 'after 623 characters').toBe(start);

		m.encryptChar('A');
		expect(m.positions[3], 'after 624 characters').not.toBe(start);
	});

	it('the middle switch reaches position 25 on the 600th character', () => {
		const m = new Purple97(example());
		for (let i = 0; i < 599; i++) m.encryptChar('A');
		expect(m.positions[2] + 1, 'after 599').toBe(24);
		m.encryptChar('A');
		expect(m.positions[2] + 1, 'after 600').toBe(25);
	});

	it('the sixes switch steps on every character', () => {
		const m = new Purple97(example());
		for (let i = 1; i <= 30; i++) {
			m.encryptChar('A');
			expect(m.positions[0]).toBe(i % 25);
		}
	});

	it('the shorthand maps onto the dials as documented', () => {
		// 9-1,24,6-23 -> sixes 9, stages 1/24/6, fast II, middle III, slow I.
		const key = parseKey('9-1,24,6-23', ALPHABET);
		expect(key.switches.map((p) => p + 1)).toEqual([9, 1, 24, 6]);
		expect(key.fastSwitch).toBe(2);
		expect(key.middleSwitch).toBe(3);
		expect(new Purple97(key).slowSwitch).toBe(1);
	});

	it('a garble is only accepted when deciphering', () => {
		expect(new Purple97(example()).decrypt('AB-CD')).toHaveLength(5);
		expect(() => new Purple97(example()).encrypt('AB-CD')).toThrow();
	});
});
