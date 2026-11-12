import assert from "node:assert/strict";
import test from "node:test";
import middleware, { config } from "../../middleware.js";

function run(url) {
	return middleware(new Request(url));
}

test("allows the production admin host", () => {
	assert.equal(run("https://blog.hhq688.com/admin/"), undefined);
	assert.equal(config.matcher, "/:path*");
});

test("allows local development hosts and ignores ports", () => {
	assert.equal(run("http://localhost:4321/admin/"), undefined);
	assert.equal(run("http://127.0.0.1:4321/admin/config.yml"), undefined);
});

test("matches host names case-insensitively", () => {
	assert.equal(run("https://BLOG.HHQ688.COM/admin/"), undefined);
});

test("rejects an unapproved deployment host", async () => {
	const response = run("https://qingge-cabana.vercel.app/admin/");
	assert.ok(response instanceof Response);
	assert.equal(response.status, 404);
	assert.equal(response.headers.get("cache-control"), "no-store");
	assert.equal(response.headers.get("x-content-type-options"), "nosniff");
	assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
	assert.equal(response.headers.get("content-security-policy"), "default-src 'none'; frame-ancestors 'none'");
	assert.equal(await response.text(), "Not Found");
});

test("rejects admin assets on an unapproved host", () => {
	const response = run("https://evil.example/admin/config.yml");
	assert.equal(response.status, 404);
});

test("normalizes encoded and duplicate-slash admin paths", () => {
	for (const path of [
		"/admin%2Fconfig.yml",
		"/%61dmin/config.yml",
		"/%2fadmin/config.yml",
		"//admin/config.yml",
		"/admin%5Cconfig.yml",
	]) {
		const response = run(`https://evil.example${path}`);
		assert.equal(response.status, 404, path);
	}
});

test("does not inspect public routes or near-miss paths", () => {
	assert.equal(run("https://evil.example/"), undefined);
	assert.equal(run("https://evil.example/administrator/"), undefined);
});
