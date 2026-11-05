import { z } from "zod";
// Better Auth requires at least 32 characters. Known example values are public.
export const authSecretSchema = z
	.string()
	.min(32)
	.refine(
		(value) => value !== "replace-with-at-least-32-characters",
		"BETTER_AUTH_SECRET is the public example placeholder. Generate a secret with openssl rand -base64 32 and store it in apps/web/.env.",
	);
