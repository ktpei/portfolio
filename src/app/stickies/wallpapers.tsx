import { useRef } from "react";
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
  const currentWallpaper = wallpapers.find((wallpaper) => wallpaper.src === current);

  function shuffle() {
    const choices = wallpapers.filter((wallpaper) => wallpaper.src !== current);
    onSelect(choices[Math.floor(Math.random() * choices.length)].src);
  }

  return <>
    <button className={styles.folder} type="button" aria-haspopup="dialog" onClick={() => {
      onOpen();
      dialogRef.current?.showModal();
    }}>
      <svg aria-hidden="true" width="42" height="36" viewBox="0 0 42 36" fill="none">
        <path d="M2 8a4 4 0 0 1 4-4h10l4 4h16a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8Z" fill="#71badf" stroke="#376d8c" />
        <rect x="2" y="12" width="38" height="20" rx="4" fill="#add9ef" stroke="#376d8c" />
      </svg>
      <span>Wallpapers</span>
    </button>
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="wallpapers-title">
      <header className={styles.titlebar}>
        <h2 id="wallpapers-title">Wallpapers</h2>
        <form method="dialog"><button className={styles.close} aria-label="Close wallpapers">×</button></form>
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
