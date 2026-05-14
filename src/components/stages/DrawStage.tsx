import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { TarotCard } from '../../data/tarotData';

interface DrawStageProps {
  availableCards: TarotCard[];
  selectedCards: { card: TarotCard; isReversed: boolean }[];
  onSelectCard: (card: TarotCard) => void;
}

function useResponsiveLayout() {
  const [layout, setLayout] = useState({
    cardsPerRow: 20,
    rows: 4,
    cardW: 56,
    cardH: 74,
    rowH: 78,
    yOffset: -110,
  });

  useEffect(() => {
    const update = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setLayout({ cardsPerRow: 6, rows: 13, cardW: 44, cardH: 58, rowH: 62, yOffset: 0 });
      } else {
        setLayout({ cardsPerRow: 20, rows: 4, cardW: 56, cardH: 74, rowH: 78, yOffset: -110 });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return layout;
}

export function DrawStage({
  availableCards, selectedCards,
  onSelectCard,
}: DrawStageProps) {
  const { t } = useTranslation();
  const { cardsPerRow, rows, cardW, cardH, rowH, yOffset } = useResponsiveLayout();

  const positionLabels = [t('positionPast'), t('positionPresent'), t('positionFuture')];

  const selectedIds = new Set(selectedCards.map(sc => sc.card.id));

  const handleClick = useCallback((card: TarotCard) => {
    onSelectCard(card);
  }, [onSelectCard]);

  const getRowLayout = (index: number) => {
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;
    const totalInRow = cardsPerRow;
    const gap = 3;
    const rowWidth = totalInRow * (cardW + gap);
    const startX = -rowWidth / 2;
    return {
      x: startX + col * (cardW + gap),
      y: row * rowH + yOffset,
      zIndex: row * 100 + col,
    };
  };

  const gridHeight = rows * rowH + Math.abs(yOffset) + cardH;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-2 md:px-4 py-2 md:py-4">
      <motion.h2
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="text-lg md:text-2xl font-bold text-goldAura text-center mb-1 tracking-wider"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {t('drawTitle')}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="text-goldAura/60 text-center mb-2 md:mb-3 text-xs md:text-sm"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {t('drawProgress', { count: selectedCards.length })}
      </motion.p>

      {/* Selection slots */}
      <div className="flex gap-3 md:gap-10 mb-4 md:mb-6 pointer-events-none">
        {[0, 1, 2].map((slotIndex) => (
          <motion.div
            key={slotIndex}
            className="relative w-20 h-28 md:w-32 md:h-48 rounded-lg border-2 border-dashed border-goldAura/30
                       flex flex-col items-center justify-center bg-mysticPurple/20 pointer-events-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 + slotIndex * 0.1 }}
          >
            <span className="absolute bottom-2 md:bottom-3 left-0 right-0 text-center text-goldAura/40 text-[10px] md:text-[11px] font-bold tracking-widest z-0 pointer-events-none">
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
      <div
        className="relative w-full max-w-[1400px] flex items-center justify-center overflow-visible"
        style={{ height: gridHeight }}
      >
        <AnimatePresence>
          {availableCards.slice(0, rows * cardsPerRow).map((card, index) => {
            if (selectedIds.has(card.id)) return null;
            const layout = getRowLayout(index);

            return (
              <motion.div
                key={card.id}
                data-card-id={card.id}
                className="absolute rounded-md cursor-pointer"
                style={{
                  width: cardW,
                  height: cardH,
                  touchAction: 'manipulation',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  x: layout.x,
                  y: layout.y,
                  scale: 1,
                  opacity: 1,
                  zIndex: layout.zIndex,
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.4 }}
                onClick={() => handleClick(card)}
              >
                <div className="relative w-full h-full rounded-md border overflow-hidden
                             bg-gradient-to-br from-mysticPurple to-darkSpace
                             border-goldAura/20 hover:border-goldAura/60 hover:scale-110 transition-transform">
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
        className="text-goldAura/40 text-[10px] md:text-xs text-center mt-2 md:mt-4"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {t('drawInstructionMouse')}
      </motion.p>
    </div>
  );
}
