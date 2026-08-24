/**
 * Verifies the key tables in docs/historical-keys.md.
 *
 * Each entry carries the indicator the operator actually transmitted: set the
 * rotors to the Grundstellung (sent in clear), type the enciphered three-letter
 * group, and the lamps give the message key. That is checkable without any
 * plaintext, so it catches both a transcription slip in the doc and a
 * regression in the engine.
 */
import { describe, expect, it } from "vitest";
import { Enigma, type MachineConfig } from "../../src/lib/enigma/machine";
import { charToIndex } from "../../src/lib/enigma/alphabet";
import type { RotorId } from "../../src/lib/enigma/rotors";
import type { PlugPair } from "../../src/lib/enigma/plugboard";

const ROTOR: Record<string, RotorId> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };

/** German-style wheel order: three digits, left to right. "245" -> II IV V. */
function wheels(wo: string): [RotorId, RotorId, RotorId] {
	const ids = [...wo].map((d) => ROTOR[d]);
	if (ids.length !== 3 || ids.some((id) => !id)) throw new Error(`bad wheel order ${wo}`);
	return ids as [RotorId, RotorId, RotorId];
}

const triple = (s: string): [number, number, number] => [
	charToIndex(s[0]),
	charToIndex(s[1]),
	charToIndex(s[2]),
];

function dayKey(wo: string, rings: string, stecker: string, grund: string): MachineConfig {
	return {
		rotors: wheels(wo),
		rings: triple(rings),
		positions: triple(grund),
		reflector: "B",
		plugboard: stecker
			.split(" ")
			.filter(Boolean)
			.map((p) => [p[0], p[1]] as PlugPair),
	};
}

interface Day {
	date: string;
	wo: string;
	rings: string;
	stecker: string;
	/** [Grundstellung, enciphered group, published message key] */
	msgs: Array<[string, string, string]>;
}

const DAYS: Day[] = [
	{
		date: "27 Jun 1941",
		wo: "352",
		rings: "RGP",
		stecker: "AV BG CH EN FU KO MS PX RY TW",
		// Message 51 is omitted on purpose — the source footnotes it as garbled
		// and it does not verify. See the note in docs/historical-keys.md.
		msgs: [
			["SDG", "EKN", "LTA"],
			["BPG", "KGM", "CSX"],
		],
	},
	{
		date: "8 Jul 1941",
		wo: "432",
		rings: "PKF",
		stecker: "CY EL FH GS IJ KQ MW PV RZ TU",
		msgs: [["OKF", "QLV", "PIK"]],
	},
	{
		date: "13 Aug 1941",
		wo: "253",
		rings: "THE",
		stecker: "AD BH FG IJ KN LZ MR OS PW QV",
		msgs: [["AMQ", "LKF", "BRZ"]],
	},
	{
		date: "19 Aug 1941",
		wo: "213",
		rings: "YPC",
		stecker: "AK BI DG FN HL JO MT QY RV UW",
		msgs: [["ALY", "XQE", "BGO"]],
	},
	{
		date: "28 Aug 1941",
		wo: "345",
		rings: "CWJ",
		stecker: "BH CS DU EI FR GM JO KQ TX VZ",
		msgs: [["DIB", "TCO", "ABC"]],
	},
	{
		date: "9 Sep 1941",
		wo: "342",
		rings: "KFZ",
		stecker: "AZ DV ET FS GQ JP LX MY NR OW",
		msgs: [["BOZ", "IWD", "ERT"]],
	},
	{
		date: "16 Sep 1941",
		wo: "513",
		rings: "LSB",
		stecker: "AP BO CY DU ES FN GR IV JT LZ",
		msgs: [
			["LTB", "MMF", "SAU"],
			["AIA", "XIE", "FUT"],
			["SDC", "JKP", "BOK"],
			["CSW", "MEK", "KLO"],
			["KPH", "YNH", "AFF"],
		],
	},
	{
		date: "27 Sep 1941",
		wo: "421",
		rings: "YHO",
		stecker: "AG CP DK EL HQ IT JV MX OY RW",
		msgs: [
			["NWH", "GGP", "SPE"],
			["STG", "YTF", "SAU"],
			["XFG", "GSM", "SEE"],
			["GUR", "JPC", "HOR"],
			["ZIP", "NDT", "WAS"],
			["SCJ", "RWT", "WAS"],
			["XHK", "FHP", "WAS"],
			["TJI", "KPJ", "GRA"],
		],
	},
	{
		date: "2 Oct 1941",
		wo: "452",
		rings: "DVM",
		stecker: "AP BU CX DH ER FQ IW KO LZ MS",
		msgs: [["FXP", "SOV", "WAS"]],
	},
	{
		date: "3 Oct 1941",
		wo: "213",
		rings: "TIP",
		stecker: "BC DE FG HI JK LX MQ NO ST VZ",
		msgs: [["DTI", "AZZ", "SEE"]],
	},
];

describe("docs/historical-keys.md", () => {
	for (const { date, wo, rings, stecker, msgs } of DAYS) {
		it(`${date} (${wo}/${rings}): indicators decipher to the published message keys`, () => {
			for (const [grund, enciphered, expected] of msgs) {
				const got = new Enigma(dayKey(wo, rings, stecker, grund)).encryptString(enciphered);
				expect(got, `${grund}+${enciphered}`).toBe(expected);
			}
		});
	}

	it("covers every verifiable indicator in the doc", () => {
		expect(DAYS.reduce((n, d) => n + d.msgs.length, 0)).toBe(22);
	});

	it("27 Jun message 51 still fails, as the doc states", () => {
		// Guards the caveat: if this ever starts passing, the doc's note is stale.
		const cfg = (g: string) => dayKey("352", "RGP", "AV BG CH EN FU KO MS PX RY TW", g);
		expect(new Enigma(cfg("ZKT")).encryptString("FLP")).toBe("APZ");
		expect(new Enigma(cfg("ZKT")).encryptString("HLP")).toBe("RPZ");
		expect(new Enigma(cfg("ZKT")).encryptString("HLP")).not.toBe("RTZ");
	});

	it("the 7 July day key is the Barbarossa key", () => {
		// Two independent sources agreeing. 245 = II IV V, BUL rings.
		const fromTable = dayKey("245", "BUL", "AV BS CG DL FU HZ IN KM OW RX", "BLA");
		expect(fromTable.rotors).toEqual(["II", "IV", "V"]);
		expect(fromTable.rings).toEqual([1, 20, 11]);
		expect(new Enigma(fromTable).encryptString("EDPUDNRGYS")).toBe("AUFKLXABTE");
	});
});
