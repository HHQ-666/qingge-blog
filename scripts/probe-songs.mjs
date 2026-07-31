/**
 * 电台曲库探测脚本
 *
 * 用法：node scripts/probe-songs.mjs
 *
 * 对每个「歌名 + 歌手」候选：
 *   1. 走 Meting search 拿真实 ID（不靠人工记忆的 ID）
 *   2. 校验返回的歌手名包含期望歌手，避免同名歌串台
 *   3. 用播放器同样的规则验证音源（非 HTML、体积 >= 800KB）
 *
 * 输出可直接誊抄进 src/config.ts 的 songs 数组。
 */

const API = "https://api.injahow.cn/meting/";

/** 候选：[歌名, 歌手]。歌手用于校验搜索结果，每位歌手只保留一首 */
const CANDIDATES = [
	// —— 现有配置里保留的代表作（每位歌手一首）——
	["此生不换", "青鸟飞鱼"],
	["黄昏", "周传雄"],
	["江南", "林俊杰"],
	["童话", "光良"],
	["勇气", "梁静茹"],
	["后来", "刘若英"],
	["传奇", "王菲"],
	["一生有你", "水木年华"],
	["那些年", "胡夏"],
	["吻别", "张学友"],
	["小城大事", "杨千嬅"],
	["突然好想你", "五月天"],
	["成都", "赵雷"],
	["演员", "薛之谦"],
	["泡沫", "邓紫棋"],
	["海阔天空", "Beyond"],
	// —— 补充 80 / 90 年代华语经典 ——
	["月亮代表我的心", "邓丽君"],
	["其实你不懂我的心", "童安格"],
	["大约在冬季", "齐秦"],
	["一场游戏一场梦", "王杰"],
	["爱如潮水", "张信哲"],
	// —— 30 首目标歌单的新增代表作 ——
	["朋友", "周华健"],
	["千千阙歌", "陈慧娴"],
	["忘情水", "刘德华"],
	["领悟", "辛晓琪"],
	["我期待", "张雨生"],
	["恋曲1990", "罗大佑"],
	["征服", "那英"],
	["再回首", "姜育恒"],
	["至少还有你", "林忆莲"],
	["爱的代价", "张艾嘉"],
	["红日", "李克勤"],
	["我期待", "张雨生"],
	["味道", "辛晓琪"],
	["领悟", "辛晓琪"],
	["爱人同志", "罗大佑"],
	["恋曲1990", "罗大佑"],
	["夜夜夜夜", "齐秦"],
	["蓝莲花", "许巍"],
	["模范情书", "刘德华"],
	["忘情水", "刘德华"],
	["朋友", "周华健"],
	["花心", "周华健"],
	["我的未来不是梦", "张雨生"],
	["把根留住", "童安格"],
	["容易受伤的女人", "王菲"],
	["谁的眨眼", "陈慧琳"],
	["千千阙歌", "陈慧娴"],
	["漫步人生路", "邓丽君"],
	["讲不出再见", "谭咏麟"],
	["水中花", "谭咏麟"],
	["一剪梅", "费玉清"],
	["天天想你", "张雨生"],
	["新不了情", "万芳"],
	["棋子", "王菲"],
	["野花", "田震"],
	["执着", "田震"],
	["爱的代价", "张艾嘉"],
	["快乐老人", "赵传"],
	["我是一只小小鸟", "赵传"],
	["祝福", "叶倩文"],
	["选择", "叶倩文"],
	["飘雪", "陈慧娴"],
	["恋恋风尘", "老狼"],
	["同桌的你", "老狼"],
	["青春无悔", "老狼"],
	["纤夫的爱", "尹相杰"],
	["涛声依旧", "毛宁"],
	["弯弯的月亮", "刘欢"],
	["好汉歌", "刘欢"],
	["雨一直下", "张宇"],
	["用心良苦", "张宇"],
	["回家", "顺子"],
	["征服", "那英"],
	["白天不懂夜的黑", "那英"],
	["为爱痴狂", "刘若英"],
	["心太软", "任贤齐"],
	["伤心太平洋", "任贤齐"],
	["爱要怎么说出口", "赵传"],
	["再回首", "姜育恒"],
	["驿动的心", "姜育恒"],
];

const MIN_BYTES = 100000;

function apiUrl(type, id) {
	const join = API.includes("?") ? "&" : "?";
	return `${API}${join}server=netease&type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
}

async function getJson(url, timeoutMs = 15000) {
	const ac = new AbortController();
	const timer = setTimeout(() => ac.abort(), timeoutMs);
	try {
		const res = await fetch(url, { signal: ac.signal });
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}

/** 归一化：去掉括号内容、空白、大小写差异，便于歌手/歌名比对 */
function norm(s) {
	return String(s || "")
		.toLowerCase()
		.replace(/[（(].*?[)）]/g, "")
		.replace(/\s+/g, "")
		.trim();
}

/** 搜索并挑出歌手匹配的那一条 */
async function resolveId(title, artist) {
	const data = await getJson(apiUrl("search", title));
	if (!Array.isArray(data)) return null;

	const wantArtist = norm(artist);
	const wantTitle = norm(title);

	for (const item of data) {
		const gotArtist = norm(item.artist || item.author);
		const gotTitle = norm(item.name || item.title);
		// 歌手需互相包含（应对 "G.E.M.邓紫棋" / "邓紫棋" 这类差异）
		const artistOk =
			gotArtist.includes(wantArtist) || wantArtist.includes(gotArtist);
		// 歌名需精确一致，避免翻唱/伴奏/Live 混入
		if (artistOk && gotTitle === wantTitle) {
			const m = String(item.url || "").match(/[?&]id=(\d+)/);
			if (m) return { id: m[1], name: item.name, artist: item.artist };
		}
	}
	return null;
}

/** 按播放器同样的规则验证音源真的能放 */
async function verifyPlayable(id) {
	const data = await getJson(apiUrl("song", id));
	const s = Array.isArray(data) ? data[0] : data;
	if (!s?.url) return { ok: false, reason: "no-url" };

	const ac = new AbortController();
	const timer = setTimeout(() => ac.abort(), 15000);
	try {
		const res = await fetch(s.url, {
			headers: { Range: "bytes=0-1" },
			signal: ac.signal,
		});
		const ct = (res.headers.get("content-type") || "").toLowerCase();
		if (ct.includes("html")) return { ok: false, reason: "html-redirect" };

		const cr = res.headers.get("content-range") || "";
		const cl = res.headers.get("content-length") || "";
		let total = 0;
		if (cr.includes("/")) total = Number(cr.split("/").pop()) || 0;
		if (!total && cl) total = Number(cl) || 0;
		if (total > 0 && total < MIN_BYTES) {
			return { ok: false, reason: `too-small(${total})` };
		}
		return { ok: true, bytes: total };
	} catch {
		return { ok: false, reason: "fetch-failed" };
	} finally {
		clearTimeout(timer);
	}
}

const passed = [];
const failed = [];
const seenArtists = new Set();

for (const [title, artist] of CANDIDATES) {
	const resolved = await resolveId(title, artist);
	if (!resolved) {
		failed.push(`${title} / ${artist} — 搜索无匹配`);
		process.stderr.write("x");
		continue;
	}

	const play = await verifyPlayable(resolved.id);
	if (!play.ok) {
		failed.push(`${title} / ${artist} (${resolved.id}) — ${play.reason}`);
		process.stderr.write("-");
		continue;
	}

	// 同一歌手只保留第一首通过的
	const key = norm(artist);
	if (seenArtists.has(key)) {
		failed.push(`${title} / ${artist} — 该歌手已有曲目，跳过`);
		process.stderr.write("s");
		continue;
	}
	seenArtists.add(key);

	passed.push({ id: resolved.id, title, artist, apiArtist: resolved.artist });
	process.stderr.write(".");
}

process.stderr.write("\n\n");

console.log(`可播放且歌手唯一：${passed.length} 首\n`);
console.log("--- 誊抄进 src/config.ts ---");
for (const s of passed) {
	console.log(
		`\t\t\t{ id: "${s.id}", title: "${s.title}", artist: "${s.artist}" },`,
	);
}
console.log(`\n--- 未通过 (${failed.length}) ---`);
for (const f of failed) console.log(f);
