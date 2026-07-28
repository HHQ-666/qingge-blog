export const PLAYBACK_MODES = ["sequence", "random", "single"];

export const PLAYBACK_MODE_LABELS = {
	sequence: "顺序",
	random: "随机",
	single: "单曲循环",
};

export function nextPlaybackMode(mode) {
	const index = PLAYBACK_MODES.indexOf(mode);
	return PLAYBACK_MODES[(index + 1) % PLAYBACK_MODES.length];
}

export function getNextIndex(mode, index, length, random = Math.random) {
	if (length <= 0) return -1;
	if (length === 1 || mode === "single") return index;
	if (mode === "random") {
		return (index + Math.floor(random() * (length - 1)) + 1) % length;
	}
	return (index + 1) % length;
}
