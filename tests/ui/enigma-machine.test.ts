/**
 * @vitest-environment happy-dom
 *
 * Enigma's UI rules: rotor windows and rings, the lampboard, plugboard clicks,
 * duplicate-rotor swapping, and the rewind gating.
 */
import { render, screen, within } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import EnigmaMachine from "../../src/lib/components/EnigmaMachine.svelte";
import { machine } from "../../src/lib/state/machine.svelte";

beforeEach(() => machine.reset());
afterEach(() => machine.reset());

const key = (letter: string) => screen.getByLabelText(`Key ${letter}`);

describe("EnigmaMachine", () => {
	it("renders the QWERTZU keyboard and a lampboard of 26", () => {
		render(EnigmaMachine);
		const keys = screen.getAllByLabelText(/^Key [A-Z]$/);
		expect(keys).toHaveLength(26);
		// Enigma's own layout: Z in the top row where QWERTY has Y.
		expect(
			keys
				.slice(0, 9)
				.map((k) => k.textContent?.trim())
				.join(""),
		).toBe("QWERTZUIO");
	});

	it("shows the three rotor windows starting at A", () => {
		render(EnigmaMachine);
		const windows = screen.getByLabelText("Rotor windows");
		expect(within(windows).getAllByText("A").length).toBeGreaterThanOrEqual(3);
	});

	it("enciphers a keypress and lights the lamp", async () => {
		const user = userEvent.setup();
		render(EnigmaMachine);

		await user.click(key("A"));

		// Canonical: A at AAA with rotors I-II-III and UKW-B gives B.
		expect(machine.recentKeys.map((k) => k.output).join("")).toBe("B");
		expect(machine.positions).toEqual([0, 0, 1]);
	});

	it("reproduces the documented worked example on the tape", async () => {
		const user = userEvent.setup();
		render(EnigmaMachine);

		for (const letter of "HELLO") await user.click(key(letter));

		expect(screen.getByTitle("Copy plaintext")).toHaveTextContent("HELLO");
		expect(screen.getByTitle("Copy ciphertext")).toHaveTextContent("ILBDA");
	});

	it("advances a rotor window with its thumbwheel", async () => {
		const user = userEvent.setup();
		render(EnigmaMachine);

		await user.click(screen.getByLabelText("Advance right rotor position up"));
		expect(machine.positions[2]).toBe(1);

		await user.click(screen.getByLabelText("Advance right rotor position down"));
		expect(machine.positions[2]).toBe(0);
	});

	it("changes a ring setting without moving the window", async () => {
		const user = userEvent.setup();
		render(EnigmaMachine);

		await user.click(screen.getByLabelText("Increment right rotor ring"));

		expect(machine.rings[2]).toBe(1);
		expect(machine.positions[2]).toBe(0);
	});

	describe("rotor selection", () => {
		it("swaps when a rotor is already in another slot", async () => {
			const user = userEvent.setup();
			render(EnigmaMachine);

			const left = screen.getByLabelText("Left");
			await user.selectOptions(left, "III");

			expect(machine.rotors).toEqual(["III", "II", "I"]);
			expect(new Set(machine.rotors).size).toBe(3);
		});
	});

	describe("reflector", () => {
		it("offers all three and marks UKW-B active", () => {
			render(EnigmaMachine);
			expect(screen.getByRole("button", { name: "UKW-A" })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "UKW-B" })).toHaveClass("active");
			expect(screen.getByRole("button", { name: "UKW-C" })).toBeInTheDocument();
		});

		it("switches to UKW-A, which changes the cipher", async () => {
			const user = userEvent.setup();
			render(EnigmaMachine);

			await user.click(screen.getByRole("button", { name: "UKW-A" }));
			expect(machine.reflector).toBe("A");

			await user.click(key("A"));
			// UKW-A is a different reflector, so A must not still give B.
			expect(machine.recentKeys[0].output).not.toBe("B");
		});
	});

	describe("plugboard", () => {
		it("pairs two letters with two clicks", async () => {
			const user = userEvent.setup();
			render(EnigmaMachine);

			await user.click(screen.getByLabelText(/^Socket A/));
			await user.click(screen.getByLabelText(/^Socket B/));

			expect(machine.plugboard).toEqual([["A", "B"]]);
		});

		it("removes a pair by clicking either end", async () => {
			const user = userEvent.setup();
			render(EnigmaMachine);

			await user.click(screen.getByLabelText(/^Socket A/));
			await user.click(screen.getByLabelText(/^Socket B/));
			await user.click(screen.getByLabelText(/^Socket B/));

			expect(machine.plugboard).toEqual([]);
		});
	});

	describe("message controls", () => {
		it("disables Rewind until something is typed", async () => {
			const user = userEvent.setup();
			render(EnigmaMachine);

			expect(screen.getByRole("button", { name: /^Rewind to/ })).toBeDisabled();

			await user.click(key("A"));
			expect(screen.getByRole("button", { name: /^Rewind to/ })).not.toBeDisabled();
		});

		it("labels Rewind with the message's starting windows", async () => {
			const user = userEvent.setup();
			render(EnigmaMachine);

			await user.click(screen.getByLabelText("Advance left rotor position up"));
			await user.click(key("A"));

			expect(screen.getByRole("button", { name: /^Rewind to/ })).toHaveTextContent("Rewind to BAA");
		});

		it("Rewind round-trips a message, keeping the daily key", async () => {
			const user = userEvent.setup();
			render(EnigmaMachine);

			await user.click(screen.getByLabelText(/^Socket A/));
			await user.click(screen.getByLabelText(/^Socket B/));

			for (const letter of "HELLO") await user.click(key(letter));
			const cipher = machine.recentKeys.map((k) => k.output).join("");

			await user.click(screen.getByRole("button", { name: /^Rewind to/ }));
			expect(machine.positions).toEqual([0, 0, 0]);
			expect(machine.plugboard).toEqual([["A", "B"]]);

			for (const letter of cipher) await user.click(key(letter));
			expect(machine.recentKeys.map((k) => k.output).join("")).toBe("HELLO");
		});

		it("Reset machine clears the daily key too", async () => {
			const user = userEvent.setup();
			render(EnigmaMachine);

			await user.click(screen.getByLabelText(/^Socket A/));
			await user.click(screen.getByLabelText(/^Socket B/));
			await user.click(key("A"));

			await user.click(screen.getByRole("button", { name: "Reset machine" }));

			expect(machine.plugboard).toEqual([]);
			expect(machine.positions).toEqual([0, 0, 0]);
			expect(machine.recentKeys).toEqual([]);
		});
	});
});
