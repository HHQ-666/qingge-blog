# 后台排序与文章封面任务

**目标：** 让写作台默认按发布时间倒序展示文章，并为全部现有文章补齐可在前台展示的通用主题封面。

## 阶段

* [complete] 1. 核对文章元数据、Sveltia 排序语法和可用图像生成能力。
* [complete] 2. 生成并检查通用分类封面资产。
* [complete] 3. 配置后台发布时间排序，并按分类回填 35 篇文章的封面字段。
* [complete] 4. 运行目标测试、Astro 诊断和生产构建验证。
* [complete] 5. 导入用户提供的 14 张分类 PNG，替换现有文章的临时 SVG 封面并验证展示。

## 约束

* 后台排序使用文章 Frontmatter 的 `published` 字段，默认降序。
* 封面放在 `public/media/uploads/covers/`，文章引用以 `/media/uploads/covers/` 开头。
* 不修改文章正文、标题、日期或分类。

## 已知错误

* `infsh` 未安装，需采用可用的图像生成途径或安装后认证。
* `npx @inference-sh/cli --version` 返回 npm 404；该包名不可用，下一步读取官方安装命令，避免重试同一方式。
* 正确 CLI 为 `npx @inferencesh/belt`，但默认 npm 缓存含 root 所有文件导致 `EPERM`；下一步使用会话临时缓存，不使用 sudo 或改动用户目录权限。
* 临时安装脚本的首次执行未生成二进制文件：`INSTALL_DIR=... curl | bash` 仅将变量传给 curl，未传给 bash。下一步需先 `export INSTALL_DIR` 再执行脚本。
* 即使导出 `INSTALL_DIR`，belt CLI 临时安装仍未留下二进制文件；已停止继续该路径，并以仓库内 SVG 作为稳定、无文字乱码的通用封面资产。

---

# Live2D 宠物模型替换任务

**目标：** 使用 Live2D 官方的 Hiyori Momose 与 Haru 接待员版，替换当前两个问题宠物；保持宠物面板、启动流程和网页加载稳定。

## 阶段

* [complete] 1. 核对当前宠物加载链、模型格式、已有测试与启动错误。
* [complete] 2. 获取并验证官方 Hiyori/Haru 运行包及许可文件。
* [complete] 3. 将两个旧宠物从 manifest 中替换为新模型，补齐头像与动作映射。
* [complete] 4. 运行模型清单测试、Astro 检查、生产构建与浏览器验证。
* [complete] 5. 请求代码审查并处理阻断问题。

## 约束

* 只替换用户确认的 Hiyori Momose 与 Haru 接待员版，不把 Parameter Controller 或 Hiyori 视频演示包当作宠物模型。
* 保留现有未被 manifest 引用的旧模型文件，待新模型验证通过后再决定是否清理，避免不可逆回退。
* 不修改与宠物替换无关的页面、文章和样式代码。
* 当前工作树已有其他任务的未相关修改，本次不覆盖、不清理，也不代为提交；新增模型资源保持在项目目录中供当前工作树直接使用。

## 已知错误

* 用户此前反馈 PetCompanion 未出现、控制台有 hydration/effect_orphan 和动态模块 504；本次必须以当前测试与浏览器证据确认是否仍存在，不能假定已修复。

## 阶段 1 结论

* `l2d-widget@0.1.1` 的类型明确支持 `.model.json` 与 `.model3.json`，运行时会按配置自动区分 Cubism 2 与新版模型。
* `PetCompanion.svelte` 通过 manifest 的 `model` 字段传给 `createWidget`，并通过 `getMotions()`、`playMotionByFile` 读取模型动作；因此新模型应直接使用官方 runtime 的 `.model3.json`，动作映射应引用该文件声明的动作。
* 现有测试把 `wanko`、`nito`、`koharu`、`haru` 当作本地旧模型，替换后测试需要同步到新的清单和资源图谱，而不是继续断言已移除的宠物。

---

# 后台主机白名单与凭据收敛任务

**目标：** 在不迁移 Squarespace DNS 的前提下，用 Vercel Routing Middleware 限制 `/admin/*` 的主机来源，移除公开前端口令，并收敛后台凭据持久化。

## 阶段

* [complete] 1. 增加 Vercel 后台主机白名单 Middleware 与测试。
* [complete] 2. 替换自定义后台门禁为原生 Sveltia 壳并删除静态副本。
* [complete] 3. 移除首页/导航公开口令入口并更新运维文档。
* [complete] 4. 增加后台专用 Vercel 安全响应头。
* [complete] 5. 完善媒体 Worker 来源白名单测试。
* [complete] 6. 完成全量检查、构建和部署交接说明。

## 约束

* DNS 继续由 Squarespace 管理，不引入 Cloudflare Access 或 Nameserver 迁移。
* 不覆盖工作树中已有的宠物、文章、音乐和样式改动。
* 主机白名单是路由边界，不替代 GitHub 身份认证；Vercel `ADMIN_ALLOWED_HOSTS` 只保存主机名列表，不保存凭据。

## 错误记录

* `pnpm type-check` 仍被仓库既有的 `--isolatedDeclarations` 类型错误阻塞（`src/config.ts`、`src/constants/constants.ts`、`src/content/config.ts` 等多个旧文件）；本次 `pnpm check` 无 errors，未扩大范围修复。
* 本地 Playwright 未自带 Chromium，改用系统 Chrome headless 时进程异常退出；已用生产构建、静态产物扫描和 66 项自动化测试替代浏览器运行验证。
