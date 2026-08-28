/**
 * @vitest-environment happy-dom
 *
 * The tape is shared by both machines and its labels are literal: "Plain" is
 * what you typed, "Cipher" is what came out. When deciphering that means the
 * recovered text sits on the Cipher line, which both guides warn about.
 */
import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Tape from "../../src/lib/components/Tape.svelte";
import type { RecentKey } from "../../src/lib/state/tape";

const keys = (input: string, output: string): RecentKey[] =>
	[...input].map((c, i) => ({ input: c, output: output[i], id: i }));

describe("Tape", () => {
	it("shows a placeholder when empty", () => {
		render(Tape, { recentKeys: [] });
		expect(screen.getByText("0")).toBeInTheDocument();
		expect(screen.getByTitle("Copy plaintext")).toHaveTextContent("·");
	});

	it("groups both lines in fives", () => {
		render(Tape, { recentKeys: keys("HELLOWORLD", "ILBDAKZUUX") });
		expect(screen.getByTitle("Copy plaintext")).toHaveTextContent("HELLO WORLD");
		expect(screen.getByTitle("Copy ciphertext")).toHaveTextContent("ILBDA KZUUX");
	});

	it("counts the keys pressed", () => {
		render(Tape, { recentKeys: keys("HELLO", "ILBDA") });
		expect(screen.getByText("5")).toBeInTheDocument();
	});

	it("leaves a trailing partial group ungrouped", () => {
		render(Tape, { recentKeys: keys("ABCDEFG", "QWERTYU") });
		expect(screen.getByTitle("Copy plaintext")).toHaveTextContent("ABCDE FG");
	});

	it("does not truncate a long message", () => {
		const long = "A".repeat(400);
		render(Tape, { recentKeys: keys(long, long) });
		const text = screen.getByTitle("Copy plaintext").textContent ?? "";
		expect(text.replace(/\s/g, "")).toHaveLength(400);
	});

	it("shows garble markers as typed", () => {
		render(Tape, { recentKeys: keys("AB-CD", "QW-ER") });
		expect(screen.getByTitle("Copy plaintext")).toHaveTextContent("AB-CD");
	});
});
