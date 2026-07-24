# 清哥的小屋

基于 [Astro](https://astro.build) 的个人静态博客，在 [Fuwari](https://github.com/saicaca/fuwari) 模板上深度定制。

**线上预览：** [https://blog.hhq688.com/](https://blog.hhq688.com/)  
**仓库：** [HHQ-666/qingge-blog](https://github.com/HHQ-666/qingge-blog)

副标题：一个菜鸟的成长之路。

---

## ✨ 功能特性

### 模板自带

- [x] Astro + Tailwind CSS
- [x] 流畅动画与页面过渡
- [x] 亮色 / 暗色模式
- [x] 自定义主题色与 Banner
- [x] 响应式设计
- [x] Pagefind 搜索
- [x] 文内目录 / RSS

### 本站增强

- [x] 动态大海 Banner（静态海报首屏占位，视频就绪后淡入）
- [x] 华语金曲电台：圆盘 FAB + 完整面板 + **精简模式**
- [x] **Twikoo 评论**（无需 GitHub 登录）
- [x] 移动端欢迎卡内嵌今日一言（打字机短句）
- [x] 移动端分类 / 标签单行折叠展开
- [x] 不蒜子统计、站点天数、开场图、阅读进度等

---

## 👀 环境要求

- Node.js >= 20
- pnpm >= 9

---

## 🚀 本地开发

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # 输出到 ./dist，并生成 pagefind 索引
pnpm preview  # 预览构建结果
pnpm check    # 诊断
pnpm new-post <filename>
```

1. 在 [`src/config.ts`](../src/config.ts) 修改站点信息与功能开关  
2. 文章目录：`src/content/posts/`  
3. 部署说明：[`DEPLOY.md`](./DEPLOY.md)

---

## ⚙️ 文章 Frontmatter

```yaml
---
title: 文章标题
published: 2026-07-21
description: 简介
image: ./cover.jpg
tags: [前端, 笔记]
category: 前端
draft: false
lang: zh_CN   # 仅当与站点语言不同时需要
---
```

---

## 💬 评论

默认使用 **Twikoo**（昵称 + 邮箱即可评论）。

| 项 | 说明 |
|----|------|
| 配置 | `src/config.ts` → `twikooConfig` |
| 云函数 | Netlify 部署 `twikoo-netlify` |
| 数据库 | MongoDB Atlas |
| envId 示例 | `https://xxx.netlify.app/.netlify/functions/twikoo` |

详细步骤见 [DEPLOY.md · Twikoo](./DEPLOY.md#二twikoo-评论推荐无需-github-登录)。

旧版 Giscus 配置仍保留在 `giscusConfig`（默认关闭），可按需切回。

---

## 🎵 电台与 Banner

| 功能 | 配置 | 说明 |
|------|------|------|
| Banner 视频 | `siteConfig.banner` | `src` 静态图 + `video` + `posterPublic` |
| 电台 | `funConfig.musicPlayer` | 完整面板内可切「精简模式」 |

---

## 🧞 常用指令

| 命令 | 作用 |
|------|------|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 本地开发服务器 |
| `pnpm build` | 生产构建 + 搜索索引 |
| `pnpm preview` | 预览构建结果 |
| `pnpm new-post <name>` | 新建文章 |
| `pnpm check` | Astro / 类型检查 |

---

## 📄 许可

上游模板 Fuwari 为 MIT License。  
本站文章与定制内容版权归作者所有。
