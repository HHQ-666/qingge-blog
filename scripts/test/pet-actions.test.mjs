import assert from "node:assert/strict";
import test from "node:test";
import {
	getActionEntries,
	getAvailableActionEntries,
	pickRandomMotion,
} from "../../src/scripts/pet-actions.mjs";

const pet = {
	actions: {
		cute: { label: "卖萌", file: "motions/cute.mtn" },
		tease: { label: "撒娇", file: "motions/tease.mtn" },
		dance: { label: "跳舞", group: "Dance", index: 0 },
	},
};

test("动作映射按配置顺序转为带 id 的数组", () => {
	assert.deepEqual(getActionEntries(pet), [
		{ id: "cute", label: "卖萌", file: "motions/cute.mtn" },
		{ id: "tease", label: "撒娇", file: "motions/tease.mtn" },
		{ id: "dance", label: "跳舞", group: "Dance", index: 0 },
	]);
});

test("文件动作只保留运行时返回的可用文件", () => {
	const available = { idle: ["motions/idle.mtn"], "": ["motions/cute.mtn"] };
	const result = getAvailableActionEntries(pet, available);
	assert.deepEqual(result.map((item) => item.id), ["cute"]);
});

test("组动作按组和索引校验", () => {
	const available = { Dance: ["motions/dance.mtn"] };
	const result = getAvailableActionEntries(pet, available);
	assert.deepEqual(result.map((item) => item.id), ["dance"]);
});

test("随机动作排除 idle 组并返回可播放文件", () => {
	const available = {
		idle: ["motions/idle.mtn"],
		Tap: ["motions/tap.mtn"],
	};
	assert.deepEqual(pickRandomMotion(available, () => 0), {
		group: "Tap",
		index: 0,
		file: "motions/tap.mtn",
	});
});

test("没有非 idle 动作时返回 null", () => {
	assert.equal(pickRandomMotion({ idle: ["motions/idle.mtn"] }, () => 0), null);
});
