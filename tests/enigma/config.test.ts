import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseConfig } from '../../src/lib/enigma/machine';

const valid = () => JSON.parse(JSON.stringify(DEFAULT_CONFIG));

describe('parseConfig', () => {
	it('accepts a valid config and returns a copy', () => {
		const input = valid();
		const out = parseConfig(input);
		expect(out).toEqual(DEFAULT_CONFIG);
		expect(out.rotors).not.toBe(input.rotors);
	});

	it('accepts a fully-loaded config and normalises plug case', () => {
		const out = parseConfig({
			rotors: ['V', 'IV', 'II'],
			rings: [1, 20, 11],
			positions: [25, 0, 13],
			reflector: 'C',
			plugboard: [['a', 'v'], ['B', 'S']]
		});
		expect(out.plugboard).toEqual([['A', 'V'], ['B', 'S']]);
	});

	it.each([
		['non-object', 42],
		['null', null],
		['unknown rotor', { ...valid(), rotors: ['I', 'II', 'IX'] }],
		['duplicate rotors', { ...valid(), rotors: ['I', 'II', 'II'] }],
		['too few rotors', { ...valid(), rotors: ['I', 'II'] }],
		['unknown reflector', { ...valid(), reflector: 'Z' }],
		['missing reflector', { ...valid(), reflector: undefined }],
		['out-of-range ring', { ...valid(), rings: [0, 0, 26] }],
		['negative position', { ...valid(), positions: [0, -1, 0] }],
		['fractional ring', { ...valid(), rings: [0, 1.5, 0] }],
		['plugboard not an array', { ...valid(), plugboard: 'AB' }],
		['malformed plug pair', { ...valid(), plugboard: [['A']] }],
		['non-letter plug', { ...valid(), plugboard: [['A', '1']] }],
		['reused plug letter', { ...valid(), plugboard: [['A', 'B'], ['A', 'C']] }],
		['self plug pair', { ...valid(), plugboard: [['A', 'A']] }],
		['eleven plug pairs', {
			...valid(),
			plugboard: [
				['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H'], ['I', 'J'], ['K', 'L'],
				['M', 'N'], ['O', 'P'], ['Q', 'R'], ['S', 'T'], ['U', 'V']
			]
		}]
	])('rejects %s', (_label, input) => {
		expect(() => parseConfig(input)).toThrow();
	});

	it('rejects string positions, the case that used to encrypt to NUL bytes', () => {
		expect(() => parseConfig({ ...valid(), positions: ['A', 'A', 'A'] })).toThrow(/positions/);
	});
});
