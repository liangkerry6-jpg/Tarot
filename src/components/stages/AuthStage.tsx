import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { InteractionMode } from '../../App';

interface AuthStageProps {
  onAuthSuccess: () => void;
  isLoading: boolean;
  error: string | null;
  interactionMode: InteractionMode;
  cursorX?: number;
  cursorY?: number;
  isHandDetected?: boolean;
}

const GESTURE_HOVER_DURATION = 2000;
const EXIT_DEBOUNCE = 300;

export function AuthStage({ onAuthSuccess, isLoading, error, interactionMode, cursorX = 0, cursorY = 0, isHandDetected = false }: AuthStageProps) {
  const { t } = useTranslation();
  const [hasClicked, setHasClicked] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [gestureProgress, setGestureProgress] = useState(0);
  const hoverStartRef = useRef<number | null>(null);
  const exitTimeRef = useRef<number | null>(null);
  const savedProgressRef = useRef(0);

  const isGesture = interactionMode === 'gesture';

  const handleBegin = useCallback(() => {
    setHasClicked(true);
    onAuthSuccess();
  }, [onAuthSuccess]);

  // Gesture mode: collision detection for hover-to-click
  const checkCollision = useCallback(() => {
    if (!isGesture || !isHandDetected || hasClicked) {
      setGestureProgress(0);
      hoverStartRef.current = null;
      exitTimeRef.current = null;
      savedProgressRef.current = 0;
      return;
    }

    const el = buttonRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const isHovering =
      cursorX >= rect.left && cursorX <= rect.right &&
      cursorY >= rect.top && cursorY <= rect.bottom;

    if (isHovering) {
      if (exitTimeRef.current !== null) {
        const timeSinceExit = Date.now() - exitTimeRef.current;
        if (timeSinceExit < EXIT_DEBOUNCE) {
          hoverStartRef.current = Date.now() - savedProgressRef.current * GESTURE_HOVER_DURATION;
        }
        exitTimeRef.current = null;
      }

      if (hoverStartRef.current === null) {
        hoverStartRef.current = Date.now();
      }

      const elapsed = Date.now() - (hoverStartRef.current || 0);
      const progress = Math.min(elapsed / GESTURE_HOVER_DURATION, 1);
      setGestureProgress(progress);
      savedProgressRef.current = progress;

      if (progress >= 1) {
        handleBegin();
      }
    } else if (hoverStartRef.current !== null) {
      if (exitTimeRef.current === null) {
        exitTimeRef.current = Date.now();
      } else if (Date.now() - exitTimeRef.current >= EXIT_DEBOUNCE) {
        setGestureProgress(0);
        hoverStartRef.current = null;
        exitTimeRef.current = null;
        savedProgressRef.current = 0;
      }
    }
  }, [cursorX, cursorY, isHandDetected, hasClicked, isGesture, handleBegin]);

  useEffect(() => {
    if (!isGesture) return;
    const interval = setInterval(checkCollision, 16);
    return () => clearInterval(interval);
  }, [checkCollision, isGesture]);

  const isMouse = !isGesture;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4">
      {/* Central mystical eye icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="relative mb-12"
      >
        <motion.div
          animate={{
            boxShadow: [
              '0 0 30px rgba(197, 160, 89, 0.3)',
              '0 0 60px rgba(197, 160, 89, 0.5)',
              '0 0 30px rgba(197, 160, 89, 0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-32 h-32 rounded-full flex items-center justify-center
                     border-2 border-goldAura/50 bg-mysticPurple/30 backdrop-blur-sm"
        >
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x1 = 50 + Math.cos(angle) * 28;
              const y1 = 50 + Math.sin(angle) * 28;
              const x2 = 50 + Math.cos(angle) * 38;
              const y2 = 50 + Math.sin(angle) * 38;
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#D4AF37" strokeWidth="1.2" opacity="0.5" />
              );
            })}
            <circle cx="50" cy="50" r="24" fill="none" stroke="#D4AF37" strokeWidth="1.5" opacity="0.6" />
            <circle cx="50" cy="50" r="16" fill="none" stroke="#D4AF37" strokeWidth="0.8" opacity="0.35" />
            <path d="M50 34 A16 16 0 1 0 50 66 A12 12 0 1 1 50 34Z"
              fill="#D4AF37" opacity="0.5" />
            <circle cx="50" cy="50" r="3" fill="#D4AF37" opacity="0.7" />
            {[[50,30],[50,70],[30,50],[70,50]].map(([cx,cy], i) => (
              <circle key={`s${i}`} cx={cx} cy={cy} r="1.5" fill="#D4AF37" opacity="0.4" />
            ))}
          </svg>
        </motion.div>

        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${50 + 60 * Math.cos((i * Math.PI * 2) / 6)}%`,
              top: `${50 + 60 * Math.sin((i * Math.PI * 2) / 6)}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Sparkles className="w-4 h-4 text-goldAura/60" />
          </motion.div>
        ))}
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-3xl md:text-4xl font-bold text-goldAura text-center mb-4 tracking-wider"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {t('authTitle')}
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="text-goldAura/60 text-center mb-12 max-w-md"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {isMouse ? t('authSubtitleMouse') : t('authSubtitle')}
      </motion.p>

      <AnimatePresence mode="wait">
        {!hasClicked && (
          <motion.button
            ref={buttonRef}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            whileHover={isMouse ? { scale: 1.05 } : undefined}
            whileTap={isMouse ? { scale: 0.95 } : undefined}
            onClick={handleBegin}
            disabled={isLoading}
            className="relative px-8 py-4 rounded-full
                       bg-gradient-to-r from-mysticPurple to-mysticPurple/80
                       border-2 border-goldAura/50
                       text-goldAura font-semibold tracking-widest
                       hover:border-goldAura hover:shadow-gold
                       transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed
                       overflow-hidden"
            style={{
              fontFamily: "'Cinzel', serif",
              ...(isGesture && gestureProgress > 0 ? {
                borderColor: `rgba(212,175,55,${0.5 + gestureProgress * 0.5})`,
                boxShadow: `0 0 ${12 + gestureProgress * 24}px rgba(197,160,89,${0.15 + gestureProgress * 0.35})`,
              } : {}),
            }}
          >
            <span className="relative z-10">
              {isLoading ? t('authPermissionRequest') : t('authButton')}
            </span>
            {/* Gesture charge-up fill */}
            {isGesture && (
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-goldAura/20 transition-none pointer-events-none"
                style={{ width: `${gestureProgress * 100}%` }}
              />
            )}
            {/* Mouse mode subtle pulse */}
            {isMouse && (
              <motion.div
                className="absolute inset-0 rounded-full bg-goldAura/20"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 mt-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-goldAura/30 border-t-goldAura rounded-full"
            />
            <span className="text-goldAura/60 text-sm">{t('authPermissionRequest')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-center max-w-md"
          >
            {t('authPermissionDenied')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
