import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	// The svelte plugin compiles runes in `*.svelte.ts` modules and `.svelte`
	// components; svelteTesting() puts the "browser" resolve condition ahead of
	// "node" so Svelte 5's mount() is available instead of the SSR build. The
	// $lib alias is what SvelteKit would normally provide.
	plugins: [svelte(), svelteTesting()],
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL("./src/lib", import.meta.url)),
		},
	},
	test: {
		include: ["tests/**/*.test.ts"],
		// Engine and store tests run in node; component tests opt into a DOM with
		// a `@vitest-environment happy-dom` docblock, so the fast majority stay fast.
		environment: "node",
		setupFiles: ["./tests/setup-dom.ts"],
	},
});
