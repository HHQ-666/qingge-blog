function objectKey(request) {
  const key = decodeURIComponent(new URL(request.url).pathname).replace(/^\/+/, "");

  if (!key || key.split("/").includes("..")) return null;
  return key;
}

export async function handleRequest(request, media) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "GET, HEAD" },
    });
  }

  const key = objectKey(request);
  if (!key) return new Response("Not Found", { status: 404 });

  const object = await media.get(key);
  if (!object) return new Response("Not Found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

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
