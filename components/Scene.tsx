"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { sceneState } from "@/lib/state";

const vert = /* glsl */ `
uniform float uTime; uniform float uProgress; uniform vec2 uMouse; uniform float uIntro; uniform float uPx;
attribute float aRand; varying float vMix; varying float vAlpha;
void main(){
  vec3 p = position;
  float n = sin(p.x*2.1+uTime*.7)+sin(p.y*2.7-uTime*.5)+sin(p.z*1.9+uTime*.6);
  float disp = .10 + .10*uProgress;
  p += normalize(p) * n * disp;
  // intro: particles fly in from far away
  p *= mix(3.2, 1.0, uIntro) ;
  // mouse repulsion in view space
  vec4 mv = modelViewMatrix * vec4(p,1.);
  vec2 m = uMouse * vec2(2.4, 1.6);
  float d = distance(mv.xy, m);
  mv.xy += normalize(mv.xy - m + 1e-4) * smoothstep(1.3, 0., d) * .45;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.6 + aRand*2.2) * uPx * (3.2 / -mv.z);
  vMix = clamp(p.y*.35+.5 + uProgress*.6, 0., 1.);
  vAlpha = .35 + .65*aRand;
}`;
const frag = /* glsl */ `
varying float vMix; varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - .5; float r = length(c); if(r>.5) discard;
  vec3 a = vec3(1., .35, .21); vec3 b = vec3(.55, .45, 1.);
  vec3 col = mix(a, b, vMix);
  gl_FragColor = vec4(col, vAlpha * smoothstep(.5, .05, r));
}`;

export default function Scene() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch { return; } // no WebGL: page still works without the background
    const px = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(px);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    camera.position.z = 4;

    const group = new THREE.Group();
    scene.add(group);

    // particle sphere
    const COUNT = window.innerWidth < 700 ? 9000 : 22000;
    const pos = new Float32Array(COUNT * 3);
    const rand = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const th = Math.random() * Math.PI * 2;
      const r = 1.25 + (Math.random() - 0.5) * 0.08;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(th);
      rand[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 }, uProgress: { value: 0 }, uIntro: { value: 0 },
        uMouse: { value: new THREE.Vector2() }, uPx: { value: px * 1.6 },
      },
    });
    const points = new THREE.Points(geo, mat);
    group.add(points);

    // inner wireframe core
    const coreGeo = new THREE.IcosahedronGeometry(0.62, 1);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xf2f0ea, wireframe: true, transparent: true, opacity: 0.14 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w / h < 0.8 ? 5.4 : 4;
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
      mouse.x += (sceneState.mx - mouse.x) * 0.06;
      mouse.y += (sceneState.my - mouse.y) * 0.06;
      const p = sceneState.progress;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uProgress.value = p;
      mat.uniforms.uIntro.value = sceneState.intro;
      mat.uniforms.uMouse.value.copy(mouse);
      group.rotation.y = t * 0.08 + mouse.x * 0.35 + p * Math.PI * 2;
      group.rotation.x = mouse.y * 0.2 + p * 0.8;
      core.rotation.y = -t * 0.2;
      // drift sphere to the right on desktop and shrink as you scroll
      const wide = camera.aspect > 1;
      group.position.x = wide ? 1.1 - p * 2.2 : 0;
      group.position.y = wide ? 0 : 0.6;
      group.scale.setScalar(1 - p * 0.25);
      canvas.style.opacity = String(Math.max(0.28, 1 - p * 4));
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      visible = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      geo.dispose(); mat.dispose(); coreGeo.dispose(); coreMat.dispose(); renderer.dispose();
    };
  }, []);

  return <canvas id="scene" ref={ref} aria-hidden="true" />;
}
