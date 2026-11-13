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

export function WallpaperPicker({ current, onSelect }: {
  current: string | null;
  onSelect: (src: string | null) => void;
}) {
  const currentWallpaper = wallpapers.find((wallpaper) => wallpaper.src === current);

  function shuffle() {
    const choices = wallpapers.filter((wallpaper) => wallpaper.src !== current);
    onSelect(choices[Math.floor(Math.random() * choices.length)].src);
  }

  return <>
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
  </>;
}
