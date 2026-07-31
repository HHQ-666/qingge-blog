## 当前线上地址

- 生产站：https://blog.hhq688.com/
- Vercel 默认域（备用）：https://qingge-cabana.vercel.app/
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
site: "https://blog.hhq688.com/",
base: "/",
```

5. 自定义域名已绑定：`blog.hhq688.com`（Squarespace DNS → Vercel）。

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

## 二、Twikoo 评论（推荐，无需 GitHub 登录）

文章页组件：[`src/components/Comment.astro`](../src/components/Comment.astro)  
开关与配置：[`src/config.ts`](../src/config.ts) → `twikooConfig`

访客只需 **昵称 + 邮箱** 即可评论，无需 GitHub 账号。

### 当前生产配置（已启用）

| 项 | 值 |
|----|-----|
| 云函数平台 | Netlify（站点 `darling-axolotl-6d79b4`） |
| 仓库 | [HHQ-666/twikoo-netlify](https://github.com/HHQ-666/twikoo-netlify)（fork 自官方） |
| 数据库 | MongoDB Atlas |
| envId | `https://darling-axolotl-6d79b4.netlify.app/.netlify/functions/twikoo` |

```ts
export const twikooConfig = {
  enable: true,
  envId: "https://darling-axolotl-6d79b4.netlify.app/.netlify/functions/twikoo",
  region: "",
  path: "pathname",
};
```

### 从零部署（Netlify + MongoDB，推荐免费方案）

1. **MongoDB Atlas**  
   - 创建免费 Cluster  
   - Database User + 密码  
   - Network Access 添加 `0.0.0.0/0`  
   - 复制连接串，将 `<password>` 换成真实密码  

2. **Fork** [twikoojs/twikoo-netlify](https://github.com/twikoojs/twikoo-netlify) 到自己的 GitHub  

3. **Netlify**  
   - Add new site → Import → 选择 fork 的 `twikoo-netlify`（**不是**博客仓库）  
   - Environment variables 新增：`MONGODB_URI` = 完整连接串  
   - Deploy；改环境变量后需 **Trigger deploy** 再部署一次  

4. 部署成功后 envId 为：

```text
https://你的站点.netlify.app/.netlify/functions/twikoo
```

浏览器打开该地址，或 POST `{"event":"GET_CONFIG"}` 应返回正常配置。

5. 填入博客 `src/config.ts` 的 `twikooConfig.envId`，重新部署**博客**。

### 其它部署方式

- 腾讯云 / Vercel / Hugging Face 等见 [Twikoo 文档](https://twikoo.js.org/backend.html)  
- 注意：腾讯云「一键部署」免费额度通常不足以支撑 Twikoo，不推荐  

### 说明

- 未填 `envId` 时，文章页显示「待配置」引导卡片。  
- 暂不需要评论：`twikooConfig.enable: false`。  
- 旧 Giscus 保留在 `giscusConfig`（默认关闭）。切回：  
  `twikooConfig.enable = false` 且 `giscusConfig.enable = true`。  
- MongoDB 密码、连接串只放在 Netlify 环境变量，**不要提交到 Git**。

---

## 二（附）、Giscus 评论（可选，需 GitHub 登录）

1. 仓库开启 Discussions，并在 [giscus.app](https://giscus.app/zh-CN) 配置  
2. 把 `repoId` / `categoryId` 写入 `giscusConfig`  
3. 关闭 Twikoo：`twikooConfig.enable: false`，打开 Giscus：`giscusConfig.enable: true`

---

## 三、上线前自检清单

- [x] `git remote` 的 `origin` 指向 `HHQ-666/qingge-blog`
- [x] `astro.config.mjs` 的 `site` 为自定义域名 `https://blog.hhq688.com/`
- [x] Twikoo `envId` 已配置（Netlify）
- [x] 自定义域名与 `site` 一致
- [ ] 本地 `pnpm build` 无报错
- [ ] 博客已重新部署以加载最新评论配置

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
| 评论（Twikoo） | `twikooConfig` |
| 评论（Giscus 备用） | `giscusConfig` |

---

## 七、移动端与电台体验（本站定制）

| 模块 | 说明 |
|------|------|
| Banner | 首屏静态海报占位；视频空闲加载，出帧后淡入 |
| 欢迎卡 | PC 显示副标题；移动端显示今日一言短句 + 刷新 |
| 分类/标签 | 默认单行，点「更多」同宽流式展开 |
| 电台 | 默认圆盘 FAB；完整面板内可切「精简模式」迷你条（半透明、跟随主题色） |
| 访客统计 | 不蒜子 JSONP 填充侧栏与页脚 |

相关组件：

- `src/components/BannerMedia.astro`
- `src/components/HomeHero.astro`
- `src/components/fun/MusicPlayer.astro`
- `src/components/widget/MobileHomeWidgets.astro`
- `src/components/fun/Busuanzi.astro`

---

## 八、写作台（Sveltia CMS）

PC 后台：[`/admin/`](https://blog.hhq688.com/admin/)  
配置：[`public/admin/config.yml`](../public/admin/config.yml)  
入口页：[`public/admin/index.html`](../public/admin/index.html)

### 功能

- 仅 **GitHub 登录** 且对仓库 `HHQ-666/qingge-blog` 有写权限的人可进入（即你自己）
- 新建/编辑 `src/content/posts/*.md`，保存即 commit 到 `main`
- Vercel 自动构建后上线
- 封面上传目录：`public/media/uploads/`

### 登录方式（口令 + GitHub Token）

本站 `/admin/` 已改为简单入口，**不再依赖 GitHub OAuth / Netlify 代理**（旧的 `api.netlify.com/auth` 会 Not Found）。

1. 打开 [`/admin/`](https://blog.hhq688.com/admin/)
2. 输入**写作口令**（与 `src/config.ts` 里 `authorGate.secret` 一致，当前为 `qingge666`）
3. **首次**再填一个 GitHub Token：
   - 打开 [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
   - 生成 token：细粒度 Token 选择 `HHQ-666/qingge-blog`，开启 **Metadata: Read**、**Contents: Read and write**；经典 Token 勾选 **`repo`**（组织仓库还需 `read:org`）
   - 粘贴到写作台（可勾选「在本机记住 Token」）
4. 点「进入写作台」→ 验证通过后直接进后台

说明：

- 口令只挡闲人误入；**真正写仓库**靠 GitHub Token
- Token 只存在你自己浏览器的 localStorage，不会进 Git
- 同一浏览器会话内口令通过后刷新可自动进入；换设备需再输入
- 若 Token 过期/无写权限，入口页会提示重新填写

#### （可选）自建 OAuth

若仍想用「Sign in with GitHub」按钮，可自建 [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth)，并在 `public/admin/config.yml` 填写 `base_url`。对个人站一般没必要。

### 本地调试 CMS

```bash
pnpm dev
# 另开终端（可选，Sveltia local_backend）
npx @sveltia/cms@latest  # 若文档要求 proxy，按官方本地代理说明
```

打开 http://localhost:4321/admin/  
`config.yml` 中 `local_backend: true` 时，可用本地代理直接写文件系统（按 Sveltia 当前文档启动 proxy）。

### 安全说明

- 不要把 `/admin` 链到全站导航给所有人（可仅收藏书签）
- 真正权限靠 **GitHub 仓库写权限**，不是靠隐藏链接
- OAuth Secret / PAT 不要提交进仓库
