export const MAX_PLAYLIST_SIZE = 30;
export const MUSIC_CACHE_VERSION = "v3";

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

export function getApiFingerprint(api, fallbackApis) {
	return [
		...new Set(
			[api, ...(Array.isArray(fallbackApis) ? fallbackApis : [])].filter(
				Boolean,
			),
		),
	].join("|");
}

export function normalizeApiSong(meta, payload) {
	const source = Array.isArray(payload) ? payload[0] : payload;
	const url = String(source?.url || "").trim();
	if (!url) return null;

	const duration = Number(source?.duration);
	return {
		id: String(meta.id),
		name: meta.title || source.name || source.title || String(meta.id),
		artist: meta.artist || source.artist || source.author || "",
		url,
		cover: source.pic || source.cover || "",
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
