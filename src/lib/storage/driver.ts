export interface PresetSummary {
	name: string;
	updatedAt: number;
}

export interface PresetRecord<T = unknown> {
	name: string;
	config: T;
	updatedAt: number;
}

/**
 * Named-preset storage, one namespace per cipher machine.
 *
 * Deliberately knows nothing about what a config contains — it stores and
 * returns `unknown`, and the caller validates on the way out (see PresetsStore).
 * Presets are user-editable in both backends, so a driver that pretended to
 * return a typed config would be lying.
 */
export interface PresetDriver {
	readonly kind: 'localstorage' | 'tauri-fs';
	list(namespace: string): Promise<PresetSummary[]>;
	load(namespace: string, name: string): Promise<PresetRecord | null>;
	save(namespace: string, name: string, config: unknown): Promise<PresetRecord>;
	remove(namespace: string, name: string): Promise<void>;
}

export function safeFilename(name: string): string {
	return (
		name
			.replace(/[^A-Za-z0-9 _-]/g, '_')
			.trim()
			.slice(0, 64) || 'untitled'
	);
}

/**
 * Namespaces reach a filesystem path in the Tauri backend, so they are checked
 * rather than interpolated blind. Code-supplied today, but a path is a path.
 */
export function safeNamespace(namespace: string): string {
	if (!/^[a-z][a-z0-9-]{0,31}$/.test(namespace)) {
		throw new Error(`Invalid preset namespace "${namespace}" (expected e.g. "enigma")`);
	}
	return namespace;
}
