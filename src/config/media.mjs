/**
 * Markdown 正文图片的唯一公开来源。
 * Cloudflare 绑定 img.hhq688.com 后，只需更新 origin，旧文章会在构建时自动迁移。
 */
export const mediaConfig = {
	origin: "https://green-mouse-f903.heqing299-328.workers.dev",
	legacyOrigins: ["https://green-mouse-f903.heqing299-328.workers.dev"],
};
