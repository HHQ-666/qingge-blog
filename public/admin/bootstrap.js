const CMS_SRC = "https://unpkg.com/@sveltia/cms@0.197.0/dist/sveltia-cms.js";
const CMS_SRI =
	"sha384-oPYfvGglsneWy8+BWzIWj0CGxssuTW3PwZcQuPVdYKw7ajNDXKp3DTPxLj3sdg9V";
const CREDENTIAL_KEYS = [
	"qingge-admin-gh-token",
	"sveltia-cms.user",
	"decap-cms-user",
	"netlify-cms-user",
	"sveltia-cms.auth",
];
const SORT_PREFERENCE_MIGRATION_KEY = "qingge-admin-sort-v1";

function removeStorageKey(storage, key) {
	try {
		storage.removeItem(key);
	} catch {}
}

function clearLegacyCredentials() {
	try {
		for (const key of CREDENTIAL_KEYS) removeStorageKey(window.localStorage, key);
	} catch {}
	try {
		for (const key of CREDENTIAL_KEYS) removeStorageKey(window.sessionStorage, key);
	} catch {}
}

function resetSavedPostView() {
	return new Promise((resolve) => {
		try {
			if (
				localStorage.getItem(SORT_PREFERENCE_MIGRATION_KEY) === "1" ||
				!window.indexedDB
			) {
				resolve();
				return;
			}

			const request = window.indexedDB.open("github:HHQ-666/qingge-blog");
			request.onerror = () => resolve();
			request.onsuccess = () => {
				const database = request.result;
				if (!database.objectStoreNames.contains("ui-settings")) {
					database.close();
					localStorage.setItem(SORT_PREFERENCE_MIGRATION_KEY, "1");
					resolve();
					return;
				}

				const transaction = database.transaction("ui-settings", "readwrite");
				transaction.objectStore("ui-settings").delete("contents-view");
				transaction.oncomplete = () => {
					database.close();
					localStorage.setItem(SORT_PREFERENCE_MIGRATION_KEY, "1");
					resolve();
				};
				transaction.onerror = () => {
					database.close();
					resolve();
				};
			};
		} catch {
			resolve();
		}
	});
}

function setStatus(message, failed = false) {
	const loading = document.getElementById("admin-loading");
	const status = document.getElementById("admin-loading-status");
	if (status) status.textContent = message;
	if (loading && failed) loading.classList.add("is-failed");
}

function hideLoading() {
	const loading = document.getElementById("admin-loading");
	if (!loading) return;
	loading.classList.add("is-hidden");
	window.setTimeout(() => loading.remove(), 300);
}

function loadCms() {
	const script = document.createElement("script");
	script.src = CMS_SRC;
	script.integrity = CMS_SRI;
	script.crossOrigin = "anonymous";
	script.async = true;
	script.onload = hideLoading;
	script.onerror = () => {
		setStatus("写作台脚本加载失败，请检查网络后刷新重试。", true);
	};
	document.head.appendChild(script);
}

function boot() {
	clearLegacyCredentials();
	window.addEventListener("pagehide", clearLegacyCredentials);
	window.addEventListener("beforeunload", clearLegacyCredentials);
	resetSavedPostView().finally(loadCms);
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
	boot();
}
