"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Cursor() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    const node = el.current!;
    const xTo = gsap.quickTo(node, "x", { duration: 0.35, ease: "power3" });
    const yTo = gsap.quickTo(node, "y", { duration: 0.35, ease: "power3" });
    const move = (e: PointerEvent) => { xTo(e.clientX); yTo(e.clientY); };
    const over = (e: PointerEvent) => {
      node.dataset.big = String(!!(e.target as HTMLElement).closest("[data-cursor]"));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerover", over); };
  }, []);
  return (
    <div
      ref={el}
      aria-hidden="true"
      data-big="false"
      className="pointer-events-none fixed top-0 left-0 z-90 -mt-[7px] -ml-[7px] size-3.5 rounded-full bg-accent opacity-90 transition-[width,height,margin] duration-300 data-[big=true]:-mt-8 data-[big=true]:-ml-8 data-[big=true]:size-16 [@media(hover:none)]:hidden"
    />
  );
}
