import { describe, expect, it } from 'vitest';
import { PurpleStore } from '../../src/lib/state/purple.svelte';
import { Purple97, parseKey, parsePurpleKey } from '../../src/lib/purple/machine';
import { PART1_ALPHABET, PART1_CIPHERTEXT, PART1_KEY } from '../purple/fourteen-part-message';

const type = (s: PurpleStore, text: string) => [...text].map((c) => s.pressKey(c)).join('');

describe('PurpleStore', () => {
	it('starts at the default key', () => {
		const s = new PurpleStore();
		expect(s.switches).toEqual([0, 0, 0, 0]);
		expect(s.fastSwitch).toBe(1);
		expect(s.middleSwitch).toBe(2);
		expect(s.slowSwitch).toBe(3);
		expect(s.mode).toBe('encrypt');
	});

	it('matches the engine keypress for keypress', () => {
		const s = new PurpleStore();
		s.loadConfig(parseKey(PART1_KEY, PART1_ALPHABET));
		s.setMode('decrypt');

		const head = PART1_CIPHERTEXT.slice(0, 120);
		const viaStore = type(s, head);
		const viaEngine = new Purple97(parseKey(PART1_KEY, PART1_ALPHABET)).decrypt(head);
		expect(viaStore).toBe(viaEngine);
	});

	it('decrypts the start of the 14-part message through the UI path', () => {
		const s = new PurpleStore();
		s.loadConfig(parseKey(PART1_KEY, PART1_ALPHABET));
		s.setMode('decrypt');
		expect(type(s, PART1_CIPHERTEXT.slice(0, 45))).toBe('FOVTATAKIDASINIMUIMINOMOXIWOIRUBESIFYXXFCKZZR'.slice(0, 45));
	});

	it('syncs all four switch positions back after each key', () => {
		const s = new PurpleStore();
		expect(s.switches).toEqual([0, 0, 0, 0]);
		s.pressKey('A');
		// Sixes always steps; fast stage (I) steps too.
		expect(s.switches[0]).toBe(1);
		expect(s.switches[1]).toBe(1);
		expect(s.switches[2]).toBe(0);
		expect(s.switches[3]).toBe(0);
	});

	it('round-trips between modes', () => {
		const key = parseKey('9-1,24,6-23', PART1_ALPHABET);
		const enc = new PurpleStore();
		enc.loadConfig(key);
		const cipher = type(enc, 'MEMORANDUM');

		const dec = new PurpleStore();
		dec.loadConfig(key);
		dec.setMode('decrypt');
		expect(type(dec, cipher)).toBe('MEMORANDUM');
	});

	it('records the tape and the last lamp output', () => {
		const s = new PurpleStore();
		const out = s.pressKey('A');
		expect(s.lastOutput).toBe(out);
		expect(s.recentKeys).toHaveLength(1);
		expect(s.recentKeys[0].input).toBe('A');
	});

	it('ignores non-letters', () => {
		const s = new PurpleStore();
		expect(s.pressKey(' ')).toBeNull();
		expect(s.pressKey('1')).toBeNull();
		expect(s.recentKeys).toEqual([]);
		expect(s.switches).toEqual([0, 0, 0, 0]);
	});

	it('accepts a garble only when deciphering', () => {
		const s = new PurpleStore();
		expect(s.pressKey('-')).toBeNull();
		s.setMode('decrypt');
		expect(s.pressKey('-')).toBe('-');
		expect(s.switches[0]).toBe(1); // still stepped
	});

	it('wraps switch dials at 25 positions', () => {
		const s = new PurpleStore();
		s.setSwitch(0, 25);
		expect(s.switches[0]).toBe(0);
		s.advanceSwitch(0, -1);
		expect(s.switches[0]).toBe(24);
		s.advanceSwitch(0, 1);
		expect(s.switches[0]).toBe(0);
	});

	it('swaps roles instead of allowing an impossible assignment', () => {
		const s = new PurpleStore();
		expect([s.fastSwitch, s.middleSwitch, s.slowSwitch]).toEqual([1, 2, 3]);

		// Make stage 2 fast; it was middle, so the old fast takes middle.
		s.setRole('fast', 2);
		expect([s.fastSwitch, s.middleSwitch]).toEqual([2, 1]);
		expect(s.slowSwitch).toBe(3);

		// Make stage 2 middle; it is currently fast, so they swap back.
		s.setRole('middle', 2);
		expect([s.fastSwitch, s.middleSwitch]).toEqual([1, 2]);
		expect(new Set([s.fastSwitch, s.middleSwitch, s.slowSwitch]).size).toBe(3);
	});

	it('keeps the three roles distinct however they are assigned', () => {
		const s = new PurpleStore();
		for (const role of ['fast', 'middle'] as const) {
			for (const stage of [1, 2, 3] as const) {
				s.setRole(role, stage);
				expect(new Set([s.fastSwitch, s.middleSwitch, s.slowSwitch]).size).toBe(3);
			}
		}
	});

	it('rejects an invalid alphabet rather than storing it', () => {
		const s = new PurpleStore();
		expect(() => s.setAlphabet('TOOSHORT')).toThrow();
		expect(() => s.setAlphabet('AACTYUXEQLHBRMPDICJASVWGZF')).toThrow();
		expect(s.alphabet).toBe('AEIOUYBCDFGHJKLMNPQRSTVWXZ');
		s.setAlphabet(PART1_ALPHABET.toLowerCase());
		expect(s.alphabet).toBe(PART1_ALPHABET);
	});

	it('exposes the sixes group', () => {
		const s = new PurpleStore();
		expect(s.sixesLetters).toBe('AEIOUY');
		s.setAlphabet(PART1_ALPHABET);
		expect(s.sixesLetters).toBe('NOKTYU');
	});

	it('validates on loadConfig', () => {
		const s = new PurpleStore();
		expect(() => s.loadConfig({ switches: [0, 0, 0, 99] } as never)).toThrow();
		expect(() =>
			s.loadConfig({ ...parseKey('1-1,1,1-12'), fastSwitch: 2, middleSwitch: 2 } as never)
		).toThrow();
	});

	it('rewinds the dials while keeping the alphabet and speeds', () => {
		const s = new PurpleStore();
		s.setAlphabet(PART1_ALPHABET);
		s.setRole('fast', 2);
		s.setSwitch(0, 8);
		s.setSwitch(2, 23);

		const cipher = type(s, 'MEMORANDUM');
		expect(s.switches[0]).not.toBe(8);

		s.rewind();
		expect(s.switches).toEqual([8, 0, 23, 0]);
		expect(s.recentKeys).toEqual([]);
		expect(s.lastOutput).toBeNull();
		// The daily key survives — this is exactly what Reset machine would wipe.
		expect(s.alphabet).toBe(PART1_ALPHABET);
		expect(s.fastSwitch).toBe(2);

		s.setMode('decrypt');
		expect(type(s, cipher)).toBe('MEMORANDUM');
	});

	it('leaves the mode alone on rewind', () => {
		const s = new PurpleStore();
		s.setMode('decrypt');
		s.pressKey('A');
		s.rewind();
		expect(s.mode).toBe('decrypt');
	});

	it('captures the message start on the first key', () => {
		const s = new PurpleStore();
		s.setSwitch(0, 8);
		expect(s.messageStart).toEqual([0, 0, 0, 0]);
		s.pressKey('A');
		expect(s.messageStart).toEqual([8, 0, 0, 0]);
	});

	it('does not open a message on a rejected key', () => {
		const s = new PurpleStore();
		s.setSwitch(0, 8);
		s.pressKey('1');
		s.pressKey('-'); // garble rejected in encipher mode
		expect(s.messageStart).toEqual([0, 0, 0, 0]);
	});

	it('newMessage clears the tape but leaves the dials', () => {
		const s = new PurpleStore();
		type(s, 'MEMORANDUM');
		const stopped = [...s.switches];
		s.newMessage();
		expect(s.recentKeys).toEqual([]);
		expect(s.switches).toEqual(stopped);
		s.pressKey('A');
		expect(s.messageStart).toEqual(stopped);
	});

	it('loadConfig sets the message start to the loaded positions', () => {
		const s = new PurpleStore();
		s.loadConfig(parseKey(PART1_KEY, PART1_ALPHABET));
		expect(s.messageStart).toEqual([8, 0, 23, 5]);
		s.pressKey('A');
		s.rewind();
		expect(s.switches).toEqual([8, 0, 23, 5]);
	});

	it('clears the tape on load and reset', () => {
		const s = new PurpleStore();
		s.pressKey('A');
		s.setMode('decrypt');
		s.setAlphabet(PART1_ALPHABET);
		s.reset();
		expect(s.recentKeys).toEqual([]);
		expect(s.lastOutput).toBeNull();
		expect(s.mode).toBe('encrypt');
		expect(s.alphabet).toBe('AEIOUYBCDFGHJKLMNPQRSTVWXZ');
		expect(s.switches).toEqual([0, 0, 0, 0]);
	});

	it('snapshot is a copy that parsePurpleKey accepts', () => {
		const s = new PurpleStore();
		s.setAlphabet(PART1_ALPHABET);
		const snap = s.snapshot();
		s.setSwitch(0, 7);
		expect(snap.switches[0]).toBe(0);
		expect(() => parsePurpleKey(snap)).not.toThrow();
	});
});
