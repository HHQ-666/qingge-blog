# 后台主机白名单与凭据收敛设计

**日期：** 2026-08-24  
**状态：** 已实现并通过本地验证

## 背景与目标

当前站点是静态 Astro 项目，生产域名 `blog.hhq688.com` 的 DNS 由 Squarespace 管理，不能依赖 Cloudflare Access 拦截 `/admin/`。旧写作台把口令编译到公开 HTML，并由站点脚本把 GitHub Token 写入浏览器持久存储；`public/admin/index.html` 还保留了一份容易漂移的静态副本。

本期目标是在不迁移 DNS、不切换整站 SSR 的前提下：

1. 在 Vercel 请求进入静态资源前，对 `/admin/*` 做主机名白名单检查。
2. 删除前端口令和首页隐藏解锁入口，让 Sveltia 自己负责 GitHub 登录界面。
3. 不再由本站写入 GitHub Token；进入后台时清理旧凭据，离开页面时再次清理已知凭据键。
4. 固定 Sveltia CMS 版本并校验初始脚本完整性，为后台单独设置 CSP、`no-store` 和 `noindex` 响应头。
5. 保留 R2 Worker 的只读媒体服务，并用单元测试覆盖来源白名单和路径边界。

## 非目标与限制

- 不修改 `hhq688.com` 的 Nameserver、Squarespace 记录或 Cloudflare 账户。
- 不把整站切换到 Astro Hybrid/SSR，不新增数据库、OAuth 服务或会话存储。
- 主机白名单是路由边界，不是用户身份认证；GitHub 仓库权限仍由 GitHub/Sveltia 控制。若需要按邮箱或组织成员认证，后续需在 Vercel Deployment Protection 或 GitHub OAuth/App 中单独配置。
- Sveltia 运行时仍会调用其官方依赖的 GitHub API 和动态代码模块；本期只固定入口版本、限制后台 CSP，并不声称第三方依赖已完全自托管。若需要抵御 CDN/转依赖被篡改，后续必须把这些模块一并自托管并在构建时锁定。

## 方案与组件

### Vercel Routing Middleware

新增根目录 `middleware.js`，使用全路径 matcher 在 Vercel URL 规范化前介入，再只处理 `/admin`（公共路径立即返回）。它读取请求 URL 的 hostname，与 `ADMIN_ALLOWED_HOSTS`（逗号分隔，可在 Vercel 环境变量中配置）比较；未配置时使用安全默认值 `blog.hhq688.com`，本地开发额外允许 `localhost` 和 `127.0.0.1`。不匹配时返回无缓存的 404，不向访客透露后台是否存在。匹配时不改写请求，继续交给 Astro 生成的静态文件。

### 后台入口

`src/pages/admin/index.astro` 只保留后台壳、可访问性提示和固定版本的 Sveltia 脚本；配置中的 `auth_methods: [token]` 明确关闭当前未配置的 OAuth 按钮。不再接收或比较口令，不再自定义 GitHub API 预检，也不再写入 Token。页面启动时删除 `qingge-admin-gh-token`、`sveltia-cms.user`、`decap-cms-user`、`netlify-cms-user` 和 `sveltia-cms.auth` 这些已知键，`pagehide`/`beforeunload` 时再次删除，避免旧版本留下的 PAT 跨会话残留；Sveltia 运行期间的内部存储由 Sveltia 自己管理。Sveltia 登录仍由其原生界面完成。

删除 `public/admin/index.html`，避免静态文件覆盖 Astro 页面；保留 `public/admin/config.yml` 作为 CMS 配置源。

### 公共页面入口

移除 `authorGate` 配置、首页小屋连点解锁逻辑、导航中的隐藏写作图标及其 `data-author-secret` 属性。作者直接打开受保护的 `/admin/` 地址；公共页面不再携带任何后台口令或入口密钥。

### Vercel 响应头

保留现有全站基础安全头，并为 `/admin/:path*` 增加：

- `Cache-Control: no-store`
- `X-Robots-Tag: noindex, nofollow, noarchive`
- 后台专用 CSP：默认拒绝，允许本站后台壳、固定的 `unpkg.com` Sveltia 模块、GitHub API、必要的图片/字体来源；禁止 frame 嵌入和表单提交到非本站。

### 媒体 Worker（弱防盗链提示）

保留现有 GET/HEAD-only、路径穿越防护、缓存和 `nosniff` 行为；来源白名单逻辑统一接受 `Origin` 或 `Referer` 的 hostname，并增加允许、拒绝、缺失来源和恶意路径测试。没有来源的直接访问继续放行，以兼容图片预览、爬虫和诊断请求，因此这层不能当作私密资源认证，R2 只放公开媒体。

## 数据流与错误处理

1. 请求 `/admin/...` 到达 Vercel Middleware。
2. 主机不在白名单：立即返回 `404`，并设置 `Cache-Control: no-store`。
3. 主机在白名单：继续读取 Astro 生成的后台文件；后台页加载固定 Sveltia 脚本。
4. Sveltia 原生登录失败时由其界面显示错误；本站不捕获、记录或上传 Token。
5. Worker 遇到非 GET/HEAD 返回 `405`，非法路径或缺失对象返回 `404`，来源不在白名单返回 `403`。

## 验收与测试

- `scripts/test/admin-host-middleware.test.mjs`：覆盖白名单 host、端口、大小写、非白名单 host、路径匹配和 404 响应头。
- `workers/qingge-media/test/index.test.mjs`：覆盖允许来源、拒绝来源、无来源直访和已有方法/路径断言。
- 后台源码测试：不存在 `gateSecret`、`AUTHOR_GATE_SECRET`、`data-author-secret`、`qingge-admin-gh-token` 写入调用和 `public/admin/index.html`；固定 Sveltia URL 与 SRI 值存在。
- `pnpm check`、`pnpm test`、`pnpm build`、`git diff --check` 全部通过。
- 构建产物检查：`dist/admin/index.html` 不包含口令字面量，且 `/admin/` 仍可由 Astro 生成。

## 上线后需要人工完成的事项

- 在 Vercel Production 环境设置 `ADMIN_ALLOWED_HOSTS=blog.hhq688.com`（如果以后新增后台自定义主机，再把它追加到同一变量）。
- 在 GitHub 撤销历史上曾粘贴到旧写作台的 PAT，并重新创建最小仓库范围、短有效期 Token；不要把 Token 写入仓库或聊天记录。
- 部署后分别用 `blog.hhq688.com/admin/` 和 Vercel 默认域名验证白名单结果；默认域名应返回 404，而主域名应显示 Sveltia 登录页。
