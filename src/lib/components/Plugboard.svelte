<script lang="ts">
	import type { PlugPair } from "$lib/enigma/plugboard";

	interface Props {
		plugboard: PlugPair[];
		onAdd: (a: string, b: string) => void;
		onRemove: (letter: string) => void;
		partner: (letter: string) => string | null;
	}

	let { plugboard, onAdd, onRemove, partner }: Props = $props();

	const ROWS: string[][] = ["ABCDEFGHIJKLM".split(""), "NOPQRSTUVWXYZ".split("")];

	// Layout constants — kept in sync with .socket and .row CSS.
	const SOCKET_W = 41.6; // 2.6rem at 16px
	const SOCKET_H = 46.4; // 2.9rem
	const GAP = 8; // 0.5rem
	const ROW_GAP = 8;
	const PADDING_X = 25.6; // 1.6rem
	const PADDING_TOP = 22.4; // 1.4rem

	function socketCentre(letter: string): { x: number; y: number } | null {
		for (let r = 0; r < ROWS.length; r++) {
			const idx = ROWS[r].indexOf(letter);
			if (idx !== -1) {
				const rowWidth = ROWS[r].length * SOCKET_W + (ROWS[r].length - 1) * GAP;
				const rowStart = PADDING_X + (containerWidth - 2 * PADDING_X - rowWidth) / 2;
				const x = rowStart + idx * (SOCKET_W + GAP) + SOCKET_W / 2;
				const y = PADDING_TOP + r * (SOCKET_H + ROW_GAP) + SOCKET_H / 2;
				return { x, y };
			}
		}
		return null;
	}

	let pendingFirst: string | null = $state(null);
	let containerEl: HTMLDivElement | undefined = $state();
	let containerWidth = $state(600);

	$effect(() => {
		if (!containerEl) return;
		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				containerWidth = entry.contentRect.width;
			}
		});
		ro.observe(containerEl);
		return () => ro.disconnect();
	});

	function handleClick(letter: string) {
		const p = partner(letter);
		if (p) {
			onRemove(letter);
			pendingFirst = null;
			return;
		}
		if (pendingFirst === null) {
			pendingFirst = letter;
		} else if (pendingFirst === letter) {
			pendingFirst = null;
		} else {
			onAdd(pendingFirst, letter);
			pendingFirst = null;
		}
	}

	function handleContextMenu(e: MouseEvent, letter: string) {
		e.preventDefault();
		if (partner(letter)) onRemove(letter);
	}

	let cables = $derived(
		plugboard
			.map(([a, b], i) => {
				const from = socketCentre(a);
				const to = socketCentre(b);
				if (!from || !to) return null;
				const mx = (from.x + to.x) / 2;
				const my = Math.max(from.y, to.y) + 28 + (i % 4) * 6;
				return { a, b, from, to, mx, my };
			})
			.filter(<T,>(x: T | null): x is T => x !== null),
	);
</script>

<div class="plugboard bezel" bind:this={containerEl}>
	<svg class="cable-layer" aria-hidden="true">
		{#each cables as cable (cable.a + cable.b)}
			<path
				d="M {cable.from.x} {cable.from.y} Q {cable.mx} {cable.my} {cable.to.x} {cable.to.y}"
				stroke="var(--cable)"
				stroke-width="5"
				fill="none"
				stroke-linecap="round"
			/>
			<path
				d="M {cable.from.x} {cable.from.y} Q {cable.mx} {cable.my} {cable.to.x} {cable.to.y}"
				stroke="rgba(255, 220, 160, 0.1)"
				stroke-width="1"
				fill="none"
				stroke-linecap="round"
			/>
		{/each}
	</svg>

	<div class="grid">
		{#each ROWS as row, rowIdx (rowIdx)}
			<div class="row">
				{#each row as letter (letter)}
					{@const plugged = partner(letter) !== null}
					{@const isPending = pendingFirst === letter}
					<button
						type="button"
						class="socket"
						class:plugged
						class:pending={isPending}
						aria-label="Socket {letter}{plugged ? ` (paired with ${partner(letter)})` : ''}"
						aria-pressed={plugged}
						onclick={() => handleClick(letter)}
						oncontextmenu={(e) => handleContextMenu(e, letter)}
					>
						<span class="legend">{letter}</span>
						<span class="hole"></span>
					</button>
				{/each}
			</div>
		{/each}
	</div>

	<p class="hint">
		{#if pendingFirst}
			Pick the partner for <strong>{pendingFirst}</strong> · click <strong>{pendingFirst}</strong> again
			to cancel
		{:else}
			Click a letter to start a pair · click a paired letter to remove it · right-click also removes
		{/if}
	</p>
</div>

<style>
	.plugboard {
		position: relative;
		padding: 1.4rem 1.6rem 1rem;
	}

	.cable-layer {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 2;
	}

	.grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		position: relative;
		z-index: 1;
	}

	.row {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}

	.socket {
		width: 2.6rem;
		height: 2.9rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: 0.18rem;
		padding: 0.2rem 0;
		border-radius: 6px;
		background: linear-gradient(180deg, #2a1c10 0%, #1a1108 100%);
		border: 1px solid var(--socket-rim);
		box-shadow:
			inset 0 1px 0 rgba(255, 220, 160, 0.07),
			inset 0 -1px 2px rgba(0, 0, 0, 0.6),
			0 2px 4px rgba(0, 0, 0, 0.45);
		transition:
			transform 60ms ease,
			border-color 60ms ease;
	}

	.socket:hover {
		border-color: var(--accent);
	}
	.socket.pending {
		border-color: var(--accent-strong);
		transform: translateY(-2px);
	}

	.legend {
		font-family: var(--font-stack-display);
		font-weight: 700;
		font-size: 0.85rem;
		color: var(--brand-text);
		opacity: 0.85;
	}

	.hole {
		width: 0.85rem;
		height: 0.85rem;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #050302 0%, #0a0604 70%, #150c06 100%);
		box-shadow:
			inset 0 1px 2px rgba(0, 0, 0, 0.9),
			inset 0 -1px 0 rgba(255, 220, 160, 0.05);
		border: 1px solid #0a0604;
	}

	.socket.plugged .hole {
		background: radial-gradient(circle at 35% 30%, #f9d36a 0%, #b07a25 65%, #5a3a14 100%);
		box-shadow:
			inset 0 1px 2px rgba(255, 240, 180, 0.4),
			inset 0 -1px 2px rgba(0, 0, 0, 0.5),
			0 0 6px rgba(255, 200, 90, 0.4);
		border-color: #6a4a2c;
	}

	.hint {
		margin: 0.8rem 0 0;
		text-align: center;
		font-size: 0.78rem;
		color: var(--muted);
	}

	.hint strong {
		color: var(--accent-strong);
		font-weight: 600;
	}
</style>
