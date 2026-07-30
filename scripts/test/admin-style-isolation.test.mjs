import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
	new URL("../../src/pages/admin/index.astro", import.meta.url),
	"utf8",
);

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

test("admin waits for Sveltia to restore a saved token before treating its login screen as a failure", () => {
	assert.match(source, /var LOGIN_SCREEN_GRACE_MS = 10000;/);
	assert.match(source, /function loginScreenTimedOut\(\)/);
	assert.match(source, /if \(loginScreenTimedOut\(\)\) \{/);
});
