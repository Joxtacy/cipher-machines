import { describe, expect, it } from 'vitest';
import { MachineStore } from '../../src/lib/state/machine.svelte';
import { charToIndex, indexToChar } from '../../src/lib/enigma/alphabet';
import { MAX_PLUG_PAIRS } from '../../src/lib/enigma/plugboard';
import type { MachineConfig } from '../../src/lib/enigma/machine';

const window = (m: MachineStore) => m.positions.map(indexToChar).join('');

describe('MachineStore', () => {
	it('encrypts through the live config and syncs rotor positions back', () => {
		const m = new MachineStore();
		expect(m.pressKey('A')).toBe('B');
		expect(window(m)).toBe('AAB');
	});

	it('matches the canonical reference vector one keypress at a time', () => {
		const m = new MachineStore();
		let out = '';
		for (let i = 0; i < 10; i++) out += m.pressKey('A');
		expect(out).toBe('BDZGOWCXLT');
	});

	it('picks up a config change made mid-message', () => {
		const a = new MachineStore();
		a.pressKey('A');
		a.setRing(2, 5);
		const afterChange = a.pressKey('A');

		// Same machine state reached by setting the ring up front must agree.
		const b = new MachineStore();
		b.setRing(2, 5);
		b.setPosition(2, 1);
		expect(b.pressKey('A')).toBe(afterChange);
	});

	it('swaps rather than duplicates when a rotor is already in another slot', () => {
		const m = new MachineStore();
		m.setRotor(0, 'III');
		expect(m.rotors).toEqual(['III', 'II', 'I']);
		expect(new Set(m.rotors).size).toBe(3);
	});

	it('leaves the order alone when re-selecting the rotor already in that slot', () => {
		const m = new MachineStore();
		m.setRotor(1, 'II');
		expect(m.rotors).toEqual(['I', 'II', 'III']);
	});

	it('wraps positions and rings modulo 26', () => {
		const m = new MachineStore();
		m.setPosition(0, 26);
		expect(m.positions[0]).toBe(0);
		m.advancePosition(0, -1);
		expect(m.positions[0]).toBe(25);
		m.setRing(1, -1);
		expect(m.rings[1]).toBe(25);
		m.advanceRing(1, 1);
		expect(m.rings[1]).toBe(0);
	});

	it('replaces conflicting plugs instead of stacking them', () => {
		const m = new MachineStore();
		m.addPlug('A', 'B');
		m.addPlug('A', 'C');
		expect(m.plugboard).toEqual([['A', 'C']]);
		expect(m.plugPartner('A')).toBe('C');
		expect(m.plugPartner('B')).toBeNull();
	});

	it('ignores a self-pair and caps at the historical cable count', () => {
		const m = new MachineStore();
		m.addPlug('A', 'A');
		expect(m.plugboard).toEqual([]);

		const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		for (let i = 0; i < 26; i += 2) m.addPlug(letters[i], letters[i + 1]);
		expect(m.plugboard.length).toBe(MAX_PLUG_PAIRS);
		// The cap matters because the engine now rejects an over-full plugboard.
		expect(() => m.pressKey('A')).not.toThrow();
	});

	it('removes plugs by either letter, case-insensitively', () => {
		const m = new MachineStore();
		m.addPlug('Q', 'W');
		m.removePlug('w');
		expect(m.plugboard).toEqual([]);
	});

	it('does not truncate a message longer than a real transmission', () => {
		const m = new MachineStore();
		for (let i = 0; i < 500; i++) m.pressKey('A');
		expect(m.recentKeys.length).toBe(500);
		expect(m.recentKeys.map((k) => k.output).join('').slice(0, 10)).toBe('BDZGOWCXLT');
	});

	it('records only letters on the tape and never steps on a non-letter', () => {
		const m = new MachineStore();
		expect(m.pressKey(' ')).toBe(' ');
		expect(m.pressKey('1')).toBe('1');
		expect(m.recentKeys).toEqual([]);
		expect(m.positions).toEqual([0, 0, 0]);
	});

	it('round-trips a message through two stores at the same start setting', () => {
		const start: MachineConfig = {
			rotors: ['II', 'IV', 'V'],
			rings: [1, 20, 11],
			positions: [1, 11, 0],
			reflector: 'B',
			plugboard: [['A', 'V']]
		};
		const enc = new MachineStore();
		enc.loadConfig(structuredClone(start));
		const cipher = [...'ANGRIFF'].map((c) => enc.pressKey(c)).join('');
		expect(cipher).not.toBe('ANGRIFF');

		const dec = new MachineStore();
		dec.loadConfig(structuredClone(start));
		expect([...cipher].map((c) => dec.pressKey(c)).join('')).toBe('ANGRIFF');
	});

	it('clears the tape and lamp on reset', () => {
		const m = new MachineStore();
		m.pressKey('A');
		m.setRotor(0, 'V');
		m.addPlug('A', 'B');
		m.reset();
		expect(m.recentKeys).toEqual([]);
		expect(m.lampLit).toBeNull();
		expect(m.rotors).toEqual(['I', 'II', 'III']);
		expect(m.plugboard).toEqual([]);
		expect(m.positions).toEqual([0, 0, 0]);
	});

	it('rewinds to where the message started, keeping the daily key', () => {
		const m = new MachineStore();
		m.setRotor(0, 'V');
		m.setRing(2, 7);
		m.addPlug('A', 'B');
		m.setPosition(0, charToIndex('Q'));
		m.setPosition(1, charToIndex('W'));
		m.setPosition(2, charToIndex('E'));

		const cipher = [...'ANGRIFF'].map((c) => m.pressKey(c)).join('');
		expect(window(m)).not.toBe('QWE');

		m.rewind();
		expect(window(m)).toBe('QWE');
		expect(m.recentKeys).toEqual([]);
		expect(m.lampLit).toBeNull();
		// Daily key untouched — that is the whole point.
		expect(m.rotors[0]).toBe('V');
		expect(m.rings[2]).toBe(7);
		expect(m.plugboard).toEqual([['A', 'B']]);

		// And it round-trips, which is what an operator actually wants.
		expect([...cipher].map((c) => m.pressKey(c)).join('')).toBe('ANGRIFF');
	});

	it('captures the message start on the first letter, not construction', () => {
		const m = new MachineStore();
		m.setPosition(0, 5);
		expect(m.messageStart).toEqual([0, 0, 0]);
		m.pressKey('A');
		expect(m.messageStart).toEqual([5, 0, 0]);
	});

	it('does not open a message on a non-letter', () => {
		const m = new MachineStore();
		m.setPosition(0, 5);
		m.pressKey(' ');
		expect(m.messageStart).toEqual([0, 0, 0]);
		m.setPosition(0, 9);
		m.pressKey('A');
		expect(m.messageStart).toEqual([9, 0, 0]);
	});

	it('keeps the message start fixed for the rest of the message', () => {
		const m = new MachineStore();
		[...'HELLO'].forEach((c) => m.pressKey(c));
		expect(m.messageStart).toEqual([0, 0, 0]);
		expect(window(m)).toBe('AAF');
	});

	it('newMessage clears the tape but leaves the rotors alone', () => {
		// What the 16 Sep 1941 operator did: consecutive messages from wherever
		// the rotors stopped.
		const m = new MachineStore();
		[...'HELLO'].forEach((c) => m.pressKey(c));
		const stopped = window(m);

		m.newMessage();
		expect(m.recentKeys).toEqual([]);
		expect(window(m)).toBe(stopped);

		// The next message starts here, so a rewind returns here too.
		m.pressKey('X');
		expect(m.messageStart.map(indexToChar).join('')).toBe(stopped);
	});

	it('loadConfig sets the message start to the loaded positions', () => {
		const m = new MachineStore();
		m.loadConfig({
			rotors: ['I', 'II', 'III'],
			rings: [0, 0, 0],
			positions: [1, 11, 0],
			reflector: 'B',
			plugboard: []
		});
		expect(m.messageStart).toEqual([1, 11, 0]);
		m.pressKey('A');
		m.rewind();
		expect(window(m)).toBe('BLA');
	});

	it('rewind is a no-op when no message is in progress', () => {
		const m = new MachineStore();
		m.setPosition(0, 4);
		m.rewind();
		expect(m.positions).toEqual([0, 0, 0]);
	});

	it('lights the lamp on press and clears it on release', () => {
		const m = new MachineStore();
		m.pressKey('A');
		expect(m.lampLit).toBe('B');
		m.releaseKey();
		expect(m.lampLit).toBeNull();
	});

	it('snapshot is a deep copy, not a live view', () => {
		const m = new MachineStore();
		m.addPlug('A', 'B');
		const snap = m.snapshot();
		m.setRotor(0, 'V');
		m.removePlug('A');
		expect(snap.rotors[0]).toBe('I');
		expect(snap.plugboard).toEqual([['A', 'B']]);
	});

	it('shows the same double-stepping period as the engine', () => {
		const m = new MachineStore();
		for (let i = 0; i < 16_900; i++) m.pressKey('A');
		expect(window(m)).toBe('AAA');
	});
});
