"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ConvexProvider, ConvexReactClient, useConvexConnectionState, useQueries } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { notePlainText, parseNoteText, seedNotes, type BoardNote, type BoardSnapshot } from "@/lib/board";
import { StickyWindow } from "../stickies/sticky-window";
import stickyStyles from "../stickies/stickies.module.css";
import { Comments, Dialog, NoteEditor, OwnerUnlock, type Mutate } from "./board-dialogs";
import styles from "./board.module.css";

type Connection = "loading" | "online" | "offline";
type BoardProps = { active: boolean };
type LiveBoard = { snapshot?: BoardSnapshot; connection: Connection };
type BoardDialog = { kind: "unlock" | "new" } | { kind: "edit" | "comments"; id: string };

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;
const boardQuery = { snapshot: { query: api.board.snapshot, args: {} } };
const noQueries = {};
const voterKey = "portfolio-board-voter";

function readLike(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function NoteText({ text }: { text: string }) {
  return parseNoteText(text).map((part, index) => typeof part === "string" ? part : (
    <a key={index} href={part.href} target="_blank" rel="noopener noreferrer">{part.label}</a>
  ));
}

export function BulletinBoard(props: BoardProps) {
  return convex
    ? <ConvexProvider client={convex}><LiveBulletinBoard {...props} /></ConvexProvider>
    : <BoardView {...props} />;
}

function LiveBulletinBoard(props: BoardProps) {
  const { active } = props;
  const { snapshot } = useQueries(active ? boardQuery : noQueries);
  const { isWebSocketConnected, hasEverConnected, connectionRetries } = useConvexConnectionState();
  const connection = snapshot instanceof Error || (!isWebSocketConnected && (hasEverConnected || connectionRetries > 0))
    ? "offline"
    : snapshot && isWebSocketConnected ? "online" : "loading";
  return <BoardView {...props} live={{ snapshot: snapshot instanceof Error ? undefined : snapshot, connection }} />;
}

function BoardView({ active, live }: BoardProps & { live?: LiveBoard }) {
  const [data, setData] = useState<BoardSnapshot>({ notes: seedNotes, comments: [], mode: "preview" });
  const [localConnection, setConnection] = useState<Connection>("loading");
  const [closed, setClosed] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [stack, setStack] = useState<string[]>([]);
  const [arrangement, setArrangement] = useState(0);
  const [dialog, setDialog] = useState<BoardDialog | null>(null);
  const [ownerKey, setOwnerKey] = useState("");
  const [reactionError, setReactionError] = useState("");
  const arrangeButton = useRef<HTMLButtonElement>(null);
  const ownerButton = useRef<HTMLButtonElement>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);
  if (!active && dialog) setDialog(null);
  if (live?.snapshot && live.snapshot !== data) setData(live.snapshot);
  const connection = live?.connection ?? localConnection;
  const isLive = live !== undefined;
  const requestVersion = useRef(0);
  const refreshing = useRef(false);
  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    const version = ++requestVersion.current;
    try {
      const response = await fetch("/api/board", { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("Unavailable");
      const snapshot: BoardSnapshot = await response.json();
      if (version === requestVersion.current) { setData(snapshot); setConnection("online"); }
    } catch { if (version === requestVersion.current) setConnection("offline"); }
    finally { refreshing.current = false; }
  }, []);
  useEffect(() => {
    if (!active || isLive) return;
    const requests = requestVersion;
    const initial = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 3000);
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearTimeout(initial); clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); requests.current++; };
  }, [active, isLive, refresh]);

  async function mutate(body: Record<string, unknown>) {
    requestVersion.current++;
    const response = await fetch("/api/board", {
      method: "POST", headers: { "Content-Type": "application/json", ...(ownerKey ? { Authorization: `Bearer ${ownerKey}` } : {}) }, body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Couldn’t save that. Please try again.");
    if (isLive) return;
    requestVersion.current++;
    setData(result as BoardSnapshot);
    setConnection("online");
  }

  // Older boards may still have the original catch-all note.
  const notes = data.notes.filter((note) => note.id !== "small-experiments" || note.title !== "Other rabbit holes");

  const linkedNote = useRef<string | null>(null);
  useEffect(() => {
    if (!active) {
      linkedNote.current = null;
      return;
    }
    const id = new URLSearchParams(window.location.search).get("idea");
    if (!id || linkedNote.current === id) return;
    const frame = requestAnimationFrame(() => {
      const note = document.getElementById(`idea-${id}`);
      if (!note) return;
      linkedNote.current = id;
      note.focus({ preventScroll: true });
      note.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [active, data.notes]);

  function activate(id: string) {
    setStack((previous) => previous.at(-1) === id ? previous : [...previous.filter((item) => item !== id), id]);
  }

  function arrangeAll() {
    setClosed([]);
    setCollapsed([]);
    setStack([]);
    setArrangement((value) => value + 1);
  }

  function closeNote(id: string) {
    setClosed((previous) => [...previous, id]);
    setStack((previous) => previous.filter((item) => item !== id));
    arrangeButton.current?.focus();
  }

  function toggleCollapsed(id: string) {
    setCollapsed((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
  }

  const visibleNotes = notes.filter((note) => !closed.includes(note.id));
  const selectedNote = dialog && "id" in dialog ? notes.find((note) => note.id === dialog.id) : undefined;
  const writable = data.mode !== "preview" && connection === "online";
  function openDialog(next: BoardDialog, trigger: HTMLElement) {
    dialogTrigger.current = trigger;
    setDialog(next);
  }

  function closeDialog(focusTarget = dialogTrigger.current) {
    setDialog(null);
    requestAnimationFrame(() => (focusTarget?.isConnected ? focusTarget : arrangeButton.current)?.focus());
  }

  return <section className={styles.board} aria-label="Idea board">
    <div className={styles.toolbar}>
      <h1>Idea board</h1>
      {ownerKey && <button type="button" aria-haspopup="dialog" disabled={!writable} onClick={(event) => openDialog({ kind: "new" }, event.currentTarget)}>New sticky</button>}
      <button type="button" ref={arrangeButton} onClick={arrangeAll}>Arrange all notes</button>
      {data.mode !== "preview" && <button type="button" ref={ownerButton} aria-haspopup={ownerKey ? undefined : "dialog"} onClick={(event) => ownerKey ? setOwnerKey("") : openDialog({ kind: "unlock" }, event.currentTarget)}>{ownerKey ? "Sign out" : "Owner access"}</button>}
    </div>
    {connection === "offline" && <p role="status" className={styles.notice}>Reconnecting to the board. Showing the last loaded ideas.</p>}
    {reactionError && <p role="alert" className={styles.notice}>{reactionError}</p>}
    {visibleNotes.length ? <div className={`${stickyStyles.workspace} ${styles.workspace}`} style={{ "--rows": Math.ceil(notes.length / 3) } as CSSProperties}>
      {notes.map((note, position) => {
        if (closed.includes(note.id)) return null;
        const title = notePlainText(note.title);
        const column = position % 3;
        const row = Math.floor(position / 3);
        return <StickyWindow
          key={`${note.id}-${arrangement}`}
          note={{ id: `idea-${note.id}`, title, x: 3 + column * 33, y: 24 + row * 222 + (column === 1 ? 18 : 0), width: 28, height: 184 }}
          color={note.color === "lavender" ? "purple" : note.color}
          active={stack.at(-1) === note.id}
          order={notes.length + stack.indexOf(note.id) + 1}
          collapsed={collapsed.includes(note.id)}
          onActivate={() => activate(note.id)}
          onClose={() => closeNote(note.id)}
          onCollapse={() => toggleCollapsed(note.id)}
          bodyClassName={styles.ideaBody}
          titleBarActions={<>
            <NoteLike note={note} disabled={!writable} mutate={mutate} onError={setReactionError} />
            <button type="button" className={styles.comment} title="Comments" aria-label="Comments" aria-haspopup="dialog" onClick={(event) => openDialog({ kind: "comments", id: note.id }, event.currentTarget)}>
              <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a7 7 0 0 1-7 7H9l-5 3 1.5-5.5A7 7 0 0 1 11 4h2a7 7 0 0 1 7 7Z" /></svg>
            </button>
          </>}
        >
          <h2 className={note.status === "shelved" ? styles.shelved : undefined}><NoteText text={note.title} /></h2>
          {note.body && <p className={styles.description}><NoteText text={note.body} /></p>}
          {ownerKey && <button type="button" className={styles.edit} aria-haspopup="dialog" disabled={!writable} onClick={(event) => openDialog({ kind: "edit", id: note.id }, event.currentTarget)}>Edit</button>}
        </StickyWindow>;
      })}
    </div> : <p className={styles.notice}>{notes.length ? "All notes are closed." : "No ideas here."}</p>}
    {dialog?.kind === "unlock" && <Dialog title="Owner access" onClose={closeDialog}>
      <OwnerUnlock onUnlock={(key) => { setOwnerKey(key); closeDialog(ownerButton.current); }} />
    </Dialog>}
    {(dialog?.kind === "new" || dialog?.kind === "edit") && <Dialog title={dialog.kind === "edit" ? "Edit sticky" : "New sticky"} onClose={closeDialog}>
      {dialog.kind === "new" || selectedNote ? <NoteEditor note={selectedNote} disabled={!writable} mutate={mutate} onDone={(removed) => closeDialog(removed ? arrangeButton.current : dialogTrigger.current)} /> : <p>This sticky was removed.</p>}
    </Dialog>}
    {dialog?.kind === "comments" && <Dialog title={selectedNote ? `Comments on ${notePlainText(selectedNote.title)}` : "Comments"} onClose={closeDialog}>
      {selectedNote ? <Comments noteId={selectedNote.id} comments={data.comments.filter((comment) => comment.noteId === selectedNote.id)}
        canModerate={!!ownerKey} writable={writable} mutate={mutate} /> : <p>This sticky was removed.</p>}
    </Dialog>}
  </section>;
}

function NoteLike({ note, disabled, mutate, onError }: { note: BoardNote; disabled: boolean; mutate: Mutate; onError: (message: string) => void }) {
  const voteKey = `portfolio-board-vote:${note.id}`;
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const initial = setTimeout(() => setLiked(readLike(voteKey)), 0);
    function sync(event: StorageEvent) {
      if (event.key === voteKey || event.key === null) setLiked(readLike(voteKey));
    }
    window.addEventListener("storage", sync);
    return () => { clearTimeout(initial); window.removeEventListener("storage", sync); };
  }, [voteKey]);

  async function toggleLike() {
    setBusy(true);
    onError("");
    try {
      const voter = localStorage.getItem(voterKey) ?? crypto.randomUUID();
      localStorage.setItem(voterKey, voter);
      const value = readLike(voteKey) ? 0 : 1;
      await mutate({ action: "vote", noteId: note.id, voter, value });
      localStorage.setItem(voteKey, String(value));
      setLiked(value === 1);
    } catch {
      onError("Couldn’t save your reaction. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className={styles.heart} title={liked ? "Unlike" : "Like"} aria-label="Like this idea" aria-pressed={liked} disabled={disabled || busy} onClick={() => void toggleLike()}>
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
    </button>
  );
}
