import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

for (const app of ["web", "worker"]) {
	const target = new URL(`../apps/${app}/.env`, import.meta.url);
	let example = await readFile(
		new URL(`../apps/${app}/.env.example`, import.meta.url),
		"utf8",
	);
	// 32 random bytes meets Better Auth's documented minimum secret length.
	example = example.replace(
		"replace-with-at-least-32-characters",
		randomBytes(32).toString("base64"),
	);
	try {
		await writeFile(target, example, { flag: "wx", mode: 0o600 });
		console.info(`Created apps/${app}/.env`);
	} catch (error) {
		if (error.code !== "EEXIST") throw error;
		console.info(`Kept existing apps/${app}/.env`);
	}
}
