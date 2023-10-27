/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { ZodError } from "zod";
import { redis } from "~/server/upstash";
import { Ratelimit } from "@upstash/ratelimit";
import { log } from "next-axiom";
import { env } from "~/env.mjs";
import { Duration } from "~/types";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

type CreateContextOptions = Record<string, never>;

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
const createInnerTRPCContext = (_opts: CreateContextOptions) => {
  return {};
};

function validateDuration(value: string): value is Duration {
  const durationRegex = /^(\d+)(ms|s|m|h|d)$/;
  return durationRegex.test(value);
}

const UPSTASH_RATELIMITER_TIME_INTERVAL: Duration = validateDuration(
  env.UPSTASH_RATELIMITER_TIME_INTERVAL,
)
  ? env.UPSTASH_RATELIMITER_TIME_INTERVAL
  : "1d";

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = (_opts: CreateNextContextOptions) => {
  const ip = _opts.req.headers["x-forwarded-for"] as string;
  let res = _opts.res;
  return {
    ...createInnerTRPCContext({}),
    ip,
    res,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafe on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */

/* log.debug("UPSTASH_RATELIMITER_TIME_INTERVAL", {
  UPSTASH_RATELIMITER_TIME_INTERVAL,
});
log.debug("UPSTASH_RATELIMITER_TOKENS_PER_TIME", {
  UPSTASH_RATELIMITER_TOKENS_PER_TIME: parseInt(
    env.UPSTASH_RATELIMITER_TOKENS_PER_TIME,
  ),
}); */

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    parseInt(env.UPSTASH_RATELIMITER_TOKENS_PER_TIME),
    UPSTASH_RATELIMITER_TIME_INTERVAL,
  ),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

const rateLimitMiddleware = t.middleware(async ({ ctx, path, next }) => {
  const identifier = `${ctx.ip}:${path}`;
  // log.debug("identifier", { identifier });
  const { success, remaining } = await ratelimit.limit(identifier);
  // log.debug("remaining", { remaining });
  ctx.res.setHeader(
    "X-RateLimit-Limit",
    env.UPSTASH_RATELIMITER_TOKENS_PER_TIME,
  );
  ctx.res.setHeader("X-RateLimit-Remaining", remaining);
  if (!success) {
    log.warn("Rate limit exceeded", { ip: identifier });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Rate limit exceeded",
    });
  }
  return next();
});

export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;
export const rateLimitedProcedure = t.procedure.use(rateLimitMiddleware);