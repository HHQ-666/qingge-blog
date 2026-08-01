import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [source, staticSource] = await Promise.all([
	readFile(
		new URL("../../src/pages/admin/index.astro", import.meta.url),
		"utf8",
	),
	readFile(new URL("../../public/admin/index.html", import.meta.url), "utf8"),
]);
const adminSources = [source, staticSource];

test("admin viewport rules are constrained to the admin page", () => {
	assert.match(source, /<body class="admin-page">/);
	assert.match(source, /html:has\(body\.admin-page\),\s*body\.admin-page/);
	assert.match(
		source,
		/body\.admin-page > div:not\(#admin-gate\):not\(#admin-boot\)/,
	);
	assert.doesNotMatch(
		source,
		/\n\s*body > div:not\(#admin-gate\):not\(#admin-boot\),/,
	);
});

test("both admin entries keep a fixed CMS shell and isolate loader fullscreen styles", () => {
	for (const adminSource of adminSources) {
		assert.match(adminSource, /--admin-shell-width:\s*1000px/);
		assert.match(
			adminSource,
			/width:\s*min\(100%,\s*var\(--admin-shell-width\)\)\s*!important/,
		);
		assert.match(
			adminSource,
			/max-width:\s*var\(--admin-shell-width\)\s*!important/,
		);
		assert.match(adminSource, /\.qingge-center-target\s*\{/);
		assert.doesNotMatch(adminSource, /\.sui\.app-shell\s*>\s*\.container\s*,/);
		assert.doesNotMatch(adminSource, /div\.container\[role="none"\]\s*,/);
		assert.doesNotMatch(
			adminSource,
			/\.sui\.app-shell \.container:has\(button\)\s*,/,
		);
		assert.doesNotMatch(
			adminSource,
			/\.sui\.app-shell\s*>\s*\.container\s*>\s*\.inner\s*,/,
		);
		assert.doesNotMatch(
			adminSource,
			/div\.container\[role="none"\]\s*>\s*\.inner\s*\{/,
		);
	}
});

test("admin waits for Sveltia to restore a saved token before treating its login screen as a failure", () => {
	assert.match(source, /var LOGIN_SCREEN_GRACE_MS = 10000;/);
	assert.match(source, /function loginScreenTimedOut\(\)/);
	assert.match(source, /if \(loginScreenTimedOut\(\)\) \{/);
});
