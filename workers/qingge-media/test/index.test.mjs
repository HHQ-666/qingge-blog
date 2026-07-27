import assert from "node:assert/strict";
import test from "node:test";
import { handleRequest } from "../src/index.mjs";

function object(body = "image-bytes") {
  return {
    body,
    httpEtag: '"abc123"',
    writeHttpMetadata(headers) {
      headers.set("content-type", "image/png");
    },
  };
}

test("rejects writes", async () => {
  const response = await handleRequest(
    new Request("https://example.workers.dev/a.png", { method: "POST" }),
    { get() {} },
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
});

test("returns 404 for a missing object", async () => {
  const response = await handleRequest(
    new Request("https://example.workers.dev/posts/a.png"),
    { async get() { return null; } },
  );

  assert.equal(response.status, 404);
});

test("returns object metadata and immutable cache headers", async () => {
  const response = await handleRequest(
    new Request("https://example.workers.dev/posts/a.png"),
    { async get() { return object(); } },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(await response.text(), "image-bytes");
});
