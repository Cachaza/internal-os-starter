import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
	copyFile,
	mkdir,
	mkdtemp,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("local setup generates private secrets and preserves existing files", async () => {
	const root = await mkdtemp(join(tmpdir(), "internal-os-setup-"));
	try {
		await mkdir(join(root, "scripts"));
		await copyFile(
			new URL("./setup-local.mjs", import.meta.url),
			join(root, "scripts/setup-local.mjs"),
		);
		for (const app of ["web", "worker"]) {
			await mkdir(join(root, `apps/${app}`), { recursive: true });
			await copyFile(
				new URL(`../apps/${app}/.env.example`, import.meta.url),
				join(root, `apps/${app}/.env.example`),
			);
		}
		execFileSync(process.execPath, [join(root, "scripts/setup-local.mjs")]);
		const original = await readFile(join(root, "apps/web/.env"), "utf8");
		assert.ok(!original.includes("replace-with-at-least-32-characters"));
		assert.match(original, /BETTER_AUTH_SECRET=\S+/);
		await writeFile(join(root, "apps/worker/.env"), "CUSTOM=preserved\n");
		execFileSync(process.execPath, [join(root, "scripts/setup-local.mjs")]);
		assert.equal(await readFile(join(root, "apps/web/.env"), "utf8"), original);
		assert.equal(
			await readFile(join(root, "apps/worker/.env"), "utf8"),
			"CUSTOM=preserved\n",
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("integration bootstrap refuses application credentials and non-test databases", () => {
	for (const testUrl of [
		"",
		"invalid",
		"https://localhost/internal_os_test",
		"postgresql://localhost/internal_os",
	]) {
		const result = spawnSync(
			process.execPath,
			[
				"--import",
				new URL("../packages/db/test-setup.ts", import.meta.url).pathname,
				"--eval",
				"throw new Error('bootstrap should have refused before this')",
			],
			{
				encoding: "utf8",
				env: {
					...process.env,
					DATABASE_URL: "postgresql://localhost/application",
					TEST_DATABASE_URL: testUrl,
				},
			},
		);
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /Integration tests require TEST_DATABASE_URL/);
	}
});
