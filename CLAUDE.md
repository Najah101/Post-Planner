@AGENTS.md

## Design system: reuse, don't rewrite

All shared styling and motion live in [app/globals.css](app/globals.css) (the "Ephemeris" design system), with JS mirrors in [lib/motion.ts](lib/motion.ts) and [lib/useExit.ts](lib/useExit.ts). Before writing any UI, read `app/globals.css` and use what is there. Do not re-implement something it already provides.

- **Colours, radius, shadows, timing**: use the CSS variables (`--bg`, `--card`, `--line`, `--text`, `--muted`, `--accent`, `--hl`, `--radius`, `--dur-*`, `--ease-*`) or their Tailwind aliases (`bg-card`, `text-muted`, `border-line`, `text-ink`, `bg-accent`, ...). Never hardcode hex values, durations or easing curves.
- **Controls**: `.btn` with `.btn-primary` / `.btn-ghost` / `.btn-quiet`, `.copy-btn`, `.field` (inputs and selects), `.label`.
- **Press feedback**: `.tap` for clickable controls, `.tap` + `.tap-surface` for rows and cards. Don't write custom `:active` / hover scale styles.
- **Floating layers**: `.menu` (stays mounted, toggle `data-open`), `.reveal` / `.reveal-up` (mount on demand), `.scrim`, `.panel`. Exit by setting `data-closing="true"` via `useExit`. Don't add fade or pop animations.
- **Content motion**: `.slide-x` with `--dir`; `t-move` for transition timing on indicators and chevrons.
- **Icons and shared components**: check `components/` (e.g. `TypeIcon`, `DateTimePicker`, `ImageField`) before building a new one.

If something genuinely new is needed, add it to `app/globals.css` (tokens in `:root`, classes in `@layer components`) and, if JS needs the values, mirror them in `lib/motion.ts`. Then use it. Don't inline one-off copies in a component. If a pattern appears in two or more places, extract it into the design system instead of duplicating it.

## Git: atomic commits

Never bundle unrelated work into one big commit. Each commit is one logical change that builds and makes sense on its own.

- Split by concern: a design-system addition, the components that use it, a bug fix, a refactor, and docs are separate commits.
- Commit in dependency order (e.g. new CSS class or helper first, then the code that uses it).
- Stage deliberately with `git add <paths>` (or `git add -p` to split a file). Never `git add -A` / `git add .` without checking `git status` and `git diff --staged` first.
- Use the existing message style: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` followed by a short lowercase summary.
- Commit as you finish each piece rather than at the end of the session. Only commit when the user has asked for it.
