import { describe, expect, it } from 'vitest';
import { Purple97, parseKey } from '../../src/lib/purple/machine';

const fresh = (key = '1-1,1,1-12') => new Purple97(parseKey(key));

/** Positions after n characters, without going through the cipher path. */
function walk(m: Purple97, n: number): Array<[number, number, number, number]> {
	const trace: Array<[number, number, number, number]> = [];
	for (let i = 0; i < n; i++) {
		m.step();
		trace.push(m.positions);
	}
	return trace;
}

describe('PURPLE stepping', () => {
	it('steps the sixes switch on every character', () => {
		const m = fresh();
		const trace = walk(m, 60);
		for (const [i, pos] of trace.entries()) {
			expect(pos[0], `char ${i}`).toBe((i + 1) % 25);
		}
	});

	it('steps exactly one twenties switch per character', () => {
		const m = fresh();
		let prev = m.positions;
		for (let i = 0; i < 2000; i++) {
			m.step();
			const now = m.positions;
			const moved = [1, 2, 3].filter((k) => now[k] !== prev[k]);
			expect(moved, `char ${i}`).toHaveLength(1);
			prev = now;
		}
	});

	it('runs the fast switch for 24 of every 25 characters early on', () => {
		// fast=1, middle=2 -> twenties index 0 is fast, 1 is middle, 2 is slow.
		const m = fresh('1-1,1,1-12');
		const trace = walk(m, 25);
		const fastSteps = trace.filter((p, i) => p[1] !== (i === 0 ? 0 : trace[i - 1][1])).length;
		expect(fastSteps).toBe(24);
		// The middle switch takes the 25th character.
		expect(trace[24][2]).toBe(1);
		expect(trace[24][3]).toBe(0);
	});

	it('fires the slow switch at character 624, not 625', () => {
		// Independent derivation of the anomaly, not read off the implementation:
		//   the middle switch steps whenever the pre-step sixes position is 24,
		//   i.e. at 0-based characters 24, 49, 74 ... 24 + 25k.
		//   It reaches position 24 after 24 such steps, at character 24 + 25*23 = 599.
		//   The slow switch then fires at the next character whose pre-step sixes
		//   position is 23 — character 623 (623 mod 25 == 23).
		// Under the common misreading (slow fires when sixes AND middle are both
		// on their last position) this would land on character 624 instead.
		const m = fresh('1-1,1,1-12');
		let prev = m.positions;
		const slowSteps: number[] = [];
		for (let i = 0; i < 700; i++) {
			m.step();
			const now = m.positions;
			if (now[3] !== prev[3]) slowSteps.push(i);
			prev = now;
		}
		expect(slowSteps[0]).toBe(623);
	});

	it('steps the middle switch on the character after the slow switch', () => {
		const m = fresh('1-1,1,1-12');
		let prev = m.positions;
		let slowAt = -1;
		let middleAfterSlow = false;
		for (let i = 0; i < 700; i++) {
			m.step();
			const now = m.positions;
			if (slowAt >= 0 && i === slowAt + 1 && now[2] !== prev[2]) middleAfterSlow = true;
			if (slowAt < 0 && now[3] !== prev[3]) slowAt = i;
			prev = now;
		}
		expect(slowAt).toBe(623);
		expect(middleAfterSlow).toBe(true);
	});

	it('honours the fast/middle role assignment from the key', () => {
		// fast=3, middle=1 -> stage III is fast, stage I is middle, stage II slow.
		const m = new Purple97(parseKey('1-1,1,1-31'));
		expect(m.fastSwitch).toBe(3);
		expect(m.middleSwitch).toBe(1);
		expect(m.slowSwitch).toBe(2);

		const before = m.positions;
		m.step();
		const after = m.positions;
		expect(after[3]).toBe(before[3] + 1); // stage III moved
		expect(after[1]).toBe(before[1]);
		expect(after[2]).toBe(before[2]);
	});

	it('starts the switches where the key says', () => {
		const m = new Purple97(parseKey('9-1,24,6-23'));
		expect(m.positions).toEqual([8, 0, 23, 5]);
		expect(m.fastSwitch).toBe(2);
		expect(m.middleSwitch).toBe(3);
		expect(m.slowSwitch).toBe(1);
	});

	it('wraps every switch at 25 positions', () => {
		const m = new Purple97(parseKey('25-25,25,25-12'));
		expect(m.positions).toEqual([24, 24, 24, 24]);
		m.step();
		expect(m.positions[0]).toBe(0);
	});
});
