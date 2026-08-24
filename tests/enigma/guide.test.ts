/**
 * Every concrete claim docs/guide.md makes about this machine. If one of these
 * fails, the guide is now lying to the reader — fix the guide or fix the engine.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, Enigma, type MachineConfig } from '../../src/lib/enigma/machine';
import { charToIndex, indexToChar } from '../../src/lib/enigma/alphabet';

const base = (): MachineConfig => structuredClone(DEFAULT_CONFIG);
const at = (p: string): MachineConfig => ({
	...base(),
	positions: [charToIndex(p[0]), charToIndex(p[1]), charToIndex(p[2])]
});

describe('docs/guide.md', () => {
	it('worked example: HELLO -> ILBDA, and back again', () => {
		expect(new Enigma(base()).encryptString('HELLO')).toBe('ILBDA');
		expect(new Enigma(base()).encryptString('ILBDA')).toBe('HELLO');
	});

	it('consecutive outputs CAN repeat: AA from ADB gives BB', () => {
		// The guide uses this to correct the common "never the same letter twice
		// in a row" claim. It must stay a real counterexample.
		expect(new Enigma(at('ADB')).encryptString('AA')).toBe('BB');
	});

	it('ring tip: changing the right ring changes the lamp for an unchanged window', () => {
		const plain = new Enigma(base()).encryptChar('A');
		const ringB = new Enigma({ ...base(), rings: [0, 0, 1] }).encryptChar('A');
		expect(plain).toBe('B');
		expect(ringB).toBe('U');
	});

	it('turnover letter never moves with Ringstellung', () => {
		// Rotor III in the right slot always kicks the middle rotor on V->W,
		// whatever the ring is set to.
		for (const ring of [0, 1, 5, 25]) {
			const turnovers: string[] = [];
			for (let start = 0; start < 26; start++) {
				const e = new Enigma({ ...base(), rings: [0, 0, ring], positions: [0, 0, start] });
				const before = e.positions[1];
				e.encryptChar('A');
				if (e.positions[1] !== before) turnovers.push(indexToChar(start));
			}
			expect(turnovers).toEqual(['V']);
		}
	});

	it('the middle rotor visits all 26 positions — it does not skip one', () => {
		const e = new Enigma(base());
		const seen = new Set<number>();
		for (let i = 0; i < 16_900; i++) {
			e.encryptChar('A');
			seen.add(e.positions[1]);
		}
		expect(seen.size).toBe(26);
	});

	it('reproduces the dwell table in the guide exactly', () => {
		// Rotor II's notch is E. Total presses spent showing each middle-rotor
		// letter over one full cycle — this is the table docs/guide.md prints.
		const e = new Enigma(base());
		const dwell = new Map<string, number>();
		for (let i = 0; i < 16_900; i++) {
			e.encryptChar('A');
			const letter = indexToChar(e.positions[1]);
			dwell.set(letter, (dwell.get(letter) ?? 0) + 1);
		}
		expect(dwell.get('E')).toBe(26); // the notch: 26 visits of 1 press
		expect(dwell.get('F')).toBe(650); // 26 visits of 25 presses
		for (const letter of 'ABCDGHIJKLMNOPQRSTUVWXYZ') {
			expect(dwell.get(letter), letter).toBe(676); // 26 visits of 26
		}
		expect([...dwell.values()].reduce((a, b) => a + b, 0)).toBe(16_900);
		// The shortfall against a plain odometer is one letter squared.
		expect(26 ** 3 - 16_900).toBe(676);
	});

	it('canonical ADU double-step sequence', () => {
		const e = new Enigma(at('ADU'));
		const seen: string[] = [];
		for (let i = 0; i < 4; i++) {
			e.encryptChar('A');
			seen.push(e.positions.map(indexToChar).join(''));
		}
		expect(seen).toEqual(['ADV', 'AEW', 'BFX', 'BFY']);
	});

	it('10 plug pairs leave exactly 6 letters unswapped', () => {
		const pairs: [string, string][] = [
			['A', 'B'],
			['C', 'D'],
			['E', 'F'],
			['G', 'H'],
			['I', 'J'],
			['K', 'L'],
			['M', 'N'],
			['O', 'P'],
			['Q', 'R'],
			['S', 'T']
		];
		const swapped = new Set(pairs.flat());
		expect(26 - swapped.size).toBe(6);
	});

	it('spaces and digits pass through unchanged and do not step the rotors', () => {
		const e = new Enigma(base());
		expect(e.encryptString('AB CD-1')).toBe('BJ EL-1');
		expect(e.positions.map(indexToChar).join('')).toBe('AAE');
	});
});
