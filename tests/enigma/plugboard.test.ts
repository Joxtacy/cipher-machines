import { describe, expect, it } from 'vitest';
import { Plugboard } from '../../src/lib/enigma/plugboard';
import { charToIndex } from '../../src/lib/enigma/alphabet';

describe('Plugboard', () => {
	it('without pairs is identity', () => {
		const p = new Plugboard([]);
		for (let i = 0; i < 26; i++) expect(p.swap(i)).toBe(i);
	});

	it('swaps configured pairs symmetrically', () => {
		const p = new Plugboard([['A', 'B'], ['C', 'D']]);
		expect(p.swap(charToIndex('A'))).toBe(charToIndex('B'));
		expect(p.swap(charToIndex('B'))).toBe(charToIndex('A'));
		expect(p.swap(charToIndex('C'))).toBe(charToIndex('D'));
		expect(p.swap(charToIndex('E'))).toBe(charToIndex('E'));
	});

	it('rejects identical pairs', () => {
		expect(() => new Plugboard([['A', 'A']])).toThrow();
	});

	it('rejects reused letters', () => {
		expect(() => new Plugboard([['A', 'B'], ['A', 'C']])).toThrow();
	});
});
