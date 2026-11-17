"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { sceneState } from "@/lib/state";

// Floating code-editor windows (real MERN snippets drawn to canvas textures)
// plus a few code glyphs. They tilt with the mouse and drift apart on scroll.

type Tok = [string, string];
const COL = {
  t: "#d7d4cc", kw: "#ff5a36", fn: "#a99bff", str: "#8fcf9c",
  num: "#e5c07b", cm: "#5b5b62", ok: "#8fcf9c",
};
const k = (s: string): Tok => [s, COL.kw];
const f = (s: string): Tok => [s, COL.fn];
const s = (x: string): Tok => [x, COL.str];
const t = (x: string): Tok => [x, COL.t];
const n = (x: string): Tok => [x, COL.num];
const c = (x: string): Tok => [x, COL.cm];

const serverCode: Tok[][] = [
  [k("import "), t("express "), k("from "), s('"express"'), t(";")],
  [k("import "), t("Project "), k("from "), s('"./models/Project.js"'), t(";")],
  [],
  [k("const "), t("app = "), f("express"), t("();")],
  [t("app."), f("use"), t("(express."), f("json"), t("());")],
  [],
  [t("app."), f("get"), t("("), s('"/api/projects"'), t(", "), k("async "), t("(req, res) => {")],
  [t("  "), k("const "), t("projects = "), k("await "), t("Project."), f("find"), t("();")],
  [t("  res."), f("json"), t("(projects);")],
  [t("});")],
  [],
  [t("app."), f("listen"), t("("), n("5000"), t(");")],
];
const appCode: Tok[][] = [
  [k("export default function "), f("App"), t("() {")],
  [t("  "), k("const "), t("[items, setItems] = "), f("useState"), t("([]);")],
  [],
  [t("  "), f("useEffect"), t("(() => {")],
  [t("    "), f("fetch"), t("("), s('"/api/projects"'), t(")")],
  [t("      ."), f("then"), t("((r) => r."), f("json"), t("())")],
  [t("      ."), f("then"), t("(setItems);")],
  [t("  }, []);")],
  [],
  [t("  "), k("return "), t("<"), f("Gallery"), t(" items={items} />;")],
  [t("}")],
];
const termCode: Tok[][] = [
  [[ "$ ", COL.kw ], t("npm run dev")],
  [],
  [c("> next dev")],
  [[ "✓ ", COL.ok ], t("MongoDB connected")],
  [[ "✓ ", COL.ok ], t("Ready on "), s("localhost:3000")],
  [[ "✓ ", COL.ok ], t("Compiled in "), n("312ms")],
];

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function windowTexture(title: string, lines: Tok[][], fam: string, numbers: boolean, W = 1280) {
  const FS = 32, LH = 50, BAR = 66, PAD = 36;
  const H = BAR + PAD + lines.length * LH + PAD;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d")!;
  rr(x, 2, 2, W - 4, H - 4, 26);
  x.fillStyle = "#101013"; x.fill();
  x.lineWidth = 2; x.strokeStyle = "rgba(242,240,234,0.16)"; x.stroke();
  x.save(); rr(x, 2, 2, W - 4, H - 4, 26); x.clip();
  x.fillStyle = "#16161a"; x.fillRect(0, 0, W, BAR);
  x.fillStyle = "rgba(242,240,234,0.1)"; x.fillRect(0, BAR, W, 2);
  ["#ff5a36", "#3a3a40", "#3a3a40"].forEach((col, i) => { x.beginPath(); x.arc(44 + i * 34, BAR / 2, 9, 0, 7); x.fillStyle = col; x.fill(); });
  x.font = `400 24px ${fam}`; x.fillStyle = COL.cm; x.textBaseline = "middle"; x.textAlign = "center";
  x.fillText(title, W / 2, BAR / 2 + 1);
  x.textAlign = "left";
  x.font = `400 ${FS}px ${fam}`;
  lines.forEach((ln, i) => {
    const y = BAR + PAD + i * LH + LH / 2;
    let px = PAD;
    if (numbers) { x.fillStyle = COL.cm; x.fillText(String(i + 1).padStart(2, " "), px, y); px += 70; }
    ln.forEach(([txt, col]) => { x.fillStyle = col; x.fillText(txt, px, y); px += x.measureText(txt).width; });
  });
  x.restore();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { tex, aspect: W / H };
}

function glyphTexture(text: string, fam: string, color: string) {
  const cv = document.createElement("canvas");
  cv.width = 512; cv.height = 256;
  const x = cv.getContext("2d")!;
  x.font = `500 170px ${fam}`; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = color; x.fillText(text, 256, 132);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export default function Scene() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.z = 8;
    const group = new THREE.Group();
    scene.add(group);

    type Item = { mesh: THREE.Mesh; base: THREE.Vector3; spread: THREE.Vector3; rot: THREE.Euler; glyph: boolean; phase: number };
    const items: Item[] = [];
    const disposables: { dispose(): void }[] = [];
    let disposed = false;

    const add = (tex: THREE.Texture, aspect: number, width: number, pos: [number, number, number], spread: [number, number, number], rot: [number, number, number], opacity: number, glyph = false) => {
      const geo = new THREE.PlaneGeometry(width, width / aspect);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, toneMapped: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      group.add(mesh);
      disposables.push(geo, mat, tex);
      items.push({ mesh, base: new THREE.Vector3(...pos), spread: new THREE.Vector3(...spread), rot: new THREE.Euler(...rot), glyph, phase: Math.random() * 6 });
    };

    const build = async () => {
      let fam = getComputedStyle(document.documentElement).getPropertyValue("--nf-mono").trim();
      fam = fam ? `${fam}, monospace` : "ui-monospace, Menlo, Consolas, monospace";
      try { await document.fonts.load(`400 32px ${fam}`); await document.fonts.load(`500 170px ${fam}`); } catch {}
      if (disposed) return;
      const a = windowTexture("server.js", serverCode, fam, true);
      const b = windowTexture("App.jsx", appCode, fam, true);
      const d = windowTexture("zsh — portfolio", termCode, fam, false, 1100);
      add(b.tex, b.aspect, 3.5, [-1.7, 1.55, -1.6], [-2.4, 1.6, 0], [0.05, 0.22, 0.03], 0.55);
      add(a.tex, a.aspect, 4.5, [0.1, 0.05, 0], [0, 0, 0], [-0.04, -0.2, 0.02], 0.96);
      add(d.tex, d.aspect, 3.2, [1.45, -1.85, 0.9], [2.4, -1.8, 0], [0.04, -0.3, -0.03], 0.96);
      const glyphs: [string, string, [number, number, number], [number, number, number]][] = [
        ["{ }", COL.kw, [-2.9, -1.0, -0.3], [-2.4, -1.4, 0]],
        ["</>", COL.fn, [2.7, 2.0, -1.1], [2.6, 1.8, 0]],
        ["=>", COL.num, [3.2, 0.0, -1.7], [3, 0.2, 0]],
        ["[ ]", COL.str, [-0.9, -2.5, -0.6], [-1, -2, 0]],
        ["&&", COL.kw, [-3.2, 0.9, -2.2], [-2.8, 0.8, 0]],
      ];
      glyphs.forEach(([g, col, pos, sp]) => add(glyphTexture(g, fam, col), 2, 0.9, pos, sp, [0, 0, 0], 0.7, true));
    };
    build();

    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w / h < 0.8 ? 11 : 8;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);
    const onMove = (e: PointerEvent) => {
      sceneState.mx = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.my = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clock = new THREE.Clock();
    const mouse = new THREE.Vector2();
    let raf = 0, visible = true;
    const onVis = () => { visible = !document.hidden; if (visible) loop(); };
    document.addEventListener("visibilitychange", onVis);

    const loop = () => {
      if (!visible) return;
      raf = requestAnimationFrame(loop);
      const tm = reduce ? 0 : clock.getElapsedTime();
      mouse.x += (sceneState.mx - mouse.x) * 0.05;
      mouse.y += (sceneState.my - mouse.y) * 0.05;
      const p = sceneState.progress, intro = sceneState.intro;
      const wide = camera.aspect > 1;

      group.position.x = wide ? 2.5 - p * 4.2 : -0.45;
      group.position.y = wide ? 0 : 2.3;
      group.rotation.y = mouse.x * 0.3 + p * 0.9;
      group.rotation.x = -mouse.y * 0.18;
      group.scale.setScalar((0.8 + intro * 0.2) * (wide ? 1 : 0.55));

      items.forEach((it, i) => {
        const sp = p * 1.4;
        it.mesh.position.set(
          it.base.x + it.spread.x * sp,
          it.base.y + it.spread.y * sp + Math.sin(tm * 0.7 + it.phase) * (it.glyph ? 0.16 : 0.07),
          it.base.z,
        );
        it.mesh.rotation.set(it.rot.x + Math.sin(tm * 0.4 + i) * 0.02, it.rot.y + Math.cos(tm * 0.35 + i) * 0.03, it.rot.z + (it.glyph ? Math.sin(tm * 0.5 + i) * 0.12 : 0));
      });
      canvas.style.opacity = String(Math.max(0.22, 1 - p * 3.5) * Math.min(1, intro * 1.5));
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      visible = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 size-full" />;
}
