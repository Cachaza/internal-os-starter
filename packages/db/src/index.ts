import { dbEnv } from "@internal-os/env/db";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema/index.ts";

export function createDb() {
	return drizzle(dbEnv.DATABASE_URL, { schema });
}

export const db = createDb();

export * from "./jobs.ts";
export * from "./organizations.ts";
