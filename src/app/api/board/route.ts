import { timingSafeEqual } from "node:crypto";
import {
  BoardStoreError,
  createBoardComment,
  deleteBoardComment,
  deleteBoardNote,
  getBoardSnapshot,
  saveBoardNote,
  setBoardVote,
} from "@/lib/board-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 8_192;
const commentAttempts = new Map<string, number>();

function json(value: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  return Response.json(value, { ...init, headers });
}

function error(message: string, status: number) { return json({ error: message }, { status }); }

function hasOwnerToken(request: Request) {
  const expected = process.env.BOARD_ADMIN_TOKEN;
  const provided = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!expected || !provided) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  return left.length === right.length && timingSafeEqual(left, right);
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const url = new URL(request.url);
  const host = request.headers.get("host");
  // Next may build the route URL with its internal hostname.
  return origin === (host ? `${url.protocol}//${host}` : url.origin);
}

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
}

function rateLimited(request: Request) {
  const key = clientKey(request);
  const current = Date.now();
  for (const [candidate, timestamp] of commentAttempts) {
    if (current - timestamp > 60_000) commentAttempts.delete(candidate);
  }
  const previous = commentAttempts.get(key) ?? 0;
  if (current - previous < 15_000) return true;
  commentAttempts.set(key, current);
  return false;
}

async function body(request: Request): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > MAX_REQUEST_BYTES) throw new BoardStoreError("Request is too large.", 413);
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_REQUEST_BYTES) throw new BoardStoreError("Request is too large.", 413);
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch {
    throw new BoardStoreError("Invalid JSON body.");
  }
}

function noteFrom(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new BoardStoreError("Invalid note.");
  return value as { id?: string; title: string; body: string; color: never; status: never };
}

export async function GET() {
  try { return json(await getBoardSnapshot()); }
  catch (caught) {
    return caught instanceof BoardStoreError
      ? error(caught.message, caught.status)
      : error("Unable to load board.", 500);
  }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return error("Cross-origin writes are not allowed.", 403);
    const input = await body(request);
    if (input.action === "vote") {
      if (input.value !== 0 && input.value !== 1) return error("Invalid reaction.", 400);
      return json(await setBoardVote(input.noteId, input.voter, input.value));
    }
    if (input.action === "comment") {
      if (typeof input.website === "string" && input.website.trim()) return error("Spam detected.", 400);
      if (!process.env.NEXT_PUBLIC_CONVEX_URL && rateLimited(request)) return error("Please wait before posting another comment.", 429);
      return json(await createBoardComment({ noteId: input.noteId as string, name: input.name as string, body: input.body as string }, clientKey(request)));
    }
    if (!hasOwnerToken(request)) return error("Owner authorization is required.", 401);
    if (input.action === "save-note") return json(await saveBoardNote(noteFrom(input.note)));
    if (input.action === "delete-note") return json(await deleteBoardNote(input.id as string));
    if (input.action === "delete-comment") return json(await deleteBoardComment(input.id as string));
    return error("Unknown board action.", 400);
  } catch (caught) {
    return caught instanceof BoardStoreError
      ? error(caught.message, caught.status)
      : error("Unable to update board.", 500);
  }
}
