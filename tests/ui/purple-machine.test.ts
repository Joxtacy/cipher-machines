/**
 * @vitest-environment happy-dom
 *
 * The PURPLE panel's interactive rules — draft-then-Apply on the alphabet, the
 * read-only slow row, rewind gating — were only ever verified by hand in a
 * browser. These pin them.
 */
import { render, screen, within } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import PurpleMachine from "../../src/lib/components/PurpleMachine.svelte";
import { purple } from "../../src/lib/state/purple.svelte";

const PART1_ALPHABET = "NOKTYUXEQLHBRMPDICJASVWGZF";

/** The module-level store is shared, so each test starts from defaults. */
beforeEach(() => purple.reset());
afterEach(() => purple.reset());

const alphabetInput = () => screen.getByLabelText("Daily alphabet") as HTMLInputElement;
const speedRow = (role: string) => screen.getByLabelText(`${role} switch`);

describe("PurpleMachine", () => {
	it("renders the typewriter keyboard, not Enigma's", () => {
		render(PurpleMachine);
		expect(screen.getByLabelText("Key Y")).toBeInTheDocument();
		const keys = screen.getAllByLabelText(/^Key [A-Z]$/);
		expect(keys).toHaveLength(26);
		expect(
			keys
				.slice(0, 10)
				.map((k) => k.textContent?.trim())
				.join(""),
		).toBe("QWERTYUIOP");
	});

	it("shows the sixes group from the current alphabet", () => {
		render(PurpleMachine);
		expect(screen.getByText("AEIOUY")).toBeInTheDocument();
	});

	describe("daily alphabet", () => {
		it("stays a draft until Apply is pressed", async () => {
			const user = userEvent.setup();
			render(PurpleMachine);

			await user.clear(alphabetInput());
			await user.type(alphabetInput(), PART1_ALPHABET);
			// Typed but not applied: the machine must be untouched.
			expect(purple.alphabet).toBe("AEIOUYBCDFGHJKLMNPQRSTVWXZ");

			await user.click(screen.getByRole("button", { name: "Apply" }));
			expect(purple.alphabet).toBe(PART1_ALPHABET);
			expect(screen.getByText("NOKTYU")).toBeInTheDocument();
		});

		it("disables Apply for an incomplete alphabet and explains why", async () => {
			const user = userEvent.setup();
			render(PurpleMachine);

			await user.clear(alphabetInput());
			await user.type(alphabetInput(), "TOOSHORT");

			expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
			expect(screen.getByText(/each exactly once \(8\/26\)/)).toBeInTheDocument();
		});

		it("disables Apply for a repeated letter", async () => {
			const user = userEvent.setup();
			render(PurpleMachine);

			await user.clear(alphabetInput());
			await user.type(alphabetInput(), "AA" + PART1_ALPHABET.slice(2));

			expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
		});

		it("uppercases as you type", async () => {
			const user = userEvent.setup();
			render(PurpleMachine);

			await user.clear(alphabetInput());
			await user.type(alphabetInput(), PART1_ALPHABET.toLowerCase());
			expect(alphabetInput().value).toBe(PART1_ALPHABET);
		});

		it("Revert throws the draft away", async () => {
			const user = userEvent.setup();
			render(PurpleMachine);

			await user.clear(alphabetInput());
			await user.type(alphabetInput(), PART1_ALPHABET);
			await user.click(screen.getByRole("button", { name: "Revert" }));

			expect(alphabetInput().value).toBe("AEIOUYBCDFGHJKLMNPQRSTVWXZ");
			expect(purple.alphabet).toBe("AEIOUYBCDFGHJKLMNPQRSTVWXZ");
		});

		it("disables Apply and Revert when the draft matches the machine", () => {
			render(PurpleMachine);
			expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
			expect(screen.getByRole("button", { name: "Revert" })).toBeDisabled();
		});
	});

	describe("switch speeds", () => {
		it("shows all three roles as matching rows", () => {
			render(PurpleMachine);
			for (const role of ["fast", "middle", "slow"]) {
				expect(within(speedRow(role)).getAllByRole("button")).toHaveLength(3);
			}
		});

		it("leaves the slow row read-only, since it is derived", () => {
			render(PurpleMachine);
			for (const button of within(speedRow("slow")).getAllByRole("button")) {
				expect(button).toBeDisabled();
			}
			// fast and middle stay operable
			for (const role of ["fast", "middle"]) {
				for (const button of within(speedRow(role)).getAllByRole("button")) {
					expect(button).not.toBeDisabled();
				}
			}
		});

		it("re-derives slow when fast changes", async () => {
			const user = userEvent.setup();
			render(PurpleMachine);

			// Defaults: fast I, middle II, so slow is III.
			expect(within(speedRow("slow")).getByRole("button", { name: "III" })).toHaveClass("active");

			await user.click(within(speedRow("fast")).getByRole("button", { name: "III" }));

			expect(purple.fastSwitch).toBe(3);
			expect(purple.slowSwitch).toBe(1);
			expect(within(speedRow("slow")).getByRole("button", { name: "I" })).toHaveClass("active");
		});

		it("swaps rather than allowing the same stage twice", async () => {
			const user = userEvent.setup();
			render(PurpleMachine);

			// Make stage II fast; it was middle, so the old fast (I) takes middle.
			await user.click(within(speedRow("fast")).getByRole("button", { name: "II" }));

			expect(purple.fastSwitch).toBe(2);
			expect(purple.middleSwitch).toBe(1);
			expect(new Set([purple.fastSwitch, purple.middleSwitch, purple.slowSwitch]).size).toBe(3);
		});
	});

	describe("message controls", () => {
		it("disables Rewind and New message with nothing typed", () => {
			render(PurpleMachine);
			expect(screen.getByRole("button", { name: /^Rewind to/ })).toBeDisabled();
			expect(screen.getByRole("button", { name: "New message" })).toBeDisabled();
		});

		it("enables them once a message is under way, labelled with the start", async () => {
			const user = userEvent.setup();
			render(PurpleMachine);

			await user.click(screen.getByLabelText("Key A"));

			const rewind = screen.getByRole("button", { name: /^Rewind to/ });
			expect(rewind).not.toBeDisabled();
			expect(rewind).toHaveTextContent("Rewind to 01 01 01 01");
		});

		it("Rewind restores the dials and keeps the alphabet", async () => {
			const user = userEvent.setup();
			render(PurpleMachine);

			await user.clear(alphabetInput());
			await user.type(alphabetInput(), PART1_ALPHABET);
			await user.click(screen.getByRole("button", { name: "Apply" }));

			for (const letter of "MEMO") await user.click(screen.getByLabelText(`Key ${letter}`));
			expect(purple.switches[0]).not.toBe(0);

			await user.click(screen.getByRole("button", { name: /^Rewind to/ }));

			expect(purple.switches).toEqual([0, 0, 0, 0]);
			expect(purple.recentKeys).toEqual([]);
			expect(purple.alphabet).toBe(PART1_ALPHABET);
		});
	});

	describe("direction", () => {
		it("starts in Encipher and switches to Decipher", async () => {
			const user = userEvent.setup();
			render(PurpleMachine);

			expect(screen.getByRole("button", { name: "Encipher" })).toHaveClass("active");
			await user.click(screen.getByRole("button", { name: "Decipher" }));

			expect(purple.mode).toBe("decrypt");
			expect(screen.getByRole("button", { name: "Decipher" })).toHaveClass("active");
		});

		it("advertises the garble key only when deciphering", async () => {
			const user = userEvent.setup();
			render(PurpleMachine);

			expect(screen.getByText("A–Z only")).toBeInTheDocument();
			await user.click(screen.getByRole("button", { name: "Decipher" }));
			expect(screen.getByText(/for a garble/)).toBeInTheDocument();
		});
	});

	it("enciphers through the UI and shows it on the tape", async () => {
		const user = userEvent.setup();
		render(PurpleMachine);

		await user.clear(alphabetInput());
		await user.type(alphabetInput(), PART1_ALPHABET);
		await user.click(screen.getByRole("button", { name: "Apply" }));

		for (const letter of "MEMORANDUM") {
			await user.click(screen.getByLabelText(`Key ${letter}`));
		}

		// Same vector the engine and store tests use, now end to end through the UI.
		expect(purple.recentKeys.map((k) => k.output).join("")).toBe("QWBKBVYATJ");
		expect(screen.getByTitle("Copy ciphertext")).toHaveTextContent("QWBKB VYATJ");
	});
});
