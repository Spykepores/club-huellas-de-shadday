import { authRouter } from "./auth-router";
import { campRouter } from "./campRouter";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  camp: campRouter,
});

export type AppRouter = typeof appRouter;
