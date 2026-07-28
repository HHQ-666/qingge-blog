const SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.min.js";

let scriptPromise;

export function claimMount(host) {
	const token = String(Number(host.dataset.twikooMountToken || "0") + 1);
	host.dataset.twikooMountToken = token;
	return token;
}

export function isCurrentMount(host, token) {
	return Boolean(host?.isConnected) && host.dataset.twikooMountToken === String(token);
}

export function loadTwikoo(documentRef = document) {
	const windowRef = documentRef.defaultView || window;
	if (windowRef.twikoo) return Promise.resolve(windowRef.twikoo);
	if (scriptPromise) return scriptPromise;

	scriptPromise = new Promise((resolve, reject) => {
		const script = documentRef.createElement("script");
		script.src = SCRIPT_SRC;
		script.async = true;
		script.dataset.qinggeTwikoo = "1";
		script.onload = () => {
			if (windowRef.twikoo) resolve(windowRef.twikoo);
			else reject(new Error("Twikoo global missing after script load"));
		};
		script.onerror = () => reject(new Error("Twikoo script failed to load"));
		documentRef.head.appendChild(script);
	}).catch((error) => {
		scriptPromise = undefined;
		throw error;
	});

	return scriptPromise;
}

export async function mountTwikoo(host, options) {
	const token = claimMount(host);
	host.setAttribute("aria-busy", "true");
	host.innerHTML = '<p class="twikoo-loading text-50 text-sm" role="status">评论加载中…</p>';

	try {
		const twikoo = await loadTwikoo(host.ownerDocument || document);
		if (!isCurrentMount(host, token)) return false;

		await twikoo.init({
			envId: options.envId,
			el: "#tcomment",
			path: options.path,
			region: options.region || undefined,
			lang: "zh-CN",
		});

		if (!isCurrentMount(host, token)) return false;
		host.dataset.twikooMountedPath = options.path;
		host.removeAttribute("aria-busy");
		return true;
	} catch (error) {
		if (!isCurrentMount(host, token)) return false;
		host.removeAttribute("aria-busy");
		host.innerHTML = '<p class="text-50 text-sm">评论加载失败，请稍后刷新重试。</p>';
		console.error("[twikoo]", error);
		return false;
	}
}
