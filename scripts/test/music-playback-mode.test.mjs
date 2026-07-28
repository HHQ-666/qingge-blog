import assert from "node:assert/strict";
import test from "node:test";
import {
  getNextIndex,
  nextPlaybackMode,
} from "../../src/scripts/music-playback-mode.mjs";

test("顺序播放在末尾回到第一首", () => {
  assert.equal(getNextIndex("sequence", 2, 3, () => 0), 0);
});

test("单曲循环保留当前歌曲", () => {
  assert.equal(getNextIndex("single", 1, 3, () => 0), 1);
});

test("随机播放不重复当前歌曲", () => {
  assert.equal(getNextIndex("random", 1, 3, () => 0), 2);
});

test("模式按顺序循环", () => {
  assert.equal(nextPlaybackMode("sequence"), "random");
  assert.equal(nextPlaybackMode("random"), "single");
  assert.equal(nextPlaybackMode("single"), "sequence");
});
