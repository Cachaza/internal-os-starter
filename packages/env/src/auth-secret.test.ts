import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { authSecretSchema } from "./auth-secret.ts";

test("rejects public example and short secrets; accepts generated secrets", () => {
	assert.equal(
		authSecretSchema.safeParse("replace-with-at-least-32-characters").success,
		false,
	);
	assert.equal(authSecretSchema.safeParse("short").success, false);
	assert.equal(
		authSecretSchema.safeParse(randomBytes(32).toString("base64")).success,
		true,
	);
});
