import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [configSource, splashSource] = await Promise.all([
	readFile(new URL("../../src/config.ts", import.meta.url), "utf8"),
	readFile(
		new URL("../../src/components/Splash.astro", import.meta.url),
		"utf8",
	),
]);

test("splash uses the approved three-second hold and 0.8-second fade", () => {
	assert.match(configSource, /splash:\s*\{[\s\S]*?durationMs:\s*3000,/);
	assert.match(configSource, /splash:\s*\{[\s\S]*?fadeMs:\s*800,/);
	assert.match(splashSource, /data-duration=\{splash\.durationMs\}/);
	assert.match(splashSource, /data-fade=\{splash\.fadeMs\}/);
});

test("splash is opaque on first paint and shares the configured fade duration with CSS", () => {
	assert.match(
		splashSource,
		/style=\{`--splash-fade: \$\{splash\.fadeMs\}ms`\}/,
	);
	assert.match(
		splashSource,
		/\.site-splash\s*\{[\s\S]*?background:\s*#0c0804;/,
	);
	assert.match(splashSource, /\.site-splash\s*\{[\s\S]*?opacity:\s*1;/);
	assert.doesNotMatch(splashSource, /animation:\s*splash-in/);
	assert.doesNotMatch(splashSource, /@keyframes\s+splash-in/);
	assert.match(
		splashSource,
		/\.site-splash\.is-leaving\s*\{[\s\S]*?animation:\s*splash-out var\(--splash-fade, 800ms\)/,
	);
});
