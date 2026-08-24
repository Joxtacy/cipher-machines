<script lang="ts">
	import "$lib/theme/tokens.css";
	import "$lib/theme/skeuomorphic.css";
	import "$lib/styles/global.css";
	import favicon from "$lib/assets/favicon.svg";
	import { page } from "$app/state";

	let { children } = $props();

	const machines = [
		{ href: "/", label: "Enigma", sub: "Wehrmacht I" },
		{ href: "/purple", label: "PURPLE", sub: "Type B" },
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Cipher Machines</title>
</svelte:head>

<nav aria-label="Machine">
	{#each machines as m (m.href)}
		<a href={m.href} aria-current={page.url.pathname === m.href ? "page" : undefined}>
			<span class="label">{m.label}</span>
			<span class="sub">{m.sub}</span>
		</a>
	{/each}
</nav>

{@render children()}

<style>
	nav {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		padding: 1rem 1.5rem 0;
		max-width: 1400px;
		margin: 0 auto;
	}

	a {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		padding: 0.45rem 1.1rem;
		border-radius: 10px;
		border: 1px solid var(--bezel-edge);
		background: linear-gradient(180deg, var(--bezel) 0%, var(--bezel-inner) 100%);
		text-decoration: none;
		color: var(--muted);
	}

	a:hover {
		color: var(--brand-text);
	}

	a[aria-current="page"] {
		color: var(--brand-text);
		border-color: var(--accent-strong);
	}

	.label {
		font-family: var(--font-stack-display);
		font-size: 0.9rem;
		letter-spacing: 0.08em;
	}

	.sub {
		font-size: 0.58rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
	}
</style>
