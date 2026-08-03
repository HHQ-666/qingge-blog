# 清哥的小屋

![Node.js >= 20](https://img.shields.io/badge/node.js-%3E%3D20-brightgreen)
![pnpm >= 9](https://img.shields.io/badge/pnpm-%3E%3D9-blue)
![Astro](https://img.shields.io/badge/Astro-5-orange)

个人静态博客 · 一个菜鸟的成长之路。

基于 [Fuwari](https://github.com/saicaca/fuwari)（Astro）深度定制。

**线上地址：** [https://blog.hhq688.com/](https://blog.hhq688.com/)  
**仓库：** [HHQ-666/qingge-blog](https://github.com/HHQ-666/qingge-blog)

---

## ✨ 功能特性

### 基础（继承自 Fuwari）

- [x] Astro 5 + Tailwind CSS
- [x] 流畅动画与 Swup 页面过渡
- [x] 亮色 / 暗色模式 + 可调主题色
- [x] 响应式布局
- [x] Pagefind 全文搜索
- [x] 文章目录 / RSS / Sitemap
- [x] Markdown 扩展语法（警告框、代码块等）

### 本站扩展

- [x] **动态大海 Banner**（视频 + 静态海报首屏占位，避免移动端空白）
- [x] **华语金曲电台**（FAB 圆盘 + 完整面板 + **精简模式**迷你条，跟随主题色）
- [x] **Twikoo 评论**（昵称 + 邮箱即可，无需 GitHub 登录）
- [x] **写作台（Sveltia CMS）**：PC 访问 `/admin/`，口令 + GitHub Token 进入后写文章并发布
- [x] **今日一言**：移动端并入欢迎卡（打字机短句）；PC 侧栏独立卡片
- [x] 移动端分类 / 标签流式展开（单行折叠 + 更多）
- [x] 不蒜子访问统计、站点运行天数、开场 Splash、阅读进度条等

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | [Astro](https://astro.build) 5 |
| 样式 | Tailwind CSS / Stylus |
| 交互 | Svelte 5 / Swup |
| 搜索 | Pagefind |
| 评论 | [Twikoo](https://twikoo.js.org/)（Netlify Functions + MongoDB Atlas） |
| 部署 | Vercel（生产）· 域名 `blog.hhq688.com` |

---

## 🚀 本地开发

```bash
# 要求：Node.js >= 20，pnpm >= 9
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # 构建 + pagefind 索引 → ./dist
pnpm preview      # 预览构建结果
pnpm check        # Astro 诊断
pnpm new-post <filename>  # 新建文章
```

主要配置文件：[`src/config.ts`](src/config.ts)  
部署说明：[`docs/DEPLOY.md`](docs/DEPLOY.md)

---

## 📝 文章 Frontmatter

```yaml
---
title: 我的第一篇文章
published: 2026-07-21
description: 简介
image: ./cover.jpg
tags: [前端, 笔记]
category: 前端
draft: false
---
```

文章放在 `src/content/posts/`。

---

## ⚙️ 功能开关速查

均在 `src/config.ts`：

| 功能 | 配置项 |
|------|--------|
| 站点信息 / Banner 视频 | `siteConfig` |
| 个人资料 | `profileConfig` |
| 全屏开场图 | `funConfig.splash` |
| 华语金曲电台 | `funConfig.musicPlayer` |
| 今日一言 | `funConfig.hitokoto` |
| 不蒜子统计 | `funConfig.busuanzi` |
| 站点天数 | `funConfig.siteDays` |
| **Twikoo 评论** | `twikooConfig` |
| 写作台 CMS | `public/admin/`（Sveltia） |
| Giscus（备用，默认关） | `giscusConfig` |

---

## 💬 评论（Twikoo）

当前使用 **Twikoo**，访客无需 GitHub 账号。

- 云函数：Netlify（`twikoo-netlify`）
- 数据库：MongoDB Atlas
- 配置：`twikooConfig.envId` 填云函数完整地址，例如：

```ts
export const twikooConfig = {
  enable: true,
  envId: "https://xxx.netlify.app/.netlify/functions/twikoo",
  region: "",
  path: "pathname",
};
```

部署步骤见 [docs/DEPLOY.md · Twikoo](docs/DEPLOY.md#二twikoo-评论推荐无需-github-登录)。

---

## 🎵 电台

右下角圆盘打开完整歌单面板；面板内可切 **精简模式**（半透明迷你条，跟随主题色）。  
配置见 `funConfig.musicPlayer`（音源依赖第三方 Meting 代理，可能失效）。
播放器只在首次打开时获取音源；当前自然月会复用已验证结果，下月自动轮换候选歌单。不可播放或试听片段会被隐藏，并由候选池中的其它歌曲补位。

---

## 📂 目录结构（节选）

```text
src/
  components/
    BannerMedia.astro      # Banner 视频 + 海报
    HomeHero.astro         # 欢迎区（移动端一言）
    Comment.astro          # Twikoo / Giscus
    fun/MusicPlayer.astro  # 电台（完整 + 精简）
    widget/                # 侧栏、移动端导航等
  config.ts                # 站点与功能配置
  content/posts/           # 文章
docs/
  DEPLOY.md                # 部署与评论配置
  README.zh-CN.md          # 中文说明
```

---

## 🔗 相关链接

- 生产站：https://blog.hhq688.com/
- 上游模板：[saicaca/fuwari](https://github.com/saicaca/fuwari)
- Twikoo：https://twikoo.js.org/

---

## ✍️ 写作台（仅作者）

PC 打开：[https://blog.hhq688.com/admin/](https://blog.hhq688.com/admin/)

- 基于 [Sveltia CMS](https://github.com/sveltia/sveltia-cms)（Git-based）
- 登录：写作口令 + GitHub Token（勾选 `repo`），不再走 GitHub OAuth 弹窗
- 登录后可新建/编辑 `src/content/posts`
- 保存即提交仓库，Vercel 自动部署
- 详细步骤见 [docs/DEPLOY.md · 写作台](docs/DEPLOY.md)

> 前台不展示入口；请自行收藏 `/admin/`。口令挡误入，写权限以 GitHub Token 为准。

## 📄 License

基于 Fuwari 修改，原项目采用 MIT License。  
本仓库内容与文章版权归作者清阿哥所有。
