import { isTauri } from '$lib/platform/tauri';
import { localStorageDriver } from './localStorage';
import { tauriFsDriver } from './tauriFs';
import type { PresetDriver } from './driver';

let cached: PresetDriver | null = null;

export function getDriver(): PresetDriver {
	if (cached) return cached;
	cached = isTauri() ? tauriFsDriver : localStorageDriver;
	return cached;
}

export type { PresetDriver, PresetRecord, PresetSummary } from './driver';
export { safeFilename, safeNamespace } from './driver';
