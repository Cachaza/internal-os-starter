import { findOrganizationMembership } from "@internal-os/db";
import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

export const organizationProcedure = protectedProcedure.use(
	async ({ ctx, next }) => {
		const organizationId = ctx.session.session.activeOrganizationId;
		if (!organizationId) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "An active organization is required",
			});
		}

		const membership = await findOrganizationMembership(
			organizationId,
			ctx.session.user.id,
		);
		if (!membership) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Organization membership is required",
			});
		}

		return next({ ctx: { ...ctx, organizationId, membership } });
	},
);
