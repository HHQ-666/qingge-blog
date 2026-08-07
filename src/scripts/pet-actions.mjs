function getActionEntries(pet) {
	return Object.entries(pet?.actions ?? {}).flatMap(([id, config]) => {
		if (!config || typeof config.label !== "string") return [];
		return [{ id, ...config }];
	});
}

function hasFile(available, file) {
	return Boolean(
		file
			&& Object.values(available ?? {}).some((files) =>
				Array.isArray(files)
					&& files.some((item) => item === file || item.startsWith(`${file}.`)),
			),
	);
}

function getAvailableActionEntries(pet, available) {
	return getActionEntries(pet).filter((action) =>
		action.file
			? hasFile(available, action.file)
			: Number.isInteger(action.index)
				&& Array.isArray(available?.[action.group])
				&& action.index >= 0
				&& action.index < available[action.group].length,
	);
}

function pickRandomMotion(available, random = Math.random) {
	const candidates = Object.entries(available ?? {})
		.filter(([group, files]) =>
			group.toLowerCase() !== "idle" && Array.isArray(files) && files.length > 0,
		)
		.flatMap(([group, files]) => files.map((file, index) => ({ group, index, file })));
	return candidates.length ? candidates[Math.floor(random() * candidates.length)] : null;
}

export { getActionEntries, getAvailableActionEntries, pickRandomMotion };
