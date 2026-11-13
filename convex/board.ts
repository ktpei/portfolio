import { v } from "convex/values";
import { internalMutation, query, type MutationCtx } from "./_generated/server";
import { refreshSeedNote, seedNotes, type BoardSnapshot } from "../src/lib/board";
import { noteColor, noteStatus } from "./schema";

const COMMENT_COOLDOWN = 15_000;
const COMMENT_LIMIT_RETENTION = 24 * 60 * 60 * 1000;

export const snapshot = query({
  args: {},
  handler: async (ctx): Promise<BoardSnapshot> => {
    const [settings, notes, comments] = await Promise.all([
      ctx.db.query("boardSettings").first(),
      ctx.db.query("notes").withIndex("by_created_at").take(1000),
      ctx.db.query("comments").order("desc").take(1000),
    ]);
    return {
      mode: "connected",
      notes: settings ? notes.map(({ id, title, body, color, status, createdAt, updatedAt, score }) => refreshSeedNote({
        id, title, body, color, status, createdAt, updatedAt, ...(score !== undefined ? { score } : {}),
      })) : seedNotes,
      comments: comments.reverse().map(({ id, noteId, name, body, createdAt }) => ({ id, noteId, name, body, createdAt })),
    };
  },
});

async function initialize(ctx: MutationCtx) {
  if (await ctx.db.query("boardSettings").first()) return;
  for (const note of seedNotes) await ctx.db.insert("notes", note);
  await ctx.db.insert("boardSettings", { initialized: true });
}

const writeRequest = v.union(
  v.object({ action: v.literal("comment"), id: v.string(), noteId: v.string(), name: v.string(), body: v.string(), clientHash: v.string() }),
  v.object({ action: v.literal("vote"), noteId: v.string(), voter: v.string(), value: v.union(v.literal(-1), v.literal(0), v.literal(1)) }),
  v.object({
    action: v.literal("save-note"),
    id: v.string(),
    isNew: v.boolean(),
    title: v.string(),
    body: v.string(),
    color: noteColor,
    status: noteStatus,
  }),
  v.object({ action: v.literal("delete-note"), id: v.string() }),
  v.object({ action: v.literal("delete-comment"), id: v.string() }),
);

export const write = internalMutation({
  args: { input: writeRequest },
  handler: async (ctx, { input }) => {
    await initialize(ctx);

    if (input.action === "delete-comment") {
      const comment = await ctx.db.query("comments").withIndex("by_public_id", (q) => q.eq("id", input.id)).unique();
      if (!comment) return { status: 404, error: "Comment not found." };
      await ctx.db.delete(comment._id);
      return { status: 200 };
    }

    const noteId = input.action === "comment" || input.action === "vote" ? input.noteId : input.id;
    const note = await ctx.db.query("notes").withIndex("by_public_id", (q) => q.eq("id", noteId)).unique();
    const now = Date.now();
    const timestamp = new Date(now).toISOString();

    if (input.action === "save-note") {
      const { id, isNew, title, body, color, status } = input;
      const fields = { title, body, color, status, updatedAt: timestamp };
      if (isNew && note) return { status: 409, error: "A sticky with this ID already exists." };
      if (isNew) await ctx.db.insert("notes", { ...fields, id, createdAt: timestamp });
      else if (note) await ctx.db.patch(note._id, fields);
      else return { status: 404, error: "Note not found." };
      return { status: 200 };
    }

    if (!note) return { status: 404, error: "Note not found." };

    if (input.action === "vote") {
      const { voter, value } = input;
      const previous = await ctx.db.query("votes").withIndex("by_note_voter", (q) => q.eq("noteId", noteId).eq("voter", voter)).unique();
      const delta = value - (previous?.value ?? 0);
      if (!delta) return { status: 200 };
      if (!value && previous) await ctx.db.delete(previous._id);
      else if (value && previous) await ctx.db.patch(previous._id, { value });
      else if (value) await ctx.db.insert("votes", { noteId, voter, value });
      await ctx.db.patch(note._id, { score: (note.score ?? 0) + delta });
      return { status: 200 };
    }

    if (input.action === "delete-note") {
      const comments = await ctx.db.query("comments").withIndex("by_note", (q) => q.eq("noteId", noteId)).collect();
      for (const comment of comments) await ctx.db.delete(comment._id);
      const votes = await ctx.db.query("votes").withIndex("by_note_voter", (q) => q.eq("noteId", noteId)).collect();
      for (const vote of votes) await ctx.db.delete(vote._id);
      await ctx.db.delete(note._id);
      return { status: 200 };
    }

    const { id, name, body, clientHash } = input;
    const previous = await ctx.db.query("commentLimits").withIndex("by_client", (q) => q.eq("clientHash", clientHash)).unique();
    if (previous && now - previous.lastPost < COMMENT_COOLDOWN) {
      return { status: 429, error: "Please wait before posting another comment." };
    }
    if (previous) await ctx.db.patch(previous._id, { lastPost: now });
    else await ctx.db.insert("commentLimits", { clientHash, lastPost: now });
    const expired = await ctx.db.query("commentLimits").withIndex("by_last_post", (q) => q.lt("lastPost", now - COMMENT_LIMIT_RETENTION)).take(16);
    for (const limit of expired) await ctx.db.delete(limit._id);
    await ctx.db.insert("comments", { id, noteId, name, body, createdAt: timestamp });
    return { status: 200 };
  },
});
