export const MAX_PLAYLIST_SIZE = 30;
export const MUSIC_CACHE_VERSION = "v4";

export function normalizeSongConfig(entries) {
	const seenArtists = new Set();
	const normalized = [];

	for (const entry of Array.isArray(entries) ? entries : []) {
		const id = String(entry?.id || "").trim();
		const title = String(entry?.title || entry?.name || "").trim();
		const artist = String(entry?.artist || "").trim();
		const artistKey = artist.toLocaleLowerCase();
		if (!id || !title || !artist || seenArtists.has(artistKey)) continue;

		seenArtists.add(artistKey);
		normalized.push({ id, title, artist });
		if (normalized.length === MAX_PLAYLIST_SIZE) break;
	}

	return normalized;
}

export function getSongIdsFingerprint(songs) {
	return songs.map((song) => String(song.id)).join(",");
}

export function getPlayableSongStates(states) {
	return (Array.isArray(states) ? states : []).filter(
		(state) => state?.status === "ready" && state?.item,
	);
}

export function getApiFingerprint(api, fallbackApis) {
	return [
		...new Set(
			[api, ...(Array.isArray(fallbackApis) ? fallbackApis : [])].filter(
				Boolean,
			),
		),
	].join("|");
}

export function getSongApiUrl(base, id) {
	const normalizedBase = String(base || "")
		.trim()
		.replace(/\/+$/, "");
	const encodedId = encodeURIComponent(String(id));
	if (/\/song$/i.test(normalizedBase)) {
		return `${normalizedBase}?id=${encodedId}&type=json&level=exhigh`;
	}

	const join = normalizedBase.includes("?") ? "&" : "?";
	return `${normalizedBase}${join}server=netease&type=song&id=${encodedId}`;
}

export function normalizeApiSong(meta, payload) {
	const source = Array.isArray(payload)
		? payload[0]
		: payload?.data && typeof payload.data === "object"
			? payload.data
			: payload;
	const rawUrl = String(source?.url || "").trim();
	if (!rawUrl) return null;

	let url;
	try {
		const parsed = new URL(rawUrl);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return null;
		}
		if (parsed.protocol === "http:") parsed.protocol = "https:";
		url = parsed.toString();
	} catch {
		return null;
	}

	const duration = Number(source?.duration);
	return {
		id: String(meta.id),
		name:
			meta.title ||
			source.name ||
			source.title ||
			source.al_name ||
			String(meta.id),
		artist:
			meta.artist || source.artist || source.author || source.ar_name || "",
		url,
		cover: source.pic || source.cover || source.picUrl || "",
		duration: Number.isFinite(duration) && duration > 0 ? duration : null,
	};
}

export function classifyDuration(duration, minDurationSec) {
	const value = Number(duration);
	const minimum = Number(minDurationSec);
	if (
		!Number.isFinite(value) ||
		value <= 0 ||
		!Number.isFinite(minimum) ||
		minimum <= 0
	) {
		return "unknown";
	}
	return value >= minimum ? "ready" : "short";
}
