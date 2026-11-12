# 执行记录

## 2026-07-29

* 已确认后台排序缺少 `published` 的可排序配置。
* 已确认全部 35 篇现有文章缺少封面字段。
* 已确认前台文章卡片可直接渲染 public 路径的封面图。
* 尝试通过 `npx @inference-sh/cli` 临时调用图像生成工具，但 npm 返回 404；尚未生成任何资产或修改文章。
* 已确认官方临时 CLI 命令是 `npx @inferencesh/belt`；默认 npm 缓存权限阻塞该命令，待改用 `$TMPDIR` 缓存。
* 审查官方安装脚本后确认支持 `INSTALL_DIR`。首次临时安装因管道环境变量作用域未传入脚本而未落盘，待以 export 方式重试。
* 已添加 5 张可复用 SVG 封面：Vue、JavaScript、CSS、前端网络、面试学习。
* 已将 `public/admin/config.yml` 设置为 `published`、`title`、`description` 可排序，默认 `published` 降序。
* 已运行 `scripts/assign-post-covers.mjs`，为全部 35 篇文章回填对应封面字段。
* `node --test scripts/test/admin-content-covers.test.mjs scripts/test/admin-style-isolation.test.mjs`：4 项通过。
* 浏览器预览确认首页 8 张文章卡片的封面均加载成功，实际渲染为 267x150；移动端截图布局正常。
* `ASTRO_TELEMETRY_DISABLED=1 npm run build` 成功：生成 44 个静态页面、5 张封面资产和 Pagefind 索引；无构建错误。
* 已加入一次性 `contents-view` IndexedDB 迁移，清除旧标题排序偏好，使已有浏览器下次进入后台也采用发布时间降序；随后保留用户后续的排序选择。
* 迁移后再次运行相关测试：5 项通过；最终 `ASTRO_TELEMETRY_DISABLED=1 npm run build` 成功。
* 已从用户桌面复制 14 张带分类文字的 PNG 到 `public/media/uploads/covers/`，统一尺寸为 1672x941。
* 已运行封面回填脚本，将全部 35 篇文章从临时 SVG 切换到分类 PNG；旧 SVG 引用数为 0。
* 相关测试 5 项通过，Astro 检查 0 errors，生产构建成功。浏览器确认首页卡片加载 PNG；Vue 文章详情页封面完整显示且文字清晰。

---

## 2026-08-10 — Live2D 宠物模型替换

* 用户确认选择 Hiyori Momose 与 Haru 接待员版。
* 已确认官方参数控制器示例和 Hiyori 视频版是动画演示数据，不作为宠物模型接入。
* 已读取当前 `public/pets/manifest.json`；待替换条目为 `wanko`、`nito`，旧模型资产暂不删除。
* 下一步：核对 OML2D 运行时对 Cubism 2/3 模型格式的支持，获取官方运行包并做最小加载验证。
* 已完成加载链核对：`l2d-widget@0.1.1` 支持 `.model3.json`，`PetCompanion.svelte` 可沿用现有 manifest 接口。
* 已从 Live2D 官方下载脚本确认 Hiyori 简体中文包和 Haru 接待员版日文包的精确下载地址；下一步下载到临时目录，检查压缩包结构和运行文件引用。
* 已下载并解压官方运行包：Hiyori 使用 `hiyori_free_t08.model3.json`，Haru 使用 `haru_greeter_t05.model3.json`；均包含完整 moc3、纹理、物理/姿态和动作文件。
* 已生成 160x160 WebP 头像 `hiyori.webp`、`haru-greeter.webp`，并为两个模型补充 `SOURCE.md` 与第三方来源说明。
* 已将 manifest 中的 `wanko`、`nito` 替换为 `hiyori`、`haru-greeter`，现有旧模型文件暂未删除。
* 第一次资源图谱测试失败：Cubism 3 可选 `Pose`/`UserData` 字段为空时未过滤，导致 `path.resolve` 收到 `undefined`；已在测试层过滤可选引用，第二次运行 4 项全部通过。
* 基线验证：宠物/启动画面相关测试 6 项全部通过；`astro check` 0 errors、0 warnings（3 hints）。
* `import('l2d-widget')` 在纯 Node 环境中因包初始化依赖 `document` 失败；这是浏览器运行时依赖，不作为项目页面错误，后续用实际浏览器验证。
* 本地开发服务器已在 `127.0.0.1:4321` 返回 200，项目当前处于启动状态。
* 浏览器验证：启动后宠物画布可见；右键面板显示 `Pio`、`静香`、`日和`、`Haru接待版`、`小春`、`Haru` 六个入口；Hiyori 与 Haru 接待员版均可切换，欢迎语出现，四个动作按钮可点击，状态条无错误。
* 浏览器调试过程中曾尝试不兼容的 MouseEvent/CUA 右键调用，最终改用 Playwright locator 的右键点击成功打开宠物面板；这不是页面运行时错误。
* 已将新模型显示比例从 `0.5` 调整为 `0.85`，浏览器中两个人物尺寸更接近原宠物且仍可见。
* 最终验证：`pnpm test` 47 项通过；`pnpm exec astro check` 0 errors、0 warnings、3 hints；`git diff --check` 通过；`pnpm run build` 成功生成 44 个页面和 Pagefind 索引。构建仅保留项目既有的 Browserslist、KaTeX 和大 chunk 提示。
* 已提交独立代码审查，待处理审查反馈后结束本任务。
* 独立审查结论：无 Critical；模型资源图和运行验证通过。审查提示当前工作树含其他任务未相关改动及未跟踪新资源，本次不覆盖、不清理、不代为提交；未引用的官方附带 `hiyori_free_t08_old.cdi3.json` 保留，不影响当前模型加载。

---

## 2026-08-24 — 后台主机白名单与凭据收敛

* 已从上一轮安全审计恢复范围：Squarespace DNS 保持不变，改做 Vercel 侧 `/admin/*` 主机白名单和后台凭据收敛。
* 已写入设计与执行计划：`docs/superpowers/specs/2026-08-24-admin-host-protection-design.md`、`docs/superpowers/plans/2026-08-24-admin-host-protection.md`。
* Task 1 已完成：新增根目录 Vercel Routing Middleware；默认允许 `blog.hhq688.com`、本地开发主机和 `ADMIN_ALLOWED_HOSTS` 配置的主机，其余 `/admin/*` 返回 `404` + `Cache-Control: no-store`。
* `node --test scripts/test/admin-host-middleware.test.mjs`：6 项通过。
* Task 2 已完成：`src/pages/admin/index.astro` 改为原生 Sveltia 壳，新增 `public/admin/bootstrap.js`，删除 `public/admin/index.html`，并把 `local_backend` 生产默认改为 false。
* Task 2/布局与内容排序回归测试：11 项通过。
* Task 3 已完成：移除 `authorGate`、首页五连点和导航隐藏写作图标；README 与 `docs/DEPLOY.md` 已改为 Vercel 主机白名单 + Sveltia 原生认证说明。
* Task 3 安全表面测试：6 项通过；`src/`、`public/`、部署文档中已无旧口令和 `data-author-secret` 引用。
* Task 4 已完成：`vercel.json` 增加 `$schema`、`/admin/:path*` 的 `no-store`/`X-Robots-Tag`/`DENY` 和后台 CSP；安全表面测试 7 项通过。
* Task 5 已完成：Worker 来源 hostname 显式规范化并覆盖生产 origin、允许子域/Referer、拒绝恶意或 malformed 来源、无来源直访；Worker 测试 8 项通过。
* 最终验证：`pnpm check` 0 errors / 3 个既有提示；`pnpm test` 67 项通过；`pnpm build` 成功生成 44 个页面和 Pagefind 索引；`git diff --check` 通过。
* 构建产物扫描确认 `dist/admin/index.html` 与 `dist/admin/bootstrap.js` 存在，旧口令/隐藏入口标记为 0；sitemap 仍排除 `/admin/`。
* `pnpm type-check` 未通过，报错均来自仓库既有 `isolatedDeclarations` 约束，未归因于本次安全改动。
* 尝试用系统 Chrome 做后台动态运行验证时 headless 进程异常退出；因此本次交付以静态构建、脚本/SRI 检查和自动化测试为依据，未声称完成真实浏览器登录验证。
* 最终静态检查：`middleware.js` 与 `public/admin/bootstrap.js` 语法通过；构建产物和源码中的旧口令/入口标记为 0，`dist/admin/index.html`、`dist/admin/bootstrap.js` 存在。
* 独立安全复核后补强：清理 Sveltia 兼容旧键（`decap-cms-user`、`netlify-cms-user`、`sveltia-cms.auth`），将 `auth_methods` 限定为 `token`，CSP 放行 Sveltia 所需的 jsDelivr/font/blob/frame/worker 来源，并把 middleware matcher 扩为 `/:path*` 以覆盖编码路径变体。
* Worker 维持“无来源直访放行”的兼容策略，并新增 `Vary: Origin, Referer`；已在 `docs/IMAGE-MIGRATION.md` 明确这只是弱防盗链提示，不是私密资源认证。
* 最终复核后将后台 `auth_methods` 固定为 token-only，补充 CSP 的 blob/font/worker/status 来源，并用全路径 matcher 覆盖编码的 `/admin` 变体；后台与 Worker 定向回归共 22 项通过。
* 2026-08-25 Chrome 兼容性修复：Chrome 扩展会向 `body` 注入额外直属 `div`，旧的后台布局规则误把它撑成整屏，导致 Sveltia 主界面被推到视口下方。已删除宽泛的 `body.admin-page > div...` 选择器，仅保留 `#nc-root` / `.sui.app-shell`；Chrome 实际 DOM 验证显示 Sveltia 主界面回到 `y=0`，17 项后台回归测试和 `astro check` 通过。
