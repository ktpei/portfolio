import { useRef, type MouseEvent, type PointerEvent } from "react";

function isBackdrop(event: MouseEvent<HTMLDialogElement>) {
  if (event.target !== event.currentTarget) return false;
  const bounds = event.currentTarget.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX >= bounds.right ||
    event.clientY < bounds.top || event.clientY >= bounds.bottom;
}

export function useDialogBackdrop(dismiss: () => void) {
  const pressedBackdrop = useRef(false);

  return {
    onPointerDown(event: PointerEvent<HTMLDialogElement>) {
      pressedBackdrop.current = event.isPrimary && event.button === 0 && isBackdrop(event);
    },
    onPointerCancel() {
      pressedBackdrop.current = false;
    },
    onClick(event: MouseEvent<HTMLDialogElement>) {
      const shouldDismiss = pressedBackdrop.current && isBackdrop(event);
      pressedBackdrop.current = false;
      if (shouldDismiss) dismiss();
    },
  };
}
