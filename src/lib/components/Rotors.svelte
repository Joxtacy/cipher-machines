<script lang="ts">
	import { indexToChar } from "$lib/enigma/alphabet";
	import type { RotorId } from "$lib/enigma/rotors";
	import type { Triple } from "$lib/enigma/machine";

	interface Props {
		rotors: Triple<RotorId>;
		positions: Triple<number>;
		rings: Triple<number>;
		onAdvance: (slot: 0 | 1 | 2, delta: number) => void;
		onAdvanceRing: (slot: 0 | 1 | 2, delta: number) => void;
	}

	let { rotors, positions, rings, onAdvance, onAdvanceRing }: Props = $props();

	const slots: Array<0 | 1 | 2> = [0, 1, 2];
	const labels = ["Left", "Middle", "Right"];
</script>

<div class="rotors bezel" aria-label="Rotor windows">
	{#each slots as slot (slot)}
		<div class="rotor">
			<div class="legend">
				<span class="rotor-id">{rotors[slot]}</span>
				<span class="rotor-pos-label">{labels[slot]}</span>
			</div>

			<button
				type="button"
				class="thumb up"
				aria-label="Advance {labels[slot].toLowerCase()} rotor position up"
				onclick={() => onAdvance(slot, 1)}
			>
				<svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
					<polygon points="10,2 18,12 2,12" fill="currentColor" />
				</svg>
			</button>

			<div class="window">
				<div class="metal"></div>
				<div class="letter-stack">
					<span class="letter">{indexToChar(positions[slot])}</span>
				</div>
				<div class="glass"></div>
			</div>

			<button
				type="button"
				class="thumb down"
				aria-label="Advance {labels[slot].toLowerCase()} rotor position down"
				onclick={() => onAdvance(slot, -1)}
			>
				<svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
					<polygon points="10,12 18,2 2,2" fill="currentColor" />
				</svg>
			</button>

			<span class="caption">Pos</span>

			<div class="ring-row">
				<button
					type="button"
					class="ring-btn"
					aria-label="Decrement {labels[slot].toLowerCase()} rotor ring"
					onclick={() => onAdvanceRing(slot, -1)}>−</button
				>
				<div class="ring-display" aria-label="{labels[slot]} ring setting">
					<span class="ring-letter">{indexToChar(rings[slot])}</span>
				</div>
				<button
					type="button"
					class="ring-btn"
					aria-label="Increment {labels[slot].toLowerCase()} rotor ring"
					onclick={() => onAdvanceRing(slot, 1)}>+</button
				>
			</div>
			<span class="caption ring-caption">Ring</span>
		</div>
	{/each}
</div>

<style>
	.rotors {
		display: flex;
		justify-content: center;
		gap: 1.6rem;
		padding: 1.1rem 1.6rem;
	}

	.rotor {
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

	.rotor-id {
		font-family: var(--font-stack-display);
		font-weight: 700;
		color: var(--accent-strong);
		font-size: 1rem;
		letter-spacing: 0.08em;
	}

	.rotor-pos-label {
		font-family: var(--font-stack-ui);
		font-size: 0.65rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}

	.caption {
		font-size: 0.55rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: var(--muted);
		margin-top: 0.05rem;
	}

	.ring-caption {
		margin-top: 0;
	}

	.thumb {
		width: 2.2rem;
		height: 1.1rem;
		display: grid;
		place-items: center;
		color: var(--rotor-thumb-arrow);
		background: var(--rotor-metal);
		border-radius: 4px;
		border: 1px solid var(--rotor-metal-side);
		box-shadow:
			inset 0 1px 0 rgba(255, 230, 180, 0.25),
			inset 0 -1px 2px rgba(0, 0, 0, 0.5),
			0 2px 3px rgba(0, 0, 0, 0.5);
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

	.window {
		position: relative;
		width: 2.6rem;
		height: 3.4rem;
		border-radius: 6px;
		background: var(--rotor-window-bg);
		border: 1px solid var(--rotor-window-rim);
		overflow: hidden;
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.7),
			inset 0 -1px 2px rgba(255, 220, 160, 0.05);
	}

	.metal {
		position: absolute;
		inset: 0;
		background: var(--rotor-metal);
		opacity: 0.55;
	}

	.letter-stack {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		transition: transform 140ms ease-out;
	}

	.letter {
		font-family: var(--font-stack-display);
		font-weight: 700;
		font-size: 1.7rem;
		color: var(--rotor-letter);
		text-shadow:
			0 1px 0 rgba(0, 0, 0, 0.7),
			0 0 6px rgba(255, 215, 140, 0.25);
	}

	.glass {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.15) 0%,
			transparent 35%,
			transparent 65%,
			rgba(0, 0, 0, 0.4) 100%
		);
	}

	.ring-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.4rem;
	}

	.ring-btn {
		width: 1.3rem;
		height: 1.3rem;
		display: grid;
		place-items: center;
		color: var(--brand-text);
		background: var(--key-face);
		border: 1px solid var(--socket-rim);
		border-radius: 4px;
		font-size: 0.85rem;
		line-height: 1;
		font-family: var(--font-stack-mono);
		transition:
			border-color 60ms ease,
			color 60ms ease;
	}

	.ring-btn:hover {
		border-color: var(--accent);
		color: var(--accent-strong);
	}

	.ring-display {
		min-width: 1.4rem;
		height: 1.3rem;
		display: grid;
		place-items: center;
		background: var(--key-face);
		border: 1px solid var(--socket-rim);
		border-radius: 4px;
		padding: 0 0.3rem;
	}

	.ring-letter {
		font-family: var(--font-stack-display);
		font-weight: 700;
		font-size: 0.85rem;
		color: var(--accent-strong);
		text-shadow: 0 0 4px rgba(255, 215, 140, 0.3);
	}
</style>
