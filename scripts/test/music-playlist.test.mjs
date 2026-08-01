import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	classifyDuration,
	getApiFingerprint,
	getPlayableSongStates,
	getSongApiUrl,
	getSongIdsFingerprint,
	MAX_PLAYLIST_SIZE,
	normalizeApiSong,
	normalizeSongConfig,
} from "../../src/scripts/music-playlist-utils.mjs";

const song = (id, artist = `歌手${id}`) => ({
	id: String(id),
	title: `歌曲${id}`,
	artist,
});

test("normalizes to at most 30 songs and keeps the first song per artist", () => {
	const entries = [
		song(1, "甲"),
		song(2, "甲"),
		...Array.from({ length: 35 }, (_, i) => song(i + 3)),
	];
	const normalized = normalizeSongConfig(entries);

	assert.equal(MAX_PLAYLIST_SIZE, 30);
	assert.equal(normalized.length, 30);
	assert.equal(normalized.filter((item) => item.artist === "甲").length, 1);
	assert.equal(normalized[0].id, "1");
});

test("cache fingerprints change when songs or APIs change", () => {
	assert.notEqual(
		getSongIdsFingerprint([song(1)]),
		getSongIdsFingerprint([song(2)]),
	);
	assert.notEqual(
		getApiFingerprint("https://a.test", ["https://b.test"]),
		getApiFingerprint("https://a.test", ["https://c.test"]),
	);
	assert.equal(
		getApiFingerprint("https://a.test", ["https://a.test", "https://b.test"]),
		"https://a.test|https://b.test",
	);
});

test("normalizes Meting payloads without trusting missing fields", () => {
	const normalized = normalizeApiSong(song(7, "歌手甲"), {
		url: "https://audio.test/7.mp3",
		pic: "https://image.test/7.jpg",
		title: "接口歌曲",
		author: "接口歌手",
	});

	assert.deepEqual(normalized, {
		id: "7",
		name: "歌曲7",
		artist: "歌手甲",
		url: "https://audio.test/7.mp3",
		cover: "https://image.test/7.jpg",
		duration: null,
	});
	assert.equal(normalizeApiSong(song(8), { title: "没有音源" }), null);

	const enhanced = normalizeApiSong(song(9), {
		data: {
			url: "http://audio.test/9.mp3",
			al_name: "接口专辑",
			ar_name: "接口歌手",
		},
	});
	assert.equal(enhanced.url, "https://audio.test/9.mp3");
	assert.equal(enhanced.name, "歌曲9");
	assert.equal(enhanced.artist, "歌手9");
});

test("builds both enhanced and Meting song requests", () => {
	assert.equal(
		getSongApiUrl("https://music.rrvenn.cn/song", "9"),
		"https://music.rrvenn.cn/song?id=9&type=json&level=exhigh",
	);
	assert.equal(
		getSongApiUrl("https://api.i-meto.com/meting/api", "9"),
		"https://api.i-meto.com/meting/api?server=netease&type=song&id=9",
	);
});

test("classifies full-length, preview, and unknown durations", () => {
	assert.equal(classifyDuration(180, 90), "ready");
	assert.equal(classifyDuration(45, 90), "short");
	assert.equal(classifyDuration(0, 90), "unknown");
	assert.equal(classifyDuration(Number.NaN, 90), "unknown");
});

test("keeps only complete ready states for the visible playlist", () => {
	const states = [
		{ status: "loading", item: null },
		{ status: "short", item: null },
		{ status: "ready", item: { id: "ready-1" } },
		{ status: "failed", item: null },
		{ status: "ready", item: null },
		{ status: "ready", item: { id: "ready-2" } },
	];

	assert.deepEqual(
		getPlayableSongStates(states).map((state) => state.item.id),
		["ready-1", "ready-2"],
	);
});

test("site configuration keeps 20 to 30 songs with unique artists", async () => {
	const source = await readFile(
		new URL("../../src/config.ts", import.meta.url),
		"utf8",
	);
	const songsSection = source.match(
		/songs:\s*\[([\s\S]*?)\n\s*\],\n\s*\},\n\s*\};/,
	);
	assert.ok(songsSection, "musicPlayer songs section should be present");

	const entries = [
		...songsSection[1].matchAll(
			/\{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*artist:\s*"([^"]+)"\s*\}/g,
		),
	].map((match) => ({ id: match[1], title: match[2], artist: match[3] }));
	assert.ok(entries.length >= 20 && entries.length <= MAX_PLAYLIST_SIZE);
	assert.equal(
		new Set(entries.map((entry) => entry.artist)).size,
		entries.length,
	);
});

test("player hides unavailable rows and uses the versioned complete-source flow", async () => {
	const source = await readFile(
		new URL("../../src/components/fun/MusicPlayer.astro", import.meta.url),
		"utf8",
	);
	assert.match(source, /MUSIC_CACHE_VERSION/);
	assert.match(source, /getPlayableSongStates/);
	assert.match(source, /var songStates = songs\.map/);
	assert.match(source, /共 " \+ readyCount \+ " 首完整音源/);
	assert.doesNotMatch(source, /非完整音源 · 重试/);
	assert.doesNotMatch(source, /音源暂不可用 · 重试/);
	assert.match(
		source,
		/li\.querySelector\("\.qm__item-status"\)\.textContent = fmt\(s\.duration\)/,
	);
	assert.doesNotMatch(source, /textContent = "完整音源"/);
	assert.match(source, /function probeAudio\(item\)/);
});

test("playback recovery does not loop after an audio pause", async () => {
	const source = await readFile(
		new URL("../../src/components/fun/MusicPlayer.astro", import.meta.url),
		"utf8",
	);
	const pauseStart = source.indexOf('audio.addEventListener("pause"');
	const errorStart = source.indexOf('audio.addEventListener("error"');
	assert.ok(pauseStart >= 0 && errorStart > pauseStart);

	const pauseHandler = source.slice(pauseStart, errorStart);
	assert.doesNotMatch(pauseHandler, /audio\.play\(\)/);
	assert.match(source, /var recoveryPromise = null;/);
	assert.match(source, /function recoverAudio\(item, resume\)/);
});
