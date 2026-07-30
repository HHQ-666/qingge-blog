import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const postsDirectory = "src/content/posts";
const covers = {
	CSS: "/media/uploads/covers/css-ui.png",
	JavaScript: "/media/uploads/covers/javascript-typescript.png",
	Vue: "/media/uploads/covers/vue.png",
	前端: "/media/uploads/covers/frontend-general.png",
	面试: "/media/uploads/covers/interview-career.png",
};

const legacyCovers = new Set([
	"/media/uploads/covers/css.svg",
	"/media/uploads/covers/javascript.svg",
	"/media/uploads/covers/vue.svg",
	"/media/uploads/covers/frontend.svg",
	"/media/uploads/covers/interview.svg",
]);

let updated = 0;

for (const file of await readdir(postsDirectory)) {
	if (!file.endsWith(".md")) continue;

	const filePath = path.join(postsDirectory, file);
	const source = await readFile(filePath, "utf8");
	const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
	if (!frontmatter) throw new Error(`Missing frontmatter: ${file}`);

	const category = frontmatter[1]
		.match(/^category:\s*"?([^"\n]+)"?\s*$/m)?.[1]
		.trim();
	const cover = covers[category];
	if (!cover) throw new Error(`No cover mapping for ${file}: ${category || "missing category"}`);
	const existingImage = frontmatter[1].match(/^image:\s*(\S+)$/m)?.[1];
	if (existingImage && !legacyCovers.has(existingImage)) continue;

	const updatedFrontmatter = existingImage
		? frontmatter[0].replace(/^image:\s*\S+$/m, `image: ${cover}`)
		: frontmatter[0].replace(/^(published:[^\n]*\n)/m, `$1image: ${cover}\n`);
	await writeFile(filePath, source.replace(frontmatter[0], updatedFrontmatter));
	updated++;
}

console.log(`Added cover fields to ${updated} posts.`);