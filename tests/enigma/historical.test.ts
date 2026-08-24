import { describe, expect, it } from 'vitest';
import { Enigma, type MachineConfig } from '../../src/lib/enigma/machine';
import { charToIndex } from '../../src/lib/enigma/alphabet';

// Operation Barbarossa, 7 July 1941, part 1 — a real intercepted Wehrmacht
// message. Enigma I, wheel order II IV V, Ringstellung 02 21 12 (B U L),
// UKW-B, Steckern AV BS CG DL FU HZ IN KM OW RX, message key BLA.
// Kenngruppe RFUGZ stripped. This is the only test with a non-zero
// Ringstellung pinned to an external ground truth: the involution tests pass
// even if the ring offset sign is inverted, this one does not.
const CIPHERTEXT =
	'EDPUDNRGYSZRCXNUYTPOMRMBOFKTBZREZKMLXLVEFGUEYSIOZVEQMIKUBPMMYLKLT' +
	'TDEISMDICAGYKUACTCDOMOHWXMUUIAUBSTSLRNBZSZWNRFXWFYSSXJZVIJHIDISHP' +
	'RKLKAYUPADTXQSPINQMATLPIFSVKDASCTACDPBOPVHJK';

const EXPECTED =
	'AUFKLXABTEILUNGXVONXKURTINOWAXKURTINOWAXNORDWESTLXSEBEZXSEBEZXUAF' +
	'FLIEGERSTRASZERIQTUNGXDUBROWKIXDUBROWKIXOPOTSCHKAXOPOTSCHKAXUMXEI' +
	'NSAQTDREINULLXUHRANGETRETENXANGRIFFXINFXRGTX';

const cfg: MachineConfig = {
	rotors: ['II', 'IV', 'V'],
	rings: [1, 20, 11],
	positions: [charToIndex('B'), charToIndex('L'), charToIndex('A')],
	reflector: 'B',
	plugboard: [
		['A', 'V'], ['B', 'S'], ['C', 'G'], ['D', 'L'], ['F', 'U'],
		['H', 'Z'], ['I', 'N'], ['K', 'M'], ['O', 'W'], ['R', 'X']
	]
};

// Enigma instruction manual, 1930 — the oldest published Enigma message, and
// the only one here needing UKW-A. Wheel order II I III, Ringstellung 24 13 22
// (XMV), Steckern AM FI NV PS TU WZ (six cables, 1930 practice), Grundstellung
// 06 15 12 (FOL). Also the only test exercising the pre-1940 doubled indicator.
const M1930: MachineConfig = {
	rotors: ['II', 'I', 'III'],
	rings: [23, 12, 21],
	positions: [5, 14, 11],
	reflector: 'A',
	plugboard: [['A', 'M'], ['F', 'I'], ['N', 'V'], ['P', 'S'], ['T', 'U'], ['W', 'Z']]
};

const M1930_CIPHERTEXT =
	'GCDSEAHUGWTQGRKVLFGXUCALXVYMIGMMNMFDXTGNVHVRMMEVOUYFZSLRHDRRXFJWC' +
	'FHUHMUNZEFRDISIKBGPMYVXUZ';

const M1930_PLAINTEXT =
	'FEINDLIQEINFANTERIEKOLONNEBEOBAQTETXANFANGSUEDAUSGANGBAERWALDEXEN' +
	'DEDREIKMOSTWAERTSNEUSTADT';

describe('historical message', () => {
	it('decrypts Operation Barbarossa 1941, part 1', () => {
		expect(new Enigma(cfg).encryptString(CIPHERTEXT)).toBe(EXPECTED);
	});

	it('recovers the doubled message key of the 1930 manual message', () => {
		// At the Grundstellung, the six-letter indicator deciphers to the
		// three-letter message key sent twice — the pre-1 May 1940 procedure.
		expect(new Enigma(structuredClone(M1930)).encryptString('PKPJXI')).toBe('ABLABL');
	});

	it('decrypts the 1930 manual message body under UKW-A', () => {
		const body: MachineConfig = {
			...structuredClone(M1930),
			positions: [charToIndex('A'), charToIndex('B'), charToIndex('L')]
		};
		expect(new Enigma(body).encryptString(M1930_CIPHERTEXT)).toBe(M1930_PLAINTEXT);
	});
});
