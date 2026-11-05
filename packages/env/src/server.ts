import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { authSecretSchema } from "./auth-secret.ts";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: authSecretSchema,
		BETTER_AUTH_URL: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
