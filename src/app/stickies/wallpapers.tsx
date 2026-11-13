import { useId, useRef } from "react";
import Image from "next/image";
import styles from "./wallpapers.module.css";

const collections = [
  { title: "Banshees of Inisherin", folder: "banshees-of-inisherin", numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { title: "Miyazaki", folder: "miyazaki", numbers: [1, 2, 3, 5] },
].map(({ title, folder, numbers }) => ({
  title,
  wallpapers: numbers.map((number) => ({
    label: `${title} ${number}`,
    src: `/wallpapers/${folder}/${String(number).padStart(2, "0")}.webp`,
  })),
}));

const wallpapers = collections.flatMap((collection) => collection.wallpapers);

export function Wallpapers({ current, onSelect, onOpen }: {
  current: string | null;
  onSelect: (src: string | null) => void;
  onOpen: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const currentWallpaper = wallpapers.find((wallpaper) => wallpaper.src === current);

  function openFolder() {
    onOpen();
    dialogRef.current?.showModal();
  }

  function shuffle() {
    const choices = wallpapers.filter((wallpaper) => wallpaper.src !== current);
    onSelect(choices[Math.floor(Math.random() * choices.length)].src);
  }

  return <>
    <button className={styles.folder} type="button" aria-haspopup="dialog" onClick={(event) => {
      event.currentTarget.focus({ preventScroll: true });
      if (event.detail === 0 || matchMedia("(any-pointer: coarse)").matches) openFolder();
    }} onDoubleClick={openFolder} onKeyDown={(event) => {
      if (event.metaKey && (event.key.toLowerCase() === "o" || event.key === "ArrowDown")) {
        event.preventDefault();
        openFolder();
      }
    }}>
      <svg aria-hidden="true" width="44" height="36" viewBox="0 0 44 36" fill="none">
        <defs>
          <linearGradient id={`${titleId}-folder`} x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="#8fe0fc" />
            <stop offset="1" stopColor="#37a8e7" />
          </linearGradient>
        </defs>
        <path d="M2 8a4 4 0 0 1 4-4h9a5 5 0 0 1 4 2l2 2h16a5 5 0 0 1 5 5v15a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8Z" fill="#298dc9" />
        <rect x="3" y="11" width="38" height="21" rx="4" fill={`url(#${titleId}-folder)`} />
        <path d="M7 12h30" stroke="#d5f3ff" strokeOpacity=".8" strokeLinecap="round" />
      </svg>
      <span>Wallpapers</span>
    </button>
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId}>
      <header className={styles.titlebar}>
        <form method="dialog"><button className={styles.close} aria-label="Close wallpapers"><span aria-hidden="true">×</span></button></form>
        <h2 id={titleId}>Wallpapers</h2>
      </header>
      <div className={styles.toolbar}>
        <p role="status">Current wallpaper <strong>{currentWallpaper?.label ?? "Default"}</strong></p>
        <div className={styles.actions}>
          <button type="button" onClick={() => onSelect(null)} disabled={!current}>Use default</button>
          <button type="button" className={styles.shuffle} onClick={shuffle}>Shuffle</button>
        </div>
      </div>
      <div className={styles.gallery}>
        {collections.map(({ title, wallpapers }) => <section key={title}>
          <h3>{title}</h3>
          <div className={styles.grid}>
            {wallpapers.map(({ src, label }) => <button type="button" key={src} className={styles.thumbnail} aria-label={label} aria-pressed={src === current} onClick={() => onSelect(src)}>
              <Image src={src} alt="" fill sizes="(max-width: 520px) 27vw, 145px" />
              {src === current && <span className={styles.selected} aria-hidden="true">✓</span>}
            </button>)}
          </div>
        </section>)}
      </div>
    </dialog>
  </>;
}
