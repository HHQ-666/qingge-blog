import assert from "node:assert/strict";
import test from "node:test";
import {
  collectCsdnImageUrls,
  makeStorageKey,
  replaceImageUrl,
} from "../migrate-csdn-images.mjs";

test("collects only CSDN image URLs and removes image fragments", () => {
  const markdown = [
    "![CSDN](https://i-blog.csdnimg.cn/blog_migrate/example.png#pic_center)",
    "![Other](https://example.com/image.png)",
  ].join("\n");

  assert.deepEqual(collectCsdnImageUrls(markdown), [
    "https://i-blog.csdnimg.cn/blog_migrate/example.png",
  ]);
});

test("creates a deterministic R2 key below the posts prefix", () => {
  const key = makeStorageKey("demo-post", Buffer.from("image-bytes"), "png");

  assert.match(key, /^posts\/demo-post\/[a-f0-9]{16}\.png$/);
});

test("replaces only the selected CSDN URL", () => {
  const source = "https://i-blog.csdnimg.cn/blog_migrate/example.png#pic_center";
  const target = "https://example.workers.dev/posts/demo/abc.png";
  const markdown = `![CSDN](${source})\n![Other](https://example.com/image.png)`;

  assert.equal(
    replaceImageUrl(markdown, source, target),
    `![CSDN](${target})\n![Other](https://example.com/image.png)`,
  );
});
