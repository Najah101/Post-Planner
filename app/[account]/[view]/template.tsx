"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const ORDER = ["calendar", "board", "upcoming"];
const indexOf = (path: string) => ORDER.indexOf(path.split("/").pop() ?? "");

// Lives in the [view] segment: a template only remounts when its own segment changes,
// so one level up it would never remount on a view switch. Remember the previous view here.
let lastIndex = -1;

/** Views slide in from the side they sit on in the tab bar. */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [dir] = useState(() => {
    // Server renders never slide (module state there is shared across requests).
    if (typeof window === "undefined") return 0;
    const next = indexOf(pathname);
    const d = lastIndex === -1 || next === -1 || next === lastIndex ? 0 : next > lastIndex ? 1 : -1;
    lastIndex = next;
    return d;
  });
  return (
    <div className="slide-x" style={{ "--dir": dir } as React.CSSProperties}>
      {children}
    </div>
  );
}
