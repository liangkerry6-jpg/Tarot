import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { TarotCard } from '../../data/tarotData';
import type { InteractionMode } from '../../App';

interface DrawStageProps {
  availableCards: TarotCard[];
  selectedCards: { card: TarotCard; isReversed: boolean }[];
  cursorX: number;
  cursorY: number;
  isHandDetected: boolean;
  onSelectCard: (card: TarotCard) => void;
  onHoverProgress?: (progress: number) => void;
  interactionMode: InteractionMode;
}

const HOVER_DURATION = 500;
const SCALE_TARGET = 1.5;
const EXIT_DEBOUNCE = 500;
const ROWS = 4;
const CARDS_PER_ROW = 20;

export function DrawStage({
  availableCards, selectedCards, cursorX, cursorY,
  isHandDetected,
  onSelectCard, onHoverProgress,
  interactionMode,
}: DrawStageProps) {
  const { t } = useTranslation();
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);
  const hoverStartTimeRef = useRef<number | null>(null);
  const exitTimeRef = useRef<number | null>(null);
  const savedProgressRef = useRef<number>(0);

  const positionLabels = [t('positionPast'), t('positionPresent'), t('positionFuture')];

  const isGesture = interactionMode === 'gesture';
  const selectedIds = new Set(selectedCards.map(sc => sc.card.id));
  const displayCards = availableCards.filter(c => !selectedIds.has(c.id)).slice(0, ROWS * CARDS_PER_ROW);

  // Mouse mode: click handler
  const handleMouseClick = useCallback((card: TarotCard) => {
    if (!isGesture) {
      onSelectCard(card);
    }
  }, [isGesture, onSelectCard]);

  // Gesture mode: elementFromPoint collision with debounced exit
  const checkCollision = useCallback(() => {
    if (!isGesture || !isHandDetected) {
      setHoveredCardId(null); hoverStartTimeRef.current = null;
      exitTimeRef.current = null;
      savedProgressRef.current = 0;
      onHoverProgress?.(0);
      return;
    }

    const el = document.elementFromPoint(cursorX, cursorY);
    let cardId: number | null = null;

    if (el) {
      let target: Element | null = el;
      while (target && !target.hasAttribute('data-card-id')) {
        target = target.parentElement;
      }
      if (target) {
        cardId = parseInt(target.getAttribute('data-card-id')!, 10);
      }
    }

    if (cardId !== null && !selectedIds.has(cardId)) {
      // Clear exit debounce
      if (exitTimeRef.current !== null) {
        const timeSinceExit = Date.now() - exitTimeRef.current;
        if (timeSinceExit < EXIT_DEBOUNCE) {
          hoverStartTimeRef.current = Date.now() - savedProgressRef.current * HOVER_DURATION;
        }
        exitTimeRef.current = null;
      }

      if (hoveredCardId !== cardId) {
        setHoveredCardId(cardId);
        hoverStartTimeRef.current = Date.now();
        savedProgressRef.current = 0;
        onHoverProgress?.(0);
      } else {
        const elapsed = Date.now() - (hoverStartTimeRef.current || 0);
        const progress = Math.min(elapsed / HOVER_DURATION, 1);
        savedProgressRef.current = progress;
        onHoverProgress?.(progress);

        if (progress >= 1) {
          const card = displayCards.find(c => c.id === cardId);
          if (card) onSelectCard(card);
          setHoveredCardId(null);
          hoverStartTimeRef.current = null;
          exitTimeRef.current = null;
          savedProgressRef.current = 0;
          onHoverProgress?.(0);
        }
      }
    } else {
      // No valid card — exit debounce
      if (hoveredCardId !== null) {
        if (exitTimeRef.current === null) {
          exitTimeRef.current = Date.now();
        } else if (Date.now() - exitTimeRef.current >= EXIT_DEBOUNCE) {
          setHoveredCardId(null);
          hoverStartTimeRef.current = null;
          exitTimeRef.current = null;
          savedProgressRef.current = 0;
          onHoverProgress?.(0);
        }
      }
    }
  }, [cursorX, cursorY, isHandDetected, displayCards, selectedIds, hoveredCardId, onSelectCard, onHoverProgress, isGesture]);

  useEffect(() => {
    if (!isGesture) return;
    const interval = setInterval(checkCollision, 16);
    return () => clearInterval(interval);
  }, [checkCollision, isGesture]);

  const getRowLayout = (index: number) => {
    const row = Math.floor(index / CARDS_PER_ROW);
    const col = index % CARDS_PER_ROW;
    const totalInRow = Math.min(CARDS_PER_ROW, displayCards.length - row * CARDS_PER_ROW);
    const cardW = 56;
    const gap = 3;
    const rowWidth = totalInRow * (cardW + gap);
    const startX = -rowWidth / 2;
    return {
      x: startX + col * (cardW + gap),
      y: row * 78 - 110,
      zIndex: row * 100 + col,
    };
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-4">
      <motion.h2
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="text-xl md:text-2xl font-bold text-goldAura text-center mb-1 tracking-wider"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {t('drawTitle')}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="text-goldAura/60 text-center mb-3 text-sm"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {t('drawProgress', { count: selectedCards.length })}
      </motion.p>

      {/* Selection slots */}
      <div className="flex gap-6 md:gap-10 mb-6 pointer-events-none">
        {[0, 1, 2].map((slotIndex) => (
          <motion.div
            key={slotIndex}
            className="relative w-28 h-40 md:w-32 md:h-48 rounded-lg border-2 border-dashed border-goldAura/30
                       flex flex-col items-center justify-center bg-mysticPurple/20 pointer-events-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 + slotIndex * 0.1 }}
          >
            {/* Position label — watermark at bottom of slot */}
            <span className="absolute bottom-3 left-0 right-0 text-center text-goldAura/40 text-[11px] font-bold tracking-widest z-0 pointer-events-none">
              {positionLabels[slotIndex]}
            </span>
            {selectedCards[slotIndex] ? (
              <motion.div
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                className="w-full h-full rounded-lg border-2 border-goldAura/50
                           bg-gradient-to-br from-mysticPurple to-darkSpace
                           flex flex-col items-center justify-center overflow-hidden relative z-10"
              >
                <div className="absolute inset-1 rounded border border-[#D4AF37]/30" />
                <div className="absolute inset-2 rounded border border-[#D4AF37]/10" />
                <svg viewBox="0 0 100 100" className="w-3/5 h-3/5 opacity-60">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i * 30 * Math.PI) / 180;
                    const x1 = 50 + Math.cos(angle) * 22;
                    const y1 = 50 + Math.sin(angle) * 22;
                    const x2 = 50 + Math.cos(angle) * 30;
                    const y2 = 50 + Math.sin(angle) * 30;
                    return (
                      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="#D4AF37" strokeWidth="1" opacity="0.4" />
                    );
                  })}
                  <circle cx="50" cy="50" r="18" fill="none" stroke="#D4AF37" strokeWidth="1.2" opacity="0.5" />
                  <circle cx="50" cy="50" r="12" fill="none" stroke="#D4AF37" strokeWidth="0.6" opacity="0.3" />
                  <path d="M50 38 A12 12 0 1 0 50 62 A9 9 0 1 1 50 38Z" fill="#D4AF37" opacity="0.45" />
                  <circle cx="50" cy="50" r="2.5" fill="#D4AF37" opacity="0.6" />
                  {[[50,32],[50,68],[32,50],[68,50]].map(([cx,cy], i) => (
                    <circle key={`s${i}`} cx={cx} cy={cy} r="1.2" fill="#D4AF37" opacity="0.35" />
                  ))}
                </svg>
              </motion.div>
            ) : (
              <svg viewBox="0 0 100 100" className="relative z-10 w-2/3 h-2/3 opacity-30">
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30 * Math.PI) / 180;
                  const x1 = 50 + Math.cos(angle) * 22;
                  const y1 = 50 + Math.sin(angle) * 22;
                  const x2 = 50 + Math.cos(angle) * 30;
                  const y2 = 50 + Math.sin(angle) * 30;
                  return (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="#D4AF37" strokeWidth="1" opacity="0.4" />
                  );
                })}
                <circle cx="50" cy="50" r="18" fill="none" stroke="#D4AF37" strokeWidth="1.2" opacity="0.5" />
                <circle cx="50" cy="50" r="12" fill="none" stroke="#D4AF37" strokeWidth="0.6" opacity="0.3" />
                <path d="M50 38 A12 12 0 1 0 50 62 A9 9 0 1 1 50 38Z" fill="#D4AF37" opacity="0.45" />
                <circle cx="50" cy="50" r="2.5" fill="#D4AF37" opacity="0.6" />
              </svg>
            )}
          </motion.div>
        ))}
      </div>

      {/* Cards grid */}
      <div className="relative w-full max-w-[1400px] h-[340px] flex items-center justify-center overflow-hidden">
        <AnimatePresence>
          {displayCards.map((card, index) => {
            const layout = getRowLayout(index);
            const isHovered = hoveredCardId === card.id;

            return (
              <motion.div
                key={card.id}
                ref={(el) => { cardRefs.current[index] = el; }}
                data-card-id={card.id}
                className={`absolute w-[54px] h-[74px] rounded-md ${isGesture ? 'cursor-default' : 'cursor-pointer'}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  x: layout.x,
                  y: layout.y,
                  scale: isHovered ? SCALE_TARGET : 1,
                  opacity: 1,
                  zIndex: isHovered ? 9999 : layout.zIndex,
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ default: { duration: 0.4 }, scale: { duration: HOVER_DURATION / 1000, ease: "circOut" } }}
                onClick={() => handleMouseClick(card)}
              >
                <div className={`relative w-full h-full rounded-md border overflow-hidden
                             bg-gradient-to-br from-mysticPurple to-darkSpace
                             ${isHovered ? 'border-goldAura shadow-lg' : 'border-goldAura/20'}
                             ${!isGesture ? 'hover:border-goldAura/60 hover:scale-110 transition-transform' : ''}`}>
                  {/* Card back miniature — Sun SVG */}
                  <div className="w-full h-full flex items-center justify-center relative">
                    <div className="absolute inset-1 rounded border border-[#D4AF37]/30" />
                    <div className="absolute inset-2 rounded border border-[#D4AF37]/10" />
                    <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 opacity-50">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const angle = (i * 30 * Math.PI) / 180;
                        const x1 = 50 + Math.cos(angle) * 22;
                        const y1 = 50 + Math.sin(angle) * 22;
                        const x2 = 50 + Math.cos(angle) * 30;
                        const y2 = 50 + Math.sin(angle) * 30;
                        return (
                          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke="#D4AF37" strokeWidth="1" opacity="0.4" />
                        );
                      })}
                      <circle cx="50" cy="50" r="18" fill="none" stroke="#D4AF37" strokeWidth="1.2" opacity="0.5" />
                      <circle cx="50" cy="50" r="12" fill="none" stroke="#D4AF37" strokeWidth="0.6" opacity="0.3" />
                      <path d="M50 38 A12 12 0 1 0 50 62 A9 9 0 1 1 50 38Z" fill="#D4AF37" opacity="0.45" />
                      <circle cx="50" cy="50" r="2.5" fill="#D4AF37" opacity="0.6" />
                      {[[50,32],[50,68],[32,50],[68,50]].map(([cx,cy], i) => (
                        <circle key={`s${i}`} cx={cx} cy={cy} r="1.2" fill="#D4AF37" opacity="0.35" />
                      ))}
                    </svg>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="text-goldAura/40 text-xs text-center mt-4"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {isGesture ? t('drawInstruction') : t('drawInstructionMouse')}
      </motion.p>
    </div>
  );
}
