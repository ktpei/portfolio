"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { site, intro, links, work, projects, education, skills } from "@/content";
import { BulletinBoard } from "../board/bulletin-board";
import styles from "./desktop.module.css";

type Space = "work" | "projects" | "stickies";
type IconName = "folder" | "work" | "grid" | "note" | "arrow" | "mail" | "code" | "file" | "person" | "external" | "chevron" | "school" | "tools" | "check";
const spaces: { id: Space; label: string; icon: IconName }[] = [
  { id: "work", label: "Work", icon: "work" },
  { id: "projects", label: "Projects", icon: "code" },
  { id: "stickies", label: "Stickies", icon: "note" },
];

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, string> = {
    folder: "M3 7V5h6l2 2h10v13H3V7Zm0 3h18",
    work: "M3 7h18v13H3V7Zm5 0V4h8v3M3 12c5 3 13 3 18 0M10 12v4h4v-4",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    note: "M4 3h16v13l-5 5H4V3Zm11 18v-5h5M8 8h8M8 12h6",
    arrow: "M18 12H5m6-6-6 6 6 6", mail: "M3 5h18v14H3V5Zm0 1 9 7 9-7",
    code: "m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18",
    file: "M5 3h9l5 5v13H5V3Zm9 0v6h5M9 13h6M9 17h6",
    person: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-3a8 5 0 0 1 16 0v3",
    external: "M14 3h7v7m0-7L10 14M10 4H4v16h16v-6", chevron: "m9 5 7 7-7 7",
    school: "m2 9 10-6 10 6-10 6L2 9Zm4 3v6l6 3 6-3v-6M22 9v8",
    tools: "m14 7 3 3 4-4a7 7 0 0 1-9 9l-7 7-3-3 7-7a7 7 0 0 1 9-9l-4 4Z",
    check: "m5 12 4 4L19 6",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function AppIcon({ kind, small = false }: { kind: Space | "mail" | "file" | "github" | "about"; small?: boolean }) {
  return <span aria-hidden="true" className={`${styles.appIcon} ${styles[kind + "Icon"]} ${small ? styles.smallIcon : ""}`}>
    {kind === "work" ? <span className={styles.finderFace}><i /><b /><em /></span> : kind === "projects" ? <Icon name="code" size={30} /> : kind === "stickies" ? <span className={styles.stickyLines} /> : kind === "github" ? <span className={styles.terminalMark}>$_</span> : kind === "about" ? <span className={styles.monogram}>kp.</span> : <Icon name={kind} size={30} />}
  </span>;
}

function DesktopWindow({ title, children, className = "", onClose, subtitle }: { title: string; children: ReactNode; className?: string; onClose: () => void; subtitle?: string }) {
  const [maximized, setMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; startX: number; startY: number; left: number; top: number; width: number; height: number } | null>(null);
  const windowRef = useRef<HTMLElement>(null);
  return <section id={`${title.toLowerCase().replaceAll(" ", "-")}-window`} ref={windowRef} tabIndex={-1} aria-label={`${title} window`} className={`${styles.window} ${className} ${maximized ? styles.maximized : ""}`} style={{ "--window-x": `${position.x}px`, "--window-y": `${position.y}px` } as CSSProperties}>
    <header className={styles.titlebar} onDoubleClick={() => { setMaximized(!maximized); setPosition({ x: 0, y: 0 }); }}
      onPointerDown={(event) => {
        if (maximized || event.button !== 0 || (event.target as HTMLElement).closest("button") || !matchMedia("(min-width: 901px)").matches) return;
        windowRef.current?.focus({ preventScroll: true });
        const rect = windowRef.current!.getBoundingClientRect();
        drag.current = { x: event.clientX, y: event.clientY, startX: position.x, startY: position.y, left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const origin = drag.current;
        if (!origin) return;
        const dx = Math.max(-origin.left + 12, Math.min(event.clientX - origin.x, innerWidth - origin.left - origin.width - 12));
        const dy = Math.max(45 - origin.top, Math.min(event.clientY - origin.y, innerHeight - origin.top - 140));
        setPosition({ x: origin.startX + dx, y: origin.startY + dy });
      }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <div className={styles.trafficLights}>
        <button onClick={onClose} aria-label={`Close ${title}`} className={styles.close}><span>×</span></button>
        <button onClick={onClose} aria-label={`Minimize ${title}`} className={styles.minimize}><span>−</span></button>
        <button onClick={() => { setMaximized(!maximized); setPosition({ x: 0, y: 0 }); }} aria-label={`${maximized ? "Restore" : "Maximize"} ${title}`} className={styles.zoom}><span>+</span></button>
      </div>
      <div className={styles.windowTitle}>{title}{subtitle && <span>{subtitle}</span>}</div>
      <span className={styles.titlebarIcon}><Icon name={title === "About me" ? "person" : "folder"} size={16} /></span>
    </header>
    {children}
  </section>;
}

export function Desktop({ initialSpace = "work" }: { initialSpace?: Space }) {
  const [active, setActive] = useState<Space>(initialSpace);
  const [open, setOpen] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(true);
  const [workIndex, setWorkIndex] = useState(0);
  const [projectIndex, setProjectIndex] = useState(0);
  const [view, setView] = useState<"main" | "education" | "toolkit">("main");
  const [clock, setClock] = useState("New York, NY");
  const navRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    function syncHash() {
      const hash = location.hash.slice(1);
      if (!hash) { setActive(initialSpace); setOpen(true); setView("main"); }
      if (hash === "work" || hash === "projects" || hash === "stickies") { setActive(hash); setOpen(true); setView("main"); }
      if (hash === "education" || hash === "toolkit") { setActive("work"); setOpen(true); setView(hash); }
      if (hash === "contact") setAboutOpen(true);
    }
    const initial = setTimeout(syncHash, 0);
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    return () => { clearTimeout(initial); window.removeEventListener("hashchange", syncHash); window.removeEventListener("popstate", syncHash); };
  }, [initialSpace]);
  useEffect(() => {
    const update = () => setClock(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date()));
    const initial = setTimeout(update, 0);
    const timer = setInterval(update, 30000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, []);

  function goTo(space: Space) {
    setActive(space); setOpen(true); setView("main");
    if (location.hash !== `#${space}`) window.history.pushState(null, "", `#${space}`);
    if (window.innerWidth <= 900) window.scrollTo({ top: 0, behavior: "instant" });
  }
  function openAbout() {
    if (active === "stickies") goTo("work");
    setAboutOpen(true);
    window.setTimeout(() => {
      const about = document.getElementById("about-me-window");
      about?.focus({ preventScroll: true });
      if (window.innerWidth <= 900) about?.scrollIntoView({ block: "start", behavior: "instant" });
    }, 0);
  }
  const currentWork = work[workIndex];
  const project = projects[projectIndex];
  const activeLabel = spaces.find((space) => space.id === active)!.label;

  return <div className={styles.desktop}>
    <a href="#desktop-content" className="skip-link">Skip to desktop content</a>
    <header className={styles.menuBar}>
      <button className={styles.menuMonogram} onClick={() => { if (active === "stickies") { goTo("work"); setAboutOpen(true); } else setAboutOpen(!aboutOpen); }} aria-label="Toggle About me">kp.</button>
      <strong>{site.name}</strong>
      <span className={styles.menuDivider} />
      <span className={styles.menuSection}>{activeLabel}</span>
      <a href={links[0].href} className={styles.menuLink}>Say hello</a>
      <div className={styles.menuRight}><span className={styles.location}>NYC <span className={styles.timeDot} /></span><time aria-label={`New York time: ${clock}`}>{clock}</time></div>
    </header>

    <nav className={styles.spaces} aria-label="Desktop spaces">
      <div className={styles.spaceTabs} role="tablist" aria-label="Choose a desktop">
        {spaces.map((space, index) => <button key={space.id} ref={(element) => { navRefs.current[index] = element; }} role="tab" id={`tab-${space.id}`} aria-controls="desktop-panel" aria-selected={active === space.id} tabIndex={active === space.id ? 0 : -1} className={`${styles.spaceTab} ${active === space.id ? styles.activeSpace : ""}`} onClick={() => goTo(space.id)} onKeyDown={(event) => {
          let next = index;
          if (event.key === "ArrowRight") next = (index + 1) % spaces.length;
          else if (event.key === "ArrowLeft") next = (index + spaces.length - 1) % spaces.length;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = spaces.length - 1;
          else return;
          event.preventDefault(); goTo(spaces[next].id); navRefs.current[next]?.focus();
        }}>
          <span className={`${styles.spacePreview} ${styles[space.id + "Preview"]}`} aria-hidden="true"><i /><i /><i /></span>
          <span className={styles.spaceLabel}>{space.label}<span>{String(index + 1).padStart(2, "0")}</span></span>
        </button>)}
      </div>
      <p>Three spaces. A little bit of me in each.</p>
    </nav>

    <main id="desktop-content" tabIndex={-1} className={styles.stage}>
      <div id="desktop-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className={styles.spaceContent}>
        {active === "stickies" ? <div className={styles.stickiesDesktop}><BulletinBoard embedded /></div> : <div className={styles.workspace}>
          <div className={styles.mainColumn}>
            <div className={styles.desktopHeading}><span>DESKTOP {active === "work" ? "01" : "02"}</span><span>{active === "work" ? "A few places I’ve made an impact." : "Built with curiosity. Shipped with care."}</span></div>
            {open ? <DesktopWindow key={active} title={activeLabel} subtitle={`${active === "work" ? work.length : projects.length} ${active === "work" ? "experiences" : "projects"}`} onClose={() => setOpen(false)} className={styles.finder}>
              <div className={styles.finderBody}>
                <aside className={styles.sidebar}>
                  <p>Favorites</p>
                  {spaces.map((space) => <button key={space.id} className={active === space.id && view === "main" ? styles.selectedSidebar : ""} onClick={() => goTo(space.id)}><Icon name={space.icon} size={17} />{space.label}</button>)}
                  <p>A little more</p>
                  <button className={view === "education" ? styles.selectedSidebar : ""} onClick={() => { setView("education"); }}><Icon name="school" size={17} />Education</button>
                  <button className={view === "toolkit" ? styles.selectedSidebar : ""} onClick={() => { setView("toolkit"); }}><Icon name="tools" size={17} />Toolkit</button>
                  <div className={styles.sidebarBottom}><span className={styles.onlineDot} />Always building</div>
                </aside>
                <div className={styles.finderMain}>
                  <div className={styles.finderToolbar}><span><Icon name="folder" size={16} /> Kevin Pei <Icon name="chevron" size={12} /> <strong>{view === "main" ? activeLabel : view === "education" ? "Education" : "Toolkit"}</strong></span><Icon name="grid" size={16} /></div>
                  <div className={styles.document}>
                    {view === "education" ? <div className={styles.extraContent}><span className={styles.sectionEyebrow}>THE FOUNDATION</span><h1>{education.school}</h1><p>{education.degree}</p><p>{education.detail}</p><span className={styles.period}>{education.period}</span></div> : view === "toolkit" ? <div className={styles.extraContent}><span className={styles.sectionEyebrow}>THINGS I REACH FOR</span><h1>My toolkit.</h1>{skills.map((group) => <div key={group.group} className={styles.skillGroup}><h2>{group.group}</h2><div className={styles.tags}>{group.items.map((item) => <span key={item}>{item}</span>)}</div></div>)}</div> : active === "work" ? <>
                      <div className={styles.documentIntro}><span className={styles.sectionEyebrow}>EXPERIENCE</span><h1>Good work. Real impact.</h1><p>Backend systems, real-time infrastructure, and the details that make them better.</p></div>
                      <div className={styles.entryTabs} aria-label="Choose an experience">{work.map((entry, index) => <button key={entry.org} aria-pressed={workIndex === index} className={workIndex === index ? styles.entryActive : ""} onClick={() => setWorkIndex(index)}>{index === 1 ? "NYU Research" : entry.org}{entry.current && <span className={styles.entryDot} />}</button>)}</div>
                      <article className={styles.workEntry} key={currentWork.org}>
                        <div className={styles.entryHeading}><span className={`${styles.companyMark} ${styles["company" + workIndex]}`}>{workIndex === 0 ? "k" : workIndex === 1 ? "NYU" : "inf"}</span><div><h2>{currentWork.org}</h2><p>{currentWork.role}</p></div>{currentWork.href && <a href={currentWork.href} target="_blank" rel="noreferrer" aria-label={`Visit ${currentWork.org} website (opens in a new tab)`}><Icon name="external" size={17} /></a>}</div>
                        <div className={styles.entryMeta}><span>{currentWork.period}</span><span>{currentWork.place}</span></div>
                        {workIndex === 0 && <div className={styles.metrics}><div><strong>65<span>%</span></strong><span>faster document loads</span></div><div><strong>29<span>%</span></strong><span>lower infra costs</span></div><div><strong>100<span>k+</span></strong><span>policies migrated</span></div></div>}
                        <ul className={styles.bulletList}>{currentWork.points.map((point) => <li key={point}>{point}</li>)}</ul>
                      </article>
                    </> : <>
                      <div className={styles.documentIntro}><span className={styles.sectionEyebrow}>SELECTED PROJECTS</span><h1>From “what if” to real things.</h1><p>A collection of experiments, late nights, and things I wanted to exist.</p></div>
                      <div className={styles.projectPicker}>{projects.map((item, index) => <button key={item.name} aria-pressed={index === projectIndex} onClick={() => setProjectIndex(index)} className={index === projectIndex ? styles.projectSelected : ""}><span className={`${styles.projectGlyph} ${styles["project" + index]}`}><Icon name={index === 0 ? "person" : index === 1 ? "code" : "grid"} size={25} /></span><strong>{item.name}</strong><span>{index < 2 ? "Agent tooling" : "Community"}</span></button>)}</div>
                      <article className={styles.projectDetail} key={project.name}><div className={styles.projectTitle}><h2>{project.name}</h2><span>{project.period}</span></div><span className={styles.award}><Icon name="check" size={13} />{project.award}</span><p>{project.blurb}</p><ul className={styles.bulletList}>{project.points.map((point) => <li key={point}>{point}</li>)}</ul><div className={styles.tags}>{project.stack.map((tech) => <span key={tech}>{tech}</span>)}</div>{project.href && <a className={styles.repoLink} href={project.href} target="_blank" rel="noreferrer">View on GitHub <Icon name="external" size={14} /><span className="sr-only"> (opens in a new tab)</span></a>}</article>
                    </>}
                  </div>
                  <footer className={styles.finderFooter}><span>{view === "main" ? active === "work" ? `${workIndex + 1} of ${work.length} experiences` : `${projectIndex + 1} of ${projects.length} projects` : "Kevin Pei"}</span><span>{active === "work" ? "Made of small improvements." : "Ideas, brought to life."}</span></footer>
                </div>
              </div>
            </DesktopWindow> : <div className={styles.closedWindow}><AppIcon kind={active} /><h1>{activeLabel} is taking a breather.</h1><button onClick={() => setOpen(true)}>Reopen {activeLabel} <Icon name="arrow" size={16} /></button></div>}
          </div>
          <aside className={styles.rightColumn}>
            {aboutOpen && <DesktopWindow title="About me" onClose={() => setAboutOpen(false)} className={styles.aboutWindow}><div className={styles.aboutContent}><div className={styles.avatar}>kp<span>.</span></div><span className={styles.aboutEyebrow}>THE PERSON BEHIND THE WINDOWS</span><h2>Hey, I’m Kevin.</h2><p className={styles.aboutRole}>{site.role} · NYC</p><p>{intro[0]}</p><p>CS at NYU. Curious by default.<br />Usually building something.</p><div className={styles.aboutLinks}>{links.map((link) => <a key={link.label} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined}>{link.label}<span aria-hidden="true">↗</span></a>)}</div></div></DesktopWindow>}
            <div className={styles.deskNote}><div className={styles.noteTop}>a note to myself <span>↗</span></div><p>Make useful things.<br />Keep asking questions.<br /><span>Enjoy the process.</span></p><button onClick={() => goTo("stickies")}>More from my stickies <span>→</span></button></div>
            {site.status && <div className={styles.availability}><span className={styles.onlineDot} />{site.status}</div>}
          </aside>
        </div>}
      </div>
    </main>

    <footer className={styles.desktopFooter}>
      <span className={styles.desktopHint}>A portfolio, with room to explore.</span>
      <nav className={styles.dock} aria-label="Application dock">
        {spaces.map((space) => <button key={space.id} onClick={() => goTo(space.id)} className={styles.dockItem} aria-label={`Open ${space.label} desktop`} aria-current={active === space.id ? "page" : undefined}><span className={styles.dockTooltip}>{space.label}</span><AppIcon kind={space.id} /><span className={`${styles.dockDot} ${active === space.id ? styles.running : ""}`} /></button>)}
        <span className={styles.dockDivider} />
        <button className={styles.dockItem} onClick={openAbout} aria-label="Open About me"><span className={styles.dockTooltip}>About me</span><AppIcon kind="about" /><span className={`${styles.dockDot} ${aboutOpen ? styles.running : ""}`} /></button>
        <a className={styles.dockItem} href={links[0].href} aria-label="Email Kevin"><span className={styles.dockTooltip}>Say hello</span><AppIcon kind="mail" /><span className={styles.dockDot} /></a>
        <a className={`${styles.dockItem} ${styles.githubDock}`} href={links[1].href} target="_blank" rel="noreferrer" aria-label="Kevin’s GitHub (opens in a new tab)"><span className={styles.dockTooltip}>GitHub</span><AppIcon kind="github" /><span className={styles.dockDot} /></a>
      </nav>
      <span className={styles.footerSignature}>Designed to feel like home.</span>
    </footer>
  </div>;
}
