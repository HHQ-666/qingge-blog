const DEFAULT_HOSTS = ["blog.hhq688.com"];
const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

function configuredHosts() {
	const raw =
		typeof process !== "undefined" && process.env
			? process.env.ADMIN_ALLOWED_HOSTS
			: "";
	const hosts = String(raw || "")
		.split(",")
		.map((host) => host.trim().toLowerCase().replace(/\.$/, ""))
		.filter(Boolean);
	return new Set([...DEFAULT_HOSTS, ...LOCAL_HOSTS, ...hosts]);
}

function isAdminPath(pathname) {
	let normalized = pathname;
	try {
		normalized = decodeURIComponent(pathname);
	} catch {}
	normalized = normalized.replaceAll("\\", "/").replace(/^\/{2,}/, "/");
	return normalized === "/admin" || normalized.startsWith("/admin/");
}

export default function adminHostMiddleware(request) {
	const url = new URL(request.url);
	if (!isAdminPath(url.pathname)) return undefined;

	const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
	if (configuredHosts().has(hostname)) return undefined;

	return new Response("Not Found", {
		status: 404,
			headers: {
				"cache-control": "no-store",
				"content-type": "text/plain; charset=utf-8",
				"content-security-policy": "default-src 'none'; frame-ancestors 'none'",
				"x-robots-tag": "noindex, nofollow, noarchive",
				"x-content-type-options": "nosniff",
			},
	});
}

export const config = {
	// Run before Vercel normalizes encoded separators; the function exits immediately for public paths.
	matcher: "/:path*",
};
