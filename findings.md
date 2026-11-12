# 后台排序与封面发现
* `src/content/posts/` 内有 35 篇 Markdown 文章，均未设置 `image` Frontmatter 字段。
* `src/components/PostCard.astro` 已支持有封面时的前台展示，无需更改组件。
* `src/utils/content-utils.ts` 已按 `published` 日期倒序提供前台文章列表。
* Sveltia CMS 支持 collection 级 `sortable_fields`。对象格式可指定 `fields`，以及 `default.field` 和 `default.direction`；字段名必须与 Frontmatter 对应。
* 分类封面可复用到 Vue、JavaScript、CSS、工程化、音视频、面试和综合学习文章。
* 用户已在桌面生成并提供 14 张统一风格、带分类文字的 16:9 PNG：frontend-general、vue、react、javascript-typescript、css-ui、node-backend、data-devops、mobile-media、ai-llm、tools-projects、learning-notes、interview-career、thoughts、diary-life。

---

# Live2D 宠物模型替换发现

* 用户确认使用 Hiyori Momose 与 Haru 接待员版替换两个问题宠物。
* Live2D 官方样例库将 Hiyori 与 Haru 标记为可用于 avatars / game apps，并提供 runtime folder；页面列出 `.moc3`、`.model3.json`、动作、物理和姿态文件。
* “Sample for Parameter Controller”页面只有动画示例数据（`.cmo3`、`.can3`和背景图），不适合作为网页宠物运行模型。
* “Hiyori Momose (video version)”同样是动画示例，页面数据结构不是可直接嵌入的 runtime folder，因此不单独加入宠物清单。
* 当前 `public/pets/manifest.json` 有 6 个条目；两个待替换的本地宠物是 `wanko` 和 `nito`，现有 `koharu` 与 `haru` 也已在本地 manifest 中。
* 当前本地 Haru 使用 Cubism 2 风格的 `.model.json` / `.moc`；官方新版下载页描述的是 Cubism 3 runtime 的 `.model3.json` / `.moc3`，必须先确认 `PetCompanion` / OML2D 对两种格式的实际支持，再决定是否复用已有 Haru 或引入官方接待员版。
* `l2d-widget@0.1.1` 的 `ModelOptions` 注释和加载实现确认支持 `.model.json` 与 `.model3.json`；新版模型走 Cubism 6 runtime 分支（包内命名如此），可由当前组件直接加载。
* Live2D 官方下载脚本给出可验证的包地址：`https://cubism.live2d.com/sample-data/bin/hiyori/hiyori_zh-Hans.zip` 与 `https://cubism.live2d.com/sample-data/bin/haru_greeter/haru_greeter_ja.zip`。
* Hiyori 页面支持简体中文包；Haru 接待员版官方页面只列出日文包，因此 Haru 的动作/配置文件名可能保留日文命名，需要接入时按实际 runtime 文件核对。
* 当前 PetCompanion 的 manifest 传递、预加载和动作读取链条不要求 `.model.json` 专属字段；只要官方 `.model3.json` 引用图像、动作和物理文件的相对路径完整即可。
