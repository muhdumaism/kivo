import { useEffect, useState } from "react";

// Drifting voxel cubes that parallax on scroll.
export function ParallaxCubes() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const onScroll = () => setY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cubes = [
    { left: "8%", top: "18%", size: 46, speed: 0.25, rot: 12, cls: "bg-violet/30 border-violet/40" },
    { left: "82%", top: "12%", size: 30, speed: 0.5, rot: -18, cls: "bg-coral/25 border-coral/40" },
    { left: "70%", top: "60%", size: 56, speed: 0.15, rot: 24, cls: "bg-lavender/20 border-lavender/40" },
    { left: "22%", top: "70%", size: 24, speed: 0.6, rot: -8, cls: "bg-coral/20 border-coral/40" },
    { left: "46%", top: "30%", size: 18, speed: 0.4, rot: 30, cls: "bg-violet/25 border-violet/40" },
    { left: "92%", top: "72%", size: 38, speed: 0.32, rot: -22, cls: "bg-lavender/25 border-lavender/40" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {cubes.map((c, i) => (
        <div
          key={i}
          className={`absolute border rounded-[6px] backdrop-blur-sm ${c.cls}`}
          style={{
            left: c.left, top: c.top, width: c.size, height: c.size,
            transform: `translateY(${-y * c.speed}px) rotate(${c.rot + y * 0.02}deg)`,
          }}
        />
      ))}
    </div>
  );
}
