"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { education, intro, links, projects, site, skills, work } from "@/content";
import { Wallpapers } from "./wallpapers";
import styles from "./stickies.module.css";

type Color = "yellow" | "blue" | "pink" | "green" | "purple" | "gray";
type NoteId = "about" | "work" | "projects" | "contact" | "education" | "toolkit";
type Note = { id: NoteId; title: string; color: Color; x: number; y: number; width: number; height: number };
const colors: Color[] = ["yellow", "blue", "pink", "green", "purple", "gray"];
const notes: Note[] = [
  { id: "about", title: "Hello, I’m Kevin.", color: "yellow", x: 3, y: 52, width: 28, height: 330 },
  { id: "work", title: "Where I’ve been working", color: "blue", x: 36, y: 91, width: 29, height: 456 },
  { id: "projects", title: "Things I’ve built", color: "pink", x: 69, y: 48, width: 28, height: 475 },
  { id: "contact", title: "Let’s keep in touch", color: "green", x: 5, y: 431, width: 27, height: 242 },
  { id: "education", title: "A note on school", color: "purple", x: 37, y: 595, width: 28, height: 210 },
  { id: "toolkit", title: "My toolkit", color: "gray", x: 70, y: 577, width: 27, height: 240 },
];

function NoteContent({ id }: { id: NoteId }) {
  if (id === "about") return <><h1>Hello, I’m Kevin.</h1><p>{site.role}<br />{site.location}</p><p>{intro[0]}</p><p>Computer science at NYU.<br />Currently at Korr Insurtech and NYU’s High Speed Research Lab.</p><p><Link href="/board">My idea board</Link></p></>;
  if (id === "work") return <><h2>Where I’ve been working</h2>{work.map((entry) => <section key={entry.org} className={styles.entry}><h3>{entry.href ? <a href={entry.href} target="_blank" rel="noreferrer">{entry.org}</a> : entry.org}</h3><p>{entry.role}<br /><span className={styles.meta}>{entry.period}</span></p><ul>{entry.points.map((point) => <li key={point}>{point}</li>)}</ul></section>)}</>;
  if (id === "projects") return <><h2>Things I’ve built</h2>{projects.map((project) => <section key={project.name} className={styles.entry}><h3>{project.href ? <a href={project.href} target="_blank" rel="noreferrer">{project.name} ↗</a> : project.name}</h3><p className={styles.meta}>{project.award}</p><p>{project.blurb}</p><details><summary>Build notes</summary><ul>{project.points.map((point) => <li key={point}>{point}</li>)}</ul><p className={styles.meta}>{project.stack.join(" · ")}<br />{project.period}</p></details></section>)}</>;
  if (id === "contact") return <><h2>Let’s keep in touch</h2><p>{links.map((link) => <span className={styles.linkLine} key={link.label}><a href={link.href} target={link.href.startsWith("mailto") ? undefined : "_blank"} rel="noreferrer">{link.label === "Email" ? link.display : link.label}</a></span>)}</p>{site.status && <p className={styles.meta}>{site.status}</p>}</>;
  if (id === "education") return <><h2>A note on school</h2><p><strong>{education.school}</strong><br />{education.degree}</p><p>{education.detail}<br />{education.period}</p></>;
  return <><h2>My toolkit</h2>{skills.map((group) => <p key={group.group}><strong>{group.group}</strong><br />{group.items.join(", ")}</p>)}</>;
}

function StickyWindow({ note, color, active, order, collapsed, onActivate, onClose, onCollapse, children }: { note: Note; color: Color; active: boolean; order: number; collapsed: boolean; onActivate: () => void; onClose: () => void; onCollapse: () => void; children: ReactNode }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const ref = useRef<HTMLElement>(null);
  const gesture = useRef<{ kind: "move" | "resize"; x: number; y: number; left: number; top: number; width: number; height: number; originX: number; originY: number; viewportWidth: number } | null>(null);

  function start(event: React.PointerEvent<HTMLElement>, kind: "move" | "resize") {
    if (event.button !== 0 || !matchMedia("(min-width: 1000px)").matches || !ref.current) return;
    if (kind === "move" && (event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    onActivate();
    const rect = ref.current.getBoundingClientRect();
    gesture.current = { kind, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height, originX: offset.x, originY: offset.y, viewportWidth: document.documentElement.clientWidth };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event: React.PointerEvent<HTMLElement>) {
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "resize") {
      setSize({ width: Math.max(240, Math.min(g.width + event.clientX - g.x, g.viewportWidth - g.left - 12)), height: Math.max(130, Math.min(g.height + event.clientY - g.y, 850)) });
    } else {
      setOffset({ x: g.originX + Math.max(12 - g.left, Math.min(event.clientX - g.x, g.viewportWidth - g.left - g.width - 12)), y: g.originY + Math.max(40 - g.top, Math.min(event.clientY - g.y, innerHeight - g.top - 28)) });
    }
  }

  return <article ref={ref} id={note.id} tabIndex={-1} aria-label={`${note.title} note`} onPointerDown={onActivate} onFocusCapture={onActivate} className={`${styles.note} ${styles[color]} ${active ? styles.active : ""} ${collapsed ? styles.collapsed : ""}`} style={{ "--left": `${note.x}%`, "--top": `${note.y}px`, "--width": `${note.width}%`, "--height": `${note.height}px`, "--offset-x": `${offset.x}px`, "--offset-y": `${offset.y}px`, ...(size ? { "--width": `${size.width}px`, "--height": `${size.height}px` } : {}), zIndex: order } as CSSProperties}>
    <header className={styles.noteBar} onPointerDown={(event) => start(event, "move")} onPointerMove={move} onPointerUp={() => { gesture.current = null; }} onPointerCancel={() => { gesture.current = null; }} onDoubleClick={(event) => { if (!(event.target as HTMLElement).closest("button")) onCollapse(); }}>
      <button className={styles.closeControl} aria-label={`Close ${note.title}`} title="Close note" onClick={onClose}><span /></button>
      <span className={styles.noteTitle}>{note.title}</span>
      <button className={styles.collapseControl} aria-label={`${collapsed ? "Expand" : "Collapse"} ${note.title}`} title={collapsed ? "Expand note" : "Collapse note"} onClick={onCollapse} aria-expanded={!collapsed}><span /></button>
    </header>
    {!collapsed && <><div className={styles.noteBody} tabIndex={0} role="region" aria-label={`${note.title} content`}>{children}</div><span className={styles.resizeGrip} aria-hidden="true" onPointerDown={(event) => start(event, "resize")} onPointerMove={move} onPointerUp={() => { gesture.current = null; }} onPointerCancel={() => { gesture.current = null; }} /></>}
  </article>;
}

export function Stickies({ children, board = false }: { children?: ReactNode; board?: boolean }) {
  const [active, setActive] = useState<NoteId>("about");
  const [stack, setStack] = useState<NoteId[]>(notes.map((note) => note.id));
  const [closed, setClosed] = useState<NoteId[]>([]);
  const [collapsed, setCollapsed] = useState<NoteId[]>([]);
  const [palette, setPalette] = useState<Record<NoteId, Color>>(() => Object.fromEntries(notes.map((note) => [note.id, note.color])) as Record<NoteId, Color>);
  const [menu, setMenu] = useState<string | null>(null);
  const [arrangement, setArrangement] = useState(0);
  const [clock, setClock] = useState("New York");
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const menuRef = useRef<HTMLElement>(null);

  function activate(id: NoteId) {
    setActive(id);
    setStack((previous) => previous[previous.length - 1] === id ? previous : [...previous.filter((item) => item !== id), id]);
  }
  function show(id: NoteId) {
    setClosed((previous) => previous.filter((item) => item !== id));
    setCollapsed((previous) => previous.filter((item) => item !== id));
    activate(id); setMenu(null);
    requestAnimationFrame(() => {
      const element = document.getElementById(id);
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ behavior: "instant", block: "nearest" });
    });
  }
  function toggleCollapsed(id: NoteId) { setCollapsed((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]); }
  function reset() { setClosed([]); setCollapsed([]); setArrangement((value) => value + 1); setMenu(null); }
  function closeNote(id: NoteId) {
    setClosed((previous) => [...new Set([...previous, id])]);
    const next = [...stack].reverse().find((item) => item !== id && !closed.includes(item));
    if (next) setActive(next);
    setMenu(null);
    requestAnimationFrame(() => menuRef.current?.querySelector<HTMLButtonElement>('[data-menu="Window"]')?.focus());
  }

  useEffect(() => {
    function sync() {
      const hash = location.hash.slice(1);
      if (hash === "stickies" && !board) { location.replace("/board"); return; }
      const note = notes.find((item) => item.id === hash);
      if (note) {
        setClosed((previous) => previous.filter((item) => item !== note.id));
        setCollapsed((previous) => previous.filter((item) => item !== note.id));
        setActive(note.id);
        setStack((previous) => [...previous.filter((item) => item !== note.id), note.id]);
        requestAnimationFrame(() => document.getElementById(note.id)?.scrollIntoView({ block: "nearest" }));
      }
    }
    const initial = setTimeout(sync, 0);
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => { clearTimeout(initial); window.removeEventListener("hashchange", sync); window.removeEventListener("popstate", sync); };
  }, [board]);

  useEffect(() => {
    const update = () => setClock(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date()).replaceAll(",", ""));
    const initial = setTimeout(update, 0);
    const timer = setInterval(update, 30000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, []);

  useEffect(() => {
    function dismiss(event: PointerEvent) { if (!menuRef.current?.contains(event.target as Node)) setMenu(null); }
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") { setMenu(null); menuRef.current?.querySelector<HTMLButtonElement>(`[data-menu="${menu}"]`)?.focus(); }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", keyboard); };
  }, [menu]);

  function menuButton(label: string, content: ReactNode) {
    return <div className={styles.menuGroup}><button data-menu={label} className={`${styles.menuButton} ${menu === label ? styles.menuSelected : ""}`} aria-expanded={menu === label} aria-controls={`menu-${label}`} onClick={() => setMenu(menu === label ? null : label)} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setMenu(label); requestAnimationFrame(() => document.getElementById(`menu-${label}`)?.querySelector<HTMLButtonElement>("button, a")?.focus()); } }}>{label}</button>{menu === label && <div id={`menu-${label}`} className={styles.dropdown} onKeyDown={(event) => { if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return; event.preventDefault(); const items = [...event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), a")]; const index = items.indexOf(document.activeElement as HTMLElement); items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus(); }}>{content}</div>}</div>;
  }

  return <div className={`${styles.desktop}${wallpaper ? ` ${styles.customWallpaper}` : ""}`}>
    {wallpaper && <div className={styles.wallpaperBackdrop} style={{ backgroundImage: `url(${wallpaper})` }} aria-hidden="true" />}
    <a className={styles.skip} href="#notes">Skip to notes</a>
    <header className={styles.menuBar} ref={menuRef}>
      <Link href="/" className={styles.brand} aria-label="Kevin Pei home">kp</Link>
      {menuButton("Stickies", <><strong className={styles.menuHeading}>Kevin Pei’s Stickies</strong><p className={styles.menuDescription}>A few notes about me.</p><hr /><Link href="/">About Kevin</Link></>)}
      {menuButton("File", <><a href={links[0].href}>Email Kevin…</a><hr /><Link href="/board">Open idea board</Link>{!board && <><hr /><button disabled={closed.includes(active)} onClick={() => closeNote(active)}>Close note</button></>}</>)}
      {!board && menuButton("Color", <>{colors.map((color) => <button key={color} disabled={closed.includes(active)} onClick={() => { setPalette((previous) => ({ ...previous, [active]: color })); setMenu(null); }}><span className={`${styles.colorSwatch} ${styles[color]}`} />{color === "gray" ? "Gray" : color[0].toUpperCase() + color.slice(1)}<span className={styles.menuCheck}>{palette[active] === color ? "✓" : ""}</span></button>)}</>)}
      {menuButton("Window", <>{!board && <><button onClick={reset}>Arrange All</button><button onClick={() => { toggleCollapsed(active); setMenu(null); }}>{collapsed.includes(active) ? "Expand" : "Collapse"} Note</button><hr /></>}{notes.map((note) => board ? <Link key={note.id} href={`/#${note.id}`}>{note.title}</Link> : <button key={note.id} onClick={() => show(note.id)}><span className={styles.windowCheck}>{active === note.id && !closed.includes(note.id) ? "✓" : ""}</span>{note.title}{closed.includes(note.id) && <span className={styles.hiddenLabel}>closed</span>}</button>)}<hr /><Link href="/board">Idea board</Link></>)}
      {menuButton("Help", <><strong className={styles.menuHeading}>Make yourself at home.</strong><p className={styles.menuDescription}>Drag a note by its title bar.<br />Double-click the bar to fold it up.<br />Resize from the bottom-right corner.<br />Use Window to reopen a note.<br />Select a note, then choose a Color.</p><hr />{board ? <Link href="/">Show portfolio notes</Link> : <button onClick={reset}>Show all notes</button>}</>)}
      <div className={styles.menuRight}><span className={styles.owner}>{site.name}</span><time aria-label={`New York time: ${clock}`}>{clock}</time></div>
    </header>
    <p className={styles.wipBanner}><strong>WIP</strong><span>This portfolio is a work in progress.</span></p>
    <div className={styles.wallpaperDesktop} data-board-desktop={board || undefined}>
      <Wallpapers current={wallpaper} onSelect={setWallpaper} onOpen={() => setMenu(null)} />
    {board ? <main id="notes" className={styles.boardSurface}><Link href="/" className={styles.back}>← Back to my notes</Link>{children}</main> : <main id="notes" className={styles.workspace} aria-label="Kevin Pei’s notes">
      {notes.filter((note) => !closed.includes(note.id)).map((note) => <StickyWindow key={`${note.id}-${arrangement}`} note={note} active={active === note.id} color={palette[note.id]} order={stack.indexOf(note.id) + 1} collapsed={collapsed.includes(note.id)} onActivate={() => activate(note.id)} onClose={() => closeNote(note.id)} onCollapse={() => toggleCollapsed(note.id)}><NoteContent id={note.id} /></StickyWindow>)}
      {closed.length === notes.length && <div className={styles.empty}><p>All tucked away.</p><button onClick={reset}>Reopen my notes</button></div>}
    </main>}
    {!board && <footer className={styles.footer}><span>Kevin Pei’s desktop</span><button onClick={reset}>Arrange all notes</button><Link href="/board">Idea board</Link></footer>}
    </div>
  </div>;
}
