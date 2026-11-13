"use client";

import { useCallback, useRef, useState } from "react";
import { DUR_EXIT } from "./motion";

/** Plays the shared exit animation (data-closing="true") before calling onClose. */
export function useExit(onClose: () => void) {
  const [closing, setClosing] = useState(false);
  const done = useRef(false);

  const close = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setClosing(true);
    setTimeout(onClose, DUR_EXIT);
  }, [onClose]);

  return { closing, close };
}
