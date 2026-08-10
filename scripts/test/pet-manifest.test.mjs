import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const manifestPath = resolve(repoRoot, "public/pets/manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const expectedIds = ["pio", "shizuku", "wanko", "nito", "koharu", "miku"];
const localIds = ["wanko", "nito", "koharu", "miku"];

function publicFile(publicUrl) {
	return resolve(repoRoot, "public", publicUrl.replace(/^\//, ""));
}

test("pet manifest contains the approved six models in order", () => {
	assert.deepEqual(
		manifest.pets.map((pet) => pet.id),
		expectedIds,
	);
	for (const removedId of ["senko", "tororo", "hijiki"]) {
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
		const motionFiles = Object.values(model.motions ?? {})
			.flat()
			.map((motion) => motion.file);
		const references = [
			model.model,
			...(model.textures ?? []),
			model.physics,
			...(model.expressions ?? []).map((expression) => expression.file),
			...motionFiles,
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
