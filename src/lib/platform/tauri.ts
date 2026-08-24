declare global {
	interface Window {
		__TAURI_INTERNALS__?: unknown;
	}
}

export function isTauri(): boolean {
	if (typeof window === "undefined") return false;
	return Boolean(window.__TAURI_INTERNALS__);
}
