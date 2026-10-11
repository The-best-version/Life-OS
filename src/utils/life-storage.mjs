import { uid } from "../state/life-state.mjs";

export const STORAGE_KEY = "life-os-2027:v3";

/* --- which copy is the real one --------------------------------------- *
 *  One origin, and only one. `localhost:47615` and `127.0.0.1:47615` are two
 *  origins to a browser: separate localStorage, separate idea of the day,
 *  separate window lease — and both of them writing to the same file on disk
 *  with no way to see each other. A port number is the same story. So the
 *  primary copy is named exactly, and anything else is readable, recoverable
 *  and never written from.
 *
 *  `LIFE_OS_PRIMARY` is the one seam, and it exists for testing: a copy of
 *  the built page served on a throwaway port can declare itself primary so
 *  the write path can actually be exercised without going anywhere near the
 *  live origin. Nothing in the shipped build sets it.
 * ---------------------------------------------------------------------- */
export const LOCAL_HOST = "http://127.0.0.1:47615";
export function primaryOrigin() {
  try {
    const override = window.LIFE_OS_PRIMARY;
    return typeof override === "string" && override ? override : LOCAL_HOST;
  } catch {
    return LOCAL_HOST;
  }
}
export function served() {
  try {
    return location.origin === primaryOrigin();
  } catch {
    return false;
  }
}
/* True for a page that is local but is not the primary copy — the place the
   «هذي ليست النسخة الأساسية» bar comes from. A file:// copy counts: it reads
   and it recovers, it simply never writes. */
export const isLocalHost = (h) =>
  h === "127.0.0.1" || h === "localhost" || h === "[::1]" || h === "::1";
export function strayCopy() {
  try {
    if (location.protocol === "file:") return true;
    return (
      location.protocol.startsWith("http") && !served() && isLocalHost(location.hostname)
    );
  } catch {
    return false;
  }
}
/* Same-origin when the server is also the one serving the page, absolute
   when it is not — a file:// page has no origin to be relative to. */
export const api = (p) => (served() ? p : primaryOrigin() + p);
/* Reading the disk copy is safe from anywhere local — a page opened as a
   file still deserves to find the data. */
export function syncLocal() {
  try {
    return location.protocol === "file:" || served() || strayCopy();
  } catch {
    return false;
  }
}

/* --- the revision counter --------------------------------------------- *
 *  The lease stops two windows writing at the same time. It does not stop a
 *  window that has been asleep from writing at all — and nothing on either
 *  side used to compare versions, so the last writer won by default and the
 *  older payload landed on top of the newer one without a word.
 *
 *  So every write carries a number that only goes up. It lives in its own
 *  localStorage key rather than inside the state: it changes on every single
 *  save, and a counter inside React state would re-render the whole app to
 *  announce that the app had just been saved. The window remembers the
 *  revision it loaded; before each write it re-reads the stored one, and a
 *  stored revision ahead of its own means another window has been working.
 *  That window stops writing and says so, rather than guessing which of two
 *  divergent copies was meant to win.
 * ---------------------------------------------------------------------- */
export const REV_KEY = "life-os-2027:rev";
export function readRev() {
  try {
    const n = Number(window.localStorage.getItem(REV_KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}
export function writeRev(n) {
  try {
    window.localStorage.setItem(REV_KEY, String(n));
  } catch {
    /* Storage blocked: nothing persists anyway, so there is no race to lose. */
  }
}

/* --- local sync -------------------------------------------------------
   Mirrors the state to the local sync server, which keeps it on disk and
   feeds the charts without a manual export. localStorage stays the source
   of truth while the app is running; the disk copy is what survives the
   browser, and `pullDisk` below reads it back when the browser turns up
   empty.

   Writing it is for the primary copy alone. A copy opened as a file, or on
   another port, has its own separate localStorage — which means its own
   separate idea of the day, and a window lease that cannot see across the
   two. Letting it write would put a snapshot from whenever it was last used
   on top of the real one: the same clobbering the lease exists to prevent,
   one layer down. It stays readable, and it keeps its own working copy. It
   just is not the one that gets saved. */
export const SYNC_DEBOUNCE = 800;
/* A minute of unbroken failure before the banner. The server restarting, the
   laptop waking, a request cut off as the page navigates — none of those is
   worth saying anything about. A server that has been off for two days is. */
export const DISK_STUCK_MS = 60 * 1000;
/* 800ms rather than 2.5s. The debounce exists so that a run of ticks is one
   write and not eight, and that is still true at this length — but two and a
   half seconds is long enough to tick a habit and close the window inside,
   which left the disk a change behind the browser. The flush below closes
   the rest of that gap; this shortens the window it has to cover. */
let syncTimer = null;
let syncPending = null; // the payload waiting on the debounce, if any
/* How the rest of the app hears about a write landing or failing: the save
   stamp needs to say «القرص ✓» only when the disk actually confirmed, and
   the conflict bar needs the 409. Set once by the app shell. */
let syncReport = () => {};
export const onSyncResult = (fn) => {
  syncReport = typeof fn === "function" ? fn : () => {};
};

/* keepalive lets a request outlive the page that started it, which is the
   whole point at `pagehide` — but it is capped at 64KB of body by the fetch
   standard, and this payload runs to several hundred KB once a cue image is
   set. Over the cap it goes out as an ordinary request, which usually still
   completes because hiding a tab is not closing it. */
const KEEPALIVE_MAX = 60 * 1024;

export function postSync(payload, rev, { force = false, guard = false, keepalive = false } = {}) {
  const body = JSON.stringify({ project: "lifeos", payload: { ...payload, rev } });
  const headers = { "Content-Type": "text/plain", "X-Local-Sync": "1" };
  if (force) headers["X-Force"] = "1";
  /* A restore from the recovery centre. The file it lands on is perfectly
     good — it is simply not the one he wants — so the server stows it first
     whatever the shapes say. `shrinkReason` cannot catch this on its own: a
     restore that happens to *add* rows still destroys the copy he would
     undo back to. */
  if (guard) headers["X-Guard"] = "1";
  const opts = { method: "POST", headers, body };
  if (keepalive && body.length < KEEPALIVE_MAX) opts.keepalive = true;
  return fetch(api("/sync"), opts).then(
    async (res) => {
      if (res.status === 409) {
        let disk = null;
        try {
          disk = await res.json();
        } catch {
          /* the body is a courtesy; the status is the message */
        }
        syncReport({ ok: false, conflict: true, disk });
        return { ok: false, conflict: true };
      }
      if (!res.ok) {
        syncReport({ ok: false, conflict: false });
        return { ok: false };
      }
      let at = Date.now();
      try {
        const info = await res.json();
        if (info && Number.isFinite(info.savedAt)) at = info.savedAt;
      } catch {
        /* an older server answers 204 with no body — the write still landed */
      }
      syncReport({ ok: true, at });
      return { ok: true, at };
    },
    () => {
      /* Server down, or the page went away mid-flight. Not fatal, but not
         silent either: the stamp has to stop claiming the disk is current. */
      syncReport({ ok: false, conflict: false });
      return { ok: false };
    },
  );
}

export function syncOut(payload, rev) {
  if (!served()) return;
  syncPending = { payload, rev };
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    const due = syncPending;
    syncPending = null;
    syncTimer = null;
    if (!due) return;
    try {
      postSync(due.payload, due.rev);
    } catch {}
  }, SYNC_DEBOUNCE);
}

/* The pending write, sent now. Called when the page is being hidden or torn
   down: a tick followed straight away by closing the window used to leave
   the disk a change behind the browser, which is exactly the copy the
   reminders read and the copy a cleared profile recovers from. */
export function flushSync() {
  if (!syncPending) return;
  const due = syncPending;
  syncPending = null;
  clearTimeout(syncTimer);
  syncTimer = null;
  try {
    postSync(due.payload, due.rev, { keepalive: true });
  } catch {}
}

/* The disk copy, taken as the truth. The two ways out of a conflict both end
   here or at a reload: this one throws away what this window holds. */
export async function adoptDisk() {
  const res = await fetch(api("/state?project=lifeos"), { cache: "no-store" });
  if (!res.ok) throw new Error("state " + res.status);
  const saved = await res.json();
  if (!saved || typeof saved !== "object" || !Array.isArray(saved.habits))
    throw new Error("not this app's state");
  const { rev, ...rest } = saved;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  writeRev(Number.isFinite(rev) ? rev : 0);
}

export const UI_KEY = "life-os-2027:ui";
/* Per page session, not per profile: its only job is to tell a fresh open
   from a reload, so it has to die with the tab. */
export const OPENED_KEY = "life-os-2027:opened";

/* --- one window at a time --------------------------------------------- *
 *  Every change writes the whole payload, so two open copies clobber each
 *  other: the second window loaded a snapshot, holds it in memory, and the
 *  next thing it saves puts that stale snapshot back over everything the
 *  first one did. Nothing errors and nothing looks wrong — a morning's ticks
 *  simply stop existing. Merging two divergent copies of this state is not
 *  something that can be done correctly after the fact, so the second window
 *  is stopped before it can write instead.
 *
 *  A lease, not a flag. A flag left behind by a crash or a force-quit locks
 *  the app out for good; a lease has to be renewed, so an abandoned one
 *  expires on its own and the next window simply takes over.
 * ---------------------------------------------------------------------- */
export const LOCK_KEY = "life-os-2027:lock";
export const TAB_KEY = "life-os-2027:tab";
/* Set just before «تابع هنا» reloads, and honoured once on the way back.
   Without it, a browser that refuses sessionStorage strands the user: the
   reloaded window comes back with a brand-new id, finds the lease it just
   wrote under its *old* id still fresh, and shows the same lock screen again
   — a button that cannot ever work. */
export const HANDOVER_KEY = "life-os-2027:handover";
export const HANDOVER_GRACE = 15000;
export const LEASE_BEAT = 2000; // the holder renews this often
export const LEASE_STALE = 6000; // unrenewed for this long and it is up for grabs

/* Per-tab and survives a reload, which is what makes "take over here" work:
   the window that claims the lease reloads to re-read the payload, and has to
   still be recognised as the holder when it comes back. sessionStorage is
   scoped to the tab, so a second window never sees this one's id. */
export function tabId() {
  try {
    let v = window.sessionStorage.getItem(TAB_KEY);
    if (!v) {
      v = `${uid()}${Date.now().toString(36)}`;
      window.sessionStorage.setItem(TAB_KEY, v);
    }
    return v;
  } catch {
    /* Storage blocked: a per-load id still prevents two windows writing over
       each other, it just cannot survive a reload. */
    return `${uid()}${Date.now().toString(36)}`;
  }
}

export const readLock = () => {
  try {
    return JSON.parse(window.localStorage.getItem(LOCK_KEY) || "null");
  } catch {
    return null;
  }
};
export const writeLock = (id) => {
  try {
    window.localStorage.setItem(LOCK_KEY, JSON.stringify({ id, at: Date.now() }));
  } catch {
    /* Storage blocked — nothing can be written anyway, so nothing to guard. */
  }
};
export const dropLock = (id) => {
  try {
    const lock = readLock();
    if (lock && lock.id === id) window.localStorage.removeItem(LOCK_KEY);
  } catch {
    /* nothing to release */
  }
};

/* True once, for the window coming back from «تابع هنا». Reading it also
   spends it, so only the reload it was set for is let through. */
export const claimHandover = () => {
  try {
    const at = Number(window.localStorage.getItem(HANDOVER_KEY));
    if (!Number.isFinite(at) || Date.now() - at > HANDOVER_GRACE) return false;
    window.localStorage.removeItem(HANDOVER_KEY);
    return true;
  } catch {
    return false;
  }
};
/* --- the three localStorage backups that were never read ------------
   `life-os-backup-1..3` were written on every single state change — three
   reads and three writes of the whole payload, plus a stringify of it, for
   a rotation no code path in this app has ever read back. Write-only, and
   paid for twice: ~78KB of the one storage quota the whole year shares and
   that `IMAGE_BUDGET` is measured against, and a copy of the entire state
   serialized three times over on every tick of a habit.

   Nothing is lost by dropping them. A copy kept in the same localStorage as
   the original is cleared by the same gesture that clears the original, so
   it never protected against the case it looks like it protects against —
   while the disk behind `syncOut` keeps `.prev.json`, 72 hourly snapshots,
   120 daily ones and a guard copy before every shrinking write, all of them
   reachable from the recovery centre and all of them on the one storage
   that survives the browser.

   `dropDeadBackups` reclaims the space on the next open. It is not a
   migration: `migrate()` reshapes the payload and these were never in it. */
export function dropDeadBackups() {
  try {
    for (let i = 1; i <= 3; i++)
      window.localStorage.removeItem("life-os-backup-" + i);
  } catch {
    /* Blocked storage has nothing to reclaim. */
  }
}
