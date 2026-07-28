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
		// 静态大海图：首帧/失败兜底，始终在视频下层
		src: "assets/images/banner-ocean-static.jpg",
		// 动态大海 Banner（相对 public；全端尝试播放，失败则保留静态图）
		video: {
			enable: true,
			src: "/media/banner-ocean.mp4",
			// 静态层兜底（Astro 优化图）
			poster: "assets/images/banner-ocean-poster.jpg",
			// 原生 video poster：public 路径，首屏立刻显示
			posterPublic: "/media/banner-ocean-poster.jpg",
		},
		position: "center",
		credit: {
			// 署名浮层已关闭；Pexels 许可信息仍保留在 public/media 与 assets 的 .meta.json
			enable: false,
			text: "Video by Abbat Studio on Pexels",
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
		{
			name: "抖音",
			icon: "fa6-brands:tiktok",
			// 抖音号：HHQ20250621（睁眼看世界）— 用二维码，避免跳搜索页出现大量同名用户
			url: "#douyin-qr",
			qr: "/media/douyin-qr.png",
		},
		{
			name: "公众号",
			icon: "fa6-brands:weixin",
			// 点击弹出二维码
			url: "#wechat-official",
			qr: "/media/wechat-official-qr.png",
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
	theme: "github-light",
};


/**
 * 作者写作台入口（仅自己可见）
 * - 浏览器控制台执行：localStorage.setItem("qingge-author","你的口令") 后刷新
 * - 或在欢迎区小屋图标上连点 5 次解锁
 * - 解锁后仅显示顶部写作图标（新窗口打开）
 * 真正写权限仍靠 GitHub，口令只控制入口显示
 */
export const authorGate = {
	/** 与 localStorage 中 qingge-author 比对；改成你自己的口令 */
	secret: "qingge-write",
	/** 写作台路径 */
	adminPath: "/admin/",
};

/**
 * Twikoo 评论（无需 GitHub 登录，昵称+邮箱即可）
 * 1. 按 docs/DEPLOY.md「Twikoo」一节部署云函数，拿到 envId
 * 2. 把 envId 填到下方（腾讯云环境 ID，或 Vercel 部署完整 URL）
 * 3. enable: true 后重新构建部署
 * 未配置 envId 时文章页会显示引导卡片。
 */
export const twikooConfig = {
	enable: true,
	/**
	 * Netlify 部署的 Twikoo 云函数完整地址
	 * 格式：https://你的站点.netlify.app/.netlify/functions/twikoo
	 */
	envId: "https://darling-axolotl-6d79b4.netlify.app/.netlify/functions/twikoo",
	/** Netlify 部署留空即可 */
	region: "",
	/** 路径模式：pathname 按路径区分文章评论 */
	path: "pathname" as const,
};

/**
 * Giscus 评论（GitHub Discussions，需登录 GitHub）— 已改用 Twikoo
 * 若仍想用 Giscus，可把 twikooConfig.enable 设为 false，再把这里 enable 设为 true。
 */
export const giscusConfig = {
	enable: false,
	repo: "HHQ-666/qingge-blog",
	repoId: "R_kgDOTey15Q",
	category: "Announcements",
	categoryId: "DIC_kwDOTey15c4DBx6i",
	mapping: "pathname" as const,
	strict: "0" as const,
	reactionsEnabled: "1" as const,
	emitMetadata: "0" as const,
	inputPosition: "top" as const,
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
		api: "https://meting.mikus.ink/api",
		/**
		 * 歌单。优先放实测可完整播放的曲目。
		 * 周杰伦部分歌曲接口常被墙，已从默认列表去掉，避免点了没声。
		 */
		songs: [
			{ id: "1934168650", title: "此生不换", artist: "青鸟飞鱼" },
			{ id: "190072", title: "黄昏", artist: "周传雄" },
			{ id: "108914", title: "江南", artist: "林俊杰" },
			{ id: "85580", title: "童话", artist: "光良" },
			{ id: "254485", title: "勇气", artist: "梁静茹" },
			{ id: "254574", title: "后来", artist: "刘若英" },
			{ id: "298838", title: "传奇", artist: "王菲" },
			{ id: "376417", title: "一生有你", artist: "水木年华" },
			{ id: "97357", title: "那些年", artist: "胡夏" },
			{ id: "190449", title: "吻别", artist: "张学友" },
			{ id: "316756", title: "小城大事", artist: "杨千嬅" },
			{ id: "385781", title: "突然好想你", artist: "五月天" },
			{ id: "436514312", title: "成都", artist: "赵雷" },
			{ id: "32507038", title: "演员", artist: "薛之谦" },
			{ id: "2714278532", title: "泡沫", artist: "邓紫棋" },
			{ id: "1357375695", title: "海阔天空", artist: "Beyond" },
			{ id: "1847408145", title: "月亮代表我的心", artist: "邓丽君" },
			{ id: "150992", title: "其实你不懂我的心", artist: "童安格" },
			{ id: "28819044", title: "大约在冬季", artist: "齐秦" },
			{ id: "158924", title: "一场游戏一场梦", artist: "王杰" },
			{ id: "187338", title: "爱如潮水", artist: "张信哲" },
		],
	},
};
