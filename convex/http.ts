import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/board/write",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.BOARD_CONVEX_WRITE_SECRET;
    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const input = await request.json();
    const { status, error } = await ctx.runMutation(internal.board.write, { input });
    return Response.json(error ? { error } : { ok: true }, { status });
  }),
});

export default http;
