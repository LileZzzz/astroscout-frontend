import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  z: number;
  radius: number;
  opacity: number;
  drift: number;
};

const STAR_COUNT = 220;
function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function createStars(width: number, height: number) {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: randomBetween(-width * 0.5, width * 1.5),
    y: randomBetween(-height * 0.35, height * 1.35),
    z: randomBetween(0.18, 1),
    radius: randomBetween(0.8, 3.8),
    opacity: randomBetween(0.2, 0.95),
    drift: randomBetween(0.2, 1.2),
  } satisfies Star));
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let stars = createStars(width, height);
    let frameId = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      stars = createStars(width, height);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current.x = event.clientX / width - 0.5;
      pointerRef.current.y = event.clientY / height - 0.5;
    };

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        const shimmer = (Math.sin(time * 0.0009 * star.drift + star.x * 0.01) + 1) * 0.5;
        const parallaxX = pointerRef.current.x * 34 * star.z;
        const parallaxY = pointerRef.current.y * 24 * star.z;
        const rise = (time * 0.012 * star.drift) % (height + 160);
        const y = ((star.y - rise + height + 120) % (height + 160) - 80) + parallaxY;
        const x = star.x + parallaxX;
        const radius = star.radius * (0.55 + star.z * 0.9);
        const alpha = star.opacity * (0.35 + shimmer * 0.65);

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 4);
        gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
        gradient.addColorStop(0.38, `rgba(216,232,255,${alpha * 0.66})`);
        gradient.addColorStop(1, "rgba(216,232,255,0)");

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(x, y, radius * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      frameId = window.requestAnimationFrame(render);
    };

    resize();
    frameId = window.requestAnimationFrame(render);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <div className="particle-field" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
