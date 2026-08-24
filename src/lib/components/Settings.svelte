<script lang="ts">
	import type { RotorId } from '$lib/enigma/rotors';
	import type { ReflectorId } from '$lib/enigma/reflectors';
	import type { Triple } from '$lib/enigma/machine';

	interface Props {
		rotors: Triple<RotorId>;
		reflector: ReflectorId;
		onSetRotor: (slot: 0 | 1 | 2, id: RotorId) => void;
		onSetReflector: (id: ReflectorId) => void;
		onClearPlugboard: () => void;
		onReset: () => void;
		onRewind: () => void;
		onNewMessage: () => void;
		/** Window letters this message started from, e.g. "AAA". */
		messageStart: string;
		/** False when no message is in progress, so there is nothing to rewind to. */
		canRewind: boolean;
	}

	let {
		rotors,
		reflector,
		onSetRotor,
		onSetReflector,
		onClearPlugboard,
		onReset,
		onRewind,
		onNewMessage,
		messageStart,
		canRewind
	}: Props = $props();

	const ROTOR_OPTIONS: RotorId[] = ['I', 'II', 'III', 'IV', 'V'];
	const REFLECTOR_OPTIONS: ReflectorId[] = ['A', 'B', 'C'];
	const slots: Array<0 | 1 | 2> = [0, 1, 2];
	const slotLabels = ['Left', 'Middle', 'Right'];
</script>

<div class="card">
	<div class="group">
		<h3>Rotors</h3>
		<div class="row">
			{#each slots as slot (slot)}
				<label class="field">
					<span>{slotLabels[slot]}</span>
					<select
						value={rotors[slot]}
						onchange={(e) =>
							onSetRotor(slot, (e.currentTarget as HTMLSelectElement).value as RotorId)}
					>
						{#each ROTOR_OPTIONS as id (id)}
							<option value={id}>{id}</option>
						{/each}
					</select>
				</label>
			{/each}
		</div>
		<p class="note">Position and ring are set on each rotor in the machine view.</p>
	</div>

	<div class="group">
		<h3>Reflector (UKW)</h3>
		<div class="row reflectors">
			{#each REFLECTOR_OPTIONS as id (id)}
				<button
					type="button"
					class="pill"
					class:active={reflector === id}
					onclick={() => onSetReflector(id)}
				>
					UKW-{id}
				</button>
			{/each}
		</div>
	</div>

	<div class="group">
		<h3>Message</h3>
		<div class="row actions">
			<button
				type="button"
				class="action"
				disabled={!canRewind}
				title={canRewind
					? `Wind the rotors back to ${messageStart} and clear the tape`
					: 'Nothing to rewind — no message in progress'}
				onclick={onRewind}
			>
				Rewind to {messageStart}
			</button>
			<button
				type="button"
				class="action"
				disabled={!canRewind}
				title="Clear the tape but leave the rotors where they are"
				onclick={onNewMessage}
			>
				New message
			</button>
		</div>
	</div>

	<div class="group">
		<h3>Reset</h3>
		<div class="row actions">
			<button type="button" class="action" onclick={onClearPlugboard}>Clear plugboard</button>
			<button
				type="button"
				class="action danger"
				title="Back to defaults — rotors, rings, reflector and plugboard included"
				onclick={onReset}
			>
				Reset machine
			</button>
		</div>
	</div>
</div>

<style>
	.row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.7rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	select {
		appearance: none;
		background: var(--key-face);
		border: 1px solid var(--socket-rim);
		border-radius: 6px;
		padding: 0.45rem 0.6rem;
		font-family: var(--font-stack-display);
		font-weight: 700;
		font-size: 0.95rem;
		color: var(--brand-text);
		min-width: 4rem;
		cursor: pointer;
	}

	select:hover {
		border-color: var(--accent);
	}

	.note {
		margin: 0.5rem 0 0;
		font-size: 0.7rem;
		color: var(--muted);
		font-style: italic;
	}

	.reflectors {
		gap: 0.4rem;
	}

	.pill {
		padding: 0.45rem 0.85rem;
		border-radius: 999px;
		border: 1px solid var(--socket-rim);
		background: var(--key-face);
		color: var(--brand-text);
		font-family: var(--font-stack-display);
		font-weight: 700;
		font-size: 0.9rem;
		letter-spacing: 0.05em;
		transition:
			background 80ms ease,
			border-color 80ms ease,
			color 80ms ease;
	}

	.pill:hover {
		border-color: var(--accent);
	}
	.pill.active {
		background: var(--accent-strong);
		color: #1a1108;
		border-color: var(--accent-strong);
	}

	.actions {
		gap: 0.5rem;
	}

	.action {
		padding: 0.5rem 0.85rem;
		border-radius: 8px;
		border: 1px solid var(--socket-rim);
		background: var(--key-face);
		color: var(--brand-text);
		font-size: 0.85rem;
		font-weight: 600;
		transition: border-color 80ms ease;
	}

	.action:hover {
		border-color: var(--accent);
	}
	.action:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.action.danger {
		border-color: rgba(208, 82, 66, 0.4);
	}
	.action.danger:hover {
		border-color: var(--danger);
		color: var(--danger);
	}
</style>
