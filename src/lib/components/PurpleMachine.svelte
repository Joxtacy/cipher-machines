<script lang="ts">
	import { onMount } from "svelte";
	import { purple, SWITCH_LABELS, type SwitchSlot } from "$lib/state/purple.svelte";
	import { purplePresets } from "$lib/state/presets.svelte";
	import { isValidAlphabet, type SwitchRole } from "$lib/purple/machine";
	import { TYPEWRITER_ROWS, TYPEWRITER_STAGGER } from "$lib/keyboard-layout";
	import Keyboard from "./Keyboard.svelte";
	import Tape from "./Tape.svelte";
	import PresetManager from "./PresetManager.svelte";

	let pressed: string | null = $state(null);
	let releaseTimer: ReturnType<typeof setTimeout> | null = null;

	// Draft text so a half-typed alphabet never reaches the machine.
	let alphabetDraft = $state(purple.alphabet);
	let alphabetValid = $derived(isValidAlphabet(alphabetDraft));
	let alphabetDirty = $derived(alphabetDraft.toUpperCase() !== purple.alphabet);

	let canRewind = $derived(purple.recentKeys.length > 0);
	let messageStartLabel = $derived(
		purple.messageStart.map((p) => String(p + 1).padStart(2, "0")).join(" "),
	);

	const slots: SwitchSlot[] = [0, 1, 2, 3];
	const stages: SwitchRole[] = [1, 2, 3];

	/**
	 * All three speeds share one row shape so the panel reads uniformly. Slow is
	 * shown but not selectable: it is derived from the other two, and choosing it
	 * directly would be ambiguous about which remaining stage becomes fast.
	 */
	const SPEED_ROWS = [{ role: "fast" }, { role: "middle" }, { role: "slow" }] as const;

	function selectedStage(role: "fast" | "middle" | "slow"): SwitchRole {
		if (role === "fast") return purple.fastSwitch;
		if (role === "middle") return purple.middleSwitch;
		return purple.slowSwitch;
	}

	function pressLetter(letter: string) {
		const upper = letter.toUpperCase();
		if (purple.pressKey(upper) === null) return;
		pressed = upper;
	}

	function releaseLetter() {
		pressed = null;
		if (releaseTimer) clearTimeout(releaseTimer);
		releaseTimer = setTimeout(() => (purple.lastOutput = purple.lastOutput), 90);
	}

	function commitAlphabet() {
		if (!alphabetValid) return;
		purple.setAlphabet(alphabetDraft);
		alphabetDraft = purple.alphabet;
	}

	function roleOf(stage: SwitchRole): string {
		if (purple.fastSwitch === stage) return "fast";
		if (purple.middleSwitch === stage) return "middle";
		return "slow";
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
		const target = e.target as HTMLElement | null;
		if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
		if (e.key.length === 1 && /^[a-zA-Z-]$/.test(e.key)) {
			e.preventDefault();
			pressLetter(e.key);
		}
	}

	function onKeyUp(e: KeyboardEvent) {
		if (e.key.length === 1 && /^[a-zA-Z-]$/.test(e.key)) releaseLetter();
	}

	onMount(() => {
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
		};
	});
</script>

<div class="machine">
	<div class="chassis">
		<header class="header">
			<div class="brand">
				<span class="brand-mark">囲</span>
				<div>
					<h1>PURPLE</h1>
					<p>Angooki Taipu B · Type B Cipher Machine</p>
				</div>
			</div>
			<div class="mode" role="group" aria-label="Direction">
				{#each ["encrypt", "decrypt"] as const as m (m)}
					<button type="button" class:active={purple.mode === m} onclick={() => purple.setMode(m)}>
						{m === "encrypt" ? "Encipher" : "Decipher"}
					</button>
				{/each}
			</div>
		</header>

		<section class="switches bezel" aria-label="Stepping switches">
			{#each slots as slot (slot)}
				<div class="switch">
					<div class="legend">
						<span class="label">{SWITCH_LABELS[slot]}</span>
						{#if slot > 0}
							<span class="role {roleOf(slot as SwitchRole)}">{roleOf(slot as SwitchRole)}</span>
						{:else}
							<span class="role always">every key</span>
						{/if}
					</div>
					<button
						type="button"
						class="thumb up"
						aria-label="Advance {SWITCH_LABELS[slot]} switch"
						onclick={() => purple.advanceSwitch(slot, 1)}
					>
						<svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
							<polygon points="10,2 18,12 2,12" fill="currentColor" />
						</svg>
					</button>
					<div class="window">
						<span class="value">{String(purple.switches[slot] + 1).padStart(2, "0")}</span>
					</div>
					<button
						type="button"
						class="thumb down"
						aria-label="Reverse {SWITCH_LABELS[slot]} switch"
						onclick={() => purple.advanceSwitch(slot, -1)}
					>
						<svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
							<polygon points="10,12 18,2 2,2" fill="currentColor" />
						</svg>
					</button>
				</div>
			{/each}
		</section>

		<section class="printer bezel" aria-label="Printer">
			<span class="printer-label">{purple.mode === "encrypt" ? "Cipher" : "Plain"}</span>
			<span class="printer-out" class:lit={purple.lastOutput !== null}>
				{purple.lastOutput ?? "·"}
			</span>
			<span class="printer-hint">
				{purple.mode === "decrypt" ? "type “-” for a garble" : "A–Z only"}
			</span>
		</section>

		<Keyboard
			{pressed}
			rows={TYPEWRITER_ROWS}
			stagger={TYPEWRITER_STAGGER}
			onPress={pressLetter}
			onRelease={releaseLetter}
		/>
	</div>

	<aside class="side">
		<div class="card">
			<div class="group">
				<h3>Daily alphabet</h3>
				<p class="hint">
					26 distinct letters. The first six are the <strong>sixes</strong>
					group:
					<code>{purple.sixesLetters}</code>
				</p>
				<input
					type="text"
					spellcheck="false"
					autocapitalize="characters"
					maxlength="26"
					aria-label="Daily alphabet"
					class:invalid={!alphabetValid}
					bind:value={alphabetDraft}
					oninput={() => (alphabetDraft = alphabetDraft.toUpperCase())}
				/>
				<div class="alpha-actions">
					<button
						type="button"
						disabled={!alphabetValid || !alphabetDirty}
						onclick={commitAlphabet}
					>
						Apply
					</button>
					<button
						type="button"
						class="ghost"
						disabled={!alphabetDirty}
						onclick={() => (alphabetDraft = purple.alphabet)}
					>
						Revert
					</button>
				</div>
				{#if !alphabetValid}
					<p class="error">
						Needs all 26 letters, each exactly once ({alphabetDraft.length}/26).
					</p>
				{/if}
			</div>

			<div class="group">
				<h3>Switch speeds</h3>
				<p class="hint">One twenties stage steps per character. Slow is whatever is left.</p>
				{#each SPEED_ROWS as row (row.role)}
					<div class="row">
						<span class="row-label">{row.role}</span>
						<div class="seg" role="group" aria-label="{row.role} switch">
							{#each stages as stage (stage)}
								<button
									type="button"
									class:active={selectedStage(row.role) === stage}
									disabled={row.role === "slow"}
									title={row.role === "slow"
										? "Derived — the stage that is neither fast nor middle"
										: `Make stage ${SWITCH_LABELS[stage]} the ${row.role} switch`}
									onclick={() => row.role !== "slow" && purple.setRole(row.role, stage)}
								>
									{SWITCH_LABELS[stage]}
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<div class="group">
				<h3>Message</h3>
				<div class="alpha-actions">
					<button
						type="button"
						disabled={!canRewind}
						title={canRewind
							? `Wind the dials back to ${messageStartLabel} and clear the tape`
							: "Nothing to rewind — no message in progress"}
						onclick={() => purple.rewind()}
					>
						Rewind to {messageStartLabel}
					</button>
					<button
						type="button"
						class="ghost"
						disabled={!canRewind}
						title="Clear the tape but leave the dials where they are"
						onclick={() => purple.newMessage()}
					>
						New message
					</button>
				</div>
			</div>

			<div class="group">
				<h3>Reset</h3>
				<div class="alpha-actions">
					<button
						type="button"
						class="danger"
						title="Back to defaults — this also resets the daily alphabet"
						onclick={() => {
							purple.reset();
							alphabetDraft = purple.alphabet;
						}}
					>
						Reset machine
					</button>
				</div>
			</div>
		</div>

		<Tape recentKeys={purple.recentKeys} />

		<PresetManager
			presets={purplePresets}
			snapshot={() => purple.snapshot()}
			onLoad={(key) => {
				purple.loadConfig(key);
				alphabetDraft = purple.alphabet;
			}}
		/>
	</aside>
</div>

<style>
	.machine {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 22rem;
		gap: 1.5rem;
		padding: 1.5rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	@media (max-width: 1000px) {
		.machine {
			grid-template-columns: 1fr;
		}
	}

	.chassis {
		position: relative;
		padding: 1.2rem 1.4rem 1.6rem;
		border-radius: 22px;
		background:
			var(--chassis-grain), linear-gradient(180deg, var(--chassis) 0%, var(--chassis-edge) 100%);
		background-blend-mode: overlay, normal;
		border: 1px solid var(--chassis-edge);
		box-shadow:
			inset 0 1px 0 var(--chassis-highlight),
			inset 0 -2px 0 rgba(0, 0, 0, 0.35),
			0 14px 30px var(--chassis-shadow),
			0 30px 80px rgba(0, 0, 0, 0.45);
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.2rem 0.4rem 0.2rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.brand {
		display: flex;
		gap: 0.85rem;
		align-items: center;
	}

	.brand-mark {
		font-size: 1.6rem;
		color: var(--accent-strong);
		filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.7));
	}

	.brand h1 {
		margin: 0;
		font-family: var(--font-stack-display);
		font-weight: 700;
		font-size: 1.5rem;
		letter-spacing: 0.06em;
		color: var(--brand-text);
	}

	.brand p {
		margin: 0;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--muted);
	}

	.mode {
		display: flex;
		gap: 0.3rem;
	}

	/* Mirrors .rotors on the Enigma side: one recessed bezel, dials inside it. */
	.switches {
		display: flex;
		justify-content: center;
		gap: 1.6rem;
		padding: 1.1rem 1.6rem;
		flex-wrap: wrap;
	}

	.switch {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
	}

	.legend {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.05rem;
	}

	.label {
		font-family: var(--font-stack-display);
		font-weight: 700;
		color: var(--accent-strong);
		font-size: 1rem;
		letter-spacing: 0.08em;
	}

	.role {
		font-family: var(--font-stack-ui);
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--muted);
	}

	.role.fast {
		color: var(--accent);
	}

	.window {
		width: 3.2rem;
		height: 2.6rem;
		display: grid;
		place-items: center;
		border-radius: 6px;
		background: var(--rotor-window-bg);
		border: 1px solid var(--rotor-window-rim);
		box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.7);
	}

	.value {
		font-family: var(--font-stack-mono);
		font-size: 1.3rem;
		color: var(--rotor-letter);
	}

	/* Same metal thumbwheels as the Enigma rotor windows. */
	.thumb {
		width: 2.2rem;
		height: 1.1rem;
		display: grid;
		place-items: center;
		padding: 0;
		color: var(--rotor-thumb-arrow);
		background: var(--rotor-metal);
		border-radius: 4px;
		border: 1px solid var(--rotor-metal-side);
		box-shadow:
			inset 0 1px 0 rgba(255, 230, 180, 0.25),
			inset 0 -1px 2px rgba(0, 0, 0, 0.5),
			0 2px 3px rgba(0, 0, 0, 0.5);
		cursor: pointer;
		transition:
			transform 60ms ease,
			filter 60ms ease;
	}

	.thumb:hover {
		filter: brightness(1.08);
	}
	.thumb:active {
		transform: translateY(1px);
	}

	.printer {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 0.6rem 0.9rem;
	}

	.printer-label,
	.printer-hint {
		font-size: 0.62rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--muted);
	}

	.printer-hint {
		margin-left: auto;
	}

	.printer-out {
		font-family: var(--font-stack-mono);
		font-size: 1.8rem;
		color: var(--muted);
		min-width: 1.5rem;
		text-align: center;
	}

	.printer-out.lit {
		color: var(--rotor-letter);
	}

	.side {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
	}

	code {
		font-family: var(--font-stack-mono);
		color: var(--accent-strong);
	}

	input {
		width: 100%;
		box-sizing: border-box;
		font-family: var(--font-stack-mono);
		font-size: 0.82rem;
		letter-spacing: 0.06em;
		padding: 0.45rem 0.55rem;
		border-radius: 8px;
		border: 1px solid var(--bezel-edge);
		background: var(--rotor-window-bg);
		color: var(--brand-text);
	}

	input.invalid {
		border-color: var(--danger);
	}

	.alpha-actions {
		display: flex;
		gap: 0.4rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: space-between;
	}

	.row-label {
		font-size: 0.66rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--muted);
	}

	.seg {
		display: flex;
		gap: 0.25rem;
	}

	button {
		font: inherit;
		font-size: 0.72rem;
		padding: 0.35rem 0.6rem;
		border-radius: 7px;
		border: 1px solid var(--bezel-edge);
		background: var(--bezel);
		color: var(--muted);
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		color: var(--brand-text);
	}

	button.active {
		color: var(--brand-text);
		border-color: var(--accent-strong);
		background: var(--bezel-inner);
	}

	button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	/* The slow row is read-only, so its selected chip keeps full contrast while
	   the other two dim like any disabled control. */
	.seg button:disabled.active {
		opacity: 1;
		color: var(--brand-text);
		border-color: var(--accent-strong);
		background: var(--bezel-inner);
	}

	button.ghost {
		background: none;
	}

	button.danger {
		border-color: rgba(208, 82, 66, 0.4);
	}
	button.danger:hover {
		border-color: var(--danger);
		color: var(--danger);
	}

	.error {
		margin: 0;
		font-size: 0.68rem;
		color: var(--danger);
	}
</style>
