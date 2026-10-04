# 2027 Life OS — Project Guidelines

These rules are binding for every change to this project.

## Behavioural model

The app is a habit system, not a to-do list. Two rules carry it and neither is negotiable:

- **Three tasks a day, hard capped.** `TOP_TASK_CAP = 3` is enforced in state, not hidden in the UI — a fourth pick is refused and told why. Loosening the cap defeats the 80/20 principle the whole screen exists to serve.
- **Six pillars hold the year.** Every 2027 goal belongs to one of `PILLARS` (الإيماني، الصحي، المهني، المالي، الاجتماعي، الشخصي). A goal with no pillar has nowhere to live.
- **Ninety days at a time.** Every goal also carries a `quarter`, and the vault opens on `currentQuarter()` — the other three are one tap away but never the default. A year-wide list is what the quarters exist to prevent.
- **The cue advances on every open, and on tap.** `useDailyQuote()` walks `QUOTES` from a cursor persisted at `life-os-2027:quote` and returns `[quote, shuffle]`; the card is a button. Keying it to the day of the month was tried and rejected — within a single day the card never visibly moved, which reads as broken. A cue only motivates when it is actually new.

**A habit can feed the library.** `habit.book` is the link and has exactly three states: `null` (an ordinary habit), `READ_ACTIVE` (follows whichever book is marked «أقرأه الآن»), or a book id (pinned, for a second reading habit). Ticking a linked habit opens `ReadLogModal` **after** the tick has landed, never before — the reward animation must play and a skipped prompt must still leave the habit done. Logging appends to `state.reading` and advances that book's `page`. **Unticking withdraws it**: today's sessions for that habit are removed and the page counter rolls back, because a log that keeps pages the user undid is worse than no log. The seeded «قراءة» habit ships linked to the active book, and `migrate()` links an existing one the same way — a feature that needs a settings hunt before it does anything will never be found.

**The evening prompt belongs to the logical day, not to the wall clock.** `inReflectWindow()` is true from `REFLECT_FROM_HOUR` (20:00) round past midnight to `DAY_START_HOUR` — because that is when this day actually ends. Testing `getHours() >= 20` left 00:00–03:59 silent, which is exactly when someone reviewing the day that just finished is awake, and exactly the hours «السهر بعد منتصف الليل» assumes he is up for; at 04:00 the day rolled over and took the question with it. «لاحقًا» snoozes for an hour and the prompt returns at most `REFLECT_MAX_SHOWS` times an evening — a button that says *later* has to mean later, and one that returns forever is one you learn to dismiss without reading. The snooze lives in the UI preferences, so a reload does not re-pop it. It also has a button of its own on the routine screen: the automatic prompt only fires inside its window on a day that fell short, and the reflection must be reachable, re-readable and editable outside both conditions.

**The reading goal is the second discipline meter.** `state.readGoal` (default `READ_GOAL_DEFAULT`) drives the tracker bar, and `readStreak()` counts days in a row that met it. A streak whose last qualifying day was yesterday still counts today — the day is not over, and zeroing it at midnight would punish someone who reads in the evening.

**Every book has a desk.** A shelf that only holds titles and a star rating is a list, not a library. `bookShape()` is the single place a book's fields are written — seed, add form and migration all go through it, so they cannot drift. `BookDesk` is where the reading actually lives: the summary, the points (each with the page it came from, reorderable), where the reading has reached, and the one takeaway. The card stays scannable and shows only a progress bar and a note count; the desk is the place you come back to. Finishing a book stamps `finishedAt` once and moving it back out clears the stamp, so the shelf never claims a finish that was undone. `READING_QUOTES` seeds `state.reads`, a second cue list about reading, walked by the same `useDailyQuote` under its own `READ_KEY` — the hook takes a key precisely so a second cue does not fight the first one's cursor.

**The user owns the order, the cues and the image.** Habits reorder by drag and by ↑/↓ arrows — the arrows are not redundant, they are the only path that works under a finger, because HTML5 drag never fires on touch. Reordering splices `state.habits`, the one flat array the blocks are a filtered view of; a per-block list would drift out of sync with what the archive and the discipline count read. `QUOTES` is seed only: it is copied into `state.quotes` on first load, after which the user adds, edits and deletes freely, and the cue card falls back to an invitation rather than a blank when the list empties. `state.cueImage` is a data URL redrawn through a canvas and stepped down until it fits `IMAGE_BUDGET` — the whole app shares one storage quota, so an oversized photo would make every later write throw and silently stop persisting *everything*. The image gives way; the habits and history never do.

The daily routine runs in six prayer-anchored blocks — الصباح، بعد الظهر، بعد العصر، بعد المغرب، بعد العشاء، قبل النوم — and every habit in every block feeds the one discipline score. The blocks follow the prayer times, not clock hours; a generic "المساء" is not a slot this user lives by.

## UI / UX

- **The ground is the sky, and it moves with the day.** `SKY` holds six phases — `night`, `fajr`, `sunrise`, `day`, `asr`, `maghrib` — selected by `skyAt()` from the wall clock and re-checked once a minute by `useSkyPhase()`, so a boundary that arrives while the app is open changes the screen instead of waiting for a reload. `SkyBackdrop` paints it: a vertical gradient, a sun or a masked crescent moon inside a wide faint halo, drifting cloud, and a seeded star field. Morning is sunrise and cloud and daylight; night is stars and stillness. This is the third ground the project has had and the two before it were both rejected as gloomy — first a blue-slate dashboard (`#0F172A`), then warm charcoal (`#2A2028 → #1B1418 → #120C10`, later deepened and lit harder). Neither failed on hue. They failed because a single fixed dark colour behind a discipline tracker reads as a monitoring console at every hour of the day. **Do not replace the sky with a static ground.**
- **A card's fill comes from the phase, not from a constant.** Each `SKY` entry carries `veil` and `veilStrong`; the root sets them as `--los-veil` / `--los-veil-strong`, and `GLASS.backgroundColor`, `T.card` and the sidebar all read the variables. Cards stay dark so white type keeps its contrast, and they *must* darken as the sky brightens — a fixed `rgba(255,255,255,0.0x)` fill turns into a pale smear against a noon horizon, which is exactly how the Eisenhower quadrants shipped broken once. **Any surface that sits directly on the sky uses `T.card`, never its own white alpha.** The veils are also tinted toward their own phase so a card belongs to the scene instead of sitting on it as a black slab.
- **Override a Card's fill with `backgroundColor`, never `background`.** The shorthand wipes `GLASS.backgroundImage` and the card loses its sheen along with its fill — this is what happened to the quadrants.
- **Nothing opaque may sit above the sky.** `SkyBackdrop` is `fixed inset-0 -z-10`; the root carries no background of its own, and the phase colour goes on `document.documentElement` so an overscroll bounce matches. Giving the root a solid `backgroundColor` paints straight over the sky — this already happened once.
- **The sun is a halo, not a disc.** A single hard-edged circle reads as a billiard ball. The light spreads wide and faint and only a small blurred core is bright. The moon's bite is cut with an SVG mask, never painted as a second disc in a flat colour — the gradient behind it is never exactly that colour at the moon's height, so the flat disc read as an eclipse.
- **Screen headings carry a coral→gold gradient** via `.los-title`. The clip is paired with `-webkit-text-fill-color: transparent`, and nothing on that element is ever animated with a transform — see the rendering trap below.
- **Every colour is saturated.** Semantic: Coral `#FF5722` action, Emerald `#10B981` success, Amber `#FFB020` achievement, Rose `#FF3B5C` danger. Organizational tints are vivid too — `#FFB020`, `#FF7A45`, `#FF4D8D`, `#9D5CFF`, `#00C2FF`, `#5B8CFF`. Muted pastels were tried once and rejected: they read as washed-out and drained the life the app exists to create. Do not re-introduce them.
- **A category tint must never colour a completion.** If a row's "done" state borrows its category colour, finishing something stops reading as finishing. Pass `T.primary` to `Checkbox`, and let the category colour its own icon and progress bar only.
- **Glassmorphism on every card:** the sheen is *warm*, not neutral white — a trace of coral at the lit corner falling through transparency to violet at the shaded one, so a card picks up the ground's colour instead of sitting on it as a grey pane. `border: 1px solid rgba(255,225,210,0.18)`, `backdrop-filter: blur(22px) saturate(180%)`, and an inset top highlight at ~0.14 alpha. Frosted, not glossy.
- **Interactive motion eases out, never in-and-out.** `cubic-bezier(.22, 1, .36, 1)` is applied by attribute selectors on Tailwind's own `transition*` classes, from a `<style>` block that ships after Tailwind — same specificity, later in the document, so it wins without `!important`.
- **Electric Coral `#FF5722` drives every primary CTA** — add a habit, add a task, add a book, save, the active nav item. One CTA colour, used everywhere, so the next action is never ambiguous.
- **Emerald `#10B981` means success only** — a completed habit, a finished task, a day above target. Never decorative, and never a group tint.
- **Amber `#FBBF24` means achievement** — star ratings, streak counters, the morning block.
- **Every completion pays out.** Checking a habit or a task fires `los-pop` (scale-bounce), `los-ripple` (expanding ring) and `los-reward` (emerald glow pulse on the card). A completion that animates nothing is a bug.
- **Navigation is split by breakpoint, never duplicated.** Desktop (`lg:flex`) gets the collapsible sidebar; mobile (`lg:hidden`) gets `BottomTabs` — a floating glass bar clear of the bottom edge via `env(safe-area-inset-bottom)`, with short labels from `NAV[].short`. Anything fixed to the bottom on mobile (the streak toast) must clear the bar.
- **Four tabs on the bar, the rest behind «المزيد».** `TAB_BAR = 4`: at 375px a tab needs ~63px to keep its label legible, so the bar shows `NAV.slice(0, TAB_BAR)` plus a More button that opens a sheet with the remaining tabs and Settings. Adding a tab means adding it to the sheet, never widening the bar.
- **Date and time sit beside the wordmark**, small — `NowStamp`, its own component so the one-second tick re-renders that line and nothing else. It is named `NowStamp` and not `Clock` because `Clock` is already a lucide icon in this file.
- Smooth transitions on every interactive state. Respect `prefers-reduced-motion` — every `los-*` animation is disabled under it (including `los-drift`, the cloud motion), and `usePrefersReducedMotion` gates both the SMIL gradient on the discipline ring and the star twinkle.

Four rendering traps this UI has already hit:

- **Never put a `transform` animation on the same element as `-webkit-background-clip: text`.** Chrome collapses the clip and the text paints as a solid block. Animate a wrapper instead, and always pair the clip with `-webkit-text-fill-color: transparent`.
- **Never drive a reward animation through `requestAnimationFrame`.** It does not run in a hidden tab, so the reward is swallowed and then replays when the tab returns. Set the state synchronously and clear it on a timer.
- **`Modal` renders through a portal into `document.body`, and must keep doing so.** A transformed ancestor becomes the containing block for every `position: fixed` descendant, and `.los-in` — the wrapper that slides each screen in — animates `transform`. Every modal is rendered from inside a module, so without the portal each one is laid out against the module's content box instead of the window: the tallest form put its own header above the top edge, where nothing can scroll to it. Capping the height treats the symptom; leaving the transformed subtree is the fix.
- **Never set a CSS shorthand beside one of its own longhands in the same `style` object.** React applies them in object order and a re-render can have the shorthand wipe the longhand. This has bitten twice: `background` erasing `GLASS.backgroundImage` (the quadrants lost their sheen), and `textDecoration` beside `textDecorationColor` on the checkbox label. Use the longhands — `backgroundColor`, `textDecorationLine`.

## Tech stack

- **React** (function components + hooks), **Tailwind CSS**, **Shadcn UI**.
- **Shadcn caveat:** shadcn is not an importable package — it is components you copy into a project with its CLI, compiling to Radix UI + Tailwind. This project ships as a single self-contained file, so `LifeOS.jsx` implements shadcn's *token model and component API* (`Card`, `Btn`, `Field`, `Badge`, `Modal`, `Checkbox`) with zero dependencies beyond `lucide-react`. Keep that contract: new primitives follow the same shape. If the project ever moves to a real build with its own `components/ui` directory, swap these for genuine shadcn components — the call sites should not need to change.
- Icons: `lucide-react`. No other icon set.

## Data

- **Always persist to `localStorage`**: habits, tasks, books, goals, sessions, income, ventures, prompts, reviews, pipeline, history, streaks, and UI preferences. A new feature's array goes in `freshState`, in the `carry` block of `loadState`, and behind a `migrate()` branch — miss the middle one and the data vanishes on the next day rollover.
- **A `history` entry is merged, never rebuilt.** The archive effect rewrites today's row on every discipline change, and that row also holds everything written about the day — the evening reflection (`distraction` / `fix`) and the accountability mirror (`mirror`). Spread the previous entry before writing, or a single habit toggle erases it. Anything new that is written per-day belongs on this row and inherits the same rule.
- **An imported file is untrusted.** `SettingsModal` refuses a payload that is not shaped like this app's state before touching anything, then runs it through `migrate()` — an older backup must come back upgraded, not broken.
- **Changing seed data is a migration, never an edit.** `SCHEMA` in `LifeOS.jsx` is the version; `migrate()` runs on load and reshapes an older payload. Bump `SCHEMA` and add a branch — moving a habit between groups must *move* the user's own row, not append a second copy beside it. Verify against a pre-migration payload before shipping.
- **The browser holds the working copy; the disk holds the one that survives.** Every save also goes to `local-sync-server.js`, which writes `graphify-out/data/lifeos.json` atomically, keeps the write before it as `lifeos.prev.json`, and stamps an hourly snapshot into `backups/auto/` (72 deep). `pullDisk()` reads it back — but **only when `localStorage` is empty**, and **before the first render**: mounting first and adopting after would paint a seeded empty day, and the save effect fires on that seed and writes emptiness over the recovery still in flight. A cleared profile, a new profile or an evicted bucket heals itself on the next open.
- **Only the served origin writes to disk.** `syncOut` refuses unless `served()`. A copy opened as a file has its own `localStorage`, its own idea of the day, and is invisible to the window lease — letting it sync would drop a snapshot from whenever it was last used on top of the live one. It can still read and still recover; it is just never the copy that gets saved.
- Wrap every read and write in `try/catch` — the app must render correctly when storage is blocked.
- Never silently delete text the user typed. On a new day, uncheck; do not clear.

## Language

- **Arabic, strictly RTL.** `dir="rtl"` on the root, and the layout must read right-to-left natively — not a mirrored LTR design.
- **Never use English placeholders or labels in the UI.** Every `placeholder`, `aria-label`, `title`, button, heading and helper line is Arabic.
- Proper nouns are the only exception: the product name `2027 Life OS`, and exam or brand names such as `STEP`.
- Watch Arabic bidi: a Latin fragment or a spaced fraction (`5.7 / 10`) inside Arabic text reverses. Wrap it in `<span dir="ltr">`.
- Fonts: **Tajawal** or **Cairo**, with a real system fallback stack.

## Project layout

| Path | What it is |
|---|---|
| `LifeOS.jsx` | The app. Single file, current version. |
| `build-life-os.mjs` | The build. `node build-life-os.mjs` — the only way the site is produced. |
| `life-os/index.html` | Built site, served at `http://127.0.0.1:47615/`. |
| `life-os/LifeOS.source.jsx` | Copy of the source, written by the build. Never edited by hand. |
| `life-os/sw.js` | Service worker. Caches the shell so the app opens with the server down. |
| `life-os/archive/` | Previous versions. Never delete; supersede. |
| `local-sync-server.js` | Serves the site and keeps the state on disk. Starts with Windows. |
| `graphify-out/data/lifeos.json` | The state, on disk. `.prev.json` beside it is the write before. |
| `backups/auto/` | Hourly snapshots, 72 deep, pruned by the server. |
| `run-life-os.vbs` | Starts the server if it is down, waits for it, then opens Chrome. |
| `افتح 2027 Life OS.lnk` | Shortcut → `run-life-os.vbs`. The one way in. |

## Build

```bash
node build-life-os.mjs
```

It bundles `LifeOS.jsx` with esbuild, generates the exact Tailwind CSS by scanning that same file, and inlines both into `life-os/index.html` — then copies the source to `life-os/LifeOS.source.jsx`, so the two cannot drift. Run it after **every** change to `LifeOS.jsx`; editing `index.html` by hand is editing a build artefact.

There is no `node_modules` beside `LifeOS.jsx` and no `package.json`. esbuild and tailwindcss are imported straight out of `iron-log/node_modules`, and `lucide-react` resolves there through esbuild's `nodePaths` — nothing is installed and nothing is fetched. React is **not** bundled: it loads as UMD 18.3.1 from cdnjs and the bundle reaches it through shims that read `window.React`. Bundling the React 19 that sits in `iron-log` beside a page loading 18.3.1 would give the app two Reacts and one of them would own the hooks.

Three things that have bitten this build before:

- **Never use `String.replace` with the bundle as the replacement string** — `$&`, `$'` and friends are substitution patterns and will corrupt the output. The build joins an array instead.
- **The project path contains a space** (`E:\claude code`). Any `file:///` URL must percent-encode it as `%20`, or Chrome opens nothing at all with no error.
- **The sync log prints characters, the disk holds bytes.** Arabic is two bytes a letter in UTF-8, so a payload logged at 24,627 is 28,839 on disk. It is not shrinking.

## Workflow

The app is served, not opened as a file. A `file://` page has no origin of its own: Chrome files every local html document on the machine into one shared storage bucket, will not install it, and will not mark its data persistent — so an ordinary "clear browsing data" takes the year with it. Served from `127.0.0.1` it has its own origin, and that is what buys persistence, installability and a service worker.

After building, restart the server if `local-sync-server.js` changed, then open it in the user's own Chrome so he can verify it himself:

```powershell
Start-Process 'C:\Windows\System32\wscript.exe' -ArgumentList '"E:\claude code\run-life-os.vbs"'
```

Confirm the window actually appeared before reporting success. **Never open a second copy while his is open** — the preview pane, a headless check, anything. Each one loads the state and writes its snapshot straight back on mount, so a window opened for twenty seconds of verification can land on top of a habit he ticked in that time. Verify against a copy, or snapshot `graphify-out/data/lifeos.json` first and diff it after.
