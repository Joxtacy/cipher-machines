<script lang="ts">
	import { KEYBOARD_ROWS } from "$lib/keyboard-layout";

	interface Props {
		pressed: string | null;
		onPress: (letter: string) => void;
		onRelease: () => void;
	}

	let { pressed, onPress, onRelease }: Props = $props();

	function handleDown(letter: string) {
		onPress(letter);
	}

	function handleUp() {
		onRelease();
	}
</script>

<div class="keyboard bezel" role="group" aria-label="Keyboard">
	{#each KEYBOARD_ROWS as row, rowIdx (rowIdx)}
		<div class="row" class:offset-1={rowIdx === 1} class:offset-0={rowIdx === 2}>
			{#each row as letter (letter)}
				<button
					type="button"
					class="key"
					class:pressed={pressed === letter}
					aria-label="Key {letter}"
					onmousedown={() => handleDown(letter)}
					onmouseup={handleUp}
					onmouseleave={handleUp}
					ontouchstart={(e) => {
						e.preventDefault();
						handleDown(letter);
					}}
					ontouchend={(e) => {
						e.preventDefault();
						handleUp();
					}}
				>
					<span class="cap">{letter}</span>
				</button>
			{/each}
		</div>
	{/each}
</div>

<style>
	.keyboard {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
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

	.key {
		width: 2.9rem;
		height: 2.9rem;
		border-radius: 50%;
		padding: 0;
		background: radial-gradient(circle at 30% 25%, #3a2a1c 0%, var(--key-face) 70%, #050302 100%);
		border: 1px solid var(--key-rim);
		display: grid;
		place-items: center;
		box-shadow:
			inset 0 1px 0 rgba(255, 220, 160, 0.08),
			inset 0 -2px 4px rgba(0, 0, 0, 0.5),
			0 3px 0 #2a1a0d,
			0 5px 8px rgba(0, 0, 0, 0.55);
		transition:
			transform 60ms ease,
			box-shadow 60ms ease,
			background 60ms ease;
		user-select: none;
	}

	.key:hover {
		border-color: var(--accent);
	}

	.key.pressed {
		background: radial-gradient(
			circle at 30% 25%,
			#2a1d12 0%,
			var(--key-face-pressed) 70%,
			#050302 100%
		);
		border-color: var(--key-rim-pressed);
		transform: translateY(2px);
		box-shadow:
			inset 0 1px 0 rgba(255, 220, 160, 0.04),
			inset 0 -2px 4px rgba(0, 0, 0, 0.7),
			0 1px 0 #2a1a0d,
			0 2px 4px rgba(0, 0, 0, 0.5);
	}

	.cap {
		font-family: var(--font-stack-display);
		font-weight: 700;
		font-size: 1.2rem;
		color: var(--key-letter);
		text-shadow: 0 1px 0 var(--key-letter-shadow);
	}
</style>
