import { describe, expect, it } from 'vitest';
import { charToIndex, indexToChar, mod26, isLetter } from '../../src/lib/enigma/alphabet';

describe('alphabet', () => {
	it('round-trips A..Z', () => {
		for (let i = 0; i < 26; i++) {
			expect(charToIndex(indexToChar(i))).toBe(i);
		}
	});

	it('mod26 handles negatives', () => {
		expect(mod26(-1)).toBe(25);
		expect(mod26(-27)).toBe(25);
		expect(mod26(26)).toBe(0);
	});

	it('rejects non A-Z in charToIndex', () => {
		expect(() => charToIndex('a')).toThrow();
		expect(() => charToIndex('1')).toThrow();
	});

	it('isLetter accepts both cases', () => {
		expect(isLetter('a')).toBe(true);
		expect(isLetter('Z')).toBe(true);
		expect(isLetter(' ')).toBe(false);
		expect(isLetter('AB')).toBe(false);
	});
});
