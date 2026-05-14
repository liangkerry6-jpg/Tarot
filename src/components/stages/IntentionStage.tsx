import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Heart, Briefcase, GraduationCap, Users, Compass } from 'lucide-react';
import type { Intention } from '../../data/contextualSummaries';
import type { InteractionMode } from '../../App';

interface IntentionStageProps {
  onSelectIntention: (intention: Intention) => void;
  cursorX?: number;
  cursorY?: number;
  isHandDetected?: boolean;
  interactionMode?: InteractionMode;
}

const intentions: { key: Intention; icon: typeof Heart; i18nKey: string }[] = [
  { key: 'love', icon: Heart, i18nKey: 'intentionLove' },
  { key: 'career', icon: Briefcase, i18nKey: 'intentionCareer' },
  { key: 'study', icon: GraduationCap, i18nKey: 'intentionStudy' },
  { key: 'social', icon: Users, i18nKey: 'intentionSocial' },
  { key: 'general', icon: Compass, i18nKey: 'intentionGeneral' },
];

const GESTURE_HOVER_DURATION = 2000;

export function IntentionStage({ onSelectIntention, cursorX = 0, cursorY = 0, isHandDetected = false, interactionMode = 'mouse' }: IntentionStageProps) {
  const { t } = useTranslation();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hoverStartRef = useRef<{ index: number; startTime: number } | null>(null);
  const [hoverProgress, setHoverProgress] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const selectedRef = useRef(false);

  const isGesture = interactionMode === 'gesture';

  // Cursor-based hover detection for gesture mode
  useEffect(() => {
    if (!isGesture || !isHandDetected || selectedRef.current) {
      hoverStartRef.current = null;
      setHoverProgress(0);
      setHoveredIdx(null);
      return;
    }

    let foundIndex: number | null = null;
    for (let i = 0; i < buttonRefs.current.length; i++) {
      const btn = buttonRefs.current[i];
      if (!btn) continue;
      const rect = btn.getBoundingClientRect();
      if (cursorX >= rect.left && cursorX <= rect.right && cursorY >= rect.top && cursorY <= rect.bottom) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex !== null) {
      const now = Date.now();
      if (hoverStartRef.current?.index === foundIndex) {
        const elapsed = now - hoverStartRef.current.startTime;
        const progress = Math.min(elapsed / GESTURE_HOVER_DURATION, 1);
        setHoverProgress(progress);
        if (elapsed >= GESTURE_HOVER_DURATION) {
          selectedRef.current = true;
          onSelectIntention(intentions[foundIndex].key);
          return;
        }
      } else {
        hoverStartRef.current = { index: foundIndex, startTime: now };
        setHoverProgress(0);
      }
      setHoveredIdx(foundIndex);
    } else {
      hoverStartRef.current = null;
      setHoverProgress(0);
      setHoveredIdx(null);
    }
  }, [cursorX, cursorY, isHandDetected, isGesture, onSelectIntention]);

  const handleClick = useCallback((key: Intention) => {
    if (isGesture) return; // gesture mode uses hover, not click
    onSelectIntention(key);
  }, [isGesture, onSelectIntention]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4">
      {/* Title */}
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-2xl md:text-3xl font-bold text-goldAura text-center mb-10 tracking-wider"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {t('intentionTitle')}
      </motion.h2>

      {/* Intention buttons */}
      <div className="flex flex-col gap-4 w-full max-w-md">
        {intentions.map((item, i) => {
          const Icon = item.icon;
          const isHovered = hoveredIdx === i;
          const progress = isHovered ? hoverProgress : 0;

          return (
            <motion.button
              key={item.key}
              ref={el => { buttonRefs.current[i] = el; }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.5 }}
              whileHover={isGesture ? {} : { scale: 1.03, x: 6 }}
              whileTap={isGesture ? {} : { scale: 0.97 }}
              onClick={() => handleClick(item.key)}
              className="relative flex items-center gap-4 px-6 py-4 rounded-xl
                         bg-white/5 backdrop-blur-md border border-white/10
                         hover:bg-white/10 hover:border-goldAura/40
                         text-goldAura/80 hover:text-goldAura
                         transition-all duration-300 group overflow-hidden"
            >
              {/* Gesture hover progress fill */}
              {isGesture && isHovered && (
                <motion.div
                  className="absolute inset-0 bg-goldAura/10 rounded-xl"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                  style={{ originX: 0 }}
                />
              )}

              <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full
                              flex items-center justify-center transition-colors ${
                                isGesture && isHovered ? 'bg-goldAura/30' : 'bg-goldAura/10 group-hover:bg-goldAura/20'
                              }`}>
                <Icon className={`w-5 h-5 transition-colors ${
                  isGesture && isHovered ? 'text-goldAura' : 'text-goldAura/70 group-hover:text-goldAura'
                }`} />
              </div>
              <span className="relative z-10 text-base md:text-lg tracking-wider"
                    style={{ fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}>
                {t(item.i18nKey)}
              </span>

              {/* Gesture progress ring */}
              {isGesture && isHovered && (
                <svg className="relative z-10 ml-auto w-6 h-6 -rotate-90">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"
                    className="text-goldAura/20" strokeWidth="2" />
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"
                    className="text-goldAura" strokeWidth="2"
                    strokeDasharray={`${progress * 2 * Math.PI * 10} ${2 * Math.PI * 10}`}
                    strokeLinecap="round" />
                </svg>
              )}

              {!isGesture && (
                <span className="ml-auto text-goldAura/20 group-hover:text-goldAura/50 transition-colors text-lg">
                  →
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
