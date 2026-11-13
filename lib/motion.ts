/** Mirrors the motion tokens in app/globals.css for code that animates from JS. Keep them in sync. */
export const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
export const DUR_MOVE = 240;
export const DUR_EXIT = 180;

/** Drag-and-drop: the card settles into place like any other moving layer. */
export const DROP_ANIMATION = { duration: DUR_MOVE, easing: EASE_OUT };
