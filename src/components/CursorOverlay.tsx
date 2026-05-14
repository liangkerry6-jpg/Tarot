import { useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import type { GesturePhase } from '../hooks/useHandTracking';

interface CursorOverlayProps {
  x: number;
  y: number;
  isVisible: boolean;
  isTrackingLost: boolean;
  gesturePhase: GesturePhase;
  hoverProgress: number;
}

/**
 * CursorOverlay — Golden aura cursor with gesture-dependent animated halo
 */
export function CursorOverlay({
  x, y, isVisible, isTrackingLost,
  gesturePhase, hoverProgress,
}: CursorOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cursorX = useMotionValue(x);
  const cursorY = useMotionValue(y);
  const springConfig = { damping: 30, stiffness: 200, mass: 0.5 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => { cursorX.set(x); cursorY.set(y); }, [x, y, cursorX, cursorY]);

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

    let frame: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!isVisible || isTrackingLost) {
        frame = requestAnimationFrame(render);
        return;
      }

      const cx = smoothX.get();
      const cy = smoothY.get();
      const t = Date.now() / 1000;

      // Core brightness by phase
      const coreAlpha = gesturePhase === 'stationary' ? 0.9
        : gesturePhase === 'circling' ? 0.8
        : 0.65;

      // --- Outer glow ---
      const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 110);
      g1.addColorStop(0, `rgba(197,160,89,${0.25 * coreAlpha})`);
      g1.addColorStop(0.5, `rgba(197,160,89,${0.08 * coreAlpha})`);
      g1.addColorStop(1, 'rgba(197,160,89,0)');
      ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2);
      ctx.fillStyle = g1; ctx.fill();

      // --- Middle glow ---
      const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 55);
      g2.addColorStop(0, `rgba(197,160,89,${0.4 * coreAlpha})`);
      g2.addColorStop(0.5, `rgba(197,160,89,${0.15 * coreAlpha})`);
      g2.addColorStop(1, 'rgba(197,160,89,0)');
      ctx.beginPath(); ctx.arc(cx, cy, 55, 0, Math.PI * 2);
      ctx.fillStyle = g2; ctx.fill();

      // --- Halo ring (pointing / circling) ---
      if (gesturePhase === 'pointing' || gesturePhase === 'circling') {
        const ringR = gesturePhase === 'circling' ? 55 : 42;
        const segments = 6;
        const rotSpeed = gesturePhase === 'circling' ? 4 : 1.2;
        const rotation = t * rotSpeed;

        for (let i = 0; i < segments; i++) {
          const sa = rotation + i * ((Math.PI * 2) / segments);
          const ea = sa + (Math.PI * 2) / segments * 0.55;
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, sa, ea);
          ctx.strokeStyle = `rgba(197,160,89,${0.25 + 0.25 * Math.sin(t * 3 + i)})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // --- Stationary ripple ---
      if (gesturePhase === 'stationary') {
        const cycle = 1800;
        for (let i = 0; i < 3; i++) {
          const phase = ((t * 1000 + i * (cycle / 3)) % cycle) / cycle;
          const r = phase * 80;
          const alpha = (1 - phase) * 0.35;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(197,160,89,${alpha})`;
          ctx.lineWidth = 1; ctx.stroke();
        }
      }

      // --- Selection halo ---
      if (gesturePhase === 'stationary' && hoverProgress > 0) {
        const pulse = 1 + 0.25 * Math.sin(t * 6);
        const r = 45 * pulse * (0.4 + hoverProgress * 0.6);
        const gs = ctx.createRadialGradient(cx, cy, r * 0.25, cx, cy, r);
        gs.addColorStop(0, `rgba(255,248,220,${0.5 + hoverProgress * 0.4})`);
        gs.addColorStop(0.5, `rgba(197,160,89,${0.25 + hoverProgress * 0.25})`);
        gs.addColorStop(1, 'rgba(197,160,89,0)');
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = gs; ctx.fill();
      }

      // --- Inner core ---
      const gi = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
      gi.addColorStop(0, `rgba(255,248,220,${0.7 * coreAlpha})`);
      gi.addColorStop(0.5, `rgba(197,160,89,${0.35 * coreAlpha})`);
      gi.addColorStop(1, 'rgba(197,160,89,0)');
      ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fillStyle = gi; ctx.fill();

      // --- Central dot ---
      const gd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 7);
      gd.addColorStop(0, 'rgba(255,248,220,1)');
      gd.addColorStop(0.5, 'rgba(232,213,163,0.8)');
      gd.addColorStop(1, 'rgba(197,160,89,0)');
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = gd; ctx.fill();

      frame = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frame);
    };
  }, [isVisible, isTrackingLost, smoothX, smoothY, gesturePhase, hoverProgress]);

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible && !isTrackingLost ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    />
  );
}
