import { useId, useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import Image from "next/image";
import { useDialogBackdrop } from "../use-dialog-backdrop";
import { useDesktopPreference } from "./use-desktop-preference";
import styles from "./wallpapers.module.css";

const directions: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
};

export function DesktopFolder({ name, slot, onOpen, children }: {
  name: string;
  slot: number;
  onOpen: () => void;
  children?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const backdrop = useDialogBackdrop(() => dialog.current?.close());
  const titleId = useId();
  const [position, setPosition, positionRestored] = useDesktopPreference<{ x: number; y: number } | undefined>(`folder:${name}`, undefined);
  const gesture = useRef<{ pointer: number; x: number; y: number; left: number; top: number } | null>(null);
  const moved = useRef(false);
  const touch = useRef(false);

  function open() {
    if (dialog.current?.open) return;
    onOpen();
    dialog.current?.showModal();
  }

  function place(button: HTMLButtonElement, left: number, top: number) {
    const desktop = button.offsetParent;
    if (!desktop) return;
    setPosition({
      x: Math.max(0, Math.min(left, desktop.clientWidth - button.offsetWidth)),
      y: Math.max(0, Math.min(top, desktop.clientHeight - button.offsetHeight)),
    });
  }

  function start(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const { offsetLeft, offsetTop } = event.currentTarget;
    moved.current = false;
    touch.current = event.pointerType !== "mouse";
    gesture.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, left: offsetLeft, top: offsetTop };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: PointerEvent<HTMLButtonElement>) {
    const start = gesture.current;
    if (!start || start.pointer !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!moved.current && Math.hypot(dx, dy) < 5) return;
    moved.current = true;
    const button = event.currentTarget;
    button.focus({ preventScroll: true });
    place(button, start.left + dx, start.top + dy);
  }

  function end(event: PointerEvent<HTMLButtonElement>) {
    if (gesture.current?.pointer === event.pointerId) gesture.current = null;
  }

  return <>
    <button type="button" className={styles.folder} aria-haspopup="dialog" data-position-restored={positionRestored}
      style={{ "--slot": slot, "--folder-x": position && `${position.x}px`, "--folder-y": position && `${position.y}px` } as CSSProperties}
      onPointerDown={start} onPointerMove={drag} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
      onClick={(event) => {
        const button = event.currentTarget;
        button.focus({ preventScroll: true });
        if (event.detail === 0 || (!moved.current && touch.current)) open();
      }} onDoubleClick={() => { if (!moved.current) open(); }} onKeyDown={(event) => {
        if (event.metaKey && (event.key.toLowerCase() === "o" || event.key === "ArrowDown")) {
          event.preventDefault();
          open();
          return;
        }
        const direction = directions[event.key];
        if (!direction || event.metaKey || event.altKey || event.ctrlKey) return;
        event.preventDefault();
        const button = event.currentTarget;
        place(button, button.offsetLeft + direction[0] * 12, button.offsetTop + direction[1] * 12);
      }}>
      <Image src="/desktop-folder.png" width={64} height={64} alt="" draggable={false} unoptimized />
      <span>{name}</span>
    </button>
    <dialog ref={dialog} {...backdrop} className={styles.dialog} aria-labelledby={titleId}>
      <header className={styles.titlebar}>
        <form method="dialog"><button className={styles.close} aria-label={`Close ${name}`}><span aria-hidden="true">×</span></button></form>
        <h2 id={titleId}>{name}</h2>
      </header>
      {children ?? <p className={styles.emptyFolder}>0 items</p>}
    </dialog>
  </>;
}
