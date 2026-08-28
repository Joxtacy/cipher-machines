/**
 * @vitest-environment happy-dom
 *
 * PresetManager is generic over the config type. These tests use a trivial
 * config and a fake driver, so they cover the component's own behaviour —
 * including that an invalid preset is refused with an explanation rather than
 * being handed to the machine.
 */
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PresetManager from "../../src/lib/components/PresetManager.svelte";
import { PresetsStore } from "../../src/lib/state/presets.svelte";
import type { PresetDriver } from "../../src/lib/storage/driver";

interface Key {
	value: string;
}

function fakeDriver(seed: Record<string, unknown> = {}): PresetDriver {
	const data = new Map<string, unknown>(Object.entries(seed));
	return {
		kind: "localstorage",
		async list() {
			return [...data.keys()].map((name) => ({ name, updatedAt: 0 }));
		},
		async load(_ns, name) {
			if (!data.has(name)) return null;
			return { name, config: data.get(name), updatedAt: 0 };
		},
		async save(_ns, name, config) {
			data.set(name, config);
			return { name, config, updatedAt: 0 };
		},
		async remove(_ns, name) {
			data.delete(name);
		},
	};
}

const parse = (raw: unknown): Key => {
	if (typeof raw !== "object" || raw === null || typeof (raw as Key).value !== "string") {
		throw new Error("value must be a string");
	}
	return raw as Key;
};

const mount = (driver: PresetDriver, onLoad = vi.fn()) => {
	const presets = new PresetsStore<Key>("enigma", parse, driver);
	render(PresetManager, {
		presets,
		snapshot: () => ({ value: "snapshot" }),
		onLoad,
	});
	return { presets, onLoad };
};

describe("PresetManager", () => {
	it("says so when there are no presets", async () => {
		mount(fakeDriver());
		expect(await screen.findByText("No saved presets yet.")).toBeInTheDocument();
	});

	it("lists what the driver holds", async () => {
		mount(fakeDriver({ "Daily key": { value: "x" } }));
		expect(await screen.findByText("Daily key")).toBeInTheDocument();
	});

	it("keeps Save disabled until a name is entered", async () => {
		const user = userEvent.setup();
		mount(fakeDriver());

		const save = screen.getByRole("button", { name: "Save current" });
		expect(save).toBeDisabled();

		await user.type(screen.getByRole("textbox"), "Monday");
		expect(save).not.toBeDisabled();
	});

	it("saves the snapshot under the typed name and clears the field", async () => {
		const user = userEvent.setup();
		const { presets } = mount(fakeDriver());

		await user.type(screen.getByRole("textbox"), "Monday");
		await user.click(screen.getByRole("button", { name: "Save current" }));

		expect(await screen.findByText("Monday")).toBeInTheDocument();
		expect(screen.getByRole("textbox")).toHaveValue("");
		expect(presets.items.map((i) => i.name)).toEqual(["Monday"]);
	});

	it("hands a valid preset to onLoad", async () => {
		const user = userEvent.setup();
		const { onLoad } = mount(fakeDriver({ Good: { value: "ok" } }));

		await user.click(await screen.findByText("Good"));

		expect(onLoad).toHaveBeenCalledWith({ value: "ok" });
	});

	it("refuses an invalid preset, naming it, and does not call onLoad", async () => {
		const user = userEvent.setup();
		const { onLoad } = mount(fakeDriver({ Corrupt: { value: 42 } }));

		await user.click(await screen.findByText("Corrupt"));

		expect(onLoad).not.toHaveBeenCalled();
		const error = await screen.findByText(/Preset "Corrupt" is invalid/);
		expect(error).toHaveTextContent("value must be a string");
	});

	it("deletes a preset", async () => {
		const user = userEvent.setup();
		mount(fakeDriver({ Gone: { value: "x" } }));

		await user.click(await screen.findByLabelText("Delete preset Gone"));

		expect(await screen.findByText("No saved presets yet.")).toBeInTheDocument();
	});

	it("reports which backend is in use", async () => {
		mount(fakeDriver());
		expect(await screen.findByText("browser")).toBeInTheDocument();
	});
});
