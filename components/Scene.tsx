"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { sceneState } from "@/lib/state";

// A calm cluster of floating, glossy geometric shapes that drift, react to the
// mouse and spread apart as you scroll.
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 5, 6); scene.add(key);
    const rim = new THREE.PointLight(0xff5a36, 40, 20); rim.position.set(-5, -2, 3); scene.add(rim);
    const fill = new THREE.PointLight(0x7a5cff, 40, 20); fill.position.set(5, -4, 2); scene.add(fill);

    const mk = (color: number, rough: number, metal: number) =>
      new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

    const defs: { geo: THREE.BufferGeometry; mat: THREE.Material; pos: [number, number, number]; s: number; spread: [number, number, number] }[] = [
      { geo: new THREE.TorusKnotGeometry(0.7, 0.24, 160, 24), mat: mk(0xf2f0ea, 0.25, 0.9), pos: [0, 0, 0], s: 1, spread: [0, 0, 0] },
      { geo: new THREE.TorusGeometry(0.45, 0.14, 24, 64), mat: mk(0xff5a36, 0.35, 0.4), pos: [-2.2, 1.2, -1], s: 1, spread: [-3, 2, 0] },
      { geo: new THREE.IcosahedronGeometry(0.5, 0), mat: mk(0x7a5cff, 0.3, 0.5), pos: [2.3, 1.5, -0.5], s: 1, spread: [3.5, 2.5, 0] },
      { geo: new THREE.OctahedronGeometry(0.45, 0), mat: mk(0xf2f0ea, 0.2, 0.8), pos: [2.0, -1.6, 0.5], s: 1, spread: [3, -2.5, 0] },
      { geo: new THREE.SphereGeometry(0.32, 32, 32), mat: mk(0xff5a36, 0.2, 0.2), pos: [-2.0, -1.5, 0.3], s: 1, spread: [-3.5, -2, 0] },
    ];
    const group = new THREE.Group();
    scene.add(group);
    const meshes = defs.map((d) => {
      const m = new THREE.Mesh(d.geo, d.mat);
      m.position.set(...d.pos);
      group.add(m);
      return m;
    });

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
      const t = reduce ? 0 : clock.getElapsedTime();
      mouse.x += (sceneState.mx - mouse.x) * 0.05;
      mouse.y += (sceneState.my - mouse.y) * 0.05;
      const p = sceneState.progress;
      const intro = sceneState.intro;
      const wide = camera.aspect > 1;

      group.position.x = wide ? 2.4 - p * 4 : 0;
      group.position.y = wide ? 0 : 1.6;
      group.rotation.y = mouse.x * 0.4 + p * 2;
      group.rotation.x = -mouse.y * 0.25;
      group.scale.setScalar((0.55 + intro * 0.45) * (wide ? 1 : 0.7));

      meshes.forEach((m, i) => {
        const d = defs[i];
        const k = p * 1.5;
        m.position.set(
          d.pos[0] + d.spread[0] * k,
          d.pos[1] + d.spread[1] * k + Math.sin(t * 0.8 + i * 1.7) * 0.18,
          d.pos[2],
        );
        m.rotation.x = t * (0.25 + i * 0.07) + i;
        m.rotation.y = t * (0.35 + i * 0.05);
      });
      canvas.style.opacity = String(Math.max(0.25, 1 - p * 3.5) * Math.min(1, intro * 1.5));
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      visible = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      defs.forEach((d) => { d.geo.dispose(); d.mat.dispose(); });
      renderer.dispose();
    };
  }, []);

  return <canvas id="scene" ref={ref} aria-hidden="true" />;
}
