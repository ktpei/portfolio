import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const noteColor = v.union(v.literal("yellow"), v.literal("blue"), v.literal("pink"), v.literal("green"), v.literal("lavender"));
export const noteStatus = v.union(v.literal("idea"), v.literal("exploring"), v.literal("building"), v.literal("shelved"), v.literal("done"));

export default defineSchema({
  notes: defineTable({
    id: v.string(),
    title: v.string(),
    body: v.string(),
    color: noteColor,
    status: noteStatus,
    createdAt: v.string(),
    updatedAt: v.string(),
    score: v.optional(v.number()),
  }).index("by_public_id", ["id"]).index("by_created_at", ["createdAt"]),
  comments: defineTable({
    id: v.string(),
    noteId: v.string(),
    name: v.string(),
    body: v.string(),
    createdAt: v.string(),
  }).index("by_public_id", ["id"]).index("by_note", ["noteId"]),
  votes: defineTable({
    noteId: v.string(),
    voter: v.string(),
    value: v.union(v.literal(-1), v.literal(1)),
  }).index("by_note_voter", ["noteId", "voter"]),
  boardSettings: defineTable({ initialized: v.literal(true) }),
  commentLimits: defineTable({
    clientHash: v.string(),
    lastPost: v.number(),
  }).index("by_client", ["clientHash"]).index("by_last_post", ["lastPost"]),
});
