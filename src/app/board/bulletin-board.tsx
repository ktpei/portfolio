"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { noteColors, noteStatuses, seedNotes, statusLabels, type BoardNote, type BoardSnapshot, type NoteColor, type NoteStatus } from "@/lib/board";
import styles from "./board.module.css";

type Filter = "all" | "active" | "shelved";
type Modal = { kind: "note"; id: string } | { kind: "edit"; note?: BoardNote } | { kind: "unlock" } | null;

function Icon({ name, size = 18 }: { name: "arrow" | "comment" | "search" | "close" | "plus" | "lock" | "note"; size?: number }) {
  const paths = { arrow: "M19 12H5m6-6-6 6 6 6", comment: "M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2v-10A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5Z", search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z", close: "m6 6 12 12M6 18 18 6", plus: "M12 5v14M5 12h14", lock: "M6 10h12v11H6zM8 10V6a4 4 0 0 1 8 0v4", note: "M5 3h14v12l-6 6H5V3Zm8 18v-6h6" };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function Dialog({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={styles.dialogInner}>
      <button className={styles.closeButton} onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button>
      {children}
    </div>
  </dialog>;
}

export function BulletinBoard({ embedded = false, native = false }: { embedded?: boolean; native?: boolean }) {
  const [data, setData] = useState<BoardSnapshot>({ notes: seedNotes, comments: [], mode: "preview" });
  const [connection, setConnection] = useState<"loading" | "online" | "offline">("loading");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [token, setToken] = useState("");
  const [notice, setNotice] = useState("");
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
    const requests = requestVersion;
    const initial = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 3000);
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearTimeout(initial); clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); requests.current++; };
  }, [refresh]);

  async function mutate(body: Record<string, unknown>) {
    requestVersion.current++;
    const response = await fetch("/api/board", {
      method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Couldn’t save that. Please try again.");
    requestVersion.current++;
    setData(result as BoardSnapshot);
    setConnection("online");
  }

  const query = search.trim().toLowerCase();
  const visible = data.notes.filter((note) => (filter === "all" || (filter === "shelved" ? note.status === "shelved" : note.status !== "shelved")) && `${note.title} ${note.body}`.toLowerCase().includes(query));
  const selected = modal?.kind === "note" ? data.notes.find((note) => note.id === modal.id) : undefined;
  const liveLabel = connection === "loading" ? "Connecting…" : connection === "offline" ? "Reconnecting…" : data.mode === "connected" ? "Live board" : data.mode === "local" ? "Local board" : "Board preview";
  const writable = connection === "online" && data.mode !== "preview";
  const BoardContent = embedded ? "section" : "main";

  return <div className={`${styles.page} ${embedded ? styles.embedded : ""} ${native ? styles.native : ""}`}>
    {!embedded && <a href="#board-main" className="skip-link">Skip to the board</a>}
    {!embedded && <header className={styles.header}>
      <Link href="/" className={styles.wordmark}>KEVIN PEI<span>.</span></Link>
      <Link href="/" className={styles.backLink}><Icon name="arrow" size={15} /> Back to portfolio</Link>
    </header>}
    <BoardContent id={!embedded ? "board-main" : undefined} className={styles.main} tabIndex={!embedded ? -1 : undefined} aria-label={embedded ? "Stickies" : undefined}>
      <div className={styles.intro}>
        <div>
          {embedded ? <><h1>{native ? "Idea board" : "Stickies"}</h1><p className={styles.description}>Loose thoughts, rabbit holes, and things I might build.</p></> : <><p className={styles.eyebrow}><span className={styles.tinyNote} aria-hidden="true" /> A LITTLE CORNER OF MY BRAIN</p><h1>The idea <em>board.</em></h1><p className={styles.description}>Loose thoughts, rabbit holes, and things I might build.<br className={styles.desktopBreak} /> Pulled from my stickies. Always a work in progress.</p></>}
        </div>
        {!embedded && <div className={styles.marginNote} aria-hidden="true">Something catch your eye?<br />Open a sticky & leave a thought.<svg viewBox="0 0 110 55" fill="none"><path d="M12 8c55-8 77 7 71 35m-10-8 10 10 13-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg></div>}
      </div>
      <div className={styles.toolbar}>
        <div className={styles.filters} aria-label="Filter ideas">
          {([['all', 'All stickies'], ['active', 'On my mind'], ['shelved', 'Back burner']] as const).map(([value, label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? styles.filterSelected : ""} onClick={() => setFilter(value)}>{label}{value === "all" && <span>{data.notes.length}</span>}</button>)}
        </div>
        <label className={styles.search}><Icon name="search" size={16} /><span className={styles.srOnly}>Search stickies</span><input type="search" placeholder="Find a thought…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      </div>
      <div className={styles.boardMeta}>
        <p><span className={`${styles.liveDot} ${connection === "online" && data.mode === "connected" ? styles.isLive : ""}`} />{liveLabel}<span className={styles.metaDivider}>/</span>{data.mode === "preview" ? "A peek at what’s on my mind" : "Updates every few seconds"}</p>
        {token ? <div className={styles.ownerActions}><button onClick={() => setModal({ kind: "edit" })} className={styles.addButton}><Icon name="plus" size={16} /> Add a sticky</button>{embedded && <button className={styles.addButton} onClick={() => { setToken(""); setNotice("Signed out of owner mode."); }}>Leave owner mode</button>}</div> : embedded ? <button onClick={() => setModal({ kind: "unlock" })} className={styles.addButton}><Icon name="lock" size={14} /> Owner access</button> : <span className={styles.noteHint}>Little notes. Possibilities.</span>}
      </div>
      {connection === "offline" && <p role="status" className={styles.banner}>The board couldn’t reconnect. Showing the last loaded notes; we’ll keep trying.</p>}
      <div className={styles.board} aria-label="Project idea stickies">
        {visible.map((note, index) => {
          const count = data.comments.filter((comment) => comment.noteId === note.id).length;
          return <button key={note.id} onClick={() => setModal({ kind: "note", id: note.id })} className={`${styles.sticky} ${styles[note.color]} ${note.status === "shelved" ? styles.shelved : ""}`} style={{ "--rotation": `${[-1.5, 1.2, -0.8, 1.8, 0.6, -1.3][index % 6]}deg` } as React.CSSProperties}>
            <span className={styles.tape} aria-hidden="true" />
            <span className={styles.stickyTop}><span className={styles.category}>{statusLabels[note.status]}</span><span className={styles.noteNumber}>{String(data.notes.indexOf(note) + 1).padStart(2, "0")}</span></span>
            <h2>{note.title}</h2>
            <p className={styles.noteBody}>{note.body}</p>
            <span className={styles.stickyBottom}><span><Icon name="comment" size={16} />{count ? `${count} ${count === 1 ? "thought" : "thoughts"}` : "Leave a thought"}</span><span aria-hidden="true">↗</span></span>
          </button>;
        })}
        {visible.length === 0 && <div className={styles.empty}><Icon name="note" size={32} /><h2>No stickies here yet.</h2><p>{query ? "Try a different word or clear your search." : "Ideas will land here as the board grows."}</p><button onClick={() => { setSearch(""); setFilter("all"); }}>Show all stickies</button></div>}
      </div>
      <p className={styles.boardCaption}>Not a roadmap. Just a place for ideas to take shape.</p>
    </BoardContent>
    {!embedded && <footer className={styles.footer}><span>A work in progress, by <Link href="/">Kevin Pei</Link>.</span><button onClick={() => { if (token) { setToken(""); setNotice("Signed out of owner mode."); } else setModal({ kind: "unlock" }); }}><Icon name="lock" size={13} />{token ? "Leave owner mode" : "Owner access"}</button></footer>}
    <span role="status" className={styles.srOnly}>{notice}</span>
    {modal?.kind === "note" && <Dialog title={selected?.title || "Sticky removed"} onClose={() => setModal(null)}>
      {selected ? <NoteDetail note={selected} comments={data.comments.filter((comment) => comment.noteId === selected.id)} canEdit={!!token} writable={writable} mutate={mutate} onEdit={() => setModal({ kind: "edit", note: selected })} /> : <><h2>This sticky has been removed.</h2><p>The board has updated since you opened it.</p></>}
    </Dialog>}
    {modal?.kind === "unlock" && <Dialog title="Owner access" onClose={() => setModal(null)}><OwnerUnlock onUnlock={(value) => { setToken(value); setModal(null); setNotice("Owner mode enabled."); }} /></Dialog>}
    {modal?.kind === "edit" && <Dialog title={modal.note ? "Edit sticky" : "Add a sticky"} onClose={() => setModal(null)}><NoteEditor key={modal.note?.id || "new"} note={modal.note} mutate={mutate} onDone={() => setModal(null)} /></Dialog>}
  </div>;
}

type Mutate = (body: Record<string, unknown>) => Promise<void>;
function NoteDetail({ note, comments, canEdit, writable, mutate, onEdit }: { note: BoardNote; comments: BoardSnapshot["comments"]; canEdit: boolean; writable: boolean; mutate: Mutate; onEdit: () => void }) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try { await mutate({ action: "comment", noteId: note.id, name, body, website }); setBody(""); setSuccess("Your thought is pinned. Thanks for adding to the idea!"); }
    catch (error) { setError(error instanceof Error ? error.message : "Couldn’t post your thought."); }
    finally { setBusy(false); }
  }
  async function removeComment(id: string) {
    setBusy(true); setError("");
    try { await mutate({ action: "delete-comment", id }); }
    catch (error) { setError(error instanceof Error ? error.message : "Couldn’t remove comment."); }
    finally { setBusy(false); }
  }
  return <>
    <div className={`${styles.detailNote} ${styles[note.color]}`}><span className={styles.category}>{statusLabels[note.status]}</span><h2>{note.title}</h2><p>{note.body}</p><div className={styles.detailMeta}><span>Kevin’s sticky</span>{canEdit && <button onClick={onEdit}>Edit sticky ↗</button>}</div></div>
    <div className={styles.conversation}><h3>Thoughts <span>{comments.length}</span></h3><p className={styles.conversationIntro}>A question, a suggestion, a “what if?” — all welcome.</p>
      {comments.length === 0 ? <p className={styles.noComments}>A fresh conversation. Yours could be the first.</p> : <ol className={styles.comments}>{comments.map((comment) => <li key={comment.id}><div><strong>{comment.name}</strong><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></div><p>{comment.body}</p>{canEdit && <button disabled={busy} onClick={() => void removeComment(comment.id)} className={styles.removeComment}>Remove comment</button>}</li>)}</ol>}
      {writable ? <form onSubmit={submit} className={styles.form}>
        <label htmlFor="comment-name">Your name<input id="comment-name" autoComplete="nickname" placeholder="What should I call you?" maxLength={60} required value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label htmlFor="comment-body">Your thought<textarea id="comment-body" placeholder="This makes me think of…" maxLength={1000} rows={3} required value={body} onChange={(event) => setBody(event.target.value)} /></label>
        <label className={styles.honeypot} aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
        <div className={styles.formBottom}><span>Public, so everyone can join in.</span><button type="submit" className={styles.primaryButton} disabled={busy || !name.trim() || !body.trim()}>{busy ? "Pinning…" : "Post thought ↗"}</button></div>
      </form> : <p className={styles.banner}>Comments are temporarily unavailable. Check back when the live board is connected.</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}{success && <p className={styles.success} role="status">{success}</p>}
    </div>
  </>;
}

function OwnerUnlock({ onUnlock }: { onUnlock: (token: string) => void }) {
  const [value, setValue] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/board/session", { headers: { Authorization: `Bearer ${value}` }, cache: "no-store" });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error || "That owner key didn’t work."); }
      onUnlock(value);
    } catch (error) { setError(error instanceof Error ? error.message : "Couldn’t unlock the board."); } finally { setBusy(false); }
  }
  return <div className={styles.editor}><p className={styles.eyebrow}>JUST FOR KEVIN</p><h2>A little tending to the board.</h2><p className={styles.conversationIntro}>Unlock to add ideas, edit stickies, and moderate comments.</p><form onSubmit={submit} className={styles.form}><label htmlFor="owner-key">Owner key<input id="owner-key" type="password" autoComplete="current-password" required value={value} onChange={(event) => setValue(event.target.value)} /></label>{error && <p role="alert" className={styles.error}>{error}</p>}<button className={styles.primaryButton} disabled={busy}>{busy ? "Unlocking…" : "Unlock board"}</button></form></div>;
}

function NoteEditor({ note, mutate, onDone }: { note?: BoardNote; mutate: Mutate; onDone: () => void }) {
  const [title, setTitle] = useState(note?.title || ""); const [body, setBody] = useState(note?.body || "");
  const [color, setColor] = useState<NoteColor>(note?.color || "yellow"); const [status, setStatus] = useState<NoteStatus>(note?.status || "idea");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [confirmDelete, setConfirmDelete] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { await mutate({ action: "save-note", note: { ...(note ? { id: note.id } : {}), title, body, color, status } }); onDone(); }
    catch (error) { setError(error instanceof Error ? error.message : "Couldn’t save sticky."); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError("");
    try { await mutate({ action: "delete-note", id: note?.id }); onDone(); }
    catch (error) { setError(error instanceof Error ? error.message : "Couldn’t remove sticky."); } finally { setBusy(false); }
  }
  return <div className={styles.editor}><p className={styles.eyebrow}>MAKE ROOM FOR A THOUGHT</p><h2>{note ? "Edit this sticky." : "A new possibility."}</h2><form className={styles.form} onSubmit={save}>
    <label htmlFor="note-title">Title<input id="note-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required /></label>
    <label htmlFor="note-body">The idea<textarea id="note-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={5} required /></label>
    <label htmlFor="note-status">Where it’s at<select id="note-status" value={status} onChange={(event) => setStatus(event.target.value as NoteStatus)}>{noteStatuses.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select></label>
    <fieldset className={styles.colorPicker}><legend>Paper color</legend>{noteColors.map((value) => <label key={value} className={styles[value]}><input type="radio" name="color" value={value} checked={color === value} onChange={() => setColor(value)} /><span className={styles.srOnly}>{value}</span><span aria-hidden="true">{color === value ? "✓" : ""}</span></label>)}</fieldset>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <button className={styles.primaryButton} disabled={busy}>{busy ? "Saving…" : "Pin to the board ↗"}</button>
  </form>{note && <div className={styles.deleteZone}>{confirmDelete ? <><p>Remove this sticky and all its comments?</p><button disabled={busy} onClick={() => void remove()}>Yes, remove it</button><button disabled={busy} onClick={() => setConfirmDelete(false)}>Keep it</button></> : <button onClick={() => setConfirmDelete(true)}>Remove sticky</button>}</div>}</div>;
}
