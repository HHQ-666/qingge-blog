import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "清哥的小屋",
	subtitle: "一个菜鸟的成长之路",
	lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	themeColor: {
		hue: 32, // Warm orange cabin light, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: true,
		// 静态兜底图（视频关闭/失败时使用；视频开启时全端播放）
		src: "assets/images/banner-ocean-static.jpg",
		// 动态大海 Banner（相对 public；PC/移动端均播放）
		video: {
			enable: true,
			src: "/media/banner-ocean.mp4",
			// 桌面视频首帧 / 加载失败兜底
			poster: "assets/images/banner-ocean-poster.jpg",
		},
		position: "center",
		credit: {
			enable: true,
			// 桌面为视频署名；移动端静态图见 banner-ocean-static.jpg.meta.json
			text: "Ocean media on Pexels",
			url: "https://www.pexels.com/video/tranquil-ocean-sunset-with-gentle-waves-38456742/",
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		{
			src: "/favicon/favicon-light-32.png",
			theme: "light",
			sizes: "32x32",
		},
		{
			src: "/favicon/favicon-light-128.png",
			theme: "light",
			sizes: "128x128",
		},
		{
			src: "/favicon/favicon-light-180.png",
			theme: "light",
			sizes: "180x180",
		},
		{
			src: "/favicon/favicon-light-192.png",
			theme: "light",
			sizes: "192x192",
		},
		{
			src: "/favicon/favicon-dark-32.png",
			theme: "dark",
			sizes: "32x32",
		},
		{
			src: "/favicon/favicon-dark-128.png",
			theme: "dark",
			sizes: "128x128",
		},
		{
			src: "/favicon/favicon-dark-180.png",
			theme: "dark",
			sizes: "180x180",
		},
		{
			src: "/favicon/favicon-dark-192.png",
			theme: "dark",
			sizes: "192x192",
		},
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
			name: "GitHub",
			url: "https://github.com/HHQ-666", // Internal links should not include the base path, as it is automatically added
			external: true, // Show an external link icon and will open in a new tab
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/qingge-avatar.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "清阿哥",
	bio: "欢迎来到清哥的小屋 · 记录成长与思考",
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github", // Visit https://icones.js.org/ for icon codes
			url: "https://github.com/HHQ-666",
		},
		{
			name: "Email",
			icon: "fa6-solid:envelope",
			url: "mailto:353398163@qq.com",
		},
		{
			name: "CSDN",
			icon: "fa6-solid:blog",
			url: "https://blog.csdn.net/weixin_44980732",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};

/**
 * Giscus 评论（基于 GitHub Discussions）
 * 启用前请按 docs/DEPLOY.md 完成仓库 Discussions + giscus.app 配置，再填入下方字段。
 * 未配置完整 id 时文章页会显示评论引导卡片（不会加载 giscus 脚本）。
 */
export const giscusConfig = {
	enable: true,
	// 博客仓库（需在该仓库 Settings → Features 开启 Discussions）
	repo: "HHQ-666/qingge-blog",
	// 在 https://giscus.app 配置后复制 repo-id
	repoId: "",
	category: "Announcements",
	// 在 giscus.app 配置后复制 category-id
	categoryId: "",
	mapping: "pathname" as const,
	strict: "0" as const,
	reactionsEnabled: "1" as const,
	emitMetadata: "0" as const,
	inputPosition: "top" as const,
	// 跟随站点亮暗色；也可固定 "light" | "dark"
	theme: "preferred_color_scheme" as const,
	lang: "zh-CN",
	loading: "lazy" as const,
};

/** 趣味插件开关 */
export const funConfig = {
	/** 首页全屏开场图（仅会话首次访问首页） */
	splash: {
		enable: true,
		/** 展示时长（毫秒），之后淡出进入主页 */
		durationMs: 3200,
		/** 淡出动画时长 */
		fadeMs: 900,
		/** 是否每个浏览器会话只播一次 */
		oncePerSession: true,
		image: "assets/images/splash-ocean-sunset.jpg",
		title: "清哥的小屋",
		subtitle: "先看看海 · 再推门进来坐坐",
	},
	/** 侧栏「今日一言」 */
	hitokoto: true,
	/** 页脚不蒜子访问统计 */
	busuanzi: true,
	/** 鼠标移动彩带粒子 */
	cursorTrail: true,
	/** 阅读进度条 */
	readingProgress: true,
	/** 站点运行天数（侧栏小卡片） */
	siteDays: {
		enable: true,
		/** 站点启用日 YYYY-MM-DD */
		startDate: "2026-07-21",
	},
	/**
	 * 华语金曲播放器（APlayer + Meting 可播放音源）
	 * 说明：
	 * - 会自动探测完整音源；版权严格的歌曲（部分周杰伦）可能被跳过
	 * - api 失效时可换成其它 Meting 实例
	 */
	musicPlayer: {
		enable: true,
		panelTitle: "华语金曲电台",
		panelSubtitle: "80 / 90 / 00 经典",
		volume: 0.55,
		themeColor: "#e8a35c",
		/** 短于该秒数的视为试听，自动跳过 */
		minDurationSec: 90,
		/** 歌单缓存小时数，刷新页面直接用缓存 */
		cacheHours: 6,
		/** 当前可用的完整音源代理（若失效请更换） */
		api: "https://api.qijieya.cn/meting/",
		/**
		 * 歌单。优先放实测可完整播放的曲目。
		 * 周杰伦部分歌曲接口常被墙，已从默认列表去掉，避免点了没声。
		 */
		songs: [
			{ id: "86363", title: "此生不换", artist: "青鸟飞鱼" },
			{ id: "190072", title: "黄昏", artist: "周传雄" },
			{ id: "108914", title: "江南", artist: "林俊杰" },
			{ id: "85580", title: "童话", artist: "光良" },
			{ id: "254485", title: "勇气", artist: "梁静茹" },
			{ id: "254574", title: "后来", artist: "刘若英" },
			{ id: "298838", title: "传奇", artist: "王菲" },
			{ id: "376417", title: "一生有你", artist: "水木年华" },
			{ id: "97357", title: "那些年", artist: "胡夏" },
			{ id: "190449", title: "吻别", artist: "张学友" },
			{ id: "316425", title: "小城大事", artist: "杨千嬅" },
			{ id: "385781", title: "突然好想你", artist: "五月天" },
			{ id: "386538", title: "温柔", artist: "五月天" },
			{ id: "386005", title: "倔强", artist: "五月天" },
			{ id: "436514312", title: "成都", artist: "赵雷" },
			{ id: "32507038", title: "演员", artist: "薛之谦" },
			{ id: "169185", title: "认真的雪", artist: "薛之谦" },
			{ id: "233931", title: "泡沫", artist: "G.E.M.邓紫棋" },
			{ id: "449818741", title: "光年之外", artist: "G.E.M.邓紫棋" },
			{ id: "347230", title: "海阔天空", artist: "Beyond" },
		],
	},
};
