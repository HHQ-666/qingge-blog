/** 允许引用资源的来源域名（弱防盗链提示，不是访问认证） */
const ALLOWED_HOSTS = ["blog.hhq688.com", "localhost"];

/**
 * 检查请求来源是否合法
 * - 无 Origin/Referer（浏览器直接访问）→ 放行
 * - 来源域名在白名单中 → 放行
 */
function isAllowedOrigin(request) {
  const origin = request.headers.get("Origin");
  const referer = request.headers.get("Referer");
  // 无来源信息（直接访问/curl）放行
  if (!origin && !referer) return true;
  try {
    const host = (origin
      ? new URL(origin).hostname
      : new URL(referer).hostname)
      .toLowerCase()
      .replace(/\.$/, "");
    return ALLOWED_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}

function objectKey(request) {
  try {
    const key = decodeURIComponent(new URL(request.url).pathname).replace(/^\/+/, "");

    if (!key || key.split("/").includes("..")) return null;
    return key;
  } catch {
    return null;
  }
}

export async function handleRequest(request, media) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "GET, HEAD" },
    });
  }

	// 弱防盗链：拒绝明确的非白名单来源；无来源直访在上方兼容放行
  if (!isAllowedOrigin(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const key = objectKey(request);
  if (!key) return new Response("Not Found", { status: 404 });

  const object = await media.get(key);
  if (!object) return new Response("Not Found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  headers.set("vary", "Origin, Referer");

  return new Response(request.method === "HEAD" ? null : object.body, {
    status: 200,
    headers,
  });
}

export default {
  fetch(request, env) {
    return handleRequest(request, env.MEDIA);
  },
};
