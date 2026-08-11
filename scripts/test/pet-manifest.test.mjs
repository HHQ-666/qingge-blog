import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const manifestPath = resolve(repoRoot, "public/pets/manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const footerSource = await readFile(
	resolve(repoRoot, "src/components/Footer.astro"),
	"utf8",
);
const petComponentSource = await readFile(
	resolve(repoRoot, "src/components/fun/PetCompanion.svelte"),
	"utf8",
);
const expectedIds = ["pio", "shizuku", "koharu"];
const localIds = ["koharu"];

function publicFile(publicUrl) {
	return resolve(repoRoot, "public", publicUrl.replace(/^\//, ""));
}

test("pet manifest contains the three visible models in order", () => {
	assert.deepEqual(
		manifest.pets.map((pet) => pet.id),
		expectedIds,
	);
	for (const removedId of [
		"wanko",
		"nito",
		"senko",
		"tororo",
		"hijiki",
		"miku",
		"hiyori",
		"haru-greeter",
		"haru",
	]) {
		assert.equal(
			manifest.pets.some((pet) => pet.id === removedId),
			false,
		);
	}
});

test("pet menu is an icon-only circular avatar picker", () => {
	assert.doesNotMatch(
		petComponentSource,
		/pet-menu-head|pet-menu-title|pet-hide-button|pet-item-name|pet-check|pet-action-strip/,
	);
	assert.match(petComponentSource, /class="pet-item-img"/);
	assert.match(petComponentSource, /role="menuitemradio"/);
});

test("site exposes the required Live2D sample-data attribution", () => {
	assert.match(footerSource, /Live2D Inc\./);
	assert.match(footerSource, /依照其条款使用/);
	assert.match(footerSource, /由作者自行创作并独立负责/);
	assert.match(footerSource, /live2d\.com\/en\/learn\/sample\/model-terms/);
});

test("new pets use complete local model resource graphs", async () => {
	for (const id of localIds) {
		const pet = manifest.pets.find((item) => item.id === id);
		assert.ok(pet, `missing manifest entry: ${id}`);
		assert.match(pet.model, new RegExp(`^/pets/models/${id}/`));

		const modelFile = publicFile(pet.model);
		const model = JSON.parse(await readFile(modelFile, "utf8"));
		const fileReferences = model.FileReferences;
		const motions = fileReferences
			? Object.values(fileReferences.Motions ?? {}).flat()
			: Object.values(model.motions ?? {}).flat();
		const motionFiles = motions.map((motion) => fileReferences ? motion.File : motion.file);
		const references = fileReferences
			? [
				fileReferences.Moc,
				...(fileReferences.Textures ?? []),
				fileReferences.Physics,
				fileReferences.Pose,
				fileReferences.UserData,
				...motionFiles,
			].filter(Boolean)
			: [
				model.model,
				...(model.textures ?? []),
				model.physics,
				model.pose,
				...(model.expressions ?? []).map((expression) => expression.file),
				...motionFiles,
				...motions.map((motion) => motion.sound),
			].filter(Boolean);
		if (fileReferences) {
			assert.equal(model.Version, 3, `${id} must be a Cubism 3 runtime model`);
			assert.match(modelFile, /\.model3\.json$/);
		} else {
			assert.ok(
				Number.isFinite(model.layout?.width) && model.layout.width > 0,
				`${id} must declare a visible canvas layout`,
			);
		}

		for (const reference of references) {
			await assert.doesNotReject(
				access(resolve(dirname(modelFile), reference)),
				`${id} is missing ${reference}`,
			);
		}

		for (const action of Object.values(pet.actions ?? {})) {
			assert.ok(
				motionFiles.includes(action.file),
				`${id} action is not declared by its model: ${action.file}`,
			);
		}
	}
});

test("new pet avatars are square WebP images and removed avatars are gone", async () => {
	for (const id of localIds) {
		const avatarFile = publicFile(`/pets/avatars/${id}.webp`);
		const metadata = await sharp(avatarFile).metadata();
		assert.equal(metadata.format, "webp", `${id} avatar must be WebP`);
		assert.equal(metadata.width, 160, `${id} avatar width must be 160px`);
		assert.equal(metadata.height, 160, `${id} avatar height must be 160px`);
	}

	for (const id of ["senko", "tororo", "hijiki", "miku"]) {
		await assert.rejects(access(publicFile(`/pets/avatars/${id}.webp`)));
	}
});
