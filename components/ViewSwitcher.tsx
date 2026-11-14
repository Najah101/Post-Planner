"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { VIEWS, isView, type View } from "@/lib/views";
import BoardView from "./BoardView";
import CalendarView from "./CalendarView";
import UpcomingView from "./UpcomingView";

const COMPONENTS: Record<View, React.ComponentType> = {
  calendar: CalendarView,
  board: BoardView,
  upcoming: UpcomingView,
};

/**
 * Renders the view named in the URL. The tab bar changes the URL with history.pushState, so
 * switching views never waits on the server: every view reads the posts PlannerProvider holds.
 * The new view slides in from the side it sits on in the tab bar.
 */
export default function ViewSwitcher() {
  const last = usePathname().split("/").pop();
  const view: View = isView(last) ? last : "calendar";
  const index = VIEWS.indexOf(view);

  // Direction comes from the previous view (adjusting state while rendering, no effect needed).
  const [prev, setPrev] = useState(index);
  const [dir, setDir] = useState(0);
  if (prev !== index) {
    setPrev(index);
    setDir(Math.sign(index - prev));
  }

  const Component = COMPONENTS[view];
  return (
    <div key={view} className="slide-x" style={{ "--dir": dir } as React.CSSProperties}>
      <Component />
    </div>
  );
}
