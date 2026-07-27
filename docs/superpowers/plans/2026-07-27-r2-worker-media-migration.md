# R2 Worker Media Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve migrated CSDN article images from Cloudflare R2 through a free `workers.dev` Worker without changing the existing Squarespace, Vercel, or email DNS.

**Architecture:** A small Cloudflare Worker receives read-only `GET` and `HEAD` requests and reads objects through an `MEDIA` R2 binding. A local migration script downloads CSDN images without the blog referer, losslessly optimizes PNG images, conservatively compresses JPEG images, uploads objects through the R2 S3 API, then rewrites only verified Markdown image URLs.

**Tech Stack:** Astro, Node.js 22, Node built-in test runner, Cloudflare Workers, Cloudflare R2, Sharp, AWS S3 SDK, Wrangler.

---

## File structure

- `workers/qingge-media/src/index.mjs`: Worker request validation, object lookup, and cache/content headers.
- `workers/qingge-media/test/index.test.mjs`: Node tests for allowed methods, missing objects, and successful media responses.
- `workers/qingge-media/wrangler.toml`: Worker name, runtime compatibility date, `workers.dev` delivery, and R2 binding declaration.
- `scripts/migrate-csdn-images.mjs`: Controlled image download, compression, upload, URL verification, Markdown replacement, and migration manifest.
- `scripts/media-migration.config.mjs`: One auditable configuration source for the issued Worker URL and R2 object prefix.
- `src/content/posts/*.md`: Only CSDN image URLs that have been downloaded and verified are replaced.
- `docs/IMAGE-MIGRATION.md`: Repeatable runbook for adding images and rolling back a migrated article.

### Task 1: Create and test the read-only Worker handler

**Files:**
- Create: `workers/qingge-media/src/index.mjs`
- Create: `workers/qingge-media/test/index.test.mjs`

- [ ] **Step 1: Write the failing Worker tests**

```js
// workers/qingge-media/test/index.test.mjs
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
  const response = await handleRequest(new Request("https://example.workers.dev/a.png", { method: "POST" }), { get() {} });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
});

test("returns 404 for a missing object", async () => {
  const response = await handleRequest(new Request("https://example.workers.dev/posts/a.png"), { async get() { return null; } });
  assert.equal(response.status, 404);
});

test("returns object metadata and immutable cache headers", async () => {
  const response = await handleRequest(new Request("https://example.workers.dev/posts/a.png"), { async get() { return object(); } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
  assert.equal(await response.text(), "image-bytes");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test workers/qingge-media/test/index.test.mjs`  
Expected: FAIL because `workers/qingge-media/src/index.mjs` does not exist.

- [ ] **Step 3: Implement the handler**

```js
// workers/qingge-media/src/index.mjs
function objectKey(request) {
  const key = decodeURIComponent(new URL(request.url).pathname).replace(/^\/+/, "");
  if (!key || key.split("/").includes("..")) return null;
  return key;
}

export async function handleRequest(request, media) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }
  const key = objectKey(request);
  if (!key) return new Response("Not Found", { status: 404 });
  const object = await media.get(key);
  if (!object) return new Response("Not Found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(request.method === "HEAD" ? null : object.body, { status: 200, headers });
}

export default {
  fetch(request, env) {
    return handleRequest(request, env.MEDIA);
  },
};
```

- [ ] **Step 4: Run the Worker tests**

Run: `node --test workers/qingge-media/test/index.test.mjs`  
Expected: PASS with three passing tests.

- [ ] **Step 5: Commit the Worker handler**

```bash
git add workers/qingge-media/src/index.mjs workers/qingge-media/test/index.test.mjs
git commit -m "feat(图片托管)：新增 R2 只读 Worker"
```

### Task 2: Bind the Worker to R2 without exposing credentials

**Files:**
- Create: `workers/qingge-media/wrangler.toml`

- [ ] **Step 1: Create the Wrangler configuration**

```toml
name = "qingge-media"
main = "src/index.mjs"
compatibility_date = "2026-07-27"
workers_dev = true

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "qingge-blog-assets"
```

- [ ] **Step 2: Create the Worker in Cloudflare Dashboard**

In Cloudflare, open `Workers & Pages` → `Create application` → `Create Worker`, name it `qingge-media`, and deploy the starter Worker. In the Worker settings, add an R2 binding named `MEDIA` that points to `qingge-blog-assets`. Enable the issued `workers.dev` address. Do not attach a custom route and do not change `hhq688.com` Nameservers.

- [ ] **Step 3: Deploy the reviewed source**

Run from `workers/qingge-media`: `pnpm dlx wrangler deploy`  
Expected: deployment output includes the exact `workers.dev` URL. Copy that complete URL exactly once into the local `MEDIA_WORKER_ORIGIN` environment variable used in Tasks 3–4; it is not committed to Git.

- [ ] **Step 4: Verify the public endpoint is safe before migration**

Run: `curl -i "$MEDIA_WORKER_ORIGIN/not-found.png"`  
Expected: `HTTP/2 404`.

Run: `curl -i -X POST "$MEDIA_WORKER_ORIGIN/not-found.png"`  
Expected: `HTTP/2 405` and `allow: GET, HEAD`.

- [ ] **Step 5: Commit the binding configuration**

```bash
git add workers/qingge-media/wrangler.toml
git commit -m "build(图片托管)：绑定 R2 媒体存储桶"
```

### Task 3: Build a verifiable migration and compression script

**Files:**
- Create: `scripts/media-migration.config.mjs`
- Create: `scripts/migrate-csdn-images.mjs`

- [ ] **Step 1: Define the migration configuration after Worker deployment**

```js
// scripts/media-migration.config.mjs
export const mediaMigrationConfig = {
  workerOrigin: process.env.MEDIA_WORKER_ORIGIN,
  bucket: "qingge-blog-assets",
  prefix: "posts",
  jpegQuality: 92,
  maxWidth: 0,
};
```

`MEDIA_WORKER_ORIGIN` must be the exact `https://...workers.dev` URL issued in Task 2. It is supplied only at run time and is never committed as a credential.

- [ ] **Step 2: Write a dry-run test fixture**

Create a fixture Markdown file containing one CSDN PNG URL and one non-CSDN image URL. The test must assert that dry-run output lists only the CSDN URL, writes no Markdown changes, and reports the proposed R2 key under `posts/`.

Run: `node --test scripts/test/migrate-csdn-images.test.mjs`  
Expected: FAIL until the migration script exists.

- [ ] **Step 3: Implement the migration safeguards**

Implement the script with these non-negotiable checks, in this order:

1. Match only Markdown URLs whose hostname is `i-blog.csdnimg.cn` or `img-blog.csdnimg.cn`.
2. Download with no blog `Referer`; reject non-2xx responses and non-image content types.
3. Decode each image with Sharp; retain its original width and height.
4. Encode PNG as lossless PNG and JPEG at quality `92`; retain the smaller valid result.
5. Upload with the exact image `Content-Type` to the deterministic key computed by `posts/${postStem}/${sha256.slice(0, 16)}.${extension}`.
6. Request the resulting Worker URL and require a 200 response and `image/*` content type before updating Markdown.
7. Write a JSON manifest containing source URL, destination key, source bytes, optimized bytes, dimensions, and final URL.
8. Default to `--dry-run`; only update Markdown when `--apply` is present.

- [ ] **Step 4: Run the fixture test and a repository dry run**

Run: `node --test scripts/test/migrate-csdn-images.test.mjs`  
Expected: PASS.

Run: `MEDIA_WORKER_ORIGIN="$MEDIA_WORKER_ORIGIN" node scripts/migrate-csdn-images.mjs --dry-run`  
Expected: a manifest preview, zero changed Markdown files, and no upload requests.

- [ ] **Step 5: Commit the migration tooling**

```bash
git add scripts/media-migration.config.mjs scripts/migrate-csdn-images.mjs scripts/test/migrate-csdn-images.test.mjs
git commit -m "feat(图片托管)：增加 CSDN 图片迁移工具"
```

### Task 4: Migrate images and update article links in verified batches

**Files:**
- Modify: `src/content/posts/*.md`
- Create: `docs/media-migration-manifest.json`
- Create: `docs/IMAGE-MIGRATION.md`

- [ ] **Step 1: Run one-article pilot migration**

Run: `MEDIA_WORKER_ORIGIN="$MEDIA_WORKER_ORIGIN" node scripts/migrate-csdn-images.mjs --apply --post '前端面试面试官纯前端如何实现录屏并保存视频到本地-134284892'`  
Expected: only that post's CSDN image URLs are replaced, each replacement has a verified Worker URL, and the manifest records every object.

- [ ] **Step 2: Build and inspect the pilot article**

Run: `pnpm build`  
Expected: Astro build completes and the built pilot article contains Worker URLs, with no image decoding errors.

- [ ] **Step 3: Migrate remaining verified batches**

Run: `MEDIA_WORKER_ORIGIN="$MEDIA_WORKER_ORIGIN" node scripts/migrate-csdn-images.mjs --apply`  
Expected: every successful object is verified before its Markdown URL changes; failed objects remain unchanged and are listed in the manifest.

- [ ] **Step 4: Verify no migrated post retains a CSDN source URL**

Run: `rg -n 'https://(?:i-|img-)blog\.csdnimg\.cn' src/content/posts`  
Expected: no output after all migration failures have been resolved or deliberately excluded.

- [ ] **Step 5: Document rollback and commit the content migration**

`docs/IMAGE-MIGRATION.md` must state that reverting a bad image requires restoring the corresponding Markdown URL from Git and optionally deleting its R2 object; it must also state that `hhq688.com` Nameservers remain unchanged.

```bash
git add src/content/posts docs/media-migration-manifest.json docs/IMAGE-MIGRATION.md
git commit -m "fix(文章图片)：迁移 CSDN 外链资源"
```

### Task 5: Deploy and verify production behavior

**Files:**
- Modify: none beyond Task 4.

- [ ] **Step 1: Push the reviewed branch and deploy through the existing Vercel `main` workflow**

Run: `git push origin codex/banner-poster-fallback` and merge the reviewed changes into `main` using the project release workflow.  
Expected: Vercel starts a new production deployment from `main`.

- [ ] **Step 2: Verify a migrated image over the production page**

Open the pilot article at `https://blog.hhq688.com/posts/前端面试面试官纯前端如何实现录屏并保存视频到本地-134284892/`.  
Expected: every migrated image has positive intrinsic dimensions and no failed network request.

- [ ] **Step 3: Verify DNS and billing safety**

Confirm `blog.hhq688.com` still resolves directly to Vercel and the Squarespace/Google MX records continue to resolve. In Cloudflare, confirm the Worker is on the Free plan, R2 uses Standard storage, and the low-threshold budget alerts remain enabled.

- [ ] **Step 4: Commit any deployment documentation correction**

```bash
git add docs
git commit -m "docs(部署)：记录图片托管验证结果"
```
