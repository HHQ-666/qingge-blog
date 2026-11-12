# 博客图片托管说明

文章图片通过 Cloudflare R2 存储，并由 Worker 提供公开只读访问：

`https://green-mouse-f903.heqing299-328.workers.dev/posts/...`

这套方式不修改 `hhq688.com` 的名称服务器、Squarespace 配置、Vercel 配置或邮箱 DNS。

## Worker 来源检查的边界

Worker 会对带有 `Origin` 或 `Referer` 的请求校验 `blog.hhq688.com`（及其子域）来源，并拒绝明显的外部来源。为兼容浏览器直接打开图片、隐私浏览器和爬虫，两个来源头都缺失时仍放行；这是一层弱防盗链提示，不是访问认证，也不能保护私密对象。因此 R2 桶中只能放公开媒体，不能把密钥、备份或其他私密文件与文章图片混放。

## 已迁移的 CSDN 图片

迁移清单在 `docs/media-migration-manifest.json`。每个对象都在上传后通过 Worker 验证为 `image/*` 响应，Markdown 才会替换为新的图片 URL。

## 再次迁移 CSDN 图片

1. 在项目根目录创建本机 `.env`（该文件已被 Git 忽略），填写：

   ```env
   R2_ACCOUNT_ID=你的账户ID
   R2_ACCESS_KEY_ID=受限令牌的Access_Key_ID
   R2_SECRET_ACCESS_KEY=受限令牌的Secret_Access_Key
   ```

2. 先运行只读演练：

   ```bash
   node scripts/migrate-csdn-images.mjs --dry-run
   ```

3. 确认结果后才执行正式迁移：

   ```bash
   node scripts/migrate-csdn-images.mjs --apply
   ```

迁移令牌只应具有 `qingge-blog-assets` 的“对象读取和写入”权限；任务完成后应在 Cloudflare 删除该令牌。

## 回滚单张图片

1. 使用 Git 恢复相应 Markdown 文件中的图片 URL。
2. 如确认不再需要该图片，可在 R2 桶中删除清单记录的 `destinationKey`。

删除 R2 对象会使对应图片 URL 返回 404，因此必须先完成 Markdown 回滚或替换。
