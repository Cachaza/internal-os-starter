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
			message: "Inicia sesión para continuar",
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
				message: "Elige una organización para continuar",
			});
		}

		const membership = await findOrganizationMembership(
			organizationId,
			ctx.session.user.id,
		);
		if (!membership) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message:
					"No tienes acceso a esta organización. Elige otra organización.",
			});
		}

		return next({ ctx: { ...ctx, organizationId, membership } });
	},
);
