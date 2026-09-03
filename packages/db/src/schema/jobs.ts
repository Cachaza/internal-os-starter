import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const jobStatus = pgEnum("job_status", [
	"pending",
	"processing",
	"completed",
	"failed",
]);

export const job = pgTable(
	"job",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		type: text("type").notNull(),
		payload: jsonb("payload").$type<unknown>().notNull(),
		status: jobStatus("status").default("pending").notNull(),
		runAt: timestamp("run_at", { withTimezone: true }).defaultNow().notNull(),
		attemptCount: integer("attempt_count").default(0).notNull(),
		lockedAt: timestamp("locked_at", { withTimezone: true }),
		lastError: text("last_error"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
	},
	(table) => [
		index("job_runnable_idx").on(table.status, table.runAt, table.createdAt),
	],
);

export type Job = typeof job.$inferSelect;
