import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const adminPagePath = new URL("src/pages/admin/index.astro", root);
const adminBootstrapPath = new URL("public/admin/bootstrap.js", root);
const adminConfigPath = new URL("public/admin/config.yml", root);
const staticAdminPath = new URL("public/admin/index.html", root);
const vercelConfigPath = new URL("vercel.json", root);
const publicEntryPaths = [
	new URL("src/config.ts", root),
	new URL("src/components/HomeHero.astro", root),
	new URL("src/components/Navbar.astro", root),
];

const adminPage = await readFile(adminPagePath, "utf8");
const adminBootstrap = await readFile(adminBootstrapPath, "utf8");
const publicEntries = await Promise.all(publicEntryPaths.map((path) => readFile(path, "utf8")));

test("admin page uses the pinned Sveltia entry script", () => {
	assert.match(
		adminBootstrap,
		/https:\/\/unpkg\.com\/@sveltia\/cms@0\.197\.0\/dist\/sveltia-cms\.js/,
	);
	assert.match(
		adminBootstrap,
		/sha384-oPYfvGglsneWy8\+BWzIWj0CGxssuTW3PwZcQuPVdYKw7ajNDXKp3DTPxLj3sdg9V/,
	);
});

test("admin page has no custom password or GitHub API gate", () => {
	for (const value of [
		"gateSecret",
		"AUTHOR_GATE_SECRET",
		"admin-gate-password",
		"https://api.github.com/user",
	]) {
		assert.doesNotMatch(adminPage, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
	}
});

test("admin page clears legacy credentials without writing them", () => {
	for (const key of [
		"qingge-admin-gh-token",
		"sveltia-cms.user",
		"decap-cms-user",
		"netlify-cms-user",
		"sveltia-cms.auth",
	]) {
		assert.match(adminBootstrap, new RegExp(`"${key.replace(".", "\\.")}"`));
	}
	assert.match(adminBootstrap, /for \(const key of CREDENTIAL_KEYS\)/);
	assert.match(adminBootstrap, /removeStorageKey\(window\.localStorage, key\)/);
	assert.match(adminBootstrap, /removeStorageKey\(window\.sessionStorage, key\)/);
	assert.match(adminBootstrap, /pagehide/);
	assert.match(adminBootstrap, /beforeunload/);
	assert.doesNotMatch(adminBootstrap, /setItem\(\s*["']qingge-admin-gh-token/);
	assert.doesNotMatch(adminBootstrap, /setItem\(\s*["']sveltia-cms\.user/);
});

test("admin config keeps GitHub backend and disables local backend", async () => {
	const config = await readFile(adminConfigPath, "utf8");
	assert.match(config, /name:\s*github/);
	assert.match(config, /auth_methods:\s*\n\s+- token/);
	assert.match(config, /local_backend:\s*false/);
});

test("the duplicate public admin HTML is removed", async () => {
	await assert.rejects(access(staticAdminPath));
});

test("public pages do not carry a password-bearing admin entry", () => {
	for (const source of publicEntries) {
		for (const value of [
			"authorGate",
			"data-author-secret",
			"qingge-author",
			"AUTHOR_GATE_SECRET",
			"qingge666",
		]) {
			assert.doesNotMatch(
				source,
				new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
			);
		}
	}
});

test("Vercel keeps global headers and adds an uncached admin CSP", async () => {
	const config = JSON.parse(await readFile(vercelConfigPath, "utf8"));
	const globalRule = config.headers.find((rule) => rule.source === "/(.*)");
	const adminRule = config.headers.find((rule) => rule.source === "/admin/:path*");
	assert.ok(globalRule);
	assert.ok(adminRule);
	const globalHeaders = Object.fromEntries(
		globalRule.headers.map(({ key, value }) => [key.toLowerCase(), value]),
	);
	const adminHeaders = Object.fromEntries(
		adminRule.headers.map(({ key, value }) => [key.toLowerCase(), value]),
	);
	assert.equal(globalHeaders["x-content-type-options"], "nosniff");
	assert.equal(adminHeaders["cache-control"], "no-store");
	assert.match(adminHeaders["x-robots-tag"], /noindex/);
	assert.match(adminHeaders["content-security-policy"], /default-src 'none'/);
	assert.match(adminHeaders["content-security-policy"], /script-src 'self' https:\/\/unpkg\.com/);
	assert.match(adminHeaders["content-security-policy"], /img-src 'self' data: blob:/);
	assert.match(adminHeaders["content-security-policy"], /font-src 'self' data: https:\/\/unpkg\.com https:\/\/cdn\.jsdelivr\.net/);
	assert.match(adminHeaders["content-security-policy"], /frame-src 'self' blob:/);
	assert.match(adminHeaders["content-security-policy"], /worker-src 'self' blob: https:\/\/unpkg\.com/);
	assert.match(adminHeaders["content-security-policy"], /frame-ancestors 'none'/);
});
