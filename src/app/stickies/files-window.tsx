import { useRef, useState, type ReactNode } from "react";
import styles from "./files-window.module.css";

const resume = {
  name: "Kevin_Pei_Resume (4).pdf",
  href: "/files/Kevin-Pei-Resume.pdf",
  date: "2026-11-13T05:57:50-05:00",
  size: "159 KB",
  kind: "PDF Document",
};

function Icon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

const tools = [
  { label: "View", icon: <path d="M3 6h.1M3 12h.1M3 18h.1M7 6h9M7 12h9M7 18h9m3-9 2 2 2-2m-4 6 2 2 2-2" /> },
  { label: "Group", icon: <path d="M2 5h15v4H2zm0 8h4v4H2zm5.5 0h4v4h-4zm5.5 0h4v4h-4zm7-3 2 2 2-2" /> },
  { label: "Share", icon: <path d="M9 8H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-3m-3 7V2M8 6l4-4 4 4" /> },
  { label: "Add Tags", icon: <path d="M3 14 14 3h7v7L10 21a1 1 0 0 1-1.4 0L3 15.4a1 1 0 0 1 0-1.4ZM17.5 6.5h.1" /> },
  { label: "Action", icon: <path strokeWidth="3" d="M5 12h.1m6.9 0h.1m6.9 0h.1" /> },
  { label: "Search", icon: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.2 15.2 4.8 4.8" /></> },
];

export function FinderToolbar({ name, titleId }: { name: string; titleId: string }) {
  return (
    <header className={styles.toolbar}>
      <form method="dialog" className={styles.trafficLights}>
        <button type="submit" aria-label={`Close ${name}`}>×</button>
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </form>
      <div className={styles.history} aria-hidden="true">
        <span className={styles.historyPill}>
          <Icon><path d="m14 6-6 6 6 6" /></Icon>
          <Icon><path d="m10 6 6 6-6 6" /></Icon>
        </span>
        Back/Forward
      </div>
      <h2 id={titleId}>{name}</h2>
      <div className={styles.tools} aria-hidden="true">
        {tools.map(({ label, icon }) => <span key={label}><span className={styles.toolIcon}><Icon>{icon}</Icon></span>{label}</span>)}
      </div>
    </header>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", hour: "numeric", minute: "2-digit",
});

export function FilesList() {
  const [selected, setSelected] = useState(true);
  const fileLink = useRef<HTMLAnchorElement>(null);
  const date = new Date(resume.date);
  const day = dateFormat.format(date);
  const group = day === dateFormat.format(new Date()) ? "Today" : day;
  const timestamp = `${group} at ${timeFormat.format(date)}`;

  return (
    <div className={styles.list} onClick={(event) => {
      if (!(event.target as Element).closest("tbody tr[data-selected]")) setSelected(false);
    }}>
      <table>
        <colgroup><col /><col /><col /><col /><col /></colgroup>
        <thead>
          <tr>
            <th scope="col" aria-label="Name"><span className={styles.nameHeader}>{group}<Icon><path d="m6 9 6 6 6-6" /></Icon></span></th>
            <th scope="col">Date Modified</th>
            <th scope="col">Date Created</th>
            <th scope="col">Size</th>
            <th scope="col">Kind</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.group}><th colSpan={5} scope="rowgroup">{group}</th></tr>
          <tr className={styles.file} data-selected={selected} onClick={() => {
            setSelected(true);
            fileLink.current?.focus({ preventScroll: true });
          }}
            onDoubleClick={(event) => {
              if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) window.open(resume.href, "_blank", "noopener");
            }}>
            <td>
              <a ref={fileLink} href={resume.href} target="_blank" rel="noopener" title={resume.name} onFocus={() => setSelected(true)}
                onClick={(event) => {
                  const pointer = event.nativeEvent as PointerEvent;
                  if (event.detail !== 0 && pointer.pointerType !== "touch" && pointer.pointerType !== "pen" && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                    event.preventDefault();
                  }
                }}
                onKeyDown={(event) => {
                  if (event.metaKey && (event.key.toLowerCase() === "o" || event.key === "ArrowDown")) {
                    event.preventDefault();
                    window.open(resume.href, "_blank", "noopener");
                  }
                }}>
                <svg viewBox="0 0 12 16" width="12" height="16" aria-hidden="true">
                  <path fill="#f2f2f2" d="M1.5 0H7l5 5v9.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 0 14.5v-13A1.5 1.5 0 0 1 1.5 0Z" />
                  <path fill="#cbcbcb" d="M7 0v4a1 1 0 0 0 1 1h4Z" />
                  <path stroke="#b7b7b7" strokeWidth=".65" d="M2.5 5h2m-2 2h6m-6 2h7m-7 2h6m-6 2h3" />
                </svg>
                <span>{resume.name}</span>
              </a>
            </td>
            <td><time dateTime={resume.date}>{timestamp}</time></td>
            <td><time dateTime={resume.date}>{timestamp}</time></td>
            <td>{resume.size}</td>
            <td>{resume.kind}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
