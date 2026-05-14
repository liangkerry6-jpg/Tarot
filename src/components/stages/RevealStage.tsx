import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { SelectedCard } from '../../hooks/useGameState';
import type { Intention, ContextualSummaries, ContextualSummaryEn } from '../../data/contextualSummaries';
import { contextualSummaries } from '../../data/contextualSummaries';

interface RevealStageProps {
  selectedCards: SelectedCard[];
  intention: Intention | null;
  onRestart: () => void;
}

const INTENTION_LABELS: Record<Intention, string> = {
  love: 'intentionLove',
  career: 'intentionCareer',
  study: 'intentionStudy',
  social: 'intentionSocial',
  general: 'intentionGeneral',
};

export function RevealStage({ selectedCards, intention, onRestart }: RevealStageProps) {
  const { t, i18n } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  const [expandedCardData, setExpandedCardData] = useState<SelectedCard | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceLeaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isZh = i18n.language === 'zh';
  const positionLabels = [t('positionPast'), t('positionPresent'), t('positionFuture')];

  useEffect(() => {
    setRevealedCards([]);
    selectedCards.forEach((_, index) => {
      setTimeout(() => {
        setRevealedCards(prev => prev.includes(index) ? prev : [...prev, index]);
      }, 400 + index * 700);
    });
  }, [selectedCards]);

  const getContextualSummary = (sc: SelectedCard): string | null => {
    if (!intention) return null;
    const summaries = contextualSummaries[sc.card.id];
    if (!summaries) return null;
    const side = sc.isReversed ? summaries.reversed : summaries.upright;
    if (isZh) {
      return (side as ContextualSummaries['upright'])[intention] || null;
    }
    const enKey = (intention + '_en') as keyof ContextualSummaryEn;
    return (side as ContextualSummaryEn)[enKey] || null;
  };

  const getFullReading = (sc: SelectedCard) => {
    if (sc.isReversed) {
      return isZh ? sc.card.meaning_reversed_cn : sc.card.meaning_reversed_en;
    }
    return isZh ? sc.card.meaning_upright_cn : sc.card.meaning_upright_en;
  };

  const getCardName = (sc: SelectedCard) => {
    return isZh ? sc.card.name_cn : sc.card.name_en;
  };

  const handleCardEnter = useCallback((sc: SelectedCard, instant = false) => {
    if (debounceLeaveRef.current) {
      clearTimeout(debounceLeaveRef.current);
      debounceLeaveRef.current = null;
    }
    if (instant) {
      if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
      setExpandedCardId(sc.card.id);
      setExpandedCardData(sc);
      return;
    }
    if (!hoverTimerRef.current) {
      hoverTimerRef.current = setTimeout(() => {
        setExpandedCardId(sc.card.id);
        setExpandedCardData(sc);
      }, 500);
    }
  }, []);

  const handleCardLeave = useCallback(() => {
    debounceLeaveRef.current = setTimeout(() => {
      if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
      debounceLeaveRef.current = null;
    }, 300);
  }, []);

  const handleExport = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#0b0c10',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement('a');
      link.download = 'arcana_veil_reading.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen px-4 py-8 pb-32">
      {/* Title */}
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-2xl md:text-3xl font-bold text-goldAura text-center mb-2 tracking-wider"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {t('revealTitle')}
      </motion.h2>

      {/* Intention badge */}
      {intention && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-goldAura/50 text-sm text-center mb-6 tracking-wider"
          style={{ fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}
        >
          {t(INTENTION_LABELS[intention])}
        </motion.p>
      )}

      {/* Hover hint */}
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="text-goldAura/60 text-sm md:text-base text-center mb-4 tracking-widest"
      >
        {isZh ? '点击上方牌面，洞悉原始牌意...' : 'Click a card above to reveal its primal meaning...'}
      </motion.p>

      {/* Exportable area */}
      <div ref={exportRef} className="flex flex-col items-center gap-8 p-6 md:p-8 rounded-2xl bg-darkSpace/50 max-w-5xl mx-auto">
        {/* Three cards row — stacks vertically on mobile */}
        <div className="flex flex-col md:flex-row flex-wrap items-center md:justify-center gap-4 md:gap-10 mb-6">
          {selectedCards.map((sc, index) => {
            const isRevealed = revealedCards.includes(index);
            const isExpanded = expandedCardId === sc.card.id;

            return (
              <motion.div
                key={sc.card.id}
                layoutId={`card-${sc.card.id}`}
                className="flex flex-col items-center"
                style={{ touchAction: 'manipulation' }}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                onMouseEnter={() => handleCardEnter(sc)}
                onMouseLeave={handleCardLeave}
                onClick={() => handleCardEnter(sc, true)}
              >
                <span className="text-goldAura/60 text-xs md:text-sm mb-2 md:mb-3 tracking-widest">
                  {positionLabels[index]}
                </span>

                <motion.div
                  layoutId={`card-inner-${sc.card.id}`}
                  className="perspective-[1200px]"
                  animate={{
                    rotateY: isRevealed ? 0 : 180,
                    scale: isExpanded ? 1.25 : 1,
                    z: isExpanded ? 50 : 0,
                  }}
                  transition={{ duration: 0.4 }}
                >
                  <div
                    className="relative w-32 h-44 md:w-40 md:h-56"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Card back */}
                    <div
                      className="absolute inset-0 rounded-xl border-2 border-goldAura/30
                                 bg-gradient-to-br from-[#1a1035] via-[#120c24] to-[#0a0815]
                                 flex items-center justify-center"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 opacity-60">
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
                        <path d="M50 38 A12 12 0 1 0 50 62 A9 9 0 1 1 50 38Z"
                          fill="#D4AF37" opacity="0.45" />
                        <circle cx="50" cy="50" r="2.5" fill="#D4AF37" opacity="0.6" />
                      </svg>
                    </div>

                    {/* Card front */}
                    <div
                      className="absolute inset-0 rounded-xl border-2 border-goldAura/50
                                 overflow-hidden shadow-lg shadow-goldAura/10"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <img
                        src={sc.card.image_url}
                        alt={sc.card.name_en}
                        className={`absolute inset-0 w-full h-full object-cover object-top ${sc.isReversed ? 'rotate-180' : ''}`}
                        crossOrigin="anonymous"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 text-center
                                      bg-black/30 backdrop-blur-md bg-gradient-to-t from-black/60 to-transparent">
                        <h3 className="text-goldAura font-bold tracking-wider text-xs md:text-sm drop-shadow-lg"
                            style={{ fontFamily: "'Cinzel', serif" }}>
                          {getCardName(sc)}
                        </h3>
                        <span className={`text-[10px] tracking-wider drop-shadow-lg ${
                          sc.isReversed ? 'text-red-300/80' : 'text-goldAura/70'
                        }`}>
                          {sc.isReversed ? t('reversed') : t('upright')}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Readings section */}
        <div className="flex flex-col gap-4 w-full">
          {selectedCards.map((sc, index) => {
            const isRevealed = revealedCards.includes(index);
            if (!isRevealed) return null;
            const summary = getContextualSummary(sc) || getFullReading(sc);

            return (
              <motion.div
                key={`reading-${sc.card.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + index * 0.3 }}
                className="p-3 md:p-6 rounded-xl bg-mysticPurple/30 border border-goldAura/20 backdrop-blur-sm"
              >
                <h4 className="text-goldAura font-semibold mb-2 md:mb-3 tracking-wider text-xs md:text-base"
                    style={{ fontFamily: "'Cinzel', serif" }}>
                  <span className="text-goldAura/60">{positionLabels[index]}</span>
                  <span className="mx-2 text-goldAura/30">—</span>
                  <span>{getCardName(sc)}</span>
                  <span className={`ml-2 text-xs ${
                    sc.isReversed ? 'text-red-400/60' : 'text-goldAura/50'
                  }`}>
                    ({sc.isReversed ? t('reversed') : t('upright')})
                  </span>
                </h4>

                {summary && (
                  <p className="text-goldAura/90 text-xs md:text-base leading-relaxed px-2 md:px-3 py-2 rounded-lg
                                bg-goldAura/5 border-l-2 border-goldAura/30">
                    {summary}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Expanded card overlay */}
      <AnimatePresence>
        {expandedCardData && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-darkSpace/85 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCardLeave}
          >
            <motion.div
              layoutId={`card-inner-${expandedCardData.card.id}`}
              className="relative w-full max-w-xs md:max-w-md rounded-xl border-2 border-goldAura/60
                         bg-gradient-to-br from-mysticPurple to-darkSpace
                         overflow-hidden shadow-2xl shadow-goldAura/20"
              onClick={(e) => e.stopPropagation()}
              onMouseLeave={handleCardLeave}
            >
              {/* Image */}
              <div className="relative w-full aspect-[3/4] max-h-[30vh] md:max-h-[30vh] overflow-hidden">
                <img
                  src={expandedCardData.card.image_url}
                  alt={expandedCardData.card.name_en}
                  className={`w-full h-full object-contain ${expandedCardData.isReversed ? 'rotate-180' : ''}`}
                  crossOrigin="anonymous"
                />
                {/* Orientation badge */}
                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs tracking-wider ${
                  expandedCardData.isReversed
                    ? 'bg-red-900/60 text-red-300 border border-red-500/30'
                    : 'bg-goldAura/20 text-goldAura border border-goldAura/30'
                }`}>
                  {expandedCardData.isReversed ? t('reversed') : t('upright')}
                </div>
                {/* Close button */}
                <button
                  onClick={() => { setExpandedCardId(null); setExpandedCardData(null); }}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full
                             bg-darkSpace/70 border border-goldAura/30
                             text-goldAura/70 hover:text-goldAura hover:border-goldAura/60
                             flex items-center justify-center
                             transition-colors duration-200 z-10"
                  aria-label="Close"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="3" y1="3" x2="11" y2="11" />
                    <line x1="11" y1="3" x2="3" y2="11" />
                  </svg>
                </button>
              </div>

              {/* Scrollable text area */}
              <div
                ref={scrollRef}
                className="p-4 md:p-5 max-h-[50vh] md:max-h-[55vh] overflow-y-auto pb-6 md:pb-8"
              >
                <h3 className="text-goldAura text-lg font-bold tracking-wider mb-1 sticky top-0 bg-gradient-to-b from-mysticPurple to-transparent pt-1 -mt-1 pb-2"
                    style={{ fontFamily: "'Cinzel', serif" }}>
                  {getCardName(expandedCardData)}
                </h3>

                <p className="text-goldAura/70 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                  {getFullReading(expandedCardData)}
                </p>
                <div className="h-4" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 flex justify-center gap-4 md:gap-6 p-4 md:p-6
                   bg-gradient-to-t from-darkSpace via-darkSpace/90 to-transparent pt-12 z-40"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRestart}
          className="flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 rounded-full
                     bg-mysticPurple/50 border-2 border-goldAura/30
                     text-goldAura hover:border-goldAura/60
                     transition-colors duration-300 text-sm md:text-base"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <RotateCcw className="w-4 h-4" />
          {t('restart')}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 rounded-full
                     bg-gradient-to-r from-goldAura/20 to-goldAura/10
                     border-2 border-goldAura/50
                     text-goldAura hover:border-goldAura
                     transition-colors duration-300
                     disabled:opacity-50 text-sm md:text-base"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <Download className="w-4 h-4" />
          {isExporting ? t('exporting') : t('export')}
        </motion.button>
      </motion.div>
    </div>
  );
}
