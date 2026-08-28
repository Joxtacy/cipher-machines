/**
 * Key row layouts, one per machine.
 *
 * These are physical-layout facts about the hardware, so they live apart from
 * the cipher engines: nothing here affects encryption, only which key sits
 * where on screen.
 */

/**
 * The Wehrmacht Enigma's QWERTZU arrangement, as printed on the real machine.
 * Note the German ordering — Z where an English keyboard has Y — and the
 * distinctive 9/8/9 split, which is Enigma's own, not a typewriter's. The
 * lampboard above the keyboard repeats this layout.
 */
export const ENIGMA_ROWS: readonly string[][] = [
	["Q", "W", "E", "R", "T", "Z", "U", "I", "O"],
	["A", "S", "D", "F", "G", "H", "J", "K"],
	["P", "Y", "X", "C", "V", "B", "N", "M", "L"],
];

/** Per-row indent in rem. Enigma nudges only its short middle row. */
export const ENIGMA_STAGGER: readonly number[] = [0, 1.1, 0];

/**
 * Standard QWERTY, for PURPLE.
 *
 * PURPLE had no cipher keyboard of its own: it was driven by ordinary electric
 * typewriters at each end, and "all messages were written in the 26-letter
 * English alphabet, which was commonly used for telegraphy" — Japanese text was
 * transliterated to romaji first. Published sources describe the typewriters
 * but do not record their exact layout, so QWERTY stands in as the standard
 * English-alphabet typewriter arrangement of the period.
 *
 * What is certain is that Enigma's QWERTZU is wrong here: it is a German
 * layout belonging to a different machine.
 */
export const TYPEWRITER_ROWS: readonly string[][] = [
	["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
	["A", "S", "D", "F", "G", "H", "J", "K", "L"],
	["Z", "X", "C", "V", "B", "N", "M"],
];

/** A typewriter staggers progressively, each row set slightly right of the last. */
export const TYPEWRITER_STAGGER: readonly number[] = [0, 0.9, 1.8];
