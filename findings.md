# 后台排序与封面发现
* `src/content/posts/` 内有 35 篇 Markdown 文章，均未设置 `image` Frontmatter 字段。
* `src/components/PostCard.astro` 已支持有封面时的前台展示，无需更改组件。
* `src/utils/content-utils.ts` 已按 `published` 日期倒序提供前台文章列表。
* Sveltia CMS 支持 collection 级 `sortable_fields`。对象格式可指定 `fields`，以及 `default.field` 和 `default.direction`；字段名必须与 Frontmatter 对应。
* 分类封面可复用到 Vue、JavaScript、CSS、工程化、音视频、面试和综合学习文章。
* 用户已在桌面生成并提供 14 张统一风格、带分类文字的 16:9 PNG：frontend-general、vue、react、javascript-typescript、css-ui、node-backend、data-devops、mobile-media、ai-llm、tools-projects、learning-notes、interview-career、thoughts、diary-life。
