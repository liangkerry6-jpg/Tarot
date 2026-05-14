import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { tarotCards } from '../../data/tarotData';
import type { CircleDirection } from '../../hooks/useHandTracking';
import type { InteractionMode } from '../../App';

interface ShuffleStageProps {
  isPointing: boolean;
  isCircling: boolean;
  circleDirection: CircleDirection;
  isStationary: boolean;
  stationaryDuration: number;
  onShuffleComplete: () => void;
  interactionMode: InteractionMode;
}

type ShufflePhase = 'idle' | 'shuffling' | 'stacking' | 'spreading' | 'done';

const ALL_CARDS = tarotCards;
const DISPLAY_COUNT = 78;

function CardBack() {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-[#1a1035] via-[#120c24] to-[#0a0815] flex items-center justify-center">
      <div className="absolute inset-1 rounded border border-[#D4AF37]/40" />
      <div className="absolute inset-2.5 rounded border border-[#D4AF37]/15" />
      <svg viewBox="0 0 100 100" className="w-3/5 h-3/5 opacity-70">
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
    </div>
  );
}

export function ShuffleStage({
  isPointing: _isPointing, isCircling, circleDirection, isStationary, stationaryDuration: _stationaryDuration,
  onShuffleComplete, interactionMode,
}: ShuffleStageProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<ShufflePhase>('idle');
  const [hasMetMinimumShuffle, setHasMetMinimumShuffle] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const stackingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spreadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const circlingStartRef = useRef<number | null>(null);

  const isMouse = interactionMode === 'mouse';

  // Fail-safe: once transitioning, guarantee onShuffleComplete fires
  useEffect(() => {
    if (!isTransitioning) return;
    const timer = setTimeout(() => {
      onShuffleComplete();
    }, 1000);
    return () => clearTimeout(timer);
  }, [isTransitioning, onShuffleComplete]);

  // Circling timer: track 2-second minimum
  useEffect(() => {
    if (isMouse || isTransitioning) return;
    if (isCircling && phase === 'shuffling') {
      if (circlingStartRef.current === null) {
        circlingStartRef.current = Date.now();
      }
      const interval = setInterval(() => {
        const elapsed = Date.now() - (circlingStartRef.current || 0);
        if (elapsed >= 2000) {
          setHasMetMinimumShuffle(true);
        }
      }, 100);
      return () => clearInterval(interval);
    } else if (!isCircling) {
      circlingStartRef.current = null;
    }
  }, [isCircling, phase, isMouse, isTransitioning]);

  // Gesture-driven phase transitions
  useEffect(() => {
    if (isMouse || isTransitioning) return;
    if (isCircling && phase === 'idle') {
      setPhase('shuffling');
    }
    if (!isCircling && phase === 'shuffling' && hasMetMinimumShuffle) {
      setPhase('stacking');
      setIsTransitioning(true);
      setHasMetMinimumShuffle(false);
      circlingStartRef.current = null;
    }
  }, [isCircling, phase, isMouse, hasMetMinimumShuffle, isTransitioning]);

  // Mouse mode: click-to-shuffle
  const handleMouseShuffle = useCallback(() => {
    if (!isMouse || phase !== 'idle') return;
    setPhase('shuffling');
    // Simulate the shuffle → stack → spread progression
    stackingTimerRef.current = setTimeout(() => setPhase('stacking'), 1800);
    const t2 = setTimeout(() => setPhase('spreading'), 2600);
    const t3 = setTimeout(() => {
      setPhase('done');
      setTimeout(() => onShuffleComplete(), 600);
    }, 4100);
    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isMouse, phase, onShuffleComplete]);

  // stacking → spreading (800ms)
  useEffect(() => {
    if (phase === 'stacking') {
      setIsTransitioning(true);
      stackingTimerRef.current = setTimeout(() => setPhase('spreading'), 800);
      return () => { if (stackingTimerRef.current) clearTimeout(stackingTimerRef.current); };
    }
  }, [phase]);

  // spreading → done (1500ms then callback)
  useEffect(() => {
    if (phase === 'spreading') {
      spreadingTimerRef.current = setTimeout(() => {
        setPhase('done');
        doneTimerRef.current = setTimeout(() => onShuffleComplete(), 600);
      }, 1500);
      return () => { if (spreadingTimerRef.current) clearTimeout(spreadingTimerRef.current); };
    }
  }, [phase, onShuffleComplete]);

  const getCardPosition = useCallback((index: number, total: number, currentPhase: ShufflePhase) => {
    if (currentPhase === 'shuffling') {
      const dir = circleDirection === 'counterclockwise' ? -1 : 1;
      const angleDeg = (index * 360) / total + dir * ((Date.now() / 20) % 360);
      const radius = 140 + (index % 7) * 14 + Math.sin(index * 0.7) * 20;
      const heightSpread = 60 + (index % 5) * 10;
      return {
        x: Math.cos((angleDeg * Math.PI) / 180) * radius,
        y: Math.sin((angleDeg * Math.PI) / 180) * radius * 0.55 + Math.sin(index * 0.9) * heightSpread,
        rotate: angleDeg + 90 + (Math.random() - 0.5) * 8,
        scale: 0.85 + (index % 4) * 0.04,
      };
    } else if (currentPhase === 'stacking') {
      return {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 3,
        rotate: (Math.random() - 0.5) * 6,
        scale: 1,
      };
    } else if (currentPhase === 'spreading') {
      const cardWidth = 56;
      const totalWidth = total * cardWidth * 0.32;
      const startX = -totalWidth / 2;
      return {
        x: startX + index * cardWidth * 0.32,
        y: (index % 3) * 2.5 - 2.5,
        rotate: (index - total / 2) * 0.07,
        scale: 1,
      };
    }
    return { x: 0, y: 0, rotate: 0, scale: 1 };
  }, [circleDirection]);

  const displayCards = ALL_CARDS.slice(0, DISPLAY_COUNT);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden">
      {/* Subtle top text */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute top-8 left-1/2 -translate-x-1/2 text-center"
      >
        <p className="text-goldAura/50 text-sm md:text-base tracking-widest"
           style={{ fontFamily: "'Cinzel', serif" }}>
          {isTransitioning
            ? t('shuffleComplete')
            : isMouse
            ? (phase === 'shuffling'
              ? t('shuffleInProgress')
              : phase === 'stacking' || phase === 'spreading'
              ? t('shuffleComplete')
              : t('authSubtitleMouse'))
            : (!isCircling && !hasMetMinimumShuffle
              ? t('shuffleInstruction')
              : isCircling && !hasMetMinimumShuffle
              ? t('shuffleKeepGoing')
              : isCircling && hasMetMinimumShuffle
              ? t('shuffleStopHint')
              : t('shuffleComplete'))}
        </p>
      </motion.div>

      {/* Cards container */}
      <div className="relative w-[700px] h-[400px] md:w-[850px] md:h-[480px] flex items-center justify-center">
        <AnimatePresence>
          {displayCards.map((card, index) => {
            const pos = getCardPosition(index, displayCards.length, phase);
            const isStacked = phase === 'idle';

            return (
              <motion.div
                key={card.id}
                className="absolute w-14 h-20 md:w-16 md:h-24 rounded-lg cursor-default"
                style={{
                  zIndex: phase === 'spreading' ? index : displayCards.length - index,
                }}
                initial={phase === 'idle' ? { opacity: 0, scale: 0.5 } : false}
                animate={{
                  x: pos.x - (isStacked ? index * 0.12 : 0),
                  y: pos.y - (isStacked ? index * 0.12 : 0),
                  rotate: pos.rotate,
                  scale: pos.scale,
                  opacity: 1,
                }}
                transition={{
                  duration: phase === 'shuffling' ? 0.4 : phase === 'stacking' ? 0.5 : 0.5,
                  ease: phase === 'shuffling' ? 'linear' : 'easeInOut',
                }}
              >
                <CardBack />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Mouse mode: shuffle button */}
      {isMouse && phase === 'idle' && !isTransitioning && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMouseShuffle}
            className="px-8 py-3 rounded-full
                       bg-gradient-to-r from-mysticPurple to-mysticPurple/80
                       border-2 border-goldAura/50
                       text-goldAura font-semibold tracking-widest
                       hover:border-goldAura transition-all duration-300"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {t('shuffleButton')}
          </motion.button>
        </div>
      )}

      {/* Gesture hints (gesture mode only) */}
      {!isMouse && phase !== 'done' && !isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}
          className="absolute bottom-10 left-0 right-0 flex justify-center"
        >
          <div className="flex items-center gap-8">
          <div className={`flex items-center gap-1.5 transition-opacity duration-500 ${isCircling ? 'opacity-100' : 'opacity-30'}`}>
            <span className="text-goldAura/50 text-base">↻</span>
            <span className="text-goldAura/30 text-xs tracking-widest">
              {t('gestureCircleHint')}
            </span>
          </div>
          <div className="text-goldAura/15 text-xs">|</div>
          <div className={`flex items-center gap-1.5 transition-opacity duration-500 ${isStationary && hasMetMinimumShuffle ? 'opacity-100' : 'opacity-30'}`}>
            <span className="text-goldAura/50 text-base">⊙</span>
            <span className="text-goldAura/30 text-xs tracking-widest">
              {t('gestureStationaryHint')}
            </span>
          </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
