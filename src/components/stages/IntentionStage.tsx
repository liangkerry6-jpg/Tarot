import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Heart, Briefcase, GraduationCap, Users, Compass } from 'lucide-react';
import type { Intention } from '../../data/contextualSummaries';

interface IntentionStageProps {
  onSelectIntention: (intention: Intention) => void;
}

const intentions: { key: Intention; icon: typeof Heart; i18nKey: string }[] = [
  { key: 'love', icon: Heart, i18nKey: 'intentionLove' },
  { key: 'career', icon: Briefcase, i18nKey: 'intentionCareer' },
  { key: 'study', icon: GraduationCap, i18nKey: 'intentionStudy' },
  { key: 'social', icon: Users, i18nKey: 'intentionSocial' },
  { key: 'general', icon: Compass, i18nKey: 'intentionGeneral' },
];

export function IntentionStage({ onSelectIntention }: IntentionStageProps) {
  const { t } = useTranslation();

  const handleClick = useCallback((key: Intention) => {
    onSelectIntention(key);
  }, [onSelectIntention]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4">
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-xl md:text-3xl font-bold text-goldAura text-center mb-6 md:mb-10 tracking-wider px-2"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {t('intentionTitle')}
      </motion.h2>

      <div className="flex flex-col gap-4 w-full max-w-md">
        {intentions.map((item, i) => {
          const Icon = item.icon;

          return (
            <motion.button
              key={item.key}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.03, x: 6 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleClick(item.key)}
              className="relative flex items-center gap-4 px-6 py-4 rounded-xl
                         bg-white/5 backdrop-blur-md border border-white/10
                         hover:bg-white/10 hover:border-goldAura/40
                         text-goldAura/80 hover:text-goldAura
                         transition-all duration-300 group overflow-hidden"
            >
              <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full
                              flex items-center justify-center
                              bg-goldAura/10 group-hover:bg-goldAura/20 transition-colors">
                <Icon className="w-5 h-5 text-goldAura/70 group-hover:text-goldAura transition-colors" />
              </div>
              <span className="relative z-10 text-base md:text-lg tracking-wider"
                    style={{ fontFamily: "'Cinzel', 'Noto Serif SC', serif" }}>
                {t(item.i18nKey)}
              </span>
              <span className="ml-auto text-goldAura/20 group-hover:text-goldAura/50 transition-colors text-lg">
                →
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
