import { findOrganization } from "@internal-os/db";
import { enqueueJob, findSystemTestJob } from "@internal-os/db/jobs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
	organizationProcedure,
	protectedProcedure,
	publicProcedure,
	router,
} from "../index.ts";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	organizationContext: organizationProcedure.query(async ({ ctx }) => {
		const organization = await findOrganization(ctx.organizationId);
		if (!organization)
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Organización no encontrada",
			});
		return {
			id: organization.id,
			name: organization.name,
			slug: organization.slug,
			role: ctx.membership.role,
		};
	}),
	systemTestJob: organizationProcedure
		.input(z.object({ id: z.uuid() }))
		.query(async ({ ctx, input }) => {
			const job = await findSystemTestJob(input.id, ctx.organizationId);
			if (!job)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Trabajo no encontrado",
				});
			return job;
		}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	enqueueSystemTest: organizationProcedure
		.input(z.object({ message: z.string().min(1) }))
		.mutation(({ ctx, input }) =>
			enqueueJob({
				type: "system.test",
				payload: { message: input.message, organizationId: ctx.organizationId },
			}),
		),
});
export type AppRouter = typeof appRouter;
