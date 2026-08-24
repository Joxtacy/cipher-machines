export const A_CODE = 'A'.charCodeAt(0);
export const ALPHABET_SIZE = 26;

export function charToIndex(c: string): number {
	const i = c.charCodeAt(0) - A_CODE;
	if (i < 0 || i >= ALPHABET_SIZE) {
		throw new RangeError(`Character "${c}" is outside A-Z`);
	}
	return i;
}

export function indexToChar(i: number): string {
	return String.fromCharCode(A_CODE + mod26(i));
}

export function mod26(n: number): number {
	return ((n % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
}

export function isLetter(c: string): boolean {
	if (c.length !== 1) return false;
	const i = c.charCodeAt(0);
	return (i >= A_CODE && i < A_CODE + ALPHABET_SIZE) ||
		(i >= 'a'.charCodeAt(0) && i < 'a'.charCodeAt(0) + ALPHABET_SIZE);
}
