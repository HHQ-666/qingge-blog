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
	bio: "欢迎来到清哥的小屋 · 记录成长思考",
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
 * - /admin/ 使用同一口令 + GitHub Token 进入发布后台
 * - 浏览器控制台：localStorage.setItem("qingge-author","你的口令") 后刷新
 * - 或在欢迎区小屋图标上连点 5 次，解锁顶部写作图标
 * 口令挡误入；真正写仓库靠 GitHub Token（不会提交进 Git）
 */
export const authorGate = {
	/** 写作台口令；请改成自己的，并与 /admin 登录一致 */
	secret: "qingge666",
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
	 * - 首次打开时探测音源，同一自然月直接复用已验证的播放地址
	 * - 每月自动轮换候选顺序；不完整或失效歌曲会被候补歌曲替换
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
		/** 每月从候选池中补足并显示的歌曲数量 */
		playlistSize: 30,
		/** 主音源返回完整歌曲；遇到限流或服务故障时会自动尝试备用代理。 */
		api: "https://music.rrvenn.cn/song",
		fallbackApis: [
			"https://api.i-meto.com/meting/api",
			"https://api.injahow.cn/meting/",
		],
		/**
		 * 候选歌单。播放器每月轮换顺序，并从后续候选中替换掉不可播放曲目。
		 * 所有候选均经过接口与时长探测；运行时仍会再次验证临时播放地址。
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
			{ id: "187134", title: "朋友", artist: "周华健" },
			{ id: "212233", title: "千千阙歌", artist: "陈慧娴" },
			{ id: "110740", title: "忘情水", artist: "刘德华" },
			{ id: "308518", title: "领悟", artist: "辛晓琪" },
			{ id: "187899", title: "我期待", artist: "张雨生" },
			{ id: "109198", title: "恋曲1990", artist: "罗大佑" },
			{ id: "280175", title: "征服", artist: "那英" },
			{ id: "104527", title: "再回首", artist: "姜育恒" },
			{ id: "256621", title: "至少还有你", artist: "林忆莲" },
			{ id: "327345", title: "爱的代价", artist: "张艾嘉" },
			{ id: "115502", title: "红日", artist: "李克勤" },
			{ id: "168091", title: "蓝莲花", artist: "许巍" },
			{ id: "152392", title: "讲不出再见", artist: "谭咏麟" },
			{ id: "82914", title: "一剪梅", artist: "费玉清" },
			{ id: "298456", title: "新不了情", artist: "万芳" },
			{ id: "293927", title: "野花", artist: "田震" },
			{ id: "188746", title: "我是一只小小鸟", artist: "赵传" },
			{ id: "3362290991", title: "祝福", artist: "叶倩文" },
			{ id: "108119", title: "恋恋风尘", artist: "老狼" },
			{ id: "1298402744", title: "纤夫的爱", artist: "尹相杰" },
			{ id: "1962191920", title: "涛声依旧", artist: "毛宁" },
			{ id: "1958429350", title: "弯弯的月亮", artist: "刘欢" },
			{ id: "190495", title: "雨一直下", artist: "张宇" },
			{ id: "287627", title: "回家", artist: "顺子" },
			{ id: "144619", title: "心太软", artist: "任贤齐" },
		],
	},
	/**
	 * 小屋宠物（Live2D 看板娘）
	 * - 右键宠物（移动端长按）弹出功能菜单：切换形象/聊天/随机/隐藏
	 * - 对话气泡、点击互动；模型库：public/pets/manifest.json（零代码增删形象）
	 */
	pet: {
		enable: true,
		/** 初始加载的默认形象 id */
		defaultPet: "pio",
	},
};
