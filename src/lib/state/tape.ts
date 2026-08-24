/** One keypress on the tape. Shared by every machine's transcript. */
export interface RecentKey {
	input: string;
	output: string;
	id: number;
}
