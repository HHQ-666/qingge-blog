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
