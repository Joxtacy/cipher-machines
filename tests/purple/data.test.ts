import { describe, expect, it } from 'vitest';
import {
	PUBLISHED_TABLES,
	SIXES,
	SIXES_LEVELS,
	SWITCH_POSITIONS,
	TWENTIES_1,
	TWENTIES_2,
	TWENTIES_3,
	TWENTIES_LEVELS,
	decryptTables,
	encryptTables
} from '../../src/lib/purple/data';

// The literals were OCR'd from the Cryptologia paper, so they get validated
// rather than trusted. A scrambled digit almost always breaks the permutation
// property, which is what makes this cheap check worth having.
describe('PURPLE wiring tables', () => {
	const cases = [
		['sixes', SIXES, SIXES_LEVELS],
		['twenties I', TWENTIES_1, TWENTIES_LEVELS],
		['twenties II', TWENTIES_2, TWENTIES_LEVELS],
		['twenties III', TWENTIES_3, TWENTIES_LEVELS]
	] as const;

	it.each(cases)('%s has 25 positions of %i levels', (_name, table, levels) => {
		expect(table).toHaveLength(SWITCH_POSITIONS);
		for (const row of table) expect(row).toHaveLength(levels);
	});

	it.each(cases)('%s: every position is a permutation, 1-based', (_name, table, levels) => {
		const expected = Array.from({ length: levels }, (_, i) => i + 1);
		for (const [i, row] of table.entries()) {
			expect(
				[...row].sort((a, b) => a - b),
				`position ${i + 1}`
			).toEqual(expected);
		}
	});

	it('has exactly one duplicated position, sixes 5 and 8', () => {
		// Flagged in docs/purple-plan.md: either a real feature of the switch or
		// an OCR artefact that happens to be a valid permutation. Pinned so it is
		// a known quantity rather than a surprise. The 14-part message decryption
		// is what actually vindicates it.
		const duplicates: string[] = [];
		for (const [name, table] of [
			['sixes', SIXES],
			['twenties I', TWENTIES_1],
			['twenties II', TWENTIES_2],
			['twenties III', TWENTIES_3]
		] as const) {
			const seen = new Map<string, number>();
			for (const [i, row] of table.entries()) {
				const k = row.join(',');
				const prev = seen.get(k);
				if (prev !== undefined) duplicates.push(`${name} ${prev + 1}/${i + 1}`);
				else seen.set(k, i);
			}
		}
		expect(duplicates).toEqual(['sixes 5/8']);
	});

	it('converts to 0-based decrypt tables', () => {
		const dec = decryptTables();
		expect(dec).toHaveLength(4);
		expect(dec[0][0]).toEqual(SIXES[0].map((v) => v - 1));
		for (const table of dec) {
			for (const row of table) {
				for (const v of row) expect(v).toBeGreaterThanOrEqual(0);
			}
		}
	});

	it('encrypt tables are the exact inverse of the decrypt tables', () => {
		const dec = decryptTables();
		const enc = encryptTables();
		for (let t = 0; t < dec.length; t++) {
			for (let p = 0; p < dec[t].length; p++) {
				for (let level = 0; level < dec[t][p].length; level++) {
					expect(enc[t][p][dec[t][p][level]]).toBe(level);
					expect(dec[t][p][enc[t][p][level]]).toBe(level);
				}
			}
		}
	});

	it('exposes the four tables in switch order', () => {
		expect(PUBLISHED_TABLES).toEqual([SIXES, TWENTIES_1, TWENTIES_2, TWENTIES_3]);
	});
});
