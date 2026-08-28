/**
 * @vitest-environment happy-dom
 */
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Keyboard from "../../src/lib/components/Keyboard.svelte";
import { ENIGMA_ROWS, TYPEWRITER_ROWS } from "../../src/lib/keyboard-layout";

const noop = () => {};

describe("Keyboard", () => {
	it("renders all 26 keys by default", () => {
		render(Keyboard, { pressed: null, onPress: noop, onRelease: noop });
		expect(screen.getAllByRole("button")).toHaveLength(26);
	});

	it("defaults to the Enigma QWERTZU layout", () => {
		render(Keyboard, { pressed: null, onPress: noop, onRelease: noop });
		const letters = screen.getAllByRole("button").map((b) => b.textContent?.trim());
		expect(letters).toEqual(ENIGMA_ROWS.flat());
	});

	it("renders the typewriter layout when asked", () => {
		render(Keyboard, {
			pressed: null,
			onPress: noop,
			onRelease: noop,
			rows: TYPEWRITER_ROWS,
		});
		const letters = screen.getAllByRole("button").map((b) => b.textContent?.trim());
		expect(letters).toEqual(TYPEWRITER_ROWS.flat());
		// The distinguishing detail: QWERTY starts its top row with Q..P and puts
		// Y in the top row, where Enigma has Z.
		expect(letters.slice(0, 10).join("")).toBe("QWERTYUIOP");
	});

	it("reports presses and releases for the key that was clicked", async () => {
		const user = userEvent.setup();
		const onPress = vi.fn();
		const onRelease = vi.fn();
		render(Keyboard, { pressed: null, onPress, onRelease });

		await user.click(screen.getByLabelText("Key G"));
		expect(onPress).toHaveBeenCalledWith("G");
		expect(onRelease).toHaveBeenCalled();
	});

	it("marks only the pressed key as pressed", () => {
		render(Keyboard, { pressed: "H", onPress: noop, onRelease: noop });
		const pressed = screen
			.getAllByRole("button")
			.filter((b) => b.classList.contains("pressed"))
			.map((b) => b.textContent?.trim());
		expect(pressed).toEqual(["H"]);
	});

	it("applies the per-row stagger it is given", () => {
		const { container } = render(Keyboard, {
			pressed: null,
			onPress: noop,
			onRelease: noop,
			rows: TYPEWRITER_ROWS,
			stagger: [0, 0.9, 1.8],
		});
		const rows = [...container.querySelectorAll<HTMLElement>(".row")];
		expect(rows.map((r) => r.style.paddingLeft)).toEqual(["0rem", "0.9rem", "1.8rem"]);
	});
});
