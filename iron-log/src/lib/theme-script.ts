/**
 * Theme constants shared by the server layout and the client provider.
 *
 * This module has NO "use client" directive, and that is the whole point of it
 * existing. `THEME_SCRIPT` is read by `app/layout.tsx`, a Server Component: a
 * value exported from a client module reaches a server component as a client
 * *reference*, not as the string itself, so the script tag would receive a proxy
 * object instead of code. Keeping these constants in a neutral module means both
 * sides get the real values.
 */

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "ironlog.theme";

/** Must match `--background` in globals.css for each theme. */
export const CHROME_COLOR: Record<ResolvedTheme, string> = {
  light: "#FEFBFA",
  dark: "#171216",
};

/**
 * The pre-paint script, injected as a string.
 *
 * Deliberately tiny and defensive: a thrown exception in <head> would stop the
 * rest of the document parsing, so every access is wrapped.
 *
 * The OS preference is deliberately NOT consulted. Light is this app's identity
 * — a bright studio with a lit, coloured ground — and following a dark OS meant
 * most people never saw it and judged the app on a near-black screen it was
 * never meant to show. Dark is a choice made in the app, stored under
 * `THEME_KEY`, and honoured from then on; it is not a default anyone falls into.
 */
export const THEME_SCRIPT = `(function(){try{
var s=localStorage.getItem("${THEME_KEY}");
var t=(s==="light"||s==="dark")?s:"light";
document.documentElement.setAttribute("data-theme",t);
var c=t==="dark"?"${CHROME_COLOR.dark}":"${CHROME_COLOR.light}";
var e=document.querySelector('meta[name="theme-color"]');
if(!e){e=document.createElement("meta");e.setAttribute("name","theme-color");document.head.appendChild(e);}
e.setAttribute("content",c);
}catch(_){}})();`;
