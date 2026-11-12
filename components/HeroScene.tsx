"use client";

import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  CanvasTexture,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  RingGeometry,
  MeshBasicMaterial,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  WebGLRenderer,
  DoubleSide,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { AGENTS } from "@/lib/agents";

function monogramTexture(letters: string, bg: string, fg: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = fg;
  g.font = "600 120px Georgia, 'Times New Roman', serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(letters, 128, 138);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

    const scene = new Scene();
    const camera = new PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.6, 9.5);

    scene.add(new HemisphereLight(0xffffff, 0x303040, 1.4));
    scene.add(new AmbientLight(0xffffff, 0.35));
    const sun = new DirectionalLight(0xffffff, 2.2);
    sun.position.set(4, 6, 6);
    scene.add(sun);

    const world = new Group();
    world.rotation.x = 0.28;
    scene.add(world);

    // Core sphere
    const coreGeo = new SphereGeometry(1.25, 48, 48);
    const coreMat = new MeshStandardMaterial({ color: new Color("#f5f5f5"), roughness: 0.35, metalness: 0.0 });
    const core = new Mesh(coreGeo, coreMat);
    world.add(core);

    // Orbit ring (flat, in the orbit plane)
    const ringGeo = new RingGeometry(3.38, 3.42, 128);
    const ringMat = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, side: DoubleSide });
    const ring = new Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    world.add(ring);

    // Staff tiles
    const tileGeo = new RoundedBoxGeometry(1.15, 1.15, 0.32, 4, 0.14);
    const tiles: { mesh: Mesh; phase: number; mat: MeshStandardMaterial; tex: CanvasTexture }[] = [];
    const orbit = new Group();
    world.add(orbit);
    AGENTS.forEach((a, i) => {
      const tex = monogramTexture(a.mono, a.color, "#0a0a0a");
      const mat = new MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0 });
      const mesh = new Mesh(tileGeo, mat);
      const phase = (i / AGENTS.length) * Math.PI * 2;
      orbit.add(mesh);
      tiles.push({ mesh, phase, mat, tex });
    });

    const R = 3.4;
    let t = 0;
    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;

    const place = () => {
      for (const { mesh, phase } of tiles) {
        const a = phase + t * 0.32;
        mesh.position.set(Math.cos(a) * R, Math.sin(t * 1.1 + phase * 2) * 0.28, Math.sin(a) * R);
        mesh.rotation.set(Math.sin(t * 0.7 + phase) * 0.25, -a + Math.PI / 2, Math.cos(t * 0.6 + phase) * 0.12);
      }
      core.rotation.y = t * 0.25;
      core.scale.setScalar(1 + Math.sin(t * 1.4) * 0.025);
    };

    const render = () => {
      tx += (mx - tx) * 0.06;
      ty += (my - ty) * 0.06;
      world.rotation.y = tx * 0.5;
      world.rotation.x = 0.28 + ty * 0.25;
      renderer.render(scene, camera);
    };

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Orbit + tiles span about ±4.6 units horizontally; back the camera off until that fits the width.
      const halfFov = Math.tan((camera.fov * Math.PI) / 360);
      camera.position.z = Math.max(9.5, 4.6 / (halfFov * camera.aspect));
      camera.updateProjectionMatrix();
      render();
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    let last = performance.now();

    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      t += Math.min((now - last) / 1000, 0.05);
      last = now;
      place();
      render();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduced || raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      my = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
    };
    const onLeave = () => {
      mx = 0;
      my = 0;
    };

    place();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(el);
    const onVis = () => !document.hidden && start();
    document.addEventListener("visibilitychange", onVis);
    if (!reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      el.addEventListener("pointerleave", onLeave);
    }
    resize();
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      tiles.forEach(({ mat, tex }) => {
        tex.dispose();
        mat.dispose();
      });
      tileGeo.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  if (failed) return null;
  return <div ref={host} className="hero-scene" aria-hidden="true" />;
}
