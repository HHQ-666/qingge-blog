# R2 Worker 图片托管设计

## 背景

现有文章直接引用 CSDN 图片。CSDN 会根据请求来源阻止这些图片，导致博客文章出现破图。主域名 `hhq688.com` 仍由 Squarespace 管理，并关联 Squarespace 站点、Vercel 博客和 Google 邮箱；不得为了图片托管切换其 Nameserver。

## 目标

- 将文章图片迁移到 Cloudflare R2，避免 CSDN 防盗链。
- 通过 Cloudflare Workers 的 `workers.dev` 地址公开读取图片，不变更现有 DNS。
- 迁移后博客仓库不保存图片二进制文件。
- 在不改变像素尺寸的前提下，优先使用无损压缩；仅在 JPEG 照片上使用高质量压缩。
- 保持 R2 Standard 存储，设置费用提醒并保留每周只读监控。

## 方案

部署一个名为 `qingge-media` 的只读 Worker，并把 `qingge-blog-assets` 绑定为只读 R2 bucket。Worker 只接受 `GET` 和 `HEAD` 请求，按 URL 路径读取对象；缺失对象返回 404，其余方法返回 405。Cloudflare 创建 Worker 时会发放唯一的 `workers.dev` 主机名；该完整主机名将写入站点的图片基础 URL 配置，图片对象统一使用 `posts/文章路径/图片文件名` 的路径结构。

该地址不依赖 `hhq688.com` 的 DNS。Worker 使用 Cloudflare 的 R2 binding，不需要将 R2 access key 或 secret 写入仓库或 Worker 代码。

## 图片迁移

1. 收集 Markdown 中的 CSDN 图片 URL，并按文章 slug 分类。
2. 下载原图，验证解码成功并记录原始尺寸与字节数。
3. PNG 使用无损优化；JPEG 使用高质量编码，尺寸保持不变；若压缩版本更大则保留原图。
4. 上传到 R2 的 `posts/文章路径/` 路径。
5. 逐个验证 Worker URL 返回图片，再替换 Markdown 外链。
6. 生产构建后扫描文章中的 CSDN 图片链接，确认归零。

## 费用与可靠性

- R2 仅使用 Standard 存储；免费额度为 10 GB-month、每月 100 万次写操作及 1,000 万次读操作。
- Workers 使用免费计划；每日请求上限为 10 万次，超过上限会失败，不会自动升级为付费计划。
- Cloudflare 账户设置低额度预算提醒；预算提醒仅通知，不能自动封顶。
- 已配置每周一次的只读监控，仅在异常、非零费用或无法读取用量时提醒。

## 验收标准

- 现有 `blog.hhq688.com`、主站、`www` 与邮箱 DNS 不变。
- 至少一篇含 CSDN 图片的文章在桌面和移动端显示正常。
- 所有迁移后图片由 Worker URL 提供，且能返回正确的 `Content-Type` 与缓存头。
- 图片总字节数不高于原图总量，截图不出现可见质量损失。
