"use client";

import { useId, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { noteColors, noteStatuses, statusLabels, type BoardComment, type BoardNote } from "@/lib/board";
import styles from "./board.module.css";

export type Mutate = (body: Record<string, unknown>) => Promise<void>;

export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return <dialog ref={ref} className={styles.dialog} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className={styles.dialogHeader}>
      <h2 id={titleId}>{title}</h2>
      <button type="button" onClick={() => onClose()} aria-label="Close dialog">×</button>
    </header>
    {children}
  </dialog>;
}

export function OwnerUnlock({ onUnlock }: { onUnlock: (key: string) => void }) {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/board/session", { headers: { Authorization: `Bearer ${key.trim()}` }, cache: "no-store" });
      if (!response.ok) throw new Error((await response.json()).error);
      onUnlock(key.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn’t unlock the board.");
    } finally {
      setBusy(false);
    }
  }

  return <form className={styles.form} onSubmit={unlock}>
    <label>Owner key<input type="password" required autoComplete="current-password" value={key} onChange={(event) => setKey(event.target.value)} /></label>
    {error && <p role="alert">{error}</p>}
    <button type="submit" disabled={busy || !key.trim()}>Unlock board</button>
  </form>;
}

export function NoteEditor({ note, disabled, mutate, onDone }: { note?: BoardNote; disabled: boolean; mutate: Mutate; onDone: (removed: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function write(input: Record<string, unknown>, removed: boolean) {
    setBusy(true);
    setError("");
    try {
      await mutate(input);
      onDone(removed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn’t update the sticky.");
    } finally {
      setBusy(false);
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void write({ action: "save-note", note: {
      ...(note ? { id: note.id } : {}),
      title: form.get("title"), body: form.get("body"), color: form.get("color"), status: form.get("status"),
    } }, false);
  }

  return <form className={styles.form} onSubmit={save}>
    <label>Title<input name="title" defaultValue={note?.title} maxLength={120} required /></label>
    <label>Description<textarea name="body" defaultValue={note?.body} rows={5} maxLength={2000} /></label>
    <div className={styles.fields}>
      <label>Paper color<select name="color" defaultValue={note?.color ?? "yellow"}>{noteColors.map((color) => <option key={color} value={color}>{color[0].toUpperCase() + color.slice(1)}</option>)}</select></label>
      <label>Status<select name="status" defaultValue={note?.status ?? "idea"}>{noteStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
    </div>
    {error && <p role="alert">{error}</p>}
    <div className={styles.formActions}>
      <button type="submit" disabled={disabled || busy}>Save sticky</button>
      {note && !confirmDelete && <button type="button" disabled={disabled || busy} onClick={() => setConfirmDelete(true)}>Delete sticky</button>}
    </div>
    {note && confirmDelete && <div className={styles.form}>
      <p>Delete this sticky and its comments?</p>
      <div className={styles.formActions}>
        <button type="button" disabled={disabled || busy} onClick={() => void write({ action: "delete-note", id: note.id }, true)}>Confirm delete</button>
        <button type="button" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</button>
      </div>
    </div>}
  </form>;
}

export function Comments({ noteId, comments, canModerate, writable, mutate }: {
  noteId: string; comments: BoardComment[]; canModerate: boolean; writable: boolean; mutate: Mutate;
}) {
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function write(input: Record<string, unknown>, success: () => void) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await mutate(input);
      success();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn’t update comments.");
    } finally {
      setBusy(false);
    }
  }

  function post(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void write({ action: "comment", noteId, name: form.get("name"), body, website: form.get("website") }, () => {
      setBody("");
      setNotice("Comment posted.");
    });
  }

  async function copyLink() {
    const url = new URL("/board", window.location.origin);
    url.searchParams.set("idea", noteId);
    try {
      await navigator.clipboard.writeText(url.href);
      setNotice("Link copied.");
    } catch {
      setNotice("Couldn’t copy the link.");
    }
  }

  return <>
    <button type="button" className={styles.shareLink} onClick={() => void copyLink()}>Copy idea link</button>
    {comments.length ? <ol className={styles.comments}>{comments.map((comment) => <li key={comment.id}>
      <p><strong>{comment.name}</strong></p>
      <p>{comment.body}</p>
      {canModerate && <button type="button" disabled={!writable || busy} onClick={() => void write({ action: "delete-comment", id: comment.id }, () => setNotice("Comment removed."))}>Remove comment by {comment.name}</button>}
    </li>)}</ol> : <p>No comments yet.</p>}
    <form className={styles.form} onSubmit={post}>
      <label>Name<input name="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="nickname" maxLength={60} required /></label>
      <label>Comment<textarea name="comment" value={body} onChange={(event) => setBody(event.target.value)} rows={3} maxLength={1000} required readOnly={busy} /></label>
      <label hidden>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className={styles.formActions}><button type="submit" disabled={!writable || busy || !name.trim() || !body.trim()}>Post comment</button><span>Comments are public.</span></div>
    </form>
    {!writable && <p>Posting is unavailable while the board is offline or in preview.</p>}
    {error && <p role="alert">{error}</p>}
    <p role="status">{notice}</p>
  </>;
}
