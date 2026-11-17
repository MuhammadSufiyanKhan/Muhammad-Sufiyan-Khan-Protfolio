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

export default function Portfolio() {
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [count, setCount] = useState(0);

  useIso(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    // Smooth scroll wired into GSAP's ticker + ScrollTrigger
    const lenis = new Lenis({ lerp: reduce ? 1 : 0.09 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenis.stop();

    const ctx = gsap.context(() => {
      // ---- initial hidden states
      gsap.set(".hero .mask > span", { yPercent: 115 });
      gsap.set(".hero-meta > *", { y: 30, opacity: 0 });
      gsap.set(".nav > *", { y: -20, opacity: 0 });

      // ---- loader + intro
      const c = { v: 0 };
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .to(c, { v: 100, duration: reduce ? 0.2 : 1.8, ease: "power2.inOut", onUpdate: () => setCount(Math.round(c.v)) })
        .to(".loader .bar", { scaleX: 1, duration: reduce ? 0.2 : 1.8, ease: "power2.inOut" }, 0)
        .to(".loader", { yPercent: -100, duration: 1, ease: "expo.inOut" })
        .add(() => lenis.start(), "<0.6")
        .to(sceneState, { intro: 1, duration: 2.4, ease: "expo.out" }, "<")
        .to(".hero .mask > span", { yPercent: 0, duration: 1.2, stagger: 0.1, ease: "expo.out" }, "<0.25")
        .to(".hero-meta > *, .nav > *", { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, "<0.5")
        .set(".loader", { display: "none" });

      // ---- scene progress tied to page scroll
      ScrollTrigger.create({
        trigger: document.body, start: "top top", end: "bottom bottom",
        onUpdate: (s) => { sceneState.progress = s.progress; },
      });

      // ---- hero title parallax
      gsap.to(".hero h1", { yPercent: -18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

      // ---- marquee (scroll-velocity aware)
      const track = document.querySelector<HTMLElement>(".marquee-track")!;
      const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
      ScrollTrigger.create({
        trigger: ".marquee", start: "top bottom", end: "bottom top",
        onUpdate: (s) => { gsap.to(loop, { timeScale: 1 + Math.min(Math.abs(s.getVelocity()) / 400, 6) * (s.direction), duration: 0.2, overwrite: true }); },
      });

      // ---- about: word-by-word scrub
      gsap.to(".about .big .w", {
        opacity: 1, stagger: 0.12, ease: "none",
        scrollTrigger: { trigger: ".about .big", start: "top 80%", end: "bottom 45%", scrub: true },
      });

      // ---- generic reveals
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, { y: 60, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });
      gsap.utils.toArray<HTMLElement>(".sec-head h2 .mask > span").forEach((el) => {
        gsap.from(el, { yPercent: 115, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
      });
      gsap.utils.toArray<HTMLElement>(".project, .exp").forEach((el) => {
        gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
      });
      gsap.from(".contact .mail", { yPercent: 40, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".contact", start: "top 60%" } });
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
      <div className="grain" aria-hidden="true" />

      <div className="loader" role="status" aria-label="Loading">
        <span className="eyebrow">Portfolio — {new Date().getFullYear()}</span>
        <span className="display count">{String(count).padStart(2, "0")}</span>
        <div className="bar" />
      </div>

      <header className="nav">
        <a href="#top" className="logo" data-cursor>MSK.</a>
        <ul>
          <li><a href="#about">About</a></li>
          <li><a href="#work">Work</a></li>
          <li><a href="#experience">Experience</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <span className="hide-sm" style={{ fontSize: 13 }}>{profile.location}</span>
      </header>

      <main id="top">
        <section className="hero">
          <div className="eyebrow" style={{ marginBottom: 24 }}>{profile.role} — Available for work</div>
          <h1 className="display" aria-label={profile.name}>
            {heroWords.map((w, i) => (
              <span className="mask" key={w}><span className={i === 1 ? "outline" : ""}>{w}</span></span>
            ))}
          </h1>
          <div className="hero-meta">
            <p>{profile.intro}</p>
            <div className="scroll-hint eyebrow"><i /> Scroll</div>
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[0, 1].map((k) => (
              <div key={k} style={{ display: "flex" }}>
                {skills.map((s) => (<span key={s + k}>{s}<b>✦</b></span>))}
              </div>
            ))}
          </div>
        </div>

        <section id="about">
          <div className="about">
            <div className="eyebrow" data-reveal>( 01 ) About</div>
            <div>
              <p className="big">
                {aboutWords.map((w, i) => (<span className="w" key={i}>{w} </span>))}
              </p>
              <div className="stack" data-reveal>
                <div className="eyebrow">Tech stack</div>
                <div className="chips">{stack.map((t) => <em key={t}>{t}</em>)}</div>
              </div>
              <div className="edu" data-reveal>
                <div className="eyebrow">Education</div>
                <h3>{education.degree}</h3>
                <p>{education.note}</p>
                <ul>{education.points.map((t) => <li key={t}>{t}</li>)}</ul>
                <div className="eyebrow" style={{ marginTop: 28 }}>Core coursework</div>
                <div className="chips">{education.coursework.map((t) => <em key={t}>{t}</em>)}</div>
              </div>
            </div>
          </div>
        </section>

        <section id="work">
          <div className="sec-head">
            <h2 className="display"><span className="mask"><span>Selected Work</span></span></h2>
            <span className="eyebrow">({String(projects.length).padStart(2, "0")})</span>
          </div>
          <div className="projects">
            {projects.map((p, i) => (
              <a key={p.id} className="project" href={p.href} target="_blank" rel="noopener noreferrer"
                data-cursor onMouseEnter={() => showPreview(i)} onMouseLeave={() => showPreview(null)}>
                <span className="idx">{p.id}</span>
                <h3>{p.title}</h3>
                <div className="meta">
                  {p.kind} — {p.desc}
                  <div className="tags">{p.tags.map((t) => <em key={t}>{t}</em>)}</div>
                </div>
                <span className="arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>

        <section id="experience">
          <div className="sec-head">
            <h2 className="display"><span className="mask"><span>Experience</span></span></h2>
            <span className="eyebrow">( 03 )</span>
          </div>
          {experience.map((e) => (
            <div className="exp" key={e.company}>
              <span className="period">{e.period}</span>
              <h3>{e.role}<small>{e.company}</small></h3>
              <p>{e.text}</p>
            </div>
          ))}
        </section>

        <section id="contact" className="contact">
          <div className="eyebrow" data-reveal>( 04 ) Contact</div>
          <div>
            <p className="eyebrow" style={{ marginBottom: 20 }} data-reveal>Have a project in mind? Let&apos;s talk.</p>
            <a className="mail" href={`mailto:${profile.email}`} data-cursor>{profile.email}</a>
          </div>
          <div className="links" data-reveal>
            {profile.socials.map((s) => (
              <a key={s.label} href={s.href} target={s.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{s.label} ↗</a>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span>Built with Next.js · GSAP · Three.js</span>
      </footer>

      <div className="preview" ref={preview} aria-hidden="true"
        style={{ background: `linear-gradient(135deg, ${projects[active].colors[0]}, ${projects[active].colors[1]})` }}>
        <span>{projects[active].kind}</span>
        <b>{projects[active].title}</b>
      </div>
    </div>
  );
}
