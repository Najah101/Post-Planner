/** The planner's views, in tab-bar order (views slide in from the side they sit on). */
export const VIEWS = ["calendar", "board", "upcoming"] as const;
export type View = (typeof VIEWS)[number];

export const isView = (v: string | undefined): v is View => VIEWS.includes(v as View);
