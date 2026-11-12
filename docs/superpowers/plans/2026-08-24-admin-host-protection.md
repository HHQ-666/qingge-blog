# 后台主机白名单与凭据收敛 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** Protect the static `/admin/*` surface by Vercel host allowlisting, remove the public front-end password/token flow, and harden the admin and media responses without changing Squarespace DNS.

**Architecture:** A root Vercel Routing Middleware runs on the full path set so encoded separators are normalized before the `/admin` decision, then returns a cacheless 404 for hosts outside `ADMIN_ALLOWED_HOSTS`; public paths exit immediately and allowed admin requests continue to Astro’s generated static page. The Astro admin page becomes a small native Sveltia shell with a pinned, SRI-checked entry script and cleanup for legacy credential keys. Vercel headers apply an admin-only CSP/no-store policy, while the existing R2 Worker remains read-only with explicit source tests.

**Tech Stack:** Astro 5 static output, Vercel Routing Middleware (`middleware.js`), Sveltia CMS 0.197.0, Vercel `vercel.json`, Node built-in test runner, Cloudflare Worker module tests.

---

### Task 1: Add and implement the Vercel admin host middleware

**Files:**
- Create: `middleware.js`
- Create: `scripts/test/admin-host-middleware.test.mjs`

- [x] **Step 1: Write failing middleware tests**

Create a test helper that calls the default export with `Request` objects and assert:

```js
test("allows the production admin host", () => {
  const response = middleware(new Request("https://blog.hhq688.com/admin/"));
  assert.equal(response, undefined);
});

test("rejects an unapproved deployment host", async () => {
  const response = middleware(new Request("https://qingge-cabana.vercel.app/admin/"));
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("does not inspect public routes", () => {
  const response = middleware(new Request("https://evil.example/"));
  assert.equal(response, undefined);
});
```

Also cover `localhost:4321`, case-insensitive host matching, `/admin/config.yml`, and a near-miss path such as `/administrator/`.

- [x] **Step 2: Run the focused test and verify it fails**

Run: `node --test scripts/test/admin-host-middleware.test.mjs`

Expected: FAIL because `middleware.js` does not exist.

- [x] **Step 3: Implement the smallest host allowlist**

Create `middleware.js` with no framework imports. Use a full `/:path*` matcher and keep the early public-path return so Vercel checks encoded admin variants before normalizing them:

```js
const DEFAULT_HOSTS = ["blog.hhq688.com"];
const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

function configuredHosts() {
  const raw =
    typeof process !== "undefined" && process.env
      ? process.env.ADMIN_ALLOWED_HOSTS
      : "";
  const hosts = String(raw || "")
    .split(",")
    .map((host) => host.trim().toLowerCase().replace(/\.$/, ""))
    .filter(Boolean);
  return new Set([...DEFAULT_HOSTS, ...LOCAL_HOSTS, ...hosts]);
}

function isAdminPath(pathname) {
  let normalized = pathname;
  try { normalized = decodeURIComponent(pathname); } catch {}
  normalized = normalized.replaceAll("\\", "/").replace(/^\/{2,}/, "/");
  return normalized === "/admin" || normalized.startsWith("/admin/");
}

export default function adminHostMiddleware(request) {
  const url = new URL(request.url);
  if (!isAdminPath(url.pathname)) return undefined;
  if (configuredHosts().has(url.hostname.toLowerCase())) return undefined;
  return new Response("Not Found", {
    status: 404,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "x-content-type-options": "nosniff",
    },
  });
}

export const config = { matcher: "/:path*" };
```

- [x] **Step 4: Run the focused test and verify it passes**

Run: `node --test scripts/test/admin-host-middleware.test.mjs`

Expected: all middleware assertions pass.

### Task 2: Replace the custom admin gate with a native Sveltia shell

**Files:**
- Modify: `src/pages/admin/index.astro`
- Delete: `public/admin/index.html`
- Modify: `public/admin/config.yml`
- Create: `scripts/test/admin-security-surface.test.mjs`

- [x] **Step 1: Add source-level regression assertions**

Test that the Astro page contains the pinned URL and SRI value, removes `gateSecret`, `AUTHOR_GATE_SECRET`, and custom GitHub API calls, and includes cleanup for both legacy keys. Assert `public/admin/index.html` is absent.

- [x] **Step 2: Replace the page with a minimal shell**

Keep `export const prerender = true`, the existing admin-only global layout rules, and an accessible loading status. Remove the password form, boot timers, custom `fetch("https://api.github.com/…")`, collaborator patch, and all token input handling. Load:

```html
<script
  src="https://unpkg.com/@sveltia/cms@0.197.0/dist/sveltia-cms.js"
  integrity="sha384-oPYfvGglsneWy8+BWzIWj0CGxssuTW3PwZcQuPVdYKw7ajNDXKp3DTPxLj3sdg9V"
  crossorigin="anonymous"
  defer
></script>
```

Before Sveltia starts, remove `qingge-admin-gh-token`, `sveltia-cms.user`, `decap-cms-user`, `netlify-cms-user`, and `sveltia-cms.auth` from both `localStorage` and `sessionStorage`; register `pagehide` and `beforeunload` handlers that repeat the removal. Do not log or transmit the values. Keep the `/admin/config.yml` discovery path and a clear message that GitHub authentication is handled by Sveltia.

- [x] **Step 3: Remove the static duplicate and update CMS comments**

Delete `public/admin/index.html` with `apply_patch`. Keep `public/admin/config.yml`, set `local_backend: false` and `auth_methods: [token]` for the deployed CMS, and update comments to say that host filtering is performed by Vercel and the current Sveltia flow uses a fine-grained GitHub token.

- [x] **Step 4: Run focused admin tests**

Run: `node --test scripts/test/admin-security-surface.test.mjs scripts/test/admin-style-isolation.test.mjs scripts/test/admin-content-covers.test.mjs`

Expected: all assertions pass and no source references the removed gate.

### Task 3: Remove public password-bearing entry points

**Files:**
- Modify: `src/config.ts`
- Modify: `src/components/HomeHero.astro`
- Modify: `src/components/Navbar.astro`
- Modify: `README.md`
- Modify: `docs/DEPLOY.md`

- [x] **Step 1: Remove the `authorGate` export and its imports**

Delete the `authorGate` object from `src/config.ts`; remove `data-author-secret`, `data-admin-path`, the five-tap handler, `qingge-author` localStorage logic, and the hidden navbar write icon. Keep the cottage icon as a non-interactive visual element and document the direct `/admin/` URL.

- [x] **Step 2: Add regression assertions for public output**

Extend `admin-security-surface.test.mjs` to read the three public source files and assert they do not contain `authorGate`, `data-author-secret`, `qingge-author`, `AUTHOR_GATE_SECRET`, or `qingge666`.

- [x] **Step 3: Update operator documentation**

Replace instructions that say to enter a site password or save a token in local storage with: open `/admin/` on an approved host, use Sveltia’s native GitHub login/access-token screen, set `ADMIN_ALLOWED_HOSTS` in Vercel, and revoke old PATs. Keep the DNS/Squarespace statement unchanged.

- [x] **Step 4: Run source regression tests**

Run: `node --test scripts/test/admin-security-surface.test.mjs`

Expected: no public source contains a password-bearing entry point.

### Task 4: Add admin-only Vercel security headers

**Files:**
- Modify: `vercel.json`

- [x] **Step 1: Add schema and route-specific headers**

Keep the existing global `nosniff`, `SAMEORIGIN`, referrer, and permissions headers. Add an `/admin/:path*` header rule with:

```json
{
  "key": "Cache-Control",
  "value": "no-store"
}
```

plus `X-Robots-Tag: noindex, nofollow, noarchive`, `Content-Security-Policy` allowing only `'self'`, the pinned `https://unpkg.com` Sveltia modules, `https://api.github.com`, `https://github.com`, `https://avatars.githubusercontent.com`, `data:` images, and inline styles required by the static shell; set `frame-ancestors 'none'`, `base-uri 'none'`, and `form-action 'self'`.

- [x] **Step 2: Add a JSON/source test**

Assert `vercel.json` parses, the global headers remain, and the admin rule contains `no-store`, `X-Robots-Tag`, and the CSP directives.

- [x] **Step 3: Run the header test**

Run: `node --test scripts/test/admin-security-surface.test.mjs`

Expected: the Vercel configuration assertions pass.

### Task 5: Complete Worker origin coverage

**Files:**
- Modify: `workers/qingge-media/src/index.mjs`
- Modify: `workers/qingge-media/test/index.test.mjs`

- [x] **Step 1: Add failing allow/deny tests**

Use a known existing object stub and assert an `Origin: https://blog.hhq688.com` request returns `200`, `Origin: https://evil.example` returns `403`, a matching `Referer` returns `200`, and a request without either header still returns `200`.

- [x] **Step 2: Normalize host matching without broadening it**

Keep the current `ALLOWED_HOSTS` list, use `new URL(...).hostname.toLowerCase()`, and accept only exact hosts or subdomains of an allowed host. Keep malformed origins rejected and preserve the current method/path checks.

- [x] **Step 3: Run Worker tests**

Run: `node --test workers/qingge-media/test/index.test.mjs`

Expected: all existing and new Worker assertions pass.

### Task 6: Full verification and deployment handoff

**Files:**
- Modify: `task_plan.md`
- Modify: `progress.md`

- [x] **Step 1: Run the complete local gate**

Run:

```bash
pnpm check
pnpm test
pnpm build
git diff --check
```

Expected: no Astro errors, all Node/Worker tests pass, build emits `dist/admin/index.html`, and `git diff --check` is clean.

- [x] **Step 2: Inspect the built security surface**

Run:

```bash
! rg -n 'qingge666|AUTHOR_GATE_SECRET|data-author-secret|authorGate|qingge-author' dist src public
test -f dist/admin/index.html
```

Expected: the first command finds no matches and the second succeeds.

- [x] **Step 3: Record results and operator steps**

Append the changed files, test counts, and the required Vercel `ADMIN_ALLOWED_HOSTS` environment variable plus PAT revocation to `progress.md`; mark this security phase complete in `task_plan.md` without changing the earlier completed phases.
