# 站点质量修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 404、排除管理页索引、优化 Markdown 图片加载、集中 R2 图片域名，并使测试、部署与 Vercel 配置一致。

**Architecture:** 一枚 rehype 插件只处理 Markdown AST 中的图片，因此不影响横幅、头像、封面和播放器。媒体主机名放入独立配置，未来可切换自定义域名。路由、sitemap、CI 和 Vercel 都沿用现有声明式机制。

**Tech Stack:** Astro 5、@astrojs/sitemap 3.6、unist-util-visit、Node built-in test runner、GitHub Actions、Vercel。

---

## File structure

- `src/config/media.mjs` — 唯一媒体域名与旧域名清单。
- `src/plugins/rehype-site-images.mjs` — 正文图片属性与域名重写。
- `scripts/test/rehype-site-images.test.mjs` — 转换器测试。
- `astro.config.mjs` — 注册转换器、sitemap 过滤。
- `src/pages/404.astro` — 站内未找到页。
- `.gitignore`、`package.json`、`.github/workflows/build.yml`、`vercel.json` — 工程和生产配置。
- `.github/workflows/deploy-pages.yml` — 删除，因为已停用 GitHub Pages。

### Task 1: 创建并测试 Markdown 图片转换器

**Files:**
- Create: `src/config/media.mjs`
- Create: `src/plugins/rehype-site-images.mjs`
- Create: `scripts/test/rehype-site-images.test.mjs`
- Modify: `astro.config.mjs:1-22, 116-149`

- [ ] **Step 1: 写会失败的图片 AST 测试**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { rehypeSiteImages } from "../../src/plugins/rehype-site-images.mjs";

function image(src, properties = {}) {
  return { type: "root", children: [{ type: "element", tagName: "img", properties: { src, ...properties }, children: [] }] };
}

test("重写旧 R2 主机且补全图片属性", () => {
  const tree = image("https://old.example.workers.dev/posts/a.png");
  rehypeSiteImages({ origin: "https://img.hhq688.com", legacyOrigins: ["https://old.example.workers.dev"] })(tree);
  assert.deepEqual(tree.children[0].properties, { src: "https://img.hhq688.com/posts/a.png", loading: "lazy", decoding: "async" });
});

test("保留显式属性和其他主机", () => {
  const tree = image("https://example.com/a.png", { loading: "eager", decoding: "sync" });
  rehypeSiteImages({ origin: "https://img.hhq688.com", legacyOrigins: ["https://old.example.workers.dev"] })(tree);
  assert.equal(tree.children[0].properties.loading, "eager");
  assert.equal(tree.children[0].properties.src, "https://example.com/a.png");
});
```

- [ ] **Step 2: 运行失败测试**

Run: `node --test scripts/test/rehype-site-images.test.mjs`

Expected: FAIL，找不到 `rehype-site-images.mjs`。

- [ ] **Step 3: 写入媒体配置和插件**

Create `src/config/media.mjs`:

```js
export const mediaConfig = {
  origin: "https://green-mouse-f903.heqing299-328.workers.dev",
  legacyOrigins: ["https://green-mouse-f903.heqing299-328.workers.dev"],
};
```

Create `src/plugins/rehype-site-images.mjs`:

```js
import { visit } from "unist-util-visit";

export function rehypeSiteImages({ origin, legacyOrigins }) {
  const targetOrigin = new URL(origin).origin;
  const knownOrigins = new Set(legacyOrigins.map((value) => new URL(value).origin));
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "img") return;
      const props = node.properties || (node.properties = {});
      if (typeof props.loading !== "string") props.loading = "lazy";
      if (typeof props.decoding !== "string") props.decoding = "async";
      if (typeof props.src !== "string") return;
      try {
        const source = new URL(props.src);
        if (knownOrigins.has(source.origin)) props.src = `${targetOrigin}${source.pathname}${source.search}${source.hash}`;
      } catch {}
    });
  };
}
```

Import both modules in `astro.config.mjs`, then add `rehypeSiteImages(mediaConfig)` after `rehypeComponents` in the `rehypePlugins` array.

- [ ] **Step 4: 验证并提交**

Run: `node --test scripts/test/rehype-site-images.test.mjs && pnpm build && rg -o '<img\\b[^>]*>' dist/posts | rg -vc 'loading="lazy"|loading="eager"'`

Expected: 测试和构建通过，正文中未声明 loading 的图片数量降低；当前域名不改变，因为初始 origin 等于旧域名。

```bash
git add astro.config.mjs src/config/media.mjs src/plugins/rehype-site-images.mjs scripts/test/rehype-site-images.test.mjs
git commit -m "feat: 优化正文图片加载与媒体域名配置"
```

### Task 2: 新增 404 并排除管理页 sitemap

**Files:**
- Create: `src/pages/404.astro`
- Modify: `astro.config.mjs:104`

- [ ] **Step 1: 使用当前 sitemap API 添加过滤**

Replace `sitemap()` with:

```js
sitemap({
  filter(page) {
    return new URL(page).pathname !== "/admin/";
  },
}),
```

The local `@astrojs/sitemap` 3.6 type definition declares `filter(page: string): boolean`.

- [ ] **Step 2: 创建博客风格的静态 404**

```astro
---
import { Icon } from "astro-icon/components";
import MainGridLayout from "@layouts/MainGridLayout.astro";
import { url } from "../utils/url-utils";
---
<MainGridLayout title="页面未找到" description="你访问的页面不存在或已移动。">
  <section class="card-base w-full rounded-[var(--radius-large)] px-6 py-14 text-center md:px-10">
    <p class="text-sm font-semibold text-[var(--primary)]">404</p>
    <h1 class="mt-2 text-3xl font-bold text-90">这里暂时没有内容</h1>
    <p class="mx-auto mt-3 max-w-md text-75">链接可能已失效、地址输入有误，或文章已经移动。</p>
    <div class="mt-7 flex flex-wrap justify-center gap-3">
      <a class="btn-regular rounded-xl px-4 py-2" href={url("/")}><Icon name="material-symbols:home-rounded" /> 返回首页</a>
      <a class="btn-plain rounded-xl px-4 py-2" href={url("/archive/")}><Icon name="material-symbols:library-books-rounded" /> 浏览归档</a>
    </div>
  </section>
</MainGridLayout>
```

- [ ] **Step 3: 验证构建产物并提交**

Run: `pnpm build && test -f dist/404.html && ! rg -q '<loc>https://blog.hhq688.com/admin/</loc>' dist/sitemap-*.xml`

Expected: 404 输出存在，sitemap 不包含 `/admin/`。

```bash
git add astro.config.mjs src/pages/404.astro
git commit -m "fix: 增加站内 404 并排除管理页索引"
```

### Task 3: 对齐忽略规则、测试、部署和响应头

**Files:**
- Modify: `.gitignore`
- Modify: `package.json:scripts`
- Modify: `.github/workflows/build.yml`
- Delete: `.github/workflows/deploy-pages.yml`
- Modify: `vercel.json`

- [ ] **Step 1: 添加本地忽略与统一测试脚本**

Append to `.gitignore`:

```gitignore
# local build and inspection artifacts
.pnpm-store/
.tmp-screens/
```

Add to package scripts:

```json
"test": "node --test scripts/test/*.test.mjs workers/qingge-media/test/*.test.mjs"
```

- [ ] **Step 2: 本地先运行所有 Node 测试**

Run: `pnpm test`

Expected: R2、Twikoo、播放模式、图片转换器测试都通过。

- [ ] **Step 3: 在 CI 的 Astro 检查后加入测试步骤**

Add to `.github/workflows/build.yml` after `Run Astro Check`:

```yaml
      - name: Run unit tests
        run: pnpm test
```

- [ ] **Step 4: 删除停用的 Pages workflow，并设置 Vercel 头**

Delete `.github/workflows/deploy-pages.yml`. Replace `vercel.json` with:

```json
{
  "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
    ]
  }]
}
```

Do not add CSP in this release because current Twikoo, Meting, Hitokoto, Busuanzi, and jsDelivr origins have not received an allow-list compatibility audit.

- [ ] **Step 5: 完整验证并提交**

Run: `pnpm test && pnpm astro check && pnpm build && git status --short`

Expected: 全部通过；`.pnpm-store/` 与 `.tmp-screens/` 不再显示为未跟踪文件。

```bash
git add .gitignore package.json .github/workflows/build.yml .github/workflows/deploy-pages.yml vercel.json
git commit -m "chore: 对齐站点测试部署与安全配置"
```

### Task 4: 发布后的冒烟验证

**Files:**
- Verify only: 本计划所有修改和 `docs/IMAGE-MIGRATION.md`

- [ ] **Step 1: 审查不含凭据或临时文件**

Run: `git status --short && git log --oneline --decorate -8 && git show --stat --oneline HEAD~5..HEAD`

Expected: `.env`、R2 凭据、`.pnpm-store/`、`.tmp-screens/` 没有被提交。

- [ ] **Step 2: 部署后验证**

检查首页、含迁移图片的文章、无效地址、`sitemap-index.xml`、`robots.txt`；在网络面板确认正文图片属性和四个 Vercel 响应头。

Expected: 图片、评论、电台正常；sitemap 没有 `/admin/`；404 使用博客布局。

- [ ] **Step 3: 记录后续自定义图片域名的唯一改动点**

Cloudflare 添加 `img.hhq688.com` 后，只修改 `mediaConfig.origin`，保留 workers.dev 在 `legacyOrigins`，运行 `pnpm test && pnpm build` 后部署；不修改文章 Markdown。
