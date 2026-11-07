"use client";

import { useCallback, useRef, useState } from "react";

/** Plays an exit animation (data-closing="true") before calling onClose. */
export function useExit(onClose: () => void, ms = 220) {
  const [closing, setClosing] = useState(false);
  const done = useRef(false);

  const close = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setClosing(true);
    setTimeout(onClose, ms);
  }, [onClose, ms]);

  return { closing, close };
}
