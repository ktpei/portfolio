import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import {
  noteColors,
  noteStatuses,
  seedNotes,
  type BoardComment,
  type BoardNote,
  type BoardSnapshot,
  type NoteColor,
  type NoteStatus,
} from "./board";

type BoardMode = BoardSnapshot["mode"];
type StoredBoard = { initialized: true; notes: BoardNote[]; comments: BoardComment[] };
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

function cleanText(value: unknown, label: string, max: number) {
  if (typeof value !== "string") throw new BoardStoreError(`${label} is required.`);
  const trimmed = value.trim();
  if (!trimmed) throw new BoardStoreError(`${label} is required.`);
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
    body: cleanText(input.body, "Body", MAX_NOTE_BODY),
    color: input.color,
    status: input.status,
  };
}

export function validateId(id: unknown) {
  if (!isSafeId(id)) throw new BoardStoreError("Invalid ID.");
  return id;
}

function toSnapshot(notes: BoardNote[], comments: BoardComment[], mode: BoardMode): BoardSnapshot {
  return { notes, comments, mode };
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

type SupabaseRow = Record<string, unknown>;

function configuredSupabase() {
  const url = process.env.BOARD_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.BOARD_SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

function noteFromRow(row: SupabaseRow): BoardNote {
  return { id: String(row.id), title: String(row.title), body: String(row.body), color: row.color as NoteColor, status: row.status as NoteStatus, createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
}

function commentFromRow(row: SupabaseRow): BoardComment {
  return { id: String(row.id), noteId: String(row.note_id), name: String(row.name), body: String(row.body), createdAt: String(row.created_at) };
}

class SupabaseBoardStore {
  private readonly settings: { url: string; key: string };

  constructor(settings: { url: string; key: string }) { this.settings = settings; }

  private async request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${this.settings.url}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: this.settings.key, Authorization: `Bearer ${this.settings.key}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
      cache: "no-store",
    });
    if (!response.ok) throw new BoardStoreError("Board database is unavailable.", 503);
    return response;
  }

  private async initialize() {
    await this.request("rpc/initialize_board", {
      method: "POST",
      body: JSON.stringify({
        p_notes: cloneSeeds().map((note) => ({ id: note.id, title: note.title, body: note.body, color: note.color, status: note.status, created_at: note.createdAt, updated_at: note.updatedAt })),
      }),
    });
  }

  async snapshot(): Promise<BoardSnapshot> {
    await this.initialize();
    const [notesResponse, commentsResponse] = await Promise.all([
      this.request("board_notes?select=*&order=created_at.asc"),
      // The public board intentionally exposes a bounded, newest-first window.
      this.request("board_comments?select=*&order=created_at.desc&limit=1000"),
    ]);
    const notes = (await notesResponse.json() as SupabaseRow[]).map(noteFromRow);
    const comments = (await commentsResponse.json() as SupabaseRow[]).map(commentFromRow).reverse();
    return toSnapshot(notes, comments, "connected");
  }

  async createComment(input: NewComment, clientKey: string) {
    const comment = validateComment(input);
    await this.initialize();
    const note = await this.request(`board_notes?id=eq.${encodeURIComponent(comment.noteId)}&select=id&limit=1`);
    if (!(await note.json() as SupabaseRow[]).length) throw new BoardStoreError("Note not found.", 404);
    const response = await this.request("rpc/create_board_comment", {
      method: "POST",
      body: JSON.stringify({
        p_id: randomUUID(), p_note_id: comment.noteId, p_name: comment.name, p_body: comment.body,
        p_client_hash: createHash("sha256").update(clientKey).digest("hex"),
      }),
    });
    if ((await response.json()) !== true) throw new BoardStoreError("Please wait before posting another comment.", 429);
    return this.snapshot();
  }

  async saveNote(input: NoteInput) {
    const note = validateNote(input);
    await this.initialize();
    const id = note.id ?? randomUUID();
    const existing = note.id ? (await this.request(`board_notes?id=eq.${encodeURIComponent(id)}&select=created_at`)).json() as Promise<SupabaseRow[]> : Promise.resolve([]);
    const rows = await existing;
    if (note.id && !rows.length) throw new BoardStoreError("Note not found.", 404);
    const record = { title: note.title, body: note.body, color: note.color, status: note.status, updated_at: now() };
    if (note.id) await this.request(`board_notes?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(record) });
    else await this.request("board_notes", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ id, ...record }) });
    return this.snapshot();
  }

  async deleteNote(id: string) {
    validateId(id);
    await this.initialize();
    const response = await this.request(`board_notes?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=representation" } });
    if (!(await response.json() as SupabaseRow[]).length) throw new BoardStoreError("Note not found.", 404);
    return this.snapshot();
  }

  async deleteComment(id: string) {
    validateId(id);
    const response = await this.request(`board_comments?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=representation" } });
    if (!(await response.json() as SupabaseRow[]).length) throw new BoardStoreError("Comment not found.", 404);
    return this.snapshot();
  }
}

const localStore = new LocalBoardStore(join(process.cwd(), ".data", "board.json"));
const preview = (): BoardSnapshot => toSnapshot(cloneSeeds(), [], "preview");

function activeStore() {
  const settings = configuredSupabase();
  if (settings) return new SupabaseBoardStore(settings);
  return process.env.NODE_ENV === "production" ? null : localStore;
}

export async function getBoardSnapshot() {
  const store = activeStore();
  return store ? store.snapshot() : preview();
}

export async function createBoardComment(input: NewComment, clientKey = "anonymous") {
  const store = activeStore();
  if (!store) throw new BoardStoreError("Board is read-only in preview mode.", 503);
  return store instanceof SupabaseBoardStore ? store.createComment(input, clientKey) : store.createComment(input);
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
