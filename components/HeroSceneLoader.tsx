"use client";

import dynamic from "next/dynamic";

// three.js (~600 KB) is loaded only in the browser and only after the page is interactive.
const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <div className="hero-scene" aria-hidden="true" />,
});

export default function HeroSceneLoader() {
  return <HeroScene />;
}
