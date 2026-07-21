## 当前线上地址

- 生产站：https://qingge-cabana.vercel.app/
- 仓库：https://github.com/HHQ-666/qingge-blog

---

# 清哥的小屋 · 部署与配置

本文档与当前线上状态对齐（Vercel 生产 + 可选 GitHub Pages 备用）。

---

## 一、部署方式

### 方案 A：Vercel（当前生产，推荐）

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录  
2. Import 仓库 `HHQ-666/qingge-blog`  
3. Framework 选 Astro，构建配置一般可保持：  
   - Install：`pnpm install`  
   - Build：`pnpm build`  
   - Output：`dist`  
4. 确认 `astro.config.mjs` 中 `site` 与生产域名一致：

```js
// astro.config.mjs
site: "https://qingge-cabana.vercel.app/",
base: "/",
```

5. 绑定自定义域名（可选）：在 Vercel 项目 Domain 中添加，并把 DNS 指到 Vercel；同时把 `site` 改成你的域名。

项目根目录已有 `vercel.json`（可为空对象），一般无需再改。

### 方案 B：GitHub Pages（备用）

仓库已包含 [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)。

| 仓库形态 | 访问地址 | `astro.config.mjs` |
|----------|----------|--------------------|
| 用户主页 `HHQ-666.github.io` | `https://hhq-666.github.io/` | `site: "https://hhq-666.github.io/"`, `base: "/"` |
| 项目页 `qingge-blog` | `https://hhq-666.github.io/qingge-blog/` | `site: "https://hhq-666.github.io"`, `base: "/qingge-blog/"` |

启用步骤：

1. 仓库 → **Settings** → **Pages** → **Source** 选 **GitHub Actions**  
2. 按上表改好 `site` / `base` 后推送 `main`  
3. 若长期只用 Vercel，可在仓库 Settings → Actions 中禁用该 workflow，避免重复构建

### Git 远程

```bash
git remote -v
# origin    https://github.com/HHQ-666/qingge-blog.git
# upstream  https://github.com/saicaca/fuwari.git   # 可选，用于同步模板
```

---

## 二、Giscus 评论（GitHub Discussions）

文章页组件：[`src/components/Comment.astro`](../src/components/Comment.astro)  
开关与配置：[`src/config.ts`](../src/config.ts) → `giscusConfig`

### 启用步骤

1. 在 **博客仓库**（`HHQ-666/qingge-blog`）→ **Settings → General → Features** 勾选 **Discussions**  
2. 打开 [giscus.app](https://giscus.app/zh-CN)  
3. 填入仓库 `HHQ-666/qingge-blog`，按页面提示：  
   - 安装 **giscus** GitHub App 并授权该仓库  
   - Discussion 分类常用 `Announcements`  
   - mapping 选 **pathname**（与代码一致）  
4. 复制生成的 `data-repo-id`、`data-category-id`  
5. 填进 `src/config.ts`：

```ts
export const giscusConfig = {
  enable: true,
  repo: "HHQ-666/qingge-blog",
  repoId: "R_xxxx",          // 从 giscus.app 复制
  category: "Announcements",
  categoryId: "DIC_xxxx",    // 从 giscus.app 复制
  // 其余保持默认即可
};
```

6. 提交并部署后，打开任意文章页底部即可评论（访客需登录 GitHub）。

> 未填 `repoId` / `categoryId` 时，文章页会显示「待开启」引导卡片，不会加载 giscus 脚本。  
> 暂不需要评论时设 `enable: false` 即可隐藏整块区域。

---

## 三、上线前自检清单

- [x] `git remote` 的 `origin` 指向 `HHQ-666/qingge-blog`
- [x] `astro.config.mjs` 的 `site` 为 Vercel 生产域名
- [ ] 本地 `pnpm build` 无报错
- [ ] （可选）Giscus `repoId` / `categoryId` 已填
- [ ] （可选）自定义域名与 `site` 一致

---

## 四、常用命令

```bash
pnpm dev      # 本地开发 http://localhost:4321
pnpm build    # 生产构建 + pagefind 搜索索引
pnpm preview  # 预览构建结果
pnpm check    # Astro / TS 诊断
pnpm new-post <filename>  # 新建文章
```

---

## 五、背景音乐说明

右下角悬浮播放器配置在 `src/config.ts` → `funConfig.musicPlayer`。

当前实现通过 **Meting 代理**（默认 `https://api.qijieya.cn/meting/`）拉取网易云曲目元数据与试听/播放地址。

注意：

- 第三方代理可能失效、限流或返回试听片段；失效时请更换 `api` 或暂时 `enable: false`
- 华语流行曲多为商业版权作品，个人站公开播放存在合规风险；更稳妥的做法是使用 **自有 / CC 授权** 的本地音频
- 若改为本地曲目：把音频放到 `public/media/music/`，并相应改播放器实现与配置

---

## 六、功能开关速查

都在 `src/config.ts`：

| 功能 | 配置项 |
|------|--------|
| 全屏开场图 | `funConfig.splash` |
| 动态大海 Banner | `siteConfig.banner.video` |
| 背景音乐 | `funConfig.musicPlayer` |
| 今日一言 | `funConfig.hitokoto` |
| 阅读进度条 | `funConfig.readingProgress` |
| 鼠标粒子 | `funConfig.cursorTrail` |
| 访问统计（不蒜子） | `funConfig.busuanzi` |
| 站点运行天数 | `funConfig.siteDays`（`startDate`） |
| 评论 | `giscusConfig` |
