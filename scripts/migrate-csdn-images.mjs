import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { mediaMigrationConfig } from "./media-migration.config.mjs";

const CSDN_IMAGE_URL = /https:\/\/(?:i-|img-)blog\.csdnimg\.cn\/[^\s)\]"']+/g;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const postsDirectory = path.join(projectRoot, "src/content/posts");
const manifestPath = path.join(projectRoot, "docs/media-migration-manifest.json");
const environmentPath = path.join(projectRoot, ".env");

async function loadLocalEnvironment() {
  let contents;

  try {
    contents = await readFile(environmentPath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return;
    throw error;
  }

  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;

    const [, name, rawValue] = match;
    process.env[name] = rawValue.replace(/^("|')(.*)\1$/, "$2");
  }
}

function withoutHash(value) {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}

export function collectCsdnImageUrls(markdown) {
  return [...new Set([...markdown.matchAll(CSDN_IMAGE_URL)].map(([url]) => withoutHash(url)))];
}

function imageReferences(markdown) {
  return [...markdown.matchAll(CSDN_IMAGE_URL)].map(([rawUrl]) => ({
    rawUrl,
    sourceUrl: withoutHash(rawUrl),
  }));
}

export function makeStorageKey(postStem, bytes, extension) {
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  return `${mediaMigrationConfig.prefix}/${postStem}/${hash}.${extension}`;
}

export function replaceImageUrl(markdown, sourceUrl, targetUrl) {
  return markdown.split(sourceUrl).join(targetUrl);
}

export function canWritePost(results) {
  return results.every((result) => result.status !== "failed");
}

function parseArguments(args) {
  const options = { apply: false, post: null };

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--apply") options.apply = true;
    if (args[index] === "--post") options.post = args[index + 1] ?? null;
  }

  return options;
}

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return markdownFiles(entryPath);
      return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
    }),
  );

  return files.flat();
}

function normalizedImageType(contentType) {
  if (contentType === "image/jpg") return "image/jpeg";
  return contentType?.split(";")[0].trim().toLowerCase() ?? "";
}

async function optimizeImage(sourceBytes, contentType, sourceUrl) {
  const input = sharp(sourceBytes, { failOn: "error" });
  const metadata = await input.metadata();
  const type = normalizedImageType(contentType);
  let optimizedBytes = sourceBytes;
  let optimizedType = type;
  let extension = path.extname(new URL(sourceUrl).pathname).slice(1).toLowerCase();

  if (type === "image/png") {
    const candidate = await input.png().toBuffer();
    if (candidate.length < sourceBytes.length) optimizedBytes = candidate;
    optimizedType = "image/png";
    extension = "png";
  } else if (type === "image/jpeg") {
    const candidate = await input.jpeg({ quality: mediaMigrationConfig.jpegQuality, mozjpeg: true }).toBuffer();
    if (candidate.length < sourceBytes.length) optimizedBytes = candidate;
    optimizedType = "image/jpeg";
    extension = "jpg";
  }

  if (!extension) throw new Error(`无法确定图片扩展名：${sourceUrl}`);
  await sharp(optimizedBytes, { failOn: "error" }).metadata();

  return {
    bytes: optimizedBytes,
    contentType: optimizedType || contentType,
    extension,
    height: metadata.height,
    width: metadata.width,
  };
}

async function downloadImage(sourceUrl) {
  const response = await fetch(sourceUrl, {
    headers: { "user-agent": "qingge-blog-image-migrator/1.0" },
    redirect: "follow",
  });
  const contentType = normalizedImageType(response.headers.get("content-type"));

  if (!response.ok) throw new Error(`下载失败：HTTP ${response.status}`);
  if (!contentType.startsWith("image/")) throw new Error(`不是图片：${contentType || "未知类型"}`);

  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentType,
  };
}

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`缺少 ${name}；仅 --apply 上传时需要该本机环境变量。`);
  return value;
}

function r2Client() {
  const endpoint =
    process.env.R2_ENDPOINT ??
    `https://${requiredEnvironment("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: requiredEnvironment("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnvironment("R2_SECRET_ACCESS_KEY"),
    },
  });
}

async function uploadAndVerify(client, key, image) {
  await client.send(
    new PutObjectCommand({
      Bucket: mediaMigrationConfig.bucket,
      Key: key,
      Body: image.bytes,
      CacheControl: "public, max-age=31536000, immutable",
      ContentType: image.contentType,
    }),
  );

  const finalUrl = `${mediaMigrationConfig.workerOrigin}/${key}`;
  const response = await fetch(finalUrl, { method: "HEAD" });
  const contentType = normalizedImageType(response.headers.get("content-type"));

  if (!response.ok || !contentType.startsWith("image/")) {
    throw new Error(`上传后验证失败：HTTP ${response.status}，类型 ${contentType || "未知"}`);
  }

  return finalUrl;
}

async function migratePost(filePath, options, client) {
  const original = await readFile(filePath, "utf8");
  const postStem = path.basename(filePath, ".md");
  const results = [];
  let updated = original;

  for (const { rawUrl, sourceUrl } of imageReferences(original)) {
    try {
      const downloaded = await downloadImage(sourceUrl);
      const image = await optimizeImage(downloaded.bytes, downloaded.contentType, sourceUrl);
      const key = makeStorageKey(postStem, image.bytes, image.extension);
      const finalUrl = `${mediaMigrationConfig.workerOrigin}/${key}`;

      if (options.apply) {
        const verifiedUrl = await uploadAndVerify(client, key, image);
        updated = replaceImageUrl(updated, rawUrl, verifiedUrl);
      }

      results.push({
        destinationKey: key,
        finalUrl,
        height: image.height,
        optimizedBytes: image.bytes.length,
        post: path.relative(projectRoot, filePath),
        sourceBytes: downloaded.bytes.length,
        sourceUrl,
        status: options.apply ? "migrated" : "dry-run",
        width: image.width,
      });
    } catch (error) {
      results.push({
        post: path.relative(projectRoot, filePath),
        sourceUrl,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { filePath, original, results, updated };
}

async function existingManifestResults() {
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    return Array.isArray(manifest.results) ? manifest.results : [];
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return [];
    throw error;
  }
}

export async function runMigration(options) {
  if (options.apply) await loadLocalEnvironment();

  const files = (await markdownFiles(postsDirectory)).filter(
    (filePath) => !options.post || path.basename(filePath, ".md") === options.post,
  );
  const client = options.apply ? r2Client() : null;
  const posts = await Promise.all(files.map((filePath) => migratePost(filePath, options, client)));
  const results = posts.flatMap((post) => post.results);

  if (options.apply) {
    if (canWritePost(results)) {
      await Promise.all(
        posts
          .filter((post) => post.updated !== post.original)
          .map((post) => writeFile(post.filePath, post.updated)),
      );
    }

    const allResults = new Map(
      [...(await existingManifestResults()), ...results].map((result) => [
        `${result.post}:${result.sourceUrl}`,
        result,
      ]),
    );

    await writeFile(
      manifestPath,
      `${JSON.stringify({ createdAt: new Date().toISOString(), workerOrigin: mediaMigrationConfig.workerOrigin, results: [...allResults.values()] }, null, 2)}\n`,
    );
  }

  return results;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const results = await runMigration(options);
  const failures = results.filter((result) => result.status === "failed");
  console.log(JSON.stringify({ mode: options.apply ? "apply" : "dry-run", results }, null, 2));

  if (failures.length > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
