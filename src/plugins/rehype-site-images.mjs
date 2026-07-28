import { visit } from "unist-util-visit";

/** 为 Markdown 正文图片补全加载属性，并把已知旧媒体域名迁移到当前来源。 */
export function rehypeSiteImages({ origin, legacyOrigins }) {
	const targetOrigin = new URL(origin).origin;
	const knownOrigins = new Set(legacyOrigins.map((value) => new URL(value).origin));

	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "img") return;

			const properties = node.properties || (node.properties = {});
			if (typeof properties.loading !== "string") properties.loading = "lazy";
			if (typeof properties.decoding !== "string") properties.decoding = "async";
			if (typeof properties.src !== "string") return;

			try {
				const source = new URL(properties.src);
				if (knownOrigins.has(source.origin)) {
					properties.src = `${targetOrigin}${source.pathname}${source.search}${source.hash}`;
				}
			} catch {
				// 相对路径和无效 URL 由 Astro 的现有 Markdown 处理流程继续处理。
			}
		});
	};
}
