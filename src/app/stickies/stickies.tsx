"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { education, highSchool, intro, links, projects, site, skills, work } from "@/content";
import { StickyWindow, type StickyColor, type StickyPlacement } from "./sticky-window";
import { DesktopFolder } from "./desktop-folder";
import { WallpaperPicker } from "./wallpapers";
import { clearDesktopPreferences, useDesktopPreference } from "./use-desktop-preference";
import folderStyles from "./wallpapers.module.css";
import styles from "./stickies.module.css";

const BulletinBoard = dynamic(() => import("../board/bulletin-board").then((module) => module.BulletinBoard));

type NoteId = "about" | "work" | "projects" | "contact" | "education" | "toolkit";
type Note = StickyPlacement & { id: NoteId; color: StickyColor };
const colors: StickyColor[] = ["yellow", "blue", "pink", "green", "purple", "gray"];
const notes: Note[] = [
  { id: "about", title: intro.title, color: "yellow", x: 3, y: 52, width: 28, height: 386 },
  { id: "work", title: "Where I’ve been working", color: "blue", x: 36, y: 91, width: 29, height: 417 },
  { id: "projects", title: "Things I’ve built", color: "pink", x: 69, y: 48, width: 28, height: 475 },
  { id: "contact", title: "Let’s keep in touch", color: "green", x: 5, y: 470, width: 27, height: 242 },
  { id: "education", title: "A note on school", color: "purple", x: 37, y: 531, width: 28, height: 278 },
  { id: "toolkit", title: "My toolkit", color: "gray", x: 70, y: 577, width: 27, height: 240 },
];
const defaultPalette = Object.fromEntries(notes.map(({ id, color }) => [id, color])) as Record<NoteId, StickyColor>;
const defaultStack: NoteId[] = [...notes.slice(1).map((note) => note.id), "about"];

function NoteContent({ id }: { id: NoteId }) {
  if (id === "about") return <>
    <div className={styles.profile}>
      <div><h1>{intro.title}</h1><p>{site.role}<br />{site.location}</p></div>
      <Image
        src="/kevin-portrait.webp"
        alt="Kevin Pei by the waterfront with the New York City skyline behind him"
        width={640}
        height={853}
        sizes="132px"
        className={styles.portrait}
      />
    </div>
    {intro.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
  </>;
  if (id === "work") return <>
    <h2>Where I’ve been working</h2>
    {work.map((entry) => <section key={entry.org} className={styles.workEntry}>
      <h3>{entry.href ? <a href={entry.href} target="_blank" rel="noreferrer">{entry.org}</a> : entry.org}</h3>
      <p>{entry.role}<br /><span className={styles.meta}>{entry.period}</span></p>
      {entry.points.length > 0 && <details className={styles.details}>
        <summary>Highlights at {entry.org}</summary>
        <ul>{entry.points.map((point) => <li key={point}>{point}</li>)}</ul>
      </details>}
    </section>)}
  </>;
  if (id === "projects") return <>
    <h2>Things I’ve built</h2>
    {projects.map((project) => <section key={project.name} className={styles.entry}>
      <h3>{project.href ? <a href={project.href} target="_blank" rel="noreferrer">{project.name} ↗</a> : project.name}</h3>
      {project.award && <p className={styles.meta}>{project.award}</p>}
      <p>{project.blurb}</p>
    </section>)}
  </>;
  if (id === "contact") return <><h2>Let’s keep in touch</h2><p>{links.map((link) => <span className={styles.linkLine} key={link.label}><a href={link.href} target={link.href.startsWith("mailto") ? undefined : "_blank"} rel="noreferrer">{link.label === "Email" ? link.display : link.label}</a></span>)}</p>{site.status && <p className={styles.meta}>{site.status}</p>}</>;
  if (id === "education") return <>
    <h2>A note on school</h2>
    <p><strong>{education.school}</strong><br />{education.degree}<br />{education.detail}<br />{education.period}</p>
    <p><strong>{highSchool.school}</strong><br />{highSchool.detail}</p>
  </>;
  return <><h2>My toolkit</h2>{skills.map((group) => <p key={group.group}><strong>{group.group}</strong><br />{group.items.join(", ")}</p>)}</>;
}

function DesktopArrow({ back = false }: { back?: boolean }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={back ? "M20 12H4m7-7-7 7 7 7" : "M4 12h16m-7-7 7 7-7 7"} />
  </svg>;
}

export function Stickies({ initialBoard = false }: { initialBoard?: boolean }) {
  const [isBoard, setIsBoard] = useState(initialBoard);
  const [boardVisited, setBoardVisited] = useState(initialBoard);
  const [reading, setReading] = useState<NoteId | null>(null);
  const [active, setActive] = useDesktopPreference<NoteId>("portfolio:active", "about");
  const [stack, setStack] = useDesktopPreference("portfolio:stack", defaultStack);
  const [closed, setClosed] = useDesktopPreference<NoteId[]>("portfolio:closed", []);
  const [collapsed, setCollapsed] = useDesktopPreference<NoteId[]>("portfolio:collapsed", []);
  const [savedColors, setPalette] = useDesktopPreference<Partial<Record<NoteId, StickyColor>>>("portfolio:palette", {});
  const palette = { ...defaultPalette, ...savedColors };
  const [menu, setMenu] = useState<string | null>(null);
  const [arrangement, setArrangement] = useState(0);
  const [clock, setClock] = useState("New York");
  const [wallpaper, setWallpaper] = useDesktopPreference<string | null>("wallpaper", null);
  const menuRef = useRef<HTMLElement>(null);
  const notesRef = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLElement>(null);
  const readingDialog = useRef<HTMLDialogElement>(null);

  function switchDesktop(event: MouseEvent<HTMLAnchorElement>, nextIsBoard: boolean, noteId?: NoteId) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setMenu(null);
    const url = nextIsBoard ? "/#stickies" : noteId ? `/#${noteId}` : "/";
    if ((!nextIsBoard || !isBoard) && url !== location.pathname + location.search + location.hash) {
      window.history.pushState(null, "", url);
    }
    if (isBoard !== nextIsBoard) {
      if (nextIsBoard) setBoardVisited(true);
      setIsBoard(nextIsBoard);
    }
    if (noteId) show(noteId);
    else requestAnimationFrame(() => (nextIsBoard ? boardRef : notesRef).current?.focus({ preventScroll: true }));
  }

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
    });
  }
  function toggleCollapsed(id: NoteId) { setCollapsed((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]); }
  function reset() {
    clearDesktopPreferences("window:portfolio:");
    setClosed([]);
    setCollapsed([]);
    setActive("about");
    setStack(defaultStack);
    setArrangement((value) => value + 1);
    setMenu(null);
  }
  function closeNote(id: NoteId) {
    setClosed((previous) => [...new Set([...previous, id])]);
    const next = [...stack].reverse().find((item) => item !== id && !closed.includes(item));
    if (next) setActive(next);
    setMenu(null);
    requestAnimationFrame(() => {
      const focusTarget = next ? document.getElementById(next) : menuRef.current?.querySelector<HTMLButtonElement>('[data-menu="Window"]');
      focusTarget?.focus({ preventScroll: true });
    });
  }

  useEffect(() => {
    function sync() {
      const hash = location.hash.slice(1);
      const nextIsBoard = hash === "stickies" || location.pathname === "/board";
      const nextDesktop = (nextIsBoard ? boardRef : notesRef).current;
      const changed = nextDesktop?.inert;
      setIsBoard(nextIsBoard);
      setMenu(null);
      if (nextIsBoard) {
        setBoardVisited(true);
        if (changed) {
          requestAnimationFrame(() => nextDesktop.focus({ preventScroll: true }));
        }
        return;
      }
      const note = notes.find((item) => item.id === hash);
      if (note) {
        setClosed((previous) => previous.filter((item) => item !== note.id));
        setCollapsed((previous) => previous.filter((item) => item !== note.id));
        setActive(note.id);
        setStack((previous) => [...previous.filter((item) => item !== note.id), note.id]);
      } else if (changed) {
        requestAnimationFrame(() => nextDesktop.focus({ preventScroll: true }));
      }
    }
    const initial = setTimeout(sync, 0);
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => { clearTimeout(initial); window.removeEventListener("hashchange", sync); window.removeEventListener("popstate", sync); };
  }, [setActive, setClosed, setCollapsed, setStack]);

  useEffect(() => {
    const update = () => setClock(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date()).replaceAll(",", ""));
    const initial = setTimeout(update, 0);
    const timer = setInterval(update, 30000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!menu) return;
    function dismiss(event: PointerEvent) { if (!menuRef.current?.contains(event.target as Node)) setMenu(null); }
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") { setMenu(null); menuRef.current?.querySelector<HTMLButtonElement>(`[data-menu="${menu}"]`)?.focus(); }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", keyboard); };
  }, [menu]);

  function menuButton(label: string, content: ReactNode) {
    const open = menu === label;
    const id = `menu-${label}`;
    const itemSelector = "button:not(:disabled), a[href]";

    function focusMenuItem(last: boolean) {
      requestAnimationFrame(() => {
        const items = [...(document.getElementById(id)?.querySelectorAll<HTMLElement>(itemSelector) ?? [])];
        items.at(last ? -1 : 0)?.focus();
      });
    }

    function navigateItems(event: ReactKeyboardEvent<HTMLDivElement>) {
      const items = [...event.currentTarget.querySelectorAll<HTMLElement>(itemSelector)];
      if (!items.length) return;
      const index = items.findIndex((item) => item === document.activeElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
        : event.key === "ArrowDown" ? (index + 1) % items.length
        : event.key === "ArrowUp" ? (index - 1 + items.length) % items.length : null;
      if (next === null) return;
      event.preventDefault();
      items[next].focus();
    }

    return <div className={styles.menuGroup} onPointerEnter={(event) => {
      if (menu && event.pointerType === "mouse") setMenu(label);
    }}>
      <button type="button" data-menu={label} className={`${styles.menuButton} ${open ? styles.menuSelected : ""}`}
        aria-expanded={open} aria-controls={open ? id : undefined}
        onClick={(event) => {
          setMenu(open ? null : label);
          if (!open && event.detail === 0) focusMenuItem(false);
        }} onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          setMenu(label);
          focusMenuItem(event.key === "ArrowUp");
        }}>{label}</button>
      {open && <div id={id} className={styles.dropdown} onKeyDown={navigateItems}>{content}</div>}
    </div>;
  }

  return <div className={`${styles.desktop}${wallpaper ? ` ${styles.customWallpaper}` : ""}`} data-wallpaper-selected={wallpaper ? true : undefined}>
    {wallpaper && <div className={styles.wallpaperBackdrop} style={{ backgroundImage: `url(${wallpaper})` }} aria-hidden="true" />}
    <a className={styles.skip} href={isBoard ? "#board-desktop" : "#notes"} onClick={(event) => {
      event.preventDefault();
      (isBoard ? boardRef : notesRef).current?.focus();
    }}>{isBoard ? "Skip to idea board" : "Skip to notes"}</a>
    <header className={styles.menuBar} ref={menuRef} onBlur={(event) => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setMenu(null);
    }}>
      <Link href="/" onClick={(event) => switchDesktop(event, false)} className={styles.brand} aria-label="Kevin Pei home">kp</Link>
      {menuButton("Stickies", <><strong className={styles.menuHeading}>Kevin Pei’s Stickies</strong><p className={styles.menuDescription}>A few notes about me.</p><hr /><Link href="/" onClick={(event) => switchDesktop(event, false)}>About Kevin</Link></>)}
      {menuButton("File", <><a href={links[0].href}>Email Kevin…</a><hr /><Link href="/#stickies" onClick={(event) => switchDesktop(event, true)}>Open idea board</Link>{!isBoard && <><hr /><button disabled={closed.includes(active)} onClick={() => closeNote(active)}>Close note</button></>}</>)}
      {!isBoard && menuButton("Color", <>{colors.map((color) => <button key={color} disabled={closed.includes(active)} onClick={() => { setPalette((previous) => ({ ...previous, [active]: color })); setMenu(null); }}><span className={`${styles.colorSwatch} ${styles[color]}`} />{color === "gray" ? "Gray" : color[0].toUpperCase() + color.slice(1)}<span className={styles.menuCheck}>{palette[active] === color ? "✓" : ""}</span></button>)}</>)}
      {menuButton("Window", <>{!isBoard ? <><button onClick={reset}>Arrange All</button><button disabled={closed.includes(active)} onClick={() => { toggleCollapsed(active); setMenu(null); }}>{collapsed.includes(active) ? "Expand" : "Collapse"} Note</button><hr /></> : <strong className={styles.menuHeading}>Go to portfolio notes</strong>}{notes.map((note) => isBoard ? <Link key={note.id} href={`/#${note.id}`} onClick={(event) => switchDesktop(event, false, note.id)}>{note.title}</Link> : <button key={note.id} onClick={() => show(note.id)}><span className={styles.windowCheck}>{active === note.id && !closed.includes(note.id) ? "✓" : ""}</span>{note.title}{closed.includes(note.id) && <span className={styles.hiddenLabel}>closed</span>}</button>)}<hr /><Link href="/#stickies" onClick={(event) => switchDesktop(event, true)}>Idea board</Link></>)}
      {menuButton("Help", <>{isBoard ? <p className={styles.menuDescription}>Drag a sticky by its title bar.<br />Double-click the bar to collapse it.<br />Resize from the bottom-right corner.<br />Use Arrange all notes to restore the board.</p> : <><strong className={styles.menuHeading}>Make yourself at home.</strong><p className={styles.menuDescription}>Drag a note by its title bar.<br />Double-click the bar to fold it up.<br />Resize from the bottom-right corner.<br />Use Window to reopen a note.<br />Select a note, then choose a Color.</p><p className={styles.menuDescription}>Keyboard: focus a title bar.<br />Arrow keys move; Shift + arrows resize.</p></>}<hr />{isBoard ? <Link href="/" onClick={(event) => switchDesktop(event, false)}>Show portfolio notes</Link> : <button onClick={reset}>Show all notes</button>}</>)}
      <div className={styles.menuRight}><span className={styles.owner}>{site.name}</span><time aria-label={`New York time: ${clock}`}>{clock}</time></div>
    </header>
    <p className={styles.wipBanner}><strong>WIP</strong><span>This portfolio is a work in progress.</span></p>
    <Link href={isBoard ? "/" : "/#stickies"} className={`${styles.edgeLink}${isBoard ? ` ${styles.backLink}` : ""}`} onClick={(event) => switchDesktop(event, !isBoard)}>
      {isBoard ? <><DesktopArrow back /> Portfolio</> : <>Idea Board <DesktopArrow /></>}
    </Link>
    <main className={styles.spaces}>
      <section ref={notesRef} id="notes" tabIndex={-1} inert={isBoard} className={`${styles.space} ${styles.portfolioSpace}`} aria-label="Kevin Pei’s notes">
        <DesktopFolder name="Wallpapers" slot={0} onOpen={() => setMenu(null)}>
          <WallpaperPicker current={wallpaper} onSelect={setWallpaper} />
        </DesktopFolder>
        <DesktopFolder name="Files" slot={1} onOpen={() => setMenu(null)}>
          <div className={folderStyles.fileList}>
            <a href="/files/Kevin-Pei-Resume.pdf" target="_blank" rel="noopener">
              Kevin Pei Resume.pdf
            </a>
          </div>
        </DesktopFolder>
        <DesktopFolder name="Archive" slot={2} onOpen={() => setMenu(null)} />
        <div className={styles.workspace}>
          {notes.filter((note) => !closed.includes(note.id)).map((note) => <StickyWindow key={`${note.id}-${arrangement}`} note={note} active={active === note.id} color={palette[note.id]} order={stack.indexOf(note.id) + 1} collapsed={collapsed.includes(note.id)} onActivate={() => activate(note.id)} onClose={() => closeNote(note.id)} onCollapse={() => toggleCollapsed(note.id)} titleBarActions={<button type="button" className={styles.readNote} aria-label={`Read ${note.title}`} aria-haspopup="dialog" title="Read full note" onClick={() => {
            setReading(note.id);
            readingDialog.current?.showModal();
          }}>↗</button>}><NoteContent id={note.id} /></StickyWindow>)}
          {closed.length === notes.length && <div className={styles.empty}><p>All tucked away.</p><button onClick={reset}>Reopen my notes</button></div>}
        </div>
      </section>
      <section ref={boardRef} id="board-desktop" tabIndex={-1} inert={!isBoard} className={`${styles.space} ${styles.boardSpace}`} aria-label="Idea Board desktop">
        <div className={styles.boardSurface}>{boardVisited && <BulletinBoard active={isBoard} />}</div>
      </section>
    </main>
    {!isBoard && <footer className={styles.footer}><span>Kevin Pei’s desktop</span><button onClick={reset}>Arrange all notes</button></footer>}
    <dialog ref={readingDialog} className={`${styles.readingDialog} ${reading ? styles[palette[reading]] : ""}`} aria-label={notes.find((note) => note.id === reading)?.title} onClose={() => setReading(null)}>
      <form method="dialog"><button>Close</button></form>
      {reading && <div className={styles.noteBody}><NoteContent id={reading} /></div>}
    </dialog>
  </div>;
}
