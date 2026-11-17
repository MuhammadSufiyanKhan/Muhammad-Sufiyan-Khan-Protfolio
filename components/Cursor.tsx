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
      node.classList.toggle("big", !!(e.target as HTMLElement).closest("[data-cursor]"));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerover", over); };
  }, []);
  return <div className="cursor" ref={el} aria-hidden="true" />;
}
