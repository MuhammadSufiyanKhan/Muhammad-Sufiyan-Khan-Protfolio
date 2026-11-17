"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Cursor from "./Cursor";
import { profile, education, experience, projects, skills, stack } from "@/lib/data";
import { sceneState } from "@/lib/state";

const Scene = dynamic(() => import("./Scene"), { ssr: false });
gsap.registerPlugin(ScrollTrigger);

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// shared class fragments
const section = "px-(--pad) py-[clamp(80px,14vw,180px)]";
const maskOuter = "block overflow-hidden";
const maskInner = "inline-block will-change-transform";
const h2 = "font-display font-extrabold uppercase leading-[.92] tracking-[-0.03em] text-[clamp(32px,9vw,140px)]";
const chip = "rounded-full border border-line bg-bg/50 px-3.5 py-2 font-mono text-xs backdrop-blur-sm";
const ease = "ease-[cubic-bezier(.7,0,.2,1)]";

export default function Portfolio() {
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [count, setCount] = useState(0);

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
      gsap.set("[data-hero-word]", { yPercent: 115 });
      gsap.set("[data-hero-meta] > *", { y: 30, opacity: 0 });
      gsap.set("[data-nav] > *", { y: -20, opacity: 0 });

      const c = { v: 0 };
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .to(c, { v: 100, duration: reduce ? 0.2 : 1.8, ease: "power2.inOut", onUpdate: () => setCount(Math.round(c.v)) })
        .fromTo("[data-bar]", { scaleX: 0 }, { scaleX: 1, duration: reduce ? 0.2 : 1.8, ease: "power2.inOut" }, 0)
        .to("[data-loader]", { yPercent: -100, duration: 1, ease: "expo.inOut" })
        .add(() => lenis.start(), "<0.6")
        .to(sceneState, { intro: 1, duration: 2.4, ease: "expo.out" }, "<")
        .to("[data-hero-word]", { yPercent: 0, duration: 1.2, stagger: 0.1, ease: "expo.out" }, "<0.25")
        .to("[data-hero-meta] > *, [data-nav] > *", { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, "<0.5")
        .set("[data-loader]", { display: "none" });

      ScrollTrigger.create({
        trigger: document.body, start: "top top", end: "bottom bottom",
        onUpdate: (s) => { sceneState.progress = s.progress; },
      });

      gsap.to("[data-hero-title]", { yPercent: -18, ease: "none", scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true } });

      const loop = gsap.to("[data-track]", { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
      ScrollTrigger.create({
        trigger: "[data-marquee]", start: "top bottom", end: "bottom top",
        onUpdate: (s) => { gsap.to(loop, { timeScale: 1 + Math.min(Math.abs(s.getVelocity()) / 400, 6) * s.direction, duration: 0.2, overwrite: true }); },
      });

      gsap.to("[data-word]", {
        opacity: 1, stagger: 0.12, ease: "none",
        scrollTrigger: { trigger: "[data-about-text]", start: "top 80%", end: "bottom 45%", scrub: true },
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, { y: 60, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });
      gsap.utils.toArray<HTMLElement>("[data-head-word]").forEach((el) => {
        gsap.from(el, { yPercent: 115, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
      });
      gsap.utils.toArray<HTMLElement>("[data-row]").forEach((el) => {
        gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
      });
      gsap.from("[data-mail]", { yPercent: 40, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: "[data-contact]", start: "top 60%" } });
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
    gsap.to(preview.current, { opacity: i === null ? 0 : 1, scale: i === null ? 0.6 : 1, rotate: i === null ? 0 : -4, duration: 0.5, ease: "power3.out", overwrite: "auto" });
  };

  const aboutWords = profile.about.split(" ");
  const heroWords = ["Muhammad", "Sufiyan", "Khan"];

  return (
    <div ref={root}>
      <Scene />
      <Cursor />
      <div aria-hidden="true" className="grain-bg animate-grain pointer-events-none fixed -inset-1/2 z-50 opacity-[.07]" />

      <div data-loader role="status" aria-label="Loading" className="fixed inset-0 z-100 flex items-end justify-between bg-bg p-(--pad)">
        <span className="eyebrow">// portfolio — {new Date().getFullYear()}</span>
        <span className="font-display text-[clamp(80px,22vw,300px)] leading-[.92] tracking-[-0.03em]">{String(count).padStart(2, "0")}</span>
        <div data-bar className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-accent" />
      </div>

      <header data-nav className="fixed inset-x-0 top-0 z-60 flex items-center justify-between px-(--pad) py-[22px] mix-blend-difference">
        <a href="#top" data-cursor className="font-display text-lg font-extrabold">MSK.</a>
        <ul className="flex gap-3 text-xs sm:gap-7 sm:text-sm">
          {[["About", "#about"], ["Work", "#work"], ["Experience", "#experience"], ["Contact", "#contact"]].map(([l, h]) => (
            <li key={l}>
              <a href={h} className={`relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-500 ${ease} hover:after:origin-left hover:after:scale-x-100`}>{l}</a>
            </li>
          ))}
        </ul>
        <span className="hidden text-[13px] sm:inline">{profile.location}</span>
      </header>

      <main id="top" className="relative z-[2]">
        <section data-hero className="flex min-h-svh flex-col justify-end px-(--pad) pt-32 pb-[clamp(40px,6vw,80px)]">
          <div className="eyebrow mb-6">// {profile.role} — available for work</div>
          <h1 data-hero-title aria-label={profile.name} className="font-display text-[clamp(30px,8vw,160px)] leading-none font-extrabold tracking-[-0.03em] uppercase">
            {heroWords.map((w, i) => (
              <span className={maskOuter} key={w}><span data-hero-word className={`${maskInner} ${i === 1 ? "text-outline" : ""}`}>{w}</span></span>
            ))}
          </h1>
          <div data-hero-meta className="mt-9 flex flex-wrap items-end justify-between gap-6">
            <p className="max-w-[460px] text-[clamp(15px,1.4vw,18px)] leading-relaxed text-muted">{profile.intro}</p>
            <div className="eyebrow flex items-center gap-2.5"><i className="animate-drip block h-[46px] w-px bg-fg" /> Scroll</div>
          </div>
        </section>

        <div data-marquee aria-hidden="true" className="relative z-[2] overflow-hidden border-y border-line bg-bg/60 py-[22px] backdrop-blur-sm">
          <div data-track className="flex w-max will-change-transform">
            {[0, 1].map((k) => (
              <div key={k} className="flex">
                {skills.map((s) => (
                  <span key={s + k} className="font-display pr-12 text-[clamp(28px,4.5vw,64px)] font-bold whitespace-nowrap">{s}<b className="ml-12 font-normal text-accent">✦</b></span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section id="about" className={section}>
          <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
            <div className="eyebrow" data-reveal>// 01 — about</div>
            <div>
              <p data-about-text className="font-display text-[clamp(22px,2.7vw,40px)] leading-[1.15] font-medium tracking-[-0.02em]">
                {aboutWords.map((w, i) => (<span data-word className="opacity-[.18]" key={i}>{w} </span>))}
              </p>
              <div data-reveal className="mt-12">
                <div className="eyebrow">// tech stack</div>
                <div className="mt-4 flex flex-wrap gap-2.5">{stack.map((t) => <em key={t} className={`${chip} not-italic`}>{t}</em>)}</div>
              </div>
              <div data-reveal className="mt-14 max-w-[760px] border-t border-line pt-7">
                <div className="eyebrow">// education</div>
                <h3 className="font-display mt-2.5 text-[clamp(26px,3vw,40px)] tracking-[-0.02em]">{education.degree}</h3>
                <p className="mt-3.5 leading-[1.7] text-muted">{education.note}</p>
                <ul className="mt-4 list-disc pl-[18px] leading-[1.8] text-muted marker:text-accent">
                  {education.points.map((t) => <li key={t}>{t}</li>)}
                </ul>
                <div className="eyebrow mt-7">// core coursework</div>
                <div className="mt-4 flex flex-wrap gap-2.5">{education.coursework.map((t) => <em key={t} className={`${chip} not-italic`}>{t}</em>)}</div>
              </div>
            </div>
          </div>
        </section>

        <section id="work" className={section}>
          <div className="mb-12 flex items-end justify-between">
            <h2 className={h2}><span className={maskOuter}><span data-head-word className={maskInner}>Selected Work</span></span></h2>
            <span className="eyebrow">({String(projects.length).padStart(2, "0")})</span>
          </div>
          <div className="group/list">
            {projects.map((p, i) => (
              <a key={p.id} href={p.href} target="_blank" rel="noopener noreferrer" data-row data-cursor
                onMouseEnter={() => showPreview(i)} onMouseLeave={() => showPreview(null)}
                className={`group relative grid grid-cols-1 gap-3 border-t border-line py-[34px] transition-colors duration-300 last:border-b md:grid-cols-[70px_minmax(0,1fr)_minmax(0,1.1fr)_40px] md:items-center md:gap-5 group-hover/list:[&:not(:hover)]:text-muted`}>
                <span className="font-mono text-sm text-muted">{p.id}</span>
                <h3 className={`font-display text-[clamp(28px,4vw,64px)] leading-none font-extrabold tracking-[-0.03em] transition-transform duration-500 ${ease} group-hover:translate-x-4`}>{p.title}</h3>
                <div className="text-sm leading-relaxed text-muted">
                  {p.kind} — {p.desc}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.tags.map((t) => <em key={t} className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-fg not-italic">{t}</em>)}
                  </div>
                </div>
                <span aria-hidden="true" className="hidden text-[28px] transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:translate-x-1.5 group-hover:text-accent md:block">↗</span>
              </a>
            ))}
          </div>
        </section>

        <section id="experience" className={section}>
          <div className="mb-12 flex items-end justify-between">
            <h2 className={h2}><span className={maskOuter}><span data-head-word className={maskInner}>Experience</span></span></h2>
            <span className="eyebrow">( 03 )</span>
          </div>
          {experience.map((e) => (
            <div data-row key={e.company} className="grid gap-2.5 border-t border-line py-9 last:border-b md:grid-cols-[200px_1fr_1.2fr] md:items-baseline md:gap-6">
              <span className="font-mono text-[13px] tracking-[.14em] text-accent uppercase">{e.period}</span>
              <h3 className="font-display text-[clamp(24px,3vw,40px)] tracking-[-0.02em]">{e.role}<small className="mt-2 block font-sans text-[15px] tracking-normal text-muted">{e.company}</small></h3>
              <p className="leading-relaxed text-muted">{e.text}</p>
            </div>
          ))}
        </section>

        <section id="contact" data-contact className={`${section} flex min-h-[90svh] flex-col justify-between`}>
          <div className="eyebrow" data-reveal>// 04 — contact</div>
          <div>
            <p className="eyebrow mb-5" data-reveal>Have a project in mind? Let&apos;s talk.</p>
            <a data-mail data-cursor href={`mailto:${profile.email}`} className="font-display inline-block text-[clamp(22px,4.6vw,80px)] leading-none font-extrabold tracking-[-0.04em] break-all transition-colors duration-300 hover:text-accent">{profile.email}</a>
          </div>
          <div data-reveal className="flex flex-wrap gap-7">
            {profile.socials.map((s) => (
              <a key={s.label} href={s.href} className="border-b border-line pb-1 transition-colors duration-300 hover:border-accent hover:text-accent">{s.label} ↗</a>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-[2] flex justify-between border-t border-line bg-bg px-(--pad) py-6 font-mono text-xs text-muted">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span>Built with Next.js · Tailwind · GSAP · Three.js</span>
      </footer>

      <div ref={preview} aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-40 hidden h-[230px] w-[340px] flex-col justify-between rounded-[14px] p-[22px] text-black opacity-0 will-change-transform [@media(hover:hover)]:flex"
        style={{ background: `linear-gradient(135deg, ${projects[active].colors[0]}, ${projects[active].colors[1]})` }}>
        <span className="font-mono text-xs tracking-[.14em] uppercase">{projects[active].kind}</span>
        <b className="font-display text-4xl leading-none tracking-[-0.03em]">{projects[active].title}</b>
      </div>
    </div>
  );
}
