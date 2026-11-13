import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createHmac, randomUUID } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import {
  noteColors,
  noteStatuses,
  refreshSeedNote,
  seedNotes,
  type BoardComment,
  type BoardNote,
  type BoardSnapshot,
  type NoteColor,
  type NoteStatus,
  type Vote,
} from "./board";

type BoardMode = BoardSnapshot["mode"];
type StoredBoard = { initialized: true; notes: BoardNote[]; comments: BoardComment[]; votes?: Record<string, Record<string, Vote>> };
export type NewComment = Pick<BoardComment, "noteId" | "name" | "body">;
export type NoteInput = { id?: string; title: string; body: string; color: NoteColor; status: NoteStatus };

export class BoardStoreError extends Error {
  public readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const MAX_TITLE = 120;
const MAX_NOTE_BODY = 2_000;
const MAX_NAME = 60;
const MAX_COMMENT_BODY = 1_000;
const safeId = /^[a-z0-9][a-z0-9-]{0,63}$/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cloneSeeds(): BoardNote[] {
  return seedNotes.map((note) => ({ ...note }));
}

function isSafeId(value: unknown): value is string {
  return typeof value === "string" && (safeId.test(value) || uuid.test(value));
}

function now() {
  return new Date().toISOString();
}

function cleanText(value: unknown, label: string, max: number, allowEmpty = false) {
  if (typeof value !== "string") throw new BoardStoreError(`${label} is required.`);
  const trimmed = value.trim();
  if (!trimmed && !allowEmpty) throw new BoardStoreError(`${label} is required.`);
  if (trimmed.length > max) throw new BoardStoreError(`${label} must be ${max} characters or fewer.`);
  return trimmed;
}

export function validateComment(input: NewComment): NewComment {
  if (!isSafeId(input.noteId)) throw new BoardStoreError("Invalid note ID.");
  return {
    noteId: input.noteId,
    name: cleanText(input.name, "Name", MAX_NAME),
    body: cleanText(input.body, "Comment", MAX_COMMENT_BODY),
  };
}

export function validateNote(input: NoteInput): NoteInput {
  if (input.id !== undefined && !isSafeId(input.id)) throw new BoardStoreError("Invalid note ID.");
  if (!noteColors.includes(input.color)) throw new BoardStoreError("Invalid note color.");
  if (!noteStatuses.includes(input.status)) throw new BoardStoreError("Invalid note status.");
  return {
    ...(input.id ? { id: input.id } : {}),
    title: cleanText(input.title, "Title", MAX_TITLE),
    body: cleanText(input.body, "Description", MAX_NOTE_BODY, true),
    color: input.color,
    status: input.status,
  };
}

export function validateId(id: unknown) {
  if (!isSafeId(id)) throw new BoardStoreError("Invalid ID.");
  return id;
}

function toSnapshot(notes: BoardNote[], comments: BoardComment[], mode: BoardMode): BoardSnapshot {
  return {
    notes: notes.map(refreshSeedNote),
    comments,
    mode,
  };
}

function parseStoredBoard(text: string): StoredBoard | null {
  try {
    const value = JSON.parse(text) as Partial<StoredBoard>;
    if (value.initialized === true && Array.isArray(value.notes) && Array.isArray(value.comments)) {
      return value as StoredBoard;
    }
  } catch {
    // A malformed development file should never crash the public board.
  }
  return null;
}

export class LocalBoardStore {
  private writeChain = Promise.resolve();
  private readonly filePath: string;

  constructor(filePath: string) { this.filePath = filePath; }

  private async read(): Promise<StoredBoard | null> {
    try {
      return parseStoredBoard(await readFile(this.filePath, "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  private async initialized(): Promise<StoredBoard> {
    return (await this.read()) ?? { initialized: true, notes: cloneSeeds(), comments: [] };
  }

  private async write(value: StoredBoard) {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(value, null, 2), "utf8");
    await rename(temporary, this.filePath);
  }

  private mutate<T>(operation: (board: StoredBoard) => T | Promise<T>): Promise<T> {
    const task = this.writeChain.then(async () => {
      const board = await this.initialized();
      const result = await operation(board);
      await this.write(board);
      return result;
    });
    this.writeChain = task.then(() => undefined, () => undefined);
    return task;
  }

  async snapshot(): Promise<BoardSnapshot> {
    const board = await this.read();
    return toSnapshot(board?.notes ?? cloneSeeds(), board?.comments ?? [], "local");
  }

  async createComment(input: NewComment): Promise<BoardSnapshot> {
    const comment = validateComment(input);
    return this.mutate((board) => {
      if (!board.notes.some((note) => note.id === comment.noteId)) throw new BoardStoreError("Note not found.", 404);
      board.comments.push({ ...comment, id: randomUUID(), createdAt: now() });
      return toSnapshot(board.notes, board.comments, "local");
    });
  }

  async saveNote(input: NoteInput): Promise<BoardSnapshot> {
    const note = validateNote(input);
    return this.mutate((board) => {
      const timestamp = now();
      const existing = note.id ? board.notes.find((item) => item.id === note.id) : undefined;
      if (note.id && !existing) throw new BoardStoreError("Note not found.", 404);
      const saved: BoardNote = {
        id: note.id ?? randomUUID(), title: note.title, body: note.body, color: note.color, status: note.status,
        ...(existing?.score !== undefined ? { score: existing.score } : {}),
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
      if (existing) Object.assign(existing, saved); else board.notes.push(saved);
      return toSnapshot(board.notes, board.comments, "local");
    });
  }

  async deleteNote(id: string): Promise<BoardSnapshot> {
    validateId(id);
    return this.mutate((board) => {
      const index = board.notes.findIndex((note) => note.id === id);
      if (index === -1) throw new BoardStoreError("Note not found.", 404);
      board.notes.splice(index, 1);
      board.comments = board.comments.filter((comment) => comment.noteId !== id);
      if (board.votes) delete board.votes[id];
      return toSnapshot(board.notes, board.comments, "local");
    });
  }

  setVote(noteId: string, voter: string, value: Vote): Promise<BoardSnapshot> {
    return this.mutate((board) => {
      const note = board.notes.find((item) => item.id === noteId);
      if (!note) throw new BoardStoreError("Note not found.", 404);
      board.votes ??= {};
      const votes = Object.hasOwn(board.votes, noteId) ? board.votes[noteId] : (board.votes[noteId] = {});
      note.score = (note.score ?? 0) + value - (votes[voter] ?? 0);
      if (value) votes[voter] = value;
      else delete votes[voter];
      return toSnapshot(board.notes, board.comments, "local");
    });
  }

  async deleteComment(id: string): Promise<BoardSnapshot> {
    validateId(id);
    return this.mutate((board) => {
      const index = board.comments.findIndex((comment) => comment.id === id);
      if (index === -1) throw new BoardStoreError("Comment not found.", 404);
      board.comments.splice(index, 1);
      return toSnapshot(board.notes, board.comments, "local");
    });
  }
}

function convexSettings() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  const siteUrl = process.env.BOARD_CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  const secret = process.env.BOARD_CONVEX_WRITE_SECRET;
  return { url, siteUrl, secret };
}

class ConvexBoardStore {
  constructor(private readonly settings: NonNullable<ReturnType<typeof convexSettings>>) {}

  async snapshot() {
    const client = new ConvexHttpClient(this.settings.url);
    return client.query(api.board.snapshot);
  }

  private async write(input: Record<string, unknown>) {
    const { siteUrl, secret } = this.settings;
    if (!siteUrl || !secret) throw new BoardStoreError("Board writes are unavailable.", 503);
    const response = await fetch(new URL("/board/write", siteUrl), {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) return { ok: true as const };
    if (response.status === 404 || response.status === 409 || response.status === 429) {
      const result = await response.json();
      throw new BoardStoreError(result.error, response.status);
    }
    throw new BoardStoreError("Board writes are unavailable.", 503);
  }

  createComment(input: NewComment, clientKey: string) {
    const clientHash = createHmac("sha256", this.settings.secret ?? "").update(clientKey).digest("hex");
    return this.write({ ...validateComment(input), action: "comment", id: randomUUID(), clientHash });
  }

  setVote(noteId: string, voter: string, value: Vote) {
    const hash = createHmac("sha256", this.settings.secret ?? "").update(voter).digest("hex");
    return this.write({ action: "vote", noteId, voter: hash, value });
  }

  saveNote(input: NoteInput) {
    const note = validateNote(input);
    return this.write({ ...note, action: "save-note", id: note.id ?? randomUUID(), isNew: !note.id });
  }

  deleteNote(id: string) {
    return this.write({ action: "delete-note", id: validateId(id) });
  }

  deleteComment(id: string) {
    return this.write({ action: "delete-comment", id: validateId(id) });
  }
}

const localStore = new LocalBoardStore(join(process.cwd(), ".data", "board.json"));
const preview = (): BoardSnapshot => toSnapshot(cloneSeeds(), [], "preview");

function activeStore() {
  const settings = convexSettings();
  if (settings) return new ConvexBoardStore(settings);
  return process.env.NODE_ENV === "production" ? null : localStore;
}

export async function getBoardSnapshot() {
  const store = activeStore();
  return store ? store.snapshot() : preview();
}

export async function createBoardComment(input: NewComment, clientKey = "anonymous") {
  const store = activeStore();
  if (!store) throw new BoardStoreError("Board is read-only in preview mode.", 503);
  return store instanceof ConvexBoardStore ? store.createComment(input, clientKey) : store.createComment(input);
}

export async function setBoardVote(noteId: unknown, voter: unknown, value: unknown) {
  const id = validateId(noteId);
  if (typeof voter !== "string" || !uuid.test(voter)) throw new BoardStoreError("Invalid voter.");
  if (value !== -1 && value !== 0 && value !== 1) throw new BoardStoreError("Invalid vote.");
  const store = activeStore();
  if (!store) throw new BoardStoreError("Board is read-only in preview mode.", 503);
  return store.setVote(id, voter.toLowerCase(), value);
}

export async function saveBoardNote(input: NoteInput) {
  const store = activeStore();
  if (!store) throw new BoardStoreError("Board is read-only in preview mode.", 503);
  return store.saveNote(input);
}

export async function deleteBoardNote(id: string) {
  const store = activeStore();
  if (!store) throw new BoardStoreError("Board is read-only in preview mode.", 503);
  return store.deleteNote(id);
}

export async function deleteBoardComment(id: string) {
  const store = activeStore();
  if (!store) throw new BoardStoreError("Board is read-only in preview mode.", 503);
  return store.deleteComment(id);
}
