import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
	new URL("../../src/pages/admin/index.astro", import.meta.url),
	"utf8",
);
const bootstrap = await readFile(
	new URL("../../public/admin/bootstrap.js", import.meta.url),
	"utf8",
);

test("admin viewport rules are constrained to the admin page", () => {
	assert.match(source, /<body class="admin-page">/);
	assert.match(source, /html:has\(body\.admin-page\),\s*body\.admin-page/);
	assert.match(source, /body\.admin-page #nc-root,/);
	assert.match(source, /body\.admin-page \.sui\.app-shell/);
	assert.doesNotMatch(source, /body\.admin-page > div:not\(#admin-loading\)/);
	assert.doesNotMatch(source, /\n\s*body > div:not\(#admin-loading\),/);
});

test("admin keeps a fixed CMS shell and isolates the loading overlay", () => {
	assert.match(source, /--admin-shell-width:\s*1000px/);
	assert.match(
		source,
		/width:\s*min\(100%,\s*var\(--admin-shell-width\)\)\s*!important/,
	);
	assert.match(
		source,
		/max-width:\s*var\(--admin-shell-width\)\s*!important/,
	);
	assert.match(source, /\.qingge-center-target\s*\{/);
	assert.match(source, /id="admin-loading" class="qingge-center-target"/);
	assert.doesNotMatch(source, /\.sui\.app-shell\s*>\s*\.container\s*,/);
	assert.doesNotMatch(source, /div\.container\[role="none"\]\s*,/);
});

test("admin bootstrap loads the CMS after the sort migration", () => {
	assert.match(source, /<script(?: is:inline)? src="\/admin\/bootstrap\.js" defer><\/script>/);
	assert.match(bootstrap, /resetSavedPostView\(\)\.finally\(loadCms\)/);
	assert.match(bootstrap, /script\.integrity = CMS_SRI/);
});
