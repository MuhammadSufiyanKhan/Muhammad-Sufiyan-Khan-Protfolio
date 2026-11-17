"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Cursor from "./Cursor";
import { profile, education, experience, projects, stack } from "@/lib/data";
import { sceneState } from "@/lib/state";

const Scene = dynamic(() => import("./Scene"), { ssr: false });
gsap.registerPlugin(ScrollTrigger);

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const themes = [
  { id: "sand", label: "Sand", bg: "#11100c", ac: "#d9cdb0" },
  { id: "paper", label: "Paper", bg: "#ece8df", ac: "#2f3bff" },
  { id: "clay", label: "Clay", bg: "#e8502a", ac: "#f6ecd2" },
] as const;

const ease = "ease-[cubic-bezier(.7,0,.2,1)]";
const display = "font-display font-semibold tracking-[-0.045em]";
const chip = "rounded-md border border-line px-3 py-2 text-xs font-semibold tracking-wide uppercase";
const sectionPad = "px-(--pad) py-[clamp(80px,12vw,170px)]";
const cols = "grid gap-8 md:grid-cols-[1fr_2.6fr]";

function Stat({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative mx-[.1em] inline-block h-[clamp(26px,6vw,112px)] w-[clamp(30px,7vw,130px)] rounded-lg border border-line bg-linear-to-b from-fg/10 to-transparent p-[10px] align-middle text-[11px] leading-tight font-bold tracking-normal whitespace-normal text-fg/90 sm:text-xs">
      {children}
    </span>
  );
}
const Arrow = () => (
  <svg viewBox="0 0 24 24" className="inline-block size-[.72em] align-middle" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M12 3v17M5 13l7 7 7-7" />
  </svg>
);

// Placeholder "UI" card for each project (swap for real screenshots any time)
function Mock({ p, className = "" }: { p: (typeof projects)[number]; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-md ${className}`} style={{ background: `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})` }}>
      <div className="absolute inset-[7%] flex flex-col gap-[6%] rounded-md bg-black/55 p-[5%] backdrop-blur-sm">
        <div className="flex gap-1.5">{[0, 1, 2].map((i) => <i key={i} className="size-1.5 rounded-full bg-white/50" />)}</div>
        <b className="font-display text-[clamp(16px,2vw,28px)] leading-none font-semibold tracking-[-0.04em] text-white">{p.title}</b>
        <i className="h-1.5 w-3/4 rounded bg-white/30" /><i className="h-1.5 w-1/2 rounded bg-white/20" />
        <div className="mt-auto grid grid-cols-3 gap-[4%]">{[0, 1, 2].map((i) => <i key={i} className="aspect-[4/3] rounded bg-white/15" />)}</div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState<string>("sand");

  useEffect(() => {
    try { const t = localStorage.getItem("theme"); if (t && themes.some((x) => x.id === t)) setTheme(t); } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("theme", theme); } catch {}
    window.dispatchEvent(new Event("themechange"));
  }, [theme]);

  useIso(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const lenis = new Lenis({ lerp: reduce ? 1 : 0.09 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenis.stop();

    const ctx = gsap.context(() => {
      gsap.set("[data-hero-line]", { yPercent: 110 });
      gsap.set("[data-fade]", { opacity: 0 });

      const c = { v: 0 };
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .to(c, { v: 100, duration: reduce ? 0.2 : 1.6, ease: "power2.inOut", onUpdate: () => setCount(Math.round(c.v)) })
        .fromTo("[data-bar]", { scaleX: 0 }, { scaleX: 1, duration: reduce ? 0.2 : 1.6, ease: "power2.inOut" }, 0)
        .to("[data-loader]", { yPercent: -100, duration: 1, ease: "expo.inOut" })
        .add(() => lenis.start(), "<0.6")
        .to(sceneState, { intro: 1, duration: 2.4, ease: "expo.out" }, "<")
        .to("[data-hero-line]", { yPercent: 0, duration: 1.3, stagger: 0.12, ease: "expo.out" }, "<0.2")
        .to("[data-fade]", { opacity: 1, duration: 1, stagger: 0.08 }, "<0.6")
        .set("[data-loader]", { display: "none" });

      ScrollTrigger.create({
        trigger: document.body, start: "top top", end: "bottom bottom",
        onUpdate: (s) => { sceneState.progress = s.progress; },
      });

      // hero stays pinned (sticky) and recedes while the next section slides over it
      gsap.to("[data-hero-inner]", {
        scale: 0.92, opacity: 0.3, ease: "none",
        scrollTrigger: { trigger: "[data-cover]", start: "top bottom", end: "top top", scrub: true },
      });

      // word-by-word reveal on big statements
      gsap.utils.toArray<HTMLElement>("[data-scrub]").forEach((el) => {
        gsap.to(el.querySelectorAll("[data-word]"), {
          opacity: 1, stagger: 0.12, ease: "none",
          scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
        });
      });

      // floating project cards drift at different speeds
      gsap.utils.toArray<HTMLElement>("[data-float]").forEach((el) => {
        const sp = Number(el.dataset.speed || 1);
        gsap.fromTo(el, { y: 140 * sp }, { y: -140 * sp, ease: "none", scrollTrigger: { trigger: "[data-statement]", start: "top bottom", end: "bottom top", scrub: true } });
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
      });
      gsap.utils.toArray<HTMLElement>("[data-head-line]").forEach((el) => {
        gsap.from(el, { yPercent: 110, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } });
      });
      gsap.utils.toArray<HTMLElement>("[data-row]").forEach((el) => {
        gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } });
      });
    }, root);

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // floating project preview that follows the cursor
  useEffect(() => {
    const el = preview.current!;
    gsap.set(el, { scale: 0.6 });
    if (window.matchMedia("(hover: none)").matches) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
    const move = (e: PointerEvent) => { xTo(e.clientX + 24); yTo(e.clientY - 120); };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  const showPreview = (i: number | null) => {
    if (i !== null) setActive(i);
    gsap.to(preview.current, { opacity: i === null ? 0 : 1, scale: i === null ? 0.6 : 1, rotate: i === null ? 0 : -3, duration: 0.5, ease: "power3.out", overwrite: "auto" });
  };

  const words = (text: string, cls = "opacity-[.16]") =>
    text.split(" ").map((w, i) => <span data-word className={cls} key={i}>{w} </span>);
  const mask = "block overflow-hidden py-[.03em]";
  const maskIn = "inline-block will-change-transform";

  return (
    <div ref={root}>
      <Scene />
      <Cursor />

      {/* loader */}
      <div data-loader role="status" aria-label="Loading" className="fixed inset-0 z-100 flex items-end justify-between bg-bg p-(--pad)">
        <span className="eyebrow">[ Portfolio {new Date().getFullYear()} ]</span>
        <span className={`${display} text-[clamp(80px,22vw,300px)] leading-[.9]`}>{String(count).padStart(2, "0")}</span>
        <div data-bar className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-fg" />
      </div>

      {/* top bar */}
      <header data-fade className="fixed inset-x-0 top-0 z-60 flex items-start justify-between px-(--pad) pt-6 pb-10 bg-linear-to-b from-bg/80 to-transparent">
        <a href="#top" data-cursor aria-label="Home" className="text-[13px] leading-[1.15] font-semibold tracking-[.32em] uppercase">
          Muhammad<br />Suf<i className="mx-[.04em] inline-block size-[.62em] bg-fg align-baseline" />yan
        </a>
        <a href={`mailto:${profile.email}`} className="hidden pt-0.5 text-sm text-fg/90 transition-opacity hover:opacity-60 sm:block">{profile.email}</a>
      </header>

      {/* floating pill nav */}
      <nav data-fade aria-label="Primary" className="fixed inset-x-0 bottom-5 z-60 mx-auto flex w-max max-w-[calc(100vw-24px)] items-center gap-0.5 rounded-xl border border-line bg-bg/80 p-1.5 backdrop-blur-md">
        {[["Projects", "#work"], ["About", "#about"], ["Experience", "#experience"]].map(([l, h]) => (
          <a key={l} href={h} className={`${l === "Experience" ? "hidden sm:block" : ""} rounded-lg px-2.5 py-2.5 text-[11px] font-semibold tracking-wide uppercase transition-colors hover:bg-fg/10 sm:px-4 sm:text-xs`}>{l}</a>
        ))}
        <a href="#contact" data-cursor className="ml-1 flex items-center gap-2 whitespace-nowrap rounded-lg bg-fg py-1.5 pr-3 pl-1.5 text-[11px] font-bold tracking-wide text-bg uppercase sm:pr-4 sm:text-xs">
          <span className="grid size-7 place-items-center rounded-md bg-bg text-[10px] font-bold text-fg">MS</span>Let&apos;s talk
        </a>
      </nav>

      {/* colour scheme switch */}
      <div data-fade className="fixed bottom-5 left-(--pad) z-60 hidden items-center gap-2 rounded-full border border-line bg-bg/70 px-2.5 py-2 backdrop-blur-md md:flex" role="group" aria-label="Colour scheme">
        {themes.map((t) => (
          <button key={t.id} type="button" onClick={() => setTheme(t.id)} aria-label={`${t.label} colour scheme`} aria-pressed={theme === t.id} title={t.label} data-cursor
            className={`size-5 cursor-pointer rounded-full border border-line transition-transform duration-300 hover:scale-110 ${theme === t.id ? "ring-2 ring-fg ring-offset-2 ring-offset-bg" : ""}`}
            style={{ background: `linear-gradient(135deg, ${t.bg} 50%, ${t.ac} 50%)` }} />
        ))}
      </div>

      <main id="top" className="relative z-[2]">
        {/* HERO — sticky; the rest of the page slides over it */}
        <section data-hero className="sticky top-0 flex h-svh flex-col justify-end overflow-hidden px-(--pad) pb-36 sm:justify-center sm:pb-0">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_25%,var(--c-bg)_100%)]" />
          <div data-hero-inner className="relative will-change-transform">
            <h1 className="sr-only">{profile.name} — Full-Stack &amp; MERN Web Developer</h1>
            <div data-fade className="eyebrow mb-5 text-fg/80">Full-Stack · MERN · Web Developer</div>
            <div aria-hidden="true" className={`${display} text-[clamp(30px,7.6vw,140px)] leading-[.92] uppercase`}>
              <span className={mask}>
                <span data-hero-line className={maskIn}>Muhammad<Stat>{experience.length}<span className="hidden sm:inline"> roles shipped</span></Stat></span>
              </span>
              <span className={mask}>
                <span data-hero-line className="flex items-end justify-between gap-6">
                  <span data-fade className="mb-[.3em] hidden max-w-[240px] text-[clamp(14px,1.15vw,18px)] leading-snug font-medium tracking-normal normal-case text-fg/90 md:block">
                    Hey, I&apos;m {profile.short}. I build full-stack web apps that are fast, scalable and a pleasure to use.
                  </span>
                  <span className="ml-auto">Sufiyan Khan</span>
                </span>
              </span>
              <span className={mask}>
                <span data-hero-line className={maskIn}>Web Developer<Stat>{projects.length}<span className="hidden sm:inline"> live projects</span></Stat><span className="hidden sm:inline"><Arrow /></span></span>
              </span>
            </div>
            <p data-fade className="mt-6 max-w-[320px] text-[15px] leading-snug font-medium text-fg/90 md:hidden">
              Hey, I&apos;m {profile.short}. I build full-stack web apps that are fast, scalable and a pleasure to use.
            </p>
          </div>
          <div data-fade className="absolute inset-x-(--pad) bottom-7 hidden items-end justify-between text-sm text-fg/80 sm:flex">
            <span>Code by code</span><span>Scroll</span>
          </div>
        </section>

        {/* everything below slides over the hero */}
        <div data-cover className="relative z-10 bg-bg">
          {/* statement + floating project cards */}
          <section data-statement className="relative overflow-hidden px-(--pad) pt-[clamp(100px,16vw,230px)] pb-[clamp(320px,42vw,680px)]">
            <div className={cols}>
              <div className="eyebrow" data-reveal>[ What I do ]</div>
              <div>
                <p data-scrub className={`${display} text-[clamp(30px,5.1vw,88px)] leading-[.98]`}>
                  {words("Full-stack web apps and polished interfaces, built with the MERN stack for teams that care about every detail.")}
                </p>
                <p data-reveal className="mt-8 text-[15px] text-muted">React · Node.js · Express · MongoDB · Next.js</p>
              </div>
            </div>
            {projects.map((p, i) => {
              const pos = [
                "left-[calc(var(--pad)-3vw)] top-[56%] w-[clamp(240px,27vw,400px)]",
                "right-[var(--pad)] top-[36%] w-[clamp(220px,25vw,380px)]",
                "left-[36%] top-[72%] w-[clamp(220px,26vw,390px)]",
              ][i] ?? "";
              return (
                <a key={p.id} data-float data-speed={[0.9, 1.3, 0.6][i] ?? 1} data-cursor href={p.href} target="_blank" rel="noopener noreferrer"
                  aria-label={`${p.title} — open live site`} className={`absolute z-10 hidden md:block ${pos}`}>
                  <Mock p={p} className="aspect-[4/3] w-full shadow-2xl shadow-black/40" />
                </a>
              );
            })}
          </section>

          {/* about */}
          <section id="about" className={sectionPad}>
            <div className={cols}>
              <div className="eyebrow" data-reveal>[ About ]</div>
              <div>
                <p data-scrub className={`${display} text-[clamp(22px,2.8vw,44px)] leading-[1.1]`}>{words(profile.about)}</p>
                <div data-reveal className="mt-12">
                  <div className="eyebrow">[ Tech stack ]</div>
                  <div className="mt-4 flex flex-wrap gap-2.5">{stack.map((t) => <span key={t} className={chip}>{t}</span>)}</div>
                </div>
                <div data-reveal className="mt-14 max-w-[760px] border-t border-line pt-7">
                  <div className="eyebrow">[ Education ]</div>
                  <h3 className={`${display} mt-3 text-[clamp(26px,3vw,44px)]`}>{education.degree}</h3>
                  <p className="mt-3.5 leading-[1.7] text-muted">{education.note}</p>
                  <ul className="mt-4 list-disc pl-[18px] leading-[1.8] text-muted marker:text-fg">
                    {education.points.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                  <div className="eyebrow mt-7">[ Core coursework ]</div>
                  <div className="mt-4 flex flex-wrap gap-2.5">{education.coursework.map((t) => <span key={t} className={chip}>{t}</span>)}</div>
                </div>
              </div>
            </div>
          </section>

          {/* work */}
          <section id="work" className={sectionPad}>
            <div className="mb-10 flex items-end justify-between">
              <h2 className={`${display} text-[clamp(40px,8vw,140px)] leading-[.92] uppercase`}><span className={mask}><span data-head-line className={maskIn}>Selected work</span></span></h2>
              <span className="eyebrow">[ {String(projects.length).padStart(2, "0")} ]</span>
            </div>
            <div className="group/list">
              {projects.map((p, i) => (
                <a key={p.id} href={p.href} target="_blank" rel="noopener noreferrer" data-row data-cursor
                  onMouseEnter={() => showPreview(i)} onMouseLeave={() => showPreview(null)}
                  className="group relative grid grid-cols-1 gap-3 border-t border-line py-[34px] transition-colors duration-300 last:border-b md:grid-cols-[60px_minmax(0,1fr)_minmax(0,1.1fr)_40px] md:items-center md:gap-5 group-hover/list:[&:not(:hover)]:text-muted">
                  <span className="text-sm text-muted">{p.id}</span>
                  <h3 className={`${display} text-[clamp(30px,4.6vw,76px)] leading-none transition-transform duration-500 ${ease} group-hover:translate-x-4`}>{p.title}</h3>
                  <div className="text-sm leading-relaxed text-muted">
                    {p.kind} — {p.desc}
                    <div className="mt-3 flex flex-wrap gap-2">{p.tags.map((t) => <span key={t} className="rounded-md border border-line px-2.5 py-1 text-[11px] font-semibold tracking-wide text-fg uppercase">{t}</span>)}</div>
                  </div>
                  <span aria-hidden="true" className="hidden text-[28px] transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:translate-x-1.5 md:block">↗</span>
                </a>
              ))}
            </div>
          </section>

          {/* experience */}
          <section id="experience" className={sectionPad}>
            <div className="mb-10 flex items-end justify-between">
              <h2 className={`${display} text-[clamp(40px,8vw,140px)] leading-[.92] uppercase`}><span className={mask}><span data-head-line className={maskIn}>Experience</span></span></h2>
              <span className="eyebrow">[ {String(experience.length).padStart(2, "0")} ]</span>
            </div>
            {experience.map((e) => (
              <div data-row key={e.company} className="grid gap-2.5 border-t border-line py-9 last:border-b md:grid-cols-[200px_1fr_1.2fr] md:items-baseline md:gap-6">
                <span className="text-[13px] font-semibold tracking-wide text-muted uppercase">{e.period}</span>
                <h3 className={`${display} text-[clamp(24px,3vw,44px)]`}>{e.role}<small className="mt-2 block text-[15px] font-medium tracking-normal text-muted">{e.company}</small></h3>
                <p className="leading-relaxed text-muted">{e.text}</p>
              </div>
            ))}
          </section>

          {/* contact */}
          <section id="contact" className="flex min-h-svh flex-col justify-between px-(--pad) pt-[clamp(80px,12vw,160px)] pb-28">
            <div className={cols}>
              <div className="eyebrow" data-reveal>[ Contact ]</div>
              <h2 className={`${display} text-[clamp(44px,9vw,164px)] leading-[.9] uppercase`}>
                <span className={mask}><span data-head-line className={maskIn}>Let&apos;s work</span></span>
                <span className={mask}><span data-head-line className={maskIn}>together</span></span>
              </h2>
            </div>
            <div className={cols}>
              <p data-reveal className="max-w-[240px] text-[15px] leading-snug text-muted">Have a project in mind? I&apos;d love to hear about it.</p>
              <a data-reveal data-cursor href={`mailto:${profile.email}`} className={`${display} inline-block text-[clamp(20px,4vw,68px)] leading-none break-all transition-opacity duration-300 hover:opacity-60`}>{profile.email}</a>
            </div>
          </section>

          <footer className="flex justify-between border-t border-line px-(--pad) py-6 pb-24 text-xs text-muted">
            <span>© {new Date().getFullYear()} {profile.name}</span>
            <span>Next.js · Tailwind · GSAP · Three.js</span>
          </footer>
        </div>
      </main>

      <div ref={preview} aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-40 hidden w-[320px] opacity-0 will-change-transform [@media(hover:hover)]:block">
        <Mock p={projects[active]} className="aspect-[4/3] w-full shadow-2xl shadow-black/40" />
      </div>
    </div>
  );
}
