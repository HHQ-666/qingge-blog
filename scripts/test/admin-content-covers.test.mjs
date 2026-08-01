import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = new URL("../..", import.meta.url);
const configPath = new URL("../../public/admin/config.yml", import.meta.url);
const postsPath = new URL("../../src/content/posts/", import.meta.url);
const adminPagePath = new URL(
	"../../src/pages/admin/index.astro",
	import.meta.url,
);

test("admin defaults to descending publication date and exposes it as a sort field", async () => {
	const config = await readFile(configPath, "utf8");

	assert.match(
		config,
		/sortable_fields:[ \t]*(?:&[A-Za-z0-9_-]+[ \t]*)?\n\s+fields:\n\s+- published\n\s+- title\n\s+- description\n\s+default:\n\s+field: published\n\s+direction: descending/,
	);
});

test("admin clears the old saved list view once so the new default sort takes effect", async () => {
	const adminPage = await readFile(adminPagePath, "utf8");

	assert.match(
		adminPage,
		/var SORT_PREFERENCE_MIGRATION_KEY = "qingge-admin-sort-v1";/,
	);
	assert.match(adminPage, /function resetSavedPostView\(\)/);
	assert.match(adminPage, /delete\("contents-view"\)/);
	assert.match(adminPage, /await resetSavedPostView\(\);/);
});

test("every post references an existing local cover image", async () => {
	const postFiles = (await readdir(postsPath)).filter((file) =>
		file.endsWith(".md"),
	);

	for (const file of postFiles) {
		const source = await readFile(
			new URL(`../../src/content/posts/${file}`, import.meta.url),
			"utf8",
		);
		const image = source.match(
			/^image:\s*(\/media\/uploads\/covers\/[^\s]+)$/m,
		)?.[1];
		assert.ok(image, `${file} must have a local cover image`);
		await stat(path.join(root.pathname, "public", image));
	}
});
