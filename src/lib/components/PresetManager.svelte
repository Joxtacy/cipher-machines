<script lang="ts" generics="T">
	import { onMount } from 'svelte';
	import type { PresetsStore } from '$lib/state/presets.svelte';

	interface Props {
		/** The machine's preset store, already namespaced and validated. */
		presets: PresetsStore<T>;
		/** Current settings to save. */
		snapshot: () => T;
		/** Apply a loaded preset. Only called with a validated config. */
		onLoad: (config: T) => void;
	}

	let { presets, snapshot, onLoad }: Props = $props();

	let newName = $state('');
	let storageKind = $derived(presets.kind);

	onMount(() => {
		void presets.refresh();
	});

	async function saveCurrent() {
		const name = newName.trim();
		if (!name) return;
		await presets.save(name, snapshot());
		newName = '';
	}

	async function loadPreset(name: string) {
		const cfg = await presets.load(name);
		if (cfg) onLoad(cfg);
	}

	async function deletePreset(name: string) {
		await presets.remove(name);
	}

	function fmt(ts: number): string {
		if (!ts) return '';
		try {
			return new Date(ts).toLocaleString();
		} catch {
			return '';
		}
	}
</script>

<div class="card">
	<header>
		<h3>Presets</h3>
		<span
			class="kind"
			title={storageKind === 'tauri-fs'
				? 'Stored as files in app data dir'
				: 'Stored in localStorage'}
		>
			{storageKind === 'tauri-fs' ? 'desktop fs' : 'browser'}
		</span>
	</header>

	<form
		class="save-row"
		onsubmit={(e) => {
			e.preventDefault();
			void saveCurrent();
		}}
	>
		<input
			type="text"
			placeholder="e.g. Daily key 1942-05-01"
			bind:value={newName}
			maxlength="64"
		/>
		<button type="submit" disabled={!newName.trim()}>Save current</button>
	</form>

	{#if presets.error}
		<p class="error">{presets.error}</p>
	{/if}

	{#if presets.loading && presets.items.length === 0}
		<p class="muted">Loading…</p>
	{:else if presets.items.length === 0}
		<p class="muted">No saved presets yet.</p>
	{:else}
		<ul>
			{#each presets.items as preset (preset.name)}
				<li>
					<button class="load" onclick={() => loadPreset(preset.name)}>
						<span class="name">{preset.name}</span>
						<span class="time">{fmt(preset.updatedAt)}</span>
					</button>
					<button
						class="del"
						aria-label="Delete preset {preset.name}"
						onclick={() => deletePreset(preset.name)}
					>
						✕
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.kind {
		font-family: var(--font-stack-mono);
		font-size: 0.7rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.save-row {
		display: flex;
		gap: 0.4rem;
	}

	input {
		flex: 1;
		min-width: 0;
		padding: 0.45rem 0.6rem;
		background: var(--key-face);
		border: 1px solid var(--socket-rim);
		border-radius: 6px;
		font-size: 0.9rem;
		color: var(--brand-text);
	}

	input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.save-row button {
		padding: 0.45rem 0.7rem;
		background: var(--accent-strong);
		color: #1a1108;
		font-weight: 700;
		font-size: 0.85rem;
		border-radius: 6px;
		border: 1px solid var(--accent-strong);
		transition: filter 80ms ease;
	}

	.save-row button:hover:not(:disabled) {
		filter: brightness(1.05);
	}
	.save-row button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		max-height: 14rem;
		overflow-y: auto;
	}

	li {
		display: flex;
		gap: 0.3rem;
		align-items: stretch;
	}

	.load {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.1rem;
		padding: 0.5rem 0.6rem;
		border-radius: 6px;
		background: var(--key-face);
		border: 1px solid var(--socket-rim);
		text-align: left;
		transition: border-color 80ms ease;
	}

	.load:hover {
		border-color: var(--accent);
	}

	.name {
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--brand-text);
	}

	.time {
		font-size: 0.7rem;
		color: var(--muted);
		font-family: var(--font-stack-mono);
	}

	.del {
		width: 2rem;
		display: grid;
		place-items: center;
		border-radius: 6px;
		border: 1px solid var(--socket-rim);
		background: var(--key-face);
		color: var(--muted);
		font-size: 0.9rem;
		transition:
			color 80ms ease,
			border-color 80ms ease;
	}

	.del:hover {
		color: var(--danger);
		border-color: var(--danger);
	}

	.muted {
		color: var(--muted);
		font-size: 0.85rem;
		margin: 0;
	}

	.error {
		margin: 0;
		color: var(--danger);
		font-size: 0.8rem;
	}
</style>
