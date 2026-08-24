import type { PresetDriver, PresetRecord, PresetSummary } from "./driver";
import { safeFilename, safeNamespace } from "./driver";

const PRESETS_ROOT = "presets";

/** One subdirectory per machine: presets/enigma, presets/purple. */
function dirFor(namespace: string): string {
	return `${PRESETS_ROOT}/${safeNamespace(namespace)}`;
}

async function ensureDir(namespace: string): Promise<string> {
	const { mkdir, exists, BaseDirectory } = await import("@tauri-apps/plugin-fs");
	const dir = dirFor(namespace);
	if (!(await exists(dir, { baseDir: BaseDirectory.AppData }))) {
		await mkdir(dir, { baseDir: BaseDirectory.AppData, recursive: true });
	}
	return dir;
}

function fileFor(namespace: string, name: string): string {
	return `${dirFor(namespace)}/${safeFilename(name)}.json`;
}

export const tauriFsDriver: PresetDriver = {
	kind: "tauri-fs",

	async list(namespace): Promise<PresetSummary[]> {
		const { readDir, BaseDirectory, stat } = await import("@tauri-apps/plugin-fs");
		const dir = await ensureDir(namespace);
		const entries = await readDir(dir, { baseDir: BaseDirectory.AppData });
		const summaries: PresetSummary[] = [];
		for (const entry of entries) {
			if (!entry.isFile || !entry.name?.endsWith(".json")) continue;
			const fullPath = `${dir}/${entry.name}`;
			let updatedAt = 0;
			try {
				const info = await stat(fullPath, { baseDir: BaseDirectory.AppData });
				updatedAt = info.mtime ? new Date(info.mtime).getTime() : 0;
			} catch {
				/* ignore */
			}
			summaries.push({ name: entry.name.replace(/\.json$/, ""), updatedAt });
		}
		return summaries.sort((a, b) => b.updatedAt - a.updatedAt);
	},

	async load(namespace, name): Promise<PresetRecord | null> {
		const { readTextFile, BaseDirectory, exists } = await import("@tauri-apps/plugin-fs");
		await ensureDir(namespace);
		const path = fileFor(namespace, name);
		if (!(await exists(path, { baseDir: BaseDirectory.AppData }))) return null;
		const raw = await readTextFile(path, { baseDir: BaseDirectory.AppData });
		const parsed = JSON.parse(raw) as { config?: unknown; updatedAt?: number };
		return { name, config: parsed.config, updatedAt: parsed.updatedAt ?? 0 };
	},

	async save(namespace, name, config): Promise<PresetRecord> {
		const { writeTextFile, BaseDirectory } = await import("@tauri-apps/plugin-fs");
		await ensureDir(namespace);
		const updatedAt = Date.now();
		const payload = JSON.stringify({ name, config, updatedAt }, null, 2);
		await writeTextFile(fileFor(namespace, name), payload, { baseDir: BaseDirectory.AppData });
		return { name, config, updatedAt };
	},

	async remove(namespace, name): Promise<void> {
		const { remove, BaseDirectory, exists } = await import("@tauri-apps/plugin-fs");
		const path = fileFor(namespace, name);
		if (await exists(path, { baseDir: BaseDirectory.AppData })) {
			await remove(path, { baseDir: BaseDirectory.AppData });
		}
	},
};
