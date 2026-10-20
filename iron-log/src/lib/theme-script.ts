/**
 * Theme constants shared by the server layout and the client provider.
 */

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "ironlog.theme";

/** Must match `--background` in globals.css for each theme. */
export const CHROME_COLOR: Record<ResolvedTheme, string> = {
  light: "#F8FAFC",
  dark: "#090C12",
};

/**
 * The pre-paint script, injected as a string.
 * Defaults to "dark" for a futuristic, sleek athlete aesthetic.
 */
export const THEME_SCRIPT = `(function(){try{
var s=localStorage.getItem("${THEME_KEY}");
var t=(s==="light"||s==="dark")?s:"dark";
document.documentElement.setAttribute("data-theme",t);
var c=t==="dark"?"${CHROME_COLOR.dark}":"${CHROME_COLOR.light}";
var e=document.querySelector('meta[name="theme-color"]');
if(!e){e=document.createElement("meta");e.setAttribute("name","theme-color");document.head.appendChild(e);}
e.setAttribute("content",c);
}catch(_){}})();`;
