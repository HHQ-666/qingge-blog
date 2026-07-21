## 当前线上地址

- 生产站：https://qingge-cabana.vercel.app/
- 仓库：https://github.com/HHQ-666/qingge-blog

---

# 清哥的小屋 · 部署与评论配置

这份文档只写你需要动手的几步。代码侧（`site` 配置、GitHub Actions 工作流、Giscus 组件）已经接好。

---

## 一、选一种部署方式

### 方案 A：GitHub Pages（推荐，免费、和现有仓库流程一致）

线上地址会是其一：

| 仓库名 | 访问地址 | `astro.config.mjs` |
|--------|----------|--------------------|
| `HHQ-666/HHQ-666.github.io`（用户主页仓库） | `https://hhq-666.github.io/` | `site: "https://hhq-666.github.io/"`, `base: "/"` |
| `HHQ-666/任意名`（项目页） | `https://hhq-666.github.io/任意名/` | `site: "https://hhq-666.github.io"`, `base: "/任意名/"` |

当前仓库已按**用户主页**配置：

```js
// astro.config.mjs
site: "https://hhq-666.github.io/",
base: "/",
```

#### 你需要做的

1. **在 GitHub 新建仓库**（如果还没有）  
   - 主页站：仓库名必须是 `HHQ-666.github.io`  
   - 或任意名项目站（记得改 `base`）

2. **把本地代码推到你的仓库**（当前 `origin` 还指向模板上游 `saicaca/fuwari`）：

```bash
# 1）把模板上游改名为 upstream（可选，方便以后同步模板）
git remote rename origin upstream

# 2）添加你自己的仓库
git remote add origin https://github.com/HHQ-666/HHQ-666.github.io.git

# 3）提交本地改动后推送
git add -A
git commit -m "feat: 初始化清哥的小屋博客"
git push -u origin main
```

3. **打开 GitHub Pages**  
   仓库 → **Settings** → **Pages** → **Build and deployment** → **Source** 选 **GitHub Actions**。

4. 推送 `main` 后会自动跑 [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)，大约几分钟后可访问。

5. （可选）自定义域名：Pages 设置里填域名，并把 DNS 指到 GitHub；然后把 `astro.config.mjs` 的 `site` 改成你的域名。

### 方案 B：Vercel（更简单的图形界面）

1. 打开 [vercel.com](https://vercel.com) 用 GitHub 登录  
2. Import 你的博客仓库  
3. Framework 选 Astro，构建命令保持默认即可：  
   - Build：`pnpm build`  
   - Output：`dist`  
4. 把 `astro.config.mjs` 的 `site` 改成 Vercel 给你的域名，例如 `https://xxx.vercel.app/`  
5. 项目已有空的 `vercel.json`，一般无需再改

---

## 二、Giscus 评论（基于 GitHub Discussions）

文章页已接入 [`src/components/Comment.astro`](../src/components/Comment.astro)，开关在 [`src/config.ts`](../src/config.ts) 的 `giscusConfig`。

### 启用步骤

1. 博客仓库 **Settings → General → Features** 勾选 **Discussions**  
2. 打开 [giscus.app](https://giscus.app/zh-CN)  
3. 填入仓库（如 `HHQ-666/HHQ-666.github.io`），按页面提示：  
   - 安装 **giscus** GitHub App 并授权该仓库  
   - 选择 Discussion 分类（常用 `Announcements`）  
   - mapping 选 **pathname**（与代码一致）  
4. 页面下方会生成 `data-repo-id`、`data-category-id` 等  
5. 填进 `src/config.ts`：

```ts
export const giscusConfig = {
  enable: true,                         // 打开
  repo: "HHQ-666/HHQ-666.github.io",    // 你的仓库
  repoId: "R_xxxx",                     // 从 giscus.app 复制
  category: "Announcements",
  categoryId: "DIC_xxxx",               // 从 giscus.app 复制
  // 其余保持默认即可
};
```

6. 提交并部署后，打开任意文章页底部即可评论（访客需登录 GitHub）。

> 未填 `repoId` / `categoryId` 或 `enable: false` 时，评论区不会渲染，站点仍可正常访问。

---

## 三、上线前自检清单

- [ ] `git remote -v` 指向你自己的仓库，而不是 `saicaca/fuwari`  
- [ ] `astro.config.mjs` 的 `site` / `base` 与最终域名一致  
- [ ] Pages Source 为 GitHub Actions（或 Vercel 已成功 Deploy）  
- [ ] 本地 `pnpm build` 无报错  
- [ ] （可选）Giscus `enable: true` 且 id 已填  

---

## 四、常用命令

```bash
pnpm dev      # 本地开发 http://localhost:4321
pnpm build    # 生产构建 + pagefind 搜索索引
pnpm preview  # 预览构建结果
```

---

## 五、背景音乐说明

右下角悬浮播放器使用的是 **CC 授权免费轻音乐**（Kevin MacLeod / Chad Crouch），**不是** 周杰伦等商业版权流行金曲。

- 曲目目录：`public/media/music/`
- 开关与歌单：`src/config.ts` → `funConfig.musicPlayer`
- 若要换成真正的 80/90 流行老歌：请自行确保版权合规，再替换该目录下的 mp3，并改 `tracks` 配置。

---

## 六、功能开关速查

都在 `src/config.ts` 的 `funConfig` / `giscusConfig` / `siteConfig.banner`：

| 功能 | 配置项 |
|------|--------|
| 全屏开场图 | `funConfig.splash` |
| 动态大海 Banner | `siteConfig.banner.video` |
| 背景音乐 | `funConfig.musicPlayer` |
| 今日一言 | `funConfig.hitokoto` |
| 阅读进度条 | `funConfig.readingProgress` |
| 鼠标粒子 | `funConfig.cursorTrail` |
| 访问统计 | `funConfig.busuanzi` |
| 评论 | `giscusConfig` |
