import assert from "node:assert/strict";
import test from "node:test";
import { rehypeSiteImages } from "../../src/plugins/rehype-site-images.mjs";

function image(src, properties = {}) {
	return {
		type: "root",
		children: [
			{
				type: "element",
				tagName: "img",
				properties: { src, ...properties },
				children: [],
			},
		],
	};
}

test("重写旧 R2 主机且补全图片属性", () => {
	const tree = image("https://old.example.workers.dev/posts/a.png");
	rehypeSiteImages({
		origin: "https://img.hhq688.com",
		legacyOrigins: ["https://old.example.workers.dev"],
	})(tree);
	assert.deepEqual(tree.children[0].properties, {
		src: "https://img.hhq688.com/posts/a.png",
		loading: "lazy",
		decoding: "async",
	});
});

test("保留显式属性和其他主机", () => {
	const tree = image("https://example.com/a.png", {
		loading: "eager",
		decoding: "sync",
	});
	rehypeSiteImages({
		origin: "https://img.hhq688.com",
		legacyOrigins: ["https://old.example.workers.dev"],
	})(tree);
	assert.equal(tree.children[0].properties.loading, "eager");
	assert.equal(tree.children[0].properties.src, "https://example.com/a.png");
});
