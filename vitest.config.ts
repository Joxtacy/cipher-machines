import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	// The svelte plugin is what compiles runes in `*.svelte.ts` modules, and the
	// $lib alias is what SvelteKit would normally provide — without both, tests
	// can only reach the pure engine, not the state layer.
	plugins: [svelte()],
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL("./src/lib", import.meta.url)),
		},
	},
	test: {
		include: ["tests/**/*.test.ts"],
		environment: "node",
	},
});
