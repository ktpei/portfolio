"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useDesktopPreference } from "./use-desktop-preference";
import styles from "./stickies.module.css";

export type StickyColor = "yellow" | "blue" | "pink" | "green" | "purple" | "gray";
export type StickyPlacement = { id: string; title: string; x: number; y: number; width: number; height: number };

export function StickyWindow({ note, color, active, order, collapsed, onActivate, onClose, onCollapse, bodyClassName, titleBarActions, children }: { note: StickyPlacement; color: StickyColor; active: boolean; order: number; collapsed: boolean; onActivate: () => void; onClose: () => void; onCollapse: () => void; bodyClassName?: string; titleBarActions?: ReactNode; children: ReactNode }) {
  const space = note.id.startsWith("idea-") ? "board" : "portfolio";
  const [offset, setOffset] = useDesktopPreference(`window:${space}:${note.id}:offset`, { x: 0, y: 0 });
  const [size, setSize] = useDesktopPreference<{ width: number; height: number } | null>(`window:${space}:${note.id}:size`, null);
  const ref = useRef<HTMLElement>(null);
  const gesture = useRef<{ kind: "move" | "resize"; x: number; y: number; left: number; top: number; width: number; height: number; originX: number; originY: number; viewport: DOMRect } | null>(null);

  function start(event: React.PointerEvent<HTMLElement>, kind: "move" | "resize") {
    if (event.button !== 0 || !matchMedia("(min-width: 1000px)").matches || !ref.current) return;
    if (kind === "move" && (event.target as HTMLElement).closest("button")) return;
    const viewport = ref.current.closest(`.${styles.spaces}`)?.getBoundingClientRect();
    if (!viewport) return;
    event.preventDefault();
    if (kind === "move") event.currentTarget.focus({ preventScroll: true });
    const rect = ref.current.getBoundingClientRect();
    gesture.current = { kind, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height, originX: offset.x, originY: offset.y, viewport };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event: React.PointerEvent<HTMLElement>) {
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "resize") {
      setSize({ width: Math.max(240, Math.min(g.width + event.clientX - g.x, g.viewport.right - g.left - 12)), height: Math.max(130, Math.min(g.height + event.clientY - g.y, 850)) });
    } else {
      setOffset({ x: g.originX + Math.max(g.viewport.left + 12 - g.left, Math.min(event.clientX - g.x, g.viewport.right - g.left - g.width - 12)), y: g.originY + Math.max(g.viewport.top - g.top, Math.min(event.clientY - g.y, g.viewport.bottom - g.top - 28)) });
    }
  }

  return <article ref={ref} id={note.id} tabIndex={-1} aria-label={`${note.title} note`} onPointerDown={onActivate} onFocusCapture={onActivate} className={`${styles.note} ${styles[color]} ${active ? styles.active : ""} ${collapsed ? styles.collapsed : ""}`} style={{ "--left": `${note.x}%`, "--top": space === "portfolio" ? `${note.y / 8.5}%` : `${note.y}px`, "--width": `${note.width}%`, "--height": space === "portfolio" ? `${note.height / 8.5}%` : `${note.height}px`, "--offset-x": `${offset.x}px`, "--offset-y": `${offset.y}px`, ...(size ? { "--width": `${size.width}px`, "--height": `${size.height}px` } : {}), zIndex: order } as CSSProperties}>
    <header className={styles.noteBar} tabIndex={0} aria-label={`${note.title} title bar. Arrow keys move the note; Shift and arrow keys resize it.`} onKeyDown={(event) => {
      if (event.target !== event.currentTarget || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) || !matchMedia("(min-width: 1000px)").matches || !ref.current) return;
      const viewport = ref.current.closest(`.${styles.spaces}`)?.getBoundingClientRect();
      if (!viewport) return;
      event.preventDefault();
      const rect = ref.current.getBoundingClientRect();
      const dx = event.key === "ArrowLeft" ? -10 : event.key === "ArrowRight" ? 10 : 0;
      const dy = event.key === "ArrowUp" ? -10 : event.key === "ArrowDown" ? 10 : 0;
      if (event.shiftKey) {
        if (!collapsed) setSize({ width: Math.max(240, Math.min(rect.width + dx, viewport.right - rect.left - 12)), height: Math.max(130, Math.min(rect.height + dy, 850)) });
      } else setOffset((previous) => ({ x: previous.x + Math.max(viewport.left + 12 - rect.left, Math.min(dx, viewport.right - rect.right - 12)), y: previous.y + Math.max(viewport.top - rect.top, Math.min(dy, viewport.bottom - rect.top - 28)) }));
    }} onPointerDown={(event) => start(event, "move")} onPointerMove={move} onPointerUp={() => { gesture.current = null; }} onPointerCancel={() => { gesture.current = null; }} onDoubleClick={(event) => { if (!(event.target as HTMLElement).closest("button")) onCollapse(); }}>
      <button type="button" className={styles.closeControl} aria-label={`Close ${note.title}`} title="Close note" onClick={onClose}><span /></button>
      <span className={styles.noteTitle}>{note.title}</span>
      {titleBarActions}
      <button type="button" className={styles.collapseControl} aria-label={`${collapsed ? "Expand" : "Collapse"} ${note.title}`} title={collapsed ? "Expand note" : "Collapse note"} onClick={onCollapse} aria-expanded={!collapsed}><span /></button>
    </header>
    {!collapsed && <><div className={bodyClassName ? `${styles.noteBody} ${bodyClassName}` : styles.noteBody} inert={space === "portfolio"} tabIndex={space === "board" ? 0 : undefined} role="region" aria-label={`${note.title} content`}>{children}</div><span className={styles.resizeGrip} aria-hidden="true" onPointerDown={(event) => start(event, "resize")} onPointerMove={move} onPointerUp={() => { gesture.current = null; }} onPointerCancel={() => { gesture.current = null; }} /></>}
  </article>;
}
