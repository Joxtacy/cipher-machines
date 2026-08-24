import { parseConfig, type MachineConfig } from '$lib/enigma/machine';
import { parsePurpleKey, type PurpleKey } from '$lib/purple/machine';
import { getDriver, type PresetDriver, type PresetSummary } from '$lib/storage';

/**
 * Named presets for one cipher machine.
 *
 * Generic over the config shape, with the machine-specific validator injected —
 * so the storage layer stays ignorant of rotors and stepping switches, and every
 * machine gets the same trust-boundary check for free.
 */
export class PresetsStore<T> {
	items: PresetSummary[] = $state([]);
	loading: boolean = $state(false);
	error: string | null = $state(null);

	/**
	 * @param namespace  storage namespace, one per machine (e.g. 'enigma')
	 * @param parse      validates untrusted stored data, or throws explaining why not
	 * @param driver     storage backend; defaults to the platform's
	 */
	constructor(
		private readonly namespace: string,
		private readonly parse: (raw: unknown) => T,
		private readonly driver: PresetDriver = getDriver()
	) {}

	get kind(): PresetDriver['kind'] {
		return this.driver.kind;
	}

	async refresh(): Promise<void> {
		this.loading = true;
		this.error = null;
		try {
			this.items = await this.driver.list(this.namespace);
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	async save(name: string, config: T): Promise<void> {
		this.error = null;
		try {
			await this.driver.save(this.namespace, name, config);
			await this.refresh();
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		}
	}

	async load(name: string): Promise<T | null> {
		this.error = null;
		try {
			const r = await this.driver.load(this.namespace, name);
			if (!r) return null;
			// Presets are user-editable (localStorage / JSON files on disk), so
			// this is a trust boundary — never hand unvalidated data to the store.
			return this.parse(r.config);
		} catch (e) {
			const why = e instanceof Error ? e.message : String(e);
			this.error = `Preset "${name}" is invalid: ${why}`;
			return null;
		}
	}

	async remove(name: string): Promise<void> {
		this.error = null;
		try {
			await this.driver.remove(this.namespace, name);
			await this.refresh();
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		}
	}
}

/** Enigma presets. Resolves to the `enigma:presets` key this app has always used. */
export const presets = new PresetsStore<MachineConfig>('enigma', parseConfig);

/** PURPLE presets, stored separately so names cannot collide across machines. */
export const purplePresets = new PresetsStore<PurpleKey>('purple', parsePurpleKey);
