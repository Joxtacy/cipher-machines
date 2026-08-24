import type { PresetDriver, PresetRecord, PresetSummary } from './driver';
import { safeNamespace } from './driver';

interface Stored {
	[name: string]: { config: unknown; updatedAt: number };
}

/**
 * One key per machine. The Enigma namespace resolves to `enigma:presets`, which
 * is the key this app has always used, so existing browser presets survive.
 */
function keyFor(namespace: string): string {
	return `${safeNamespace(namespace)}:presets`;
}

function read(namespace: string): Stored {
	if (typeof localStorage === 'undefined') return {};
	const raw = localStorage.getItem(keyFor(namespace));
	if (!raw) return {};
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === 'object' ? (parsed as Stored) : {};
	} catch {
		return {};
	}
}

function write(namespace: string, s: Stored): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(keyFor(namespace), JSON.stringify(s));
}

export const localStorageDriver: PresetDriver = {
	kind: 'localstorage',

	async list(namespace): Promise<PresetSummary[]> {
		return Object.entries(read(namespace))
			.map(([name, v]) => ({ name, updatedAt: v.updatedAt }))
			.sort((a, b) => b.updatedAt - a.updatedAt);
	},

	async load(namespace, name): Promise<PresetRecord | null> {
		const v = read(namespace)[name];
		if (!v) return null;
		return { name, config: v.config, updatedAt: v.updatedAt };
	},

	async save(namespace, name, config): Promise<PresetRecord> {
		const s = read(namespace);
		const updatedAt = Date.now();
		s[name] = { config, updatedAt };
		write(namespace, s);
		return { name, config, updatedAt };
	},

	async remove(namespace, name): Promise<void> {
		const s = read(namespace);
		delete s[name];
		write(namespace, s);
	}
};
