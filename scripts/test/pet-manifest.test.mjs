import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const manifestPath = resolve(repoRoot, "public/pets/manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const expectedIds = ["pio", "shizuku", "wanko", "nito", "koharu", "haru"];
const localIds = ["wanko", "nito", "koharu", "haru"];

function publicFile(publicUrl) {
	return resolve(repoRoot, "public", publicUrl.replace(/^\//, ""));
}

test("pet manifest contains the approved six models in order", () => {
	assert.deepEqual(
		manifest.pets.map((pet) => pet.id),
		expectedIds,
	);
	for (const removedId of ["senko", "tororo", "hijiki", "miku"]) {
		assert.equal(
			manifest.pets.some((pet) => pet.id === removedId),
			false,
		);
	}
});

test("new pets use complete local model resource graphs", async () => {
	for (const id of localIds) {
		const pet = manifest.pets.find((item) => item.id === id);
		assert.ok(pet, `missing manifest entry: ${id}`);
		assert.match(pet.model, new RegExp(`^/pets/models/${id}/`));

		const modelFile = publicFile(pet.model);
		const model = JSON.parse(await readFile(modelFile, "utf8"));
		assert.ok(
			Number.isFinite(model.layout?.width) && model.layout.width > 0,
			`${id} must declare a visible canvas layout`,
		);
		const motions = Object.values(model.motions ?? {}).flat();
		const motionFiles = motions.map((motion) => motion.file);
		const references = [
			model.model,
			...(model.textures ?? []),
			model.physics,
			model.pose,
			...(model.expressions ?? []).map((expression) => expression.file),
			...motionFiles,
			...motions.map((motion) => motion.sound),
		].filter(Boolean);

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
