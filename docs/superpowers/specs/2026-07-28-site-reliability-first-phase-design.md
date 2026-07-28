# 站点可靠性与体验修复（第一期）设计

**日期：** 2026-07-28  
**状态：** 已确认，待实现

## 背景与边界

本设计扩展 `2026-07-27-comment-home-music-fixes-design.md`，覆盖已验证的可靠性、SEO、性能与部署问题。第二期的标签/分类独立页、文章封面、每篇独立 OG 图、相关文章和视频省流策略不在本次实现范围内。

工作区已有其他 AI 留下的未提交改动：

- `src/components/HomeHero.astro`：桌面端隐藏首页横幅一言，移动端打字速度改为 72ms；
- `src/components/fun/PageLoader.astro`：消除 Astro 类型检查中的可空元素问题；
- `scripts/probe-songs.mjs`：按真实 Meting 搜索结果探测可播放歌曲。

本次会保留、审查并在通过验证后纳入提交，不覆盖或丢弃它们。

## 已验证现状

- `pnpm astro check` 当前为 0 个错误、7 个提示；截图中的 PageLoader 类型错误已由本地未提交改动消除。
- `pnpm build` 通过；已有 R2 迁移与 Worker 测试均通过，但没有统一的 `pnpm test` 命令，CI 也未运行它们。
- `/admin/` 虽有 `noindex`，仍被 `@astrojs/sitemap` 写入 sitemap。
- 没有生成 404 页面。
- 构建产物中 297 个 `img` 标签里有 212 个没有 loading 属性；文章正文 Markdown 图片是主要来源。
- 迁移后的文章直接引用具体 `workers.dev` 主机名，变更图片域名时需要修改文章源文件。
- `.pnpm-store/` 与 `.tmp-screens/` 未被 Git 忽略。
- `vercel.json` 为空，未设置站点安全响应头。
- `deploy-pages.yml` 会在 push 到 main 时部署 GitHub Pages；用户明确确认不再使用 GitHub Pages，实际生产为 Vercel。

## 第一部分：已有体验问题

### 首页一言与页面加载器

保留现有 HomeHero 和 PageLoader 改动，并通过检查和构建验证：

- 宽度大于等于 640px 时，首页横幅一言显式隐藏，桌面端仅显示侧栏 Hitokoto；
- 移动端打字机使用 72ms 间隔，且减少动态效果时直接显示完整文本；
- PageLoader 的元素只在已判空后传入初始化函数，`astro check` 不再产生类型错误。

### 评论区

Twikoo 改为共享的脚本加载 Promise 和可重入挂载逻辑：

- 同一会话中只添加一次外部脚本；
- 页面路由切换时仅挂载当前宿主，较早的异步结果不得覆盖后进入页面；
- 主题切换不清空评论区或再次调用初始化；
- 加载阶段使用居中状态；头像图片设置稳定的尺寸上限与 `object-fit`，防止资源延迟时异常拉伸。

### 电台

曲库采用配置维护的精选方案：

- 保留现有代表曲，每位歌手只保留一首；
- 使用现有探测脚本验证候选歌曲的搜索结果和音源；从通过验证的候选中添加约 12 首 80/90 年代华语经典歌曲；
- 新增曲目写入配置前必须可播放；曲库 ID 指纹变化自动失效旧缓存；
- 播放器增加顺序、随机、单曲循环三种模式，并将选择保存到浏览器本地存储；自动切歌、上一首、下一首和迷你播放入口使用同一模式状态。

## 第二部分：内容、SEO 与性能

### 路由与站点地图

- 新增项目风格的 `404.astro`，提供返回首页和归档页的入口；
- 为 sitemap 集成配置过滤规则，排除 `/admin/`；保留页面自身 `noindex, nofollow`。

### 文章图片

新增一个只处理 Markdown 内容图片的 rehype 转换：

- 没有显式 loading 属性的正文图片增加 `loading="lazy"` 与 `decoding="async"`；
- 不改动首屏横幅、文章封面、头像和播放器封面等组件图片；
- 已显式指定的属性不覆盖。

迁移图片的访问地址抽为配置项。构建时转换已迁移 Markdown 图片的主机名，而文章源文件中的对象路径保持不变；初始值仍是当前可用的 `workers.dev` 地址。以后用户在 Cloudflare 为 Worker 添加例如 `img.hhq688.com` 的自定义域名时，只改该配置并重新部署，无需逐篇改 Markdown。

## 第三部分：工程与安全

- `.gitignore` 添加 `.pnpm-store/` 和 `.tmp-screens/`；
- `package.json` 添加 `pnpm test`，运行现有 Node 测试；GitHub Actions 的校验工作流在 Astro 检查后运行测试；
- 删除不再使用的 GitHub Pages 部署工作流；
- 在 `vercel.json` 配置低风险响应头：`X-Content-Type-Options: nosniff`、`X-Frame-Options: SAMEORIGIN`、`Referrer-Policy: strict-origin-when-cross-origin` 和限制性 `Permissions-Policy`；
- 本期不启用 Content-Security-Policy，避免破坏 Twikoo、Meting、Hitokoto 等现有外部服务。

## 验收标准

- `pnpm astro check`、`pnpm test`、`pnpm build` 均通过；CI 会运行检查与测试。
- 移动端首次进入文章页及路由切换后，评论区不出现放大头像、重复表单或错位加载状态；主题切换不清空正在输入的内容。
- 桌面端首页横幅不显示一言，移动端一言速度变慢；页面加载器无类型错误。
- 电台曲库中每位歌手至多一首；三种模式均正确自动续播，刷新后保持模式。
- 未找到的地址显示站内 404；sitemap 不含 `/admin/`。
- 正文 Markdown 图片默认延迟加载且异步解码，首屏组件图片行为不变。
- 图片主机名通过单一配置切换；当前图片仍可访问。
- 本地缓存目录不再显示为待跟踪文件；GitHub Pages 不再自动部署；Vercel 返回约定的安全响应头。

## 非目标

- 不变更评论数据或 Twikoo 服务端。
- 不删除或更换 R2 中的图片对象。
- 不修改用户 Cloudflare DNS；自定义图片域名仅在用户后续明确配置时启用。
- 不实现第二期的内容产品功能。
