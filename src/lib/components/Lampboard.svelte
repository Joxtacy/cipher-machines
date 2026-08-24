<script lang="ts">
	import { KEYBOARD_ROWS } from '$lib/keyboard-layout';

	interface Props {
		lit: string | null;
	}

	let { lit }: Props = $props();
</script>

<div class="lampboard bezel" aria-label="Lampboard">
	{#each KEYBOARD_ROWS as row, rowIdx (rowIdx)}
		<div class="row" class:offset-1={rowIdx === 1} class:offset-0={rowIdx === 2}>
			{#each row as letter (letter)}
				<div class="lamp" class:on={lit === letter} aria-hidden="true">
					<span class="letter">{letter}</span>
					<div class="halo"></div>
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.lampboard {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 1.4rem 1.8rem 1.6rem;
	}

	.row {
		display: flex;
		justify-content: center;
		gap: 0.55rem;
	}

	.row.offset-1 {
		padding-left: 1.1rem;
	}
	.row.offset-0 {
		padding-left: 0;
	}

	.lamp {
		position: relative;
		width: 2.6rem;
		height: 2.6rem;
		border-radius: 50%;
		background: radial-gradient(circle at 30% 30%, #2a2014 0%, var(--lamp-off) 65%, #110a05 100%);
		border: 1px solid var(--lamp-rim);
		box-shadow:
			inset 0 1px 0 rgba(255, 220, 160, 0.06),
			inset 0 -2px 4px rgba(0, 0, 0, 0.5),
			0 1px 2px rgba(0, 0, 0, 0.5);
		display: grid;
		place-items: center;
		transition: background 80ms ease;
	}

	.letter {
		font-family: var(--font-stack-display);
		font-weight: 700;
		font-size: 1.15rem;
		letter-spacing: 0.02em;
		color: var(--lamp-letter-off);
		text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
		transition:
			color 80ms ease,
			text-shadow 80ms ease;
		user-select: none;
		z-index: 1;
	}

	.halo {
		position: absolute;
		inset: -10px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			var(--lamp-glow) 0%,
			var(--lamp-glow-soft) 35%,
			transparent 70%
		);
		opacity: 0;
		transition: opacity 80ms ease;
		pointer-events: none;
	}

	.lamp.on {
		background: radial-gradient(circle at 30% 30%, #fff8d8 0%, #f9d36a 60%, #b07a25 100%);
	}

	.lamp.on .letter {
		color: var(--lamp-letter-on);
		text-shadow:
			0 0 6px rgba(255, 240, 180, 0.7),
			0 0 14px rgba(255, 200, 100, 0.5);
	}

	.lamp.on .halo {
		opacity: 1;
	}
</style>
