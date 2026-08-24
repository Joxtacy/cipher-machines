import { ALPHABET_SIZE, charToIndex, indexToChar, isLetter, mod26 } from './alphabet';
import { Plugboard, type PlugPair } from './plugboard';
import { REFLECTOR_IDS, Reflector, type ReflectorId } from './reflectors';
import { ROTOR_IDS, Rotor, type RotorId } from './rotors';

export type Triple<T> = [T, T, T];

export interface MachineConfig {
	rotors: Triple<RotorId>; // [left, middle, right]
	rings: Triple<number>; // 0-25, Ringstellung
	positions: Triple<number>; // 0-25, Grundstellung
	reflector: ReflectorId;
	plugboard: PlugPair[];
}

export const DEFAULT_CONFIG: MachineConfig = {
	rotors: ['I', 'II', 'III'],
	rings: [0, 0, 0],
	positions: [0, 0, 0],
	reflector: 'B',
	plugboard: []
};

function triple<T>(
	v: unknown,
	field: string,
	check: (x: unknown) => boolean,
	expected: string
): Triple<T> {
	if (!Array.isArray(v) || v.length !== 3) {
		throw new Error(`${field} must be an array of 3 values`);
	}
	for (const x of v) {
		if (!check(x))
			throw new Error(
				`${field} contains an invalid value: ${JSON.stringify(x)} (expected ${expected})`
			);
	}
	return [...v] as Triple<T>;
}

function isDialValue(x: unknown): boolean {
	return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x < ALPHABET_SIZE;
}

/**
 * Validate untrusted JSON into a MachineConfig, or throw explaining why not.
 *
 * Presets are user-editable: localStorage on web, plain JSON files on disk on
 * desktop. Without this, a hand-edited or corrupt preset reaches `new Enigma`
 * on *every* keypress — either throwing from inside a key handler or, for a
 * non-numeric position, silently encrypting to NUL bytes.
 */
export function parseConfig(raw: unknown): MachineConfig {
	if (typeof raw !== 'object' || raw === null) throw new Error('Config must be an object');
	const c = raw as Record<string, unknown>;

	const rotors = triple<RotorId>(
		c.rotors,
		'rotors',
		(x) => ROTOR_IDS.includes(x as RotorId),
		ROTOR_IDS.join('/')
	);
	if (new Set(rotors).size !== 3)
		throw new Error(`rotors must be distinct, got ${rotors.join(', ')}`);

	if (!REFLECTOR_IDS.includes(c.reflector as ReflectorId)) {
		throw new Error(
			`Unknown reflector: ${JSON.stringify(c.reflector)} (expected ${REFLECTOR_IDS.join('/')})`
		);
	}

	if (!Array.isArray(c.plugboard)) throw new Error('plugboard must be an array');
	const plugboard = c.plugboard.map((pair, i) => {
		if (!Array.isArray(pair) || pair.length !== 2)
			throw new Error(`plugboard[${i}] must be a pair of letters`);
		return pair.map((l) => {
			if (typeof l !== 'string' || !/^[A-Za-z]$/.test(l)) {
				throw new Error(`plugboard[${i}] contains an invalid letter: ${JSON.stringify(l)}`);
			}
			return l.toUpperCase();
		}) as PlugPair;
	});
	new Plugboard(plugboard); // reuses the cap / reuse / self-pair rules

	return {
		rotors,
		rings: triple<number>(c.rings, 'rings', isDialValue, '0-25'),
		positions: triple<number>(c.positions, 'positions', isDialValue, '0-25'),
		reflector: c.reflector as ReflectorId,
		plugboard
	};
}

export class Enigma {
	private left: Rotor;
	private middle: Rotor;
	private right: Rotor;
	private reflector: Reflector;
	private plugboard: Plugboard;

	constructor(cfg: MachineConfig = DEFAULT_CONFIG) {
		this.left = new Rotor(cfg.rotors[0], cfg.positions[0], cfg.rings[0]);
		this.middle = new Rotor(cfg.rotors[1], cfg.positions[1], cfg.rings[1]);
		this.right = new Rotor(cfg.rotors[2], cfg.positions[2], cfg.rings[2]);
		this.reflector = new Reflector(cfg.reflector);
		this.plugboard = new Plugboard(cfg.plugboard);
	}

	get positions(): Triple<number> {
		return [this.left.position, this.middle.position, this.right.position];
	}

	setPositions(p: Triple<number>): void {
		this.left.position = mod26(p[0]);
		this.middle.position = mod26(p[1]);
		this.right.position = mod26(p[2]);
	}

	private step(): void {
		// Double-stepping anomaly: if the middle rotor is on its notch, it
		// advances along with the left rotor on the next keypress.
		const middleAtNotch = this.middle.atNotch();
		const rightAtNotch = this.right.atNotch();

		if (middleAtNotch) {
			this.middle.advance();
			this.left.advance();
		} else if (rightAtNotch) {
			this.middle.advance();
		}
		this.right.advance();
	}

	encryptChar(c: string): string {
		if (!isLetter(c)) return c;
		this.step();

		let i = charToIndex(c.toUpperCase());
		i = this.plugboard.swap(i);
		i = this.right.forward(i);
		i = this.middle.forward(i);
		i = this.left.forward(i);
		i = this.reflector.reflect(i);
		i = this.left.reverse(i);
		i = this.middle.reverse(i);
		i = this.right.reverse(i);
		i = this.plugboard.swap(i);
		return indexToChar(i);
	}

	encryptString(s: string): string {
		let out = '';
		for (const c of s) out += this.encryptChar(c);
		return out;
	}
}
