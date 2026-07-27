export const mediaMigrationConfig = {
  workerOrigin:
    process.env.MEDIA_WORKER_ORIGIN ??
    "https://green-mouse-f903.heqing299-328.workers.dev",
  bucket: "qingge-blog-assets",
  prefix: "posts",
  jpegQuality: 92,
};
