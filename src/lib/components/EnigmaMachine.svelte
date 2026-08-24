<script lang="ts">
	import { onMount } from 'svelte';
	import { indexToChar, isLetter } from '$lib/enigma/alphabet';
	import { machine } from '$lib/state/machine.svelte';
	import { presets } from '$lib/state/presets.svelte';
	import Lampboard from './Lampboard.svelte';
	import Keyboard from './Keyboard.svelte';
	import Rotors from './Rotors.svelte';
	import Plugboard from './Plugboard.svelte';
	import Settings from './Settings.svelte';
	import Tape from './Tape.svelte';
	import PresetManager from './PresetManager.svelte';

	let pressed: string | null = $state(null);
	let releaseTimer: ReturnType<typeof setTimeout> | null = null;

	function pressLetter(letter: string) {
		const upper = letter.toUpperCase();
		if (!isLetter(upper)) return;
		pressed = upper;
		machine.pressKey(upper);
	}

	function releaseLetter() {
		pressed = null;
		// Tail the lamp glow a bit so it feels mechanical.
		if (releaseTimer) clearTimeout(releaseTimer);
		releaseTimer = setTimeout(() => machine.releaseKey(), 90);
	}

	// The machine listens on window, so ignore keys aimed at a real field.
	function isTyping(e: KeyboardEvent) {
		const el = e.target as HTMLElement | null;
		return !!el?.closest('input, textarea, select, [contenteditable="true"]');
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTyping(e)) return;
		if (e.key.length === 1 && isLetter(e.key)) {
			e.preventDefault();
			pressLetter(e.key);
		}
	}

	function onKeyUp(e: KeyboardEvent) {
		if (isTyping(e)) return;
		if (e.key.length === 1 && isLetter(e.key)) {
			releaseLetter();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
		};
	});
</script>

<div class="machine" data-theme-target>
	<div class="chassis">
		<header class="header">
			<div class="brand">
				<span class="brand-mark">⛬</span>
				<div>
					<h1>Enigma</h1>
					<p>Wehrmacht Enigma I simulator</p>
				</div>
			</div>
		</header>

		<section class="upper">
			<Rotors
				rotors={machine.rotors}
				positions={machine.positions}
				rings={machine.rings}
				onAdvance={(slot, delta) => machine.advancePosition(slot, delta)}
				onAdvanceRing={(slot, delta) => machine.advanceRing(slot, delta)}
			/>

			<div class="lamps-keys">
				<Lampboard lit={machine.lampLit} />
				<Keyboard {pressed} onPress={pressLetter} onRelease={releaseLetter} />
			</div>

			<Plugboard
				plugboard={machine.plugboard}
				onAdd={(a, b) => machine.addPlug(a, b)}
				onRemove={(l) => machine.removePlug(l)}
				partner={(l) => machine.plugPartner(l)}
			/>
		</section>
	</div>

	<aside class="side">
		<Settings
			rotors={machine.rotors}
			reflector={machine.reflector}
			onSetRotor={(slot, id) => machine.setRotor(slot, id)}
			onSetReflector={(id) => machine.setReflector(id)}
			onClearPlugboard={() => machine.clearPlugboard()}
			onReset={() => machine.reset()}
			onRewind={() => machine.rewind()}
			onNewMessage={() => machine.newMessage()}
			messageStart={machine.messageStart.map(indexToChar).join('')}
			canRewind={machine.recentKeys.length > 0}
		/>
		<Tape recentKeys={machine.recentKeys} />
		<PresetManager
			{presets}
			snapshot={() => machine.snapshot()}
			onLoad={(cfg) => machine.loadConfig(cfg)}
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
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.2rem 0.4rem 1rem;
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
		letter-spacing: 0.18em;
		color: var(--muted);
	}

	.upper {
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}

	.lamps-keys {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}

	.side {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
	}
</style>
