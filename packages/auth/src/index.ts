import { db } from "@internal-os/db";
import * as schema from "@internal-os/db/schema/auth";
import { env } from "@internal-os/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

export function createAuth() {
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",

			schema: schema,
		}),
		trustedOrigins: [env.BETTER_AUTH_URL],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		plugins: [organization(), nextCookies()],
	});
}

export const auth = createAuth();
