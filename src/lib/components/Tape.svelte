<script lang="ts">
	import type { RecentKey } from "$lib/state/tape";

	interface Props {
		recentKeys: RecentKey[];
	}

	let { recentKeys }: Props = $props();

	const GROUP = 5;

	let plaintext = $derived(recentKeys.map((k) => k.input).join(""));
	let ciphertext = $derived(recentKeys.map((k) => k.output).join(""));

	function group(s: string): string {
		return (s.match(new RegExp(`.{1,${GROUP}}`, "g")) ?? []).join(" ");
	}

	function copy(s: string) {
		if (typeof navigator !== "undefined" && navigator.clipboard) {
			void navigator.clipboard.writeText(s);
		}
	}
</script>

<div class="card">
	<header>
		<h3>Tape</h3>
		<span class="count">{recentKeys.length}</span>
	</header>

	<div class="line">
		<div class="label">Plain</div>
		<button type="button" class="text" title="Copy plaintext" onclick={() => copy(plaintext)}>
			{group(plaintext) || "·"}
		</button>
	</div>
	<div class="line">
		<div class="label">Cipher</div>
		<button
			type="button"
			class="text cipher"
			title="Copy ciphertext"
			onclick={() => copy(ciphertext)}
		>
			{group(ciphertext) || "·"}
		</button>
	</div>
</div>

<style>
	.count {
		font-family: var(--font-stack-mono);
		font-size: 0.75rem;
		color: var(--muted);
	}

	.line {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.label {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--muted);
	}

	.text {
		display: block;
		text-align: left;
		padding: 0.55rem 0.7rem;
		border-radius: 6px;
		background: var(--key-face);
		border: 1px solid var(--socket-rim);
		font-family: var(--font-stack-mono);
		font-size: 0.85rem;
		color: var(--brand-text);
		min-height: 2rem;
		max-height: 6rem;
		overflow-y: auto;
		word-break: break-all;
		line-height: 1.5;
		transition: border-color 80ms ease;
	}

	.text:hover {
		border-color: var(--accent);
	}

	.cipher {
		color: var(--accent-strong);
	}
</style>
