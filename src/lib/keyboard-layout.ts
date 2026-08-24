/**
 * Keyboard row layout, shared by the lampboard and both machines' keyboards.
 *
 * This is the Wehrmacht Enigma's QWERTZU arrangement, as printed on the real
 * machine. PURPLE's operators used ordinary typewriters rather than a fixed
 * cipher keyboard, so reusing this layout there is a UI convenience, not a
 * historical claim.
 */
export const KEYBOARD_ROWS: readonly string[][] = [
	['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O'],
	['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K'],
	['P', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'L']
];
