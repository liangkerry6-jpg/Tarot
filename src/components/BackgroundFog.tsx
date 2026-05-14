import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * BackgroundFog Component
 *
 * Creates a deep starry sky atmosphere with:
 * - Rich deep purple and dark space gradient
 * - Slow-moving purple nebula fog layers
 * - Twinkling star particles (golden & white)
 * - Floating stardust particles
 * - Vignette for depth
 */
export function BackgroundFog() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas-based star field for better performance
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generate stars
    const stars: Array<{
      x: number;
      y: number;
      radius: number;
      opacity: number;
      speed: number;
      phase: number;
      color: string;
    }> = [];

    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.6 + 0.1,
        speed: Math.random() * 0.005 + 0.002,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.7 ? '197, 160, 89' : '180, 160, 220',
      });
    }

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const star of stars) {
        const twinkle = Math.sin(time * star.speed * 30 + star.phase) * 0.5 + 0.5;
        const alpha = star.opacity * (0.5 + twinkle * 0.5);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${star.color}, ${alpha})`;
        ctx.fill();

        // Glow for brighter stars
        if (star.radius > 1) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${star.color}, ${alpha * 0.15})`;
          ctx.fill();
        }
      }

      // Shooting stars (occasional)
      if (Math.random() < 0.003) {
        const sx = Math.random() * canvas.width;
        const sy = Math.random() * canvas.height * 0.5;
        const length = 40 + Math.random() * 60;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + length, sy + length * 0.3);
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.6)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Deep purple base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0815 0%, #120c24 30%, #1a1035 60%, #0b0c10 100%)',
        }}
      />

      {/* Purple nebula floating fog */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 15% 25%, rgba(88, 42, 128, 0.3) 0%, transparent 60%),
            radial-gradient(ellipse 50% 35% at 85% 50%, rgba(62, 30, 100, 0.25) 0%, transparent 55%),
            radial-gradient(ellipse 70% 45% at 50% 80%, rgba(45, 20, 85, 0.2) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 70% 15%, rgba(80, 50, 140, 0.15) 0%, transparent 50%)
          `,
        }}
        animate={{
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Second nebula layer - slowly drifting */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 55% 35% at 78% 32%, rgba(100, 55, 150, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 45% 40% at 25% 68%, rgba(55, 25, 95, 0.25) 0%, transparent 55%),
            radial-gradient(ellipse 35% 25% at 55% 22%, rgba(70, 40, 120, 0.15) 0%, transparent 45%)
          `,
        }}
        animate={{
          x: [0, 15, -10, 0],
          y: [0, -8, 5, 0],
          opacity: [0.7, 0.9, 0.7],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Golden mist wisps */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 30% 20% at 40% 35%, rgba(197, 160, 89, 0.06) 0%, transparent 60%),
            radial-gradient(ellipse 25% 15% at 65% 55%, rgba(197, 160, 89, 0.04) 0%, transparent 55%)
          `,
        }}
        animate={{
          opacity: [0.3, 0.7, 0.3],
          x: [0, -10, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Canvas star field */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Large floating golden dust */}
      <div className="absolute inset-0">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`dust-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: Math.random() > 0.5
                ? 'rgba(197, 160, 89, 0.5)'
                : 'rgba(180, 160, 220, 0.4)',
            }}
            animate={{
              y: [0, -(20 + Math.random() * 40), 0],
              x: [0, (Math.random() - 0.5) * 30, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 8,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Deep vignette for atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 45%, rgba(8, 6, 20, 0.85) 100%)',
        }}
      />
    </div>
  );
}
