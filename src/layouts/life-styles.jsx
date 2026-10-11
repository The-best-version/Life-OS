import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { T, Card, Btn } from "../components/life-shared.jsx";

/* ==================================================================== *
 *  THE GROUND AND THE STYLESHEET
 *
 *  Three things that are all the same thing: what the app is painted on,
 *  the rules that paint it, and the one screen that is nothing but those
 *  two. `SkyBackdrop` is the ground — a sky that moves with the day rather
 *  than a fixed dark colour, which is the third ground this project has
 *  had and the only one that was not rejected as gloomy. `AppStyles` is
 *  the gradient heading, the ease curves and every `los-*` animation.
 *  `SecondWindow` is the whole screen a window without the write lease
 *  gets instead of the app.
 *
 *  They are in one file because `SecondWindow` renders both of the others,
 *  and the root renders all three. Leaving the sky in LifeOS.jsx and
 *  taking only the stylesheet and the second window would have made this
 *  module import SkyBackdrop back out of its own consumer — a cycle. The
 *  sky block turned out to reach for nothing at all beyond React: not `T`,
 *  not `GLASS`, not the state. That is what made the seam possible here
 *  and nowhere else.
 *
 *  `SKY`, `SKY_BY_TIME`, `skyAt`, `useStars` and `CLOUDS` stay internal.
 *  Only `SkyBackdrop` and `useSkyPhase` cross the seam, which is exactly
 *  the pair the root reads — the phase to tint the root with, and the
 *  backdrop to paint behind it.
 * ==================================================================== */

/* --- sky -------------------------------------------------------------- *
 *  The ground is not a fixed colour any more: it is the sky outside, and
 *  it moves with the day. A morning of sunrise and drifting cloud, a night
 *  of stars and stillness — the routine is prayer-anchored, so the screen
 *  is anchored the same way. A single dark charcoal was tried twice and
 *  rejected both times as gloomy; the fix was not another hue but daylight.
 *
 *  Each phase also carries `veil`: the card fill. Cards stay dark so white
 *  type keeps its contrast, and they have to darken as the sky brightens —
 *  a noon sky under the old 0.055 white fill is unreadable.
 * ==================================================================== */
const SKY = [
  {
    id: "night",
    label: "ليل",
    from: 20 * 60,
    sky: ["#070B1F", "#0D1330", "#181538"],
    body: "#0B1026",
    stars: 1,
    orb: { kind: "moon", x: 73, y: 15, r: 30, color: "#F4EBD6", glow: "#BFD4FF" },
    clouds: 0.12,
    cloud: "#2A2F52",
    veil: "rgba(198,214,255,0.075)",
    veilStrong: "rgba(186,203,255,0.062)",
  },
  {
    id: "fajr",
    label: "فجر",
    from: 4 * 60 + 30,
    sky: ["#131A3A", "#3B2A57", "#8E4462"],
    body: "#1A1F42",
    stars: 0.45,
    orb: { kind: "glow", x: 24, y: 88, r: 46, color: "#FFB48A", glow: "#FF7E6B" },
    clouds: 0.32,
    cloud: "#6B4A6B",
    veil: "rgba(255,222,232,0.075)",
    veilStrong: "rgba(250,212,226,0.062)",
  },
  {
    id: "sunrise",
    label: "شروق",
    from: 6 * 60 + 15,
    sky: ["#2C4C86", "#E2745C", "#FFC77E"],
    body: "#3A4E86",
    stars: 0,
    orb: { kind: "sun", x: 26, y: 74, r: 42, color: "#FFF1C9", glow: "#FF9A4C" },
    clouds: 0.72,
    cloud: "#FFD8C4",
    veil: "rgba(34,16,24,0.62)",
    veilStrong: "rgba(28,13,20,0.70)",
  },
  {
    id: "day",
    label: "نهار",
    from: 9 * 60,
    sky: ["#1E6FB4", "#5FADDD", "#BEE4F3"],
    body: "#2A7ABE",
    stars: 0,
    orb: { kind: "sun", x: 74, y: 18, r: 36, color: "#FFFBE8", glow: "#FFE07A" },
    clouds: 1,
    cloud: "#FFFFFF",
    veil: "rgba(15,19,31,0.73)",
    veilStrong: "rgba(11,15,26,0.81)",
  },
  {
    id: "asr",
    label: "عصر",
    from: 15 * 60,
    sky: ["#2F6796", "#E9A461", "#FFDCA6"],
    body: "#3D7099",
    stars: 0,
    orb: { kind: "sun", x: 22, y: 58, r: 40, color: "#FFF4D2", glow: "#FFB347" },
    clouds: 0.85,
    cloud: "#FFE9CF",
    veil: "rgba(30,18,14,0.66)",
    veilStrong: "rgba(24,14,11,0.74)",
  },
  {
    id: "maghrib",
    label: "مغرب",
    from: 17 * 60 + 30,
    sky: ["#201741", "#B4406C", "#FF8B4E"],
    body: "#2A1B44",
    stars: 0.18,
    orb: { kind: "sun", x: 20, y: 86, r: 44, color: "#FFD9A8", glow: "#FF5E3A" },
    clouds: 0.55,
    cloud: "#9C5A72",
    veil: "rgba(26,14,30,0.57)",
    veilStrong: "rgba(21,11,25,0.67)",
  },
];

/* Ordered by start minute so the lookup is a plain scan; the night entry
   wraps midnight, which is why it is the fallback rather than a range. */
const SKY_BY_TIME = [...SKY].sort((a, b) => a.from - b.from);

function skyAt(date = new Date()) {
  const mins = date.getHours() * 60 + date.getMinutes();
  let found = SKY.find((p) => p.id === "night");
  for (const phase of SKY_BY_TIME) if (mins >= phase.from) found = phase;
  return found;
}

/* Re-checked once a minute. A phase boundary that arrives while the app is
   open should change the sky, not wait for a reload — this is left open
   all day. */
export function useSkyPhase() {
  const [phase, setPhase] = useState(() => skyAt());
  useEffect(() => {
    const t = setInterval(() => setPhase(skyAt()), 60000);
    return () => clearInterval(t);
  }, []);
  return phase;
}

/* Deterministic star field: seeded so it does not reshuffle on every
   render, which would read as flicker rather than as sky. */
function useStars(count = 70) {
  return useMemo(() => {
    let seed = 20270930;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    return Array.from({ length: count }, () => ({
      x: rand() * 100,
      y: rand() * 72,
      r: 0.5 + rand() * 1.3,
      o: 0.35 + rand() * 0.65,
      d: rand() * 4,
    }));
  }, [count]);
}

const CLOUDS = [
  { y: 8, s: 1.0, o: 0.62, dur: 200, start: 0.08 },
  { y: 19, s: 0.62, o: 0.44, dur: 280, start: 0.42 },
  { y: 30, s: 1.3, o: 0.5, dur: 230, start: 0.66 },
  { y: 44, s: 0.8, o: 0.34, dur: 320, start: 0.24 },
  { y: 57, s: 0.55, o: 0.26, dur: 260, start: 0.86 },
];

/* The sky itself: a fixed layer behind everything, carrying the sun or
   moon, drifting cloud and a star field. Pointer-events off — scenery. */
export function SkyBackdrop({ phase }) {
  const stars = useStars();
  const { orb } = phase;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${phase.sky[0]} 0%, ${phase.sky[1]} 58%, ${phase.sky[2]} 100%)`,
        transition: "background 1600ms ease",
        /* --- the sky is drawn once, not on every scrolled frame ---------
           Sixty-five stars, three clouds and four gradients, all behind a
           card tree whose every glass surface re-samples this layer as it
           moves. Left in the page's normal paint, the whole lot is rasterised
           again each frame of a scroll; given a compositor layer of its own it
           is rasterised once and then only composited.

           `translateZ(0)` is what asks for the layer and `contain` promises
           the browser nothing inside can affect anything outside it, so it
           never has to look. `backfaceVisibility` keeps Chrome from keeping a
           second copy of the texture for a flip that cannot happen.

           Safe to transform here, and only here: the scenery holds no
           `position: fixed` descendant to re-parent — every child is
           `absolute` — and no text clipped to a gradient, which is the pair
           this project has been bitten by before. */
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        contain: "layout paint style",
      }}
    >
      {phase.stars > 0 && (
        <svg
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          style={{ opacity: phase.stars, transition: "opacity 1600ms ease" }}
        >
          {stars.map((st, i) => (
            <circle
              key={i}
              cx={st.x}
              cy={st.y}
              r={st.r / 6}
              fill="#FFFFFF"
              opacity={st.o}
            />
          ))}
        </svg>
      )}

      {/* The halo does the work. A single hard-edged disc reads as a
          billiard ball, not a sun — so the light spreads far and faint,
          and only a small core is actually bright. */}
      <div
        className="absolute rounded-full"
        style={{
          left: `${orb.x}%`,
          top: `${orb.y}%`,
          width: `${orb.r * 1.5}vmax`,
          height: `${orb.r * 1.5}vmax`,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${orb.glow}3D 0%, ${orb.glow}1F 32%, ${orb.glow}0F 52%, transparent 74%)`,
          transition: "all 1600ms ease",
        }}
      />
      {orb.kind === "sun" && (
        <div
          className="absolute rounded-full"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.r * 0.17}vmax`,
            height: `${orb.r * 0.17}vmax`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${orb.color} 0%, ${orb.color} 58%, ${orb.glow} 84%, ${orb.glow}00 100%)`,
            filter: "blur(0.5vmax)",
            boxShadow: `0 0 ${orb.r * 0.3}vmax ${orb.r * 0.07}vmax ${orb.glow}66`,
            transition: "all 1600ms ease",
          }}
        />
      )}
      {orb.kind === "moon" && (
        /* The bite is cut with a mask, not painted over. A second disc in a
           flat colour read as an eclipse, because the gradient behind the
           moon is never exactly that colour at the moon's height. */
        <svg
          className="absolute"
          viewBox="0 0 100 100"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.r * 0.2}vmax`,
            height: `${orb.r * 0.2}vmax`,
            transform: "translate(-50%, -50%)",
            filter: `drop-shadow(0 0 ${orb.r * 0.1}vmax ${orb.glow}99)`,
            transition: "all 1600ms ease",
          }}
        >
          <defs>
            <mask id="los-moon">
              <rect width="100" height="100" fill="black" />
              <circle cx="50" cy="50" r="38" fill="white" />
              <circle cx="70" cy="34" r="33" fill="black" />
            </mask>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="38"
            fill={orb.color}
            mask="url(#los-moon)"
          />
        </svg>
      )}

      {phase.clouds > 0.05 &&
        CLOUDS.map((c, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              /* Held still, never drifting. A cloud crossing the screen sits
                 behind every card, and a backdrop that keeps moving invalidates
                 every `backdrop-filter` on the page once per frame — the whole
                 card tree re-blurs sixty times a second, forever, which is what
                 made the app hang. The sky still changes with the day; it just
                 stops moving while you are reading it. `start` was the drift's
                 phase offset, so it is the natural resting place. */
              left: `${-15 + c.start * 120}%`,
              top: `${c.y}%`,
              width: `${17 * c.s}vmax`,
              height: `${7 * c.s}vmax`,
              opacity: c.o * phase.clouds,
              filter: `blur(${0.35 * c.s}vmax)`,
              transition: "opacity 1600ms ease",
            }}
          >
            <svg viewBox="0 0 170 70" className="h-full w-full">
              <g fill={phase.cloud}>
                <ellipse cx="52" cy="44" rx="34" ry="22" />
                <ellipse cx="86" cy="34" rx="30" ry="26" />
                <ellipse cx="116" cy="46" rx="28" ry="20" />
                <rect x="24" y="44" width="122" height="22" rx="11" />
              </g>
            </svg>
          </div>
        ))}

      {/* A floor of shade, so cards low on the page keep their contrast on
          the bright phases where the horizon is lightest. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${phase.body}33 62%, ${phase.body}66 100%)`,
          transition: "background 1600ms ease",
        }}
      />
    </div>
  );
}

/* The shared stylesheet. Lifted out of the root's JSX because the second
   window returns before it and was rendering without the gradient heading,
   the ease curves and every los-* animation — close enough to a different
   app to be alarming on the one screen whose job is to reassure. Both
   branches mount this. */
export function AppStyles() {
  return (
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700&display=swap');
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    
        /* Cairo carries more weight at display sizes than Tajawal; headings
           take it, body copy stays on Tajawal for readability. */
        h1, h2, h3 {
          font-family: 'Cairo', 'Tajawal', ui-sans-serif, system-ui, sans-serif;
          letter-spacing: -0.015em;
        }
        h2 { line-height: 1.25; }
    
        /* Coral-to-gold on the headings that carry a screen. The clip is
           paired with a transparent fill, and nothing on this element is
           ever animated with a transform — Chrome collapses the clip and
           paints the text as a solid block if it is. Animate a wrapper. */
        /* Cloud drift: slow enough to read as weather, not motion. */
        @keyframes los-drift {
          from { transform: translateX(-20vw); }
          to   { transform: translateX(120vw); }
        }
        .los-drift {
          animation-name: los-drift;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
    
        .los-title {
          background-image: linear-gradient(100deg, #FFCF7A 0%, #FF8A50 46%, #FF5722 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
    
        /* Everything Tailwind marks as transitioning eases OUT instead of
           in-and-out, so hover arrives fast and settles slowly. Attribute
           selectors tie with Tailwind's own class, and this block ships
           after it in the document, so it wins without !important. */
        [class~="transition"],
        [class~="transition-all"],
        [class~="transition-colors"],
        [class~="transition-transform"],
        [class~="transition-opacity"] {
          transition-timing-function: cubic-bezier(.22, 1, .36, 1);
        }
    
        @keyframes losFlame { 0%,100% { transform: scale(1) rotate(-2deg); } 50% { transform: scale(1.15) rotate(3deg); } }
        .los-flame { animation: losFlame 1.6s ease-in-out infinite; }
    
        @keyframes losIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .los-in { animation: losIn .3s cubic-bezier(.22,1,.36,1) both; }
    
        @keyframes losCoverIn { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
        .los-cover-in { animation: losCoverIn .35s cubic-bezier(.22,1,.36,1) both; }
    
        /* --- reward loop: the payoff for finishing something ------------ */
        @keyframes losReward {
          0%   { transform: scale(1);     box-shadow: 0 0 0 0 ${T.primary}B3; }
          30%  { transform: scale(1.045); box-shadow: 0 0 22px 6px ${T.primary}66; }
          60%  { transform: scale(0.982); box-shadow: 0 0 30px 10px ${T.primary}26; }
          100% { transform: scale(1);     box-shadow: 0 0 0 0 ${T.primary}00; }
        }
        .los-reward { animation: losReward .7s cubic-bezier(.34,1.56,.64,1) forwards; }
    
        @keyframes losPop {
          0%   { transform: scale(1)    rotate(0deg); }
          35%  { transform: scale(1.35) rotate(-8deg); }
          62%  { transform: scale(0.9)  rotate(3deg); }
          100% { transform: scale(1.06) rotate(0deg); }
        }
        .los-pop { animation: losPop .52s cubic-bezier(.34,1.56,.64,1) forwards; }
    
        @keyframes losRipple {
          0%   { opacity: .95; transform: scale(1); }
          100% { opacity: 0;   transform: scale(2.9); }
        }
        .los-ripple { animation: losRipple .64s cubic-bezier(.22,1,.36,1) forwards; }
    
        @keyframes losHalo { 0%,100% { opacity: .38; transform: scale(1); } 50% { opacity: .62; transform: scale(1.06); } }
        .los-halo { animation: losHalo 2.4s ease-in-out infinite; }
    
        @keyframes losThrob { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .los-throb { animation: losThrob 2.4s ease-in-out infinite; }
    
        /* Hover lives in CSS so React never fights an imperatively-set style. */
        .los-nav:not(.los-nav-on):hover {
          background: rgba(255,255,255,0.07) !important;
          color: ${T.fg} !important;
        }
        .los-nav-on:hover { filter: brightness(1.12); }
        .los-btn:active { filter: brightness(.95); }
        .los-tab:active { transform: scale(.93); }
    
        /* --- الارتفاع عند المرور (los-raise) ---------------------------
           بطاقة تُلمَس يجب أن ترتفع لا أن تتلوّن: الظلّ يتعمّق تحتها
           والحدّ يسخن، فتُقرأ كجسم مرفوع عن السماء لا كمستطيل غيّر لونه.
           هذا هو مصدر إحساس الـ 3D في هذا التطبيق — طبقات ظلّ، لا تدرّج
           ألوان.

           ثلاثة ظلال لا ظلّ واحد، وهذا هو بيت القصيد: ظلّ تماسّ ضيّق
           يثبّت الحافة، وظلّ متوسّط يعطي الارتفاع، وظلّ واسع خفيف هو
           الضوء المحيط. ظلّ واحد واسع يبدو ضبابًا تحت البطاقة.

           المنحنى هو منحنى التطبيق — cubic-bezier(.22,1,.36,1) — خروجٌ
           فقط بلا دخول، لأن حركة تبدأ بطيئة تبدو متأخّرة عن الإصبع.

           ولا will-change هنا بقصد: البطاقة تحمل backdrop-filter، وطلب
           طبقة مركّبة لكل بطاقة على الشاشة هو ثمن التمرير نفسه الذي
           يحاربه content-visibility أدناه. */
        .los-raise {
          transition: transform .34s cubic-bezier(.22,1,.36,1),
                      box-shadow .34s cubic-bezier(.22,1,.36,1),
                      border-color .34s cubic-bezier(.22,1,.36,1);
        }
        .los-raise:hover,
        .los-raise:focus-visible {
          transform: translateY(-3px);
          border-color: rgba(255,235,220,0.30);
          box-shadow:
            inset 0 1px 0 0 rgba(255,240,230,0.20),
            inset 0 -1px 0 0 rgba(0,0,0,0.34),
            0 2px 4px -2px rgba(0,0,0,0.65),
            0 14px 26px -12px rgba(0,0,0,0.60),
            0 40px 80px -36px rgba(0,0,0,0.95);
        }
        .los-raise:active { transform: translateY(-1px) scale(.994); }
    
        @media (prefers-reduced-motion: reduce) {
          .los-flame, .los-in, .los-cover-in, .los-reward,
          .los-pop, .los-ripple, .los-halo, .los-throb, .los-drift {
            animation: none !important;
          }
          .los-btn:hover { transform: none !important; }
          /* الارتفاع حركةٌ أيضًا: يبقى تعمّق الظلّ ويسقط الإزاحة. */
          .los-raise, .los-raise:hover, .los-raise:focus-visible, .los-raise:active {
            transform: none !important;
            transition: box-shadow .2s linear, border-color .2s linear;
          }
        }

        /* --- what a scroll actually costs --------------------------------
           Not the length of the page. A glass card re-samples the sky behind
           it and re-blurs it on every frame it moves, so the bill is the
           number of blurred cards the browser is holding times the radius of
           each — and left alone, that is every card on the screen whether or
           not it is anywhere near the viewport. The routine screen carries
           sixteen of them.

           "content-visibility: auto" is the one property that fixes this
           rather than trimming it: a card scrolled out of view is not laid
           out, not styled, not painted and not blurred at all, so the cost
           follows what is on screen instead of what exists. The browser
           still finds text inside one for find-in-page, focus and anchors,
           and renders it before it scrolls in.

           "contain-intrinsic-size: auto 220px" is what keeps the scrollbar
           still: "auto" remembers each card's real height once it has been
           rendered the first time, and the 220px is only the guess used
           before that has ever happened.

           ".los-cue" is excluded deliberately, not forgotten.
           "content-visibility" implies paint containment, and that card
           carries two decorative glows positioned outside its own border
           box — contained, they are clipped away. It is one card, always
           near the top of the screen, so it is also the one that gains
           least from being skipped. */
        .los-surface:not(.los-cue) {
          content-visibility: auto;
          contain-intrinsic-size: auto 220px;
        }

        /* A scrollable strip inside a glass panel, without the platform
           scrollbar cutting a grey trench down the middle of it. Thin,
           transparent until the pointer is actually over the strip, and
           never reserving a gutter — the sidebar is 268px and cannot spare
           15 of them to a bar that is only needed on a short screen. */
        .los-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .los-scroll::-webkit-scrollbar { width: 6px; }
        .los-scroll::-webkit-scrollbar-track { background: transparent; }
        .los-scroll::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 999px;
          transition: background 200ms ease;
        }
        .los-scroll:hover { scrollbar-color: rgba(255,255,255,0.18) transparent; }
        .los-scroll:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); }
        .los-scroll:hover::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>
  );
}

/* ==================================================================== *
 *  The second window — stopped before it can write
 *
 *  Deliberately the whole screen rather than a banner. A banner over a
 *  working-looking app invites exactly the ticking and typing that will be
 *  thrown away, and this window cannot save a word of it.
 * ==================================================================== */
export function SecondWindow({ onTakeOver, phase }) {
  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen w-full items-center justify-center px-5 text-white antialiased"
      style={{
        "--los-veil": phase.veil,
        "--los-veil-strong": phase.veilStrong,
        fontFamily:
          "'Tajawal', 'Cairo', ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      <AppStyles />
      <SkyBackdrop phase={phase} />
      <Card className="los-in w-full max-w-lg p-7 text-center sm:p-9">
        <span
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border"
          style={{
            borderColor: `${T.accent}4D`,
            background: `${T.accent}14`,
            color: T.accent,
          }}
        >
          <Lock size={28} strokeWidth={1.8} />
        </span>

        <h1
          className="los-title mt-5 text-2xl font-extrabold leading-tight sm:text-[27px]"
        >
          التطبيق مفتوح في نافذة أخرى
        </h1>

        <p
          className="mx-auto mt-3.5 max-w-md text-[13px] leading-relaxed"
          style={{ color: T.muted }}
        >
          فتحه مرّتين يجعل النافذتين تكتبان فوق بعضهما، وآخر من يحفظ يمحو عمل
          الأخرى دون أن يظهر أي خطأ. لذلك أُوقف الحفظ في هذه النافذة حمايةً
          لبياناتك.
        </p>

        <div className="mt-6 space-y-2.5">
          <Btn variant="default" size="lg" className="w-full" onClick={onTakeOver}>
            <ArrowLeft size={16} /> تابع هنا وأوقف النافذة الأخرى
          </Btn>
          <p className="text-[11px] leading-relaxed" style={{ color: T.faint }}>
            أو أغلق هذه النافذة وارجع للأولى. ما كتبتَه محفوظ هناك.
          </p>
        </div>

        <p
          className="mt-6 rounded-xl border px-3.5 py-2.5 text-[11px] leading-relaxed"
          style={{
            borderColor: `${T.accent}3D`,
            background: `${T.accent}12`,
            color: T.accent,
          }}
        >
          «تابع هنا» يعيد تحميل الصفحة ليقرأ آخر نسخة محفوظة — فلا تضيع تعديلات
          النافذة الأخرى.
        </p>
      </Card>
    </div>
  );
}
