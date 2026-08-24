import { describe, expect, it } from 'vitest';
import { Enigma, type MachineConfig } from '../../src/lib/enigma/machine';
import { charToIndex, indexToChar } from '../../src/lib/enigma/alphabet';

function snapshot(e: Enigma): string {
	return e.positions.map(indexToChar).join('');
}

const cfg = (positions: [string, string, string]): MachineConfig => ({
	rotors: ['I', 'II', 'III'],
	rings: [0, 0, 0],
	positions: [charToIndex(positions[0]), charToIndex(positions[1]), charToIndex(positions[2])],
	reflector: 'B',
	plugboard: []
});

describe('Enigma stepping', () => {
	it('advances the right rotor on every keypress', () => {
		const e = new Enigma(cfg(['A', 'A', 'A']));
		e.encryptChar('X');
		expect(snapshot(e)).toBe('AAB');
		e.encryptChar('X');
		expect(snapshot(e)).toBe('AAC');
	});

	it('right-rotor notch (V on rotor III) advances the middle rotor', () => {
		// Rotor III notch is V. Set right=V; on next press it should
		// advance the middle rotor and itself.
		const e = new Enigma(cfg(['A', 'A', 'V']));
		e.encryptChar('X');
		expect(snapshot(e)).toBe('ABW');
	});

	it('exhibits the double-stepping anomaly', () => {
		// Rotor II notch is E. Place middle at E, right at any non-notch.
		// On the very next press: middle is at notch → middle advances AND
		// left advances; right also advances as always.
		const e = new Enigma(cfg(['A', 'E', 'A']));
		e.encryptChar('X');
		expect(snapshot(e)).toBe('BFB');
	});

	it('matches the canonical double-step sequence preceding ADV', () => {
		// Walking up to the double step from ADU shows the classic pattern:
		// ADU → ADV → AEW → BFX → BFY (middle steps twice in a row).
		const e = new Enigma(cfg(['A', 'D', 'U']));
		e.encryptChar('X');
		expect(snapshot(e)).toBe('ADV');
		e.encryptChar('X');
		expect(snapshot(e)).toBe('AEW');
		e.encryptChar('X');
		expect(snapshot(e)).toBe('BFX');
		e.encryptChar('X');
		expect(snapshot(e)).toBe('BFY');
	});

	it('has period 26 × 25 × 26 = 16,900 (not 26³) because of double stepping', () => {
		const e = new Enigma(cfg(['A', 'A', 'A']));
		for (let i = 0; i < 16_900; i++) e.encryptChar('A');
		expect(snapshot(e)).toBe('AAA');
	});
});
