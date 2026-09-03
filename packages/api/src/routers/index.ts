import { enqueueJob } from "@internal-os/db/jobs";
import { z } from "zod";

import {
	organizationProcedure,
	protectedProcedure,
	publicProcedure,
	router,
} from "../index";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
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
