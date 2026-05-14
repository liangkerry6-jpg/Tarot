import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Languages, MousePointer2, Hand } from 'lucide-react';
import type { InteractionMode } from '../App';

interface TopBarProps {
  interactionMode: InteractionMode;
  onToggleMode: () => void;
}

export function TopBar({ interactionMode, onToggleMode }: TopBarProps) {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* App Title */}
        <div className="flex flex-col">
          <motion.h1
            className="text-2xl md:text-3xl font-bold text-goldAura tracking-wider"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {t('appTitle')}
          </motion.h1>
          <motion.p
            className="text-sm text-goldAura/60 tracking-widest"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {t('appSubtitle')}
          </motion.p>
        </div>

        {/* Right-side controls */}
        <div className="flex items-center gap-3">
          {/* Interaction Mode Toggle */}
          <div className="relative flex flex-col items-center">
            <motion.button
              onClick={onToggleMode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full
                         bg-mysticPurple/50 border border-goldAura/30
                         text-goldAura hover:border-goldAura/60
                         transition-colors duration-300 backdrop-blur-sm"
              title={interactionMode === 'mouse' ? '切换到手势模式' : 'Switch to Mouse Mode'}
            >
              {interactionMode === 'mouse' ? (
                <MousePointer2 className="w-3.5 h-3.5" />
              ) : (
                <Hand className="w-3.5 h-3.5" />
              )}
              <span className="text-xs font-medium tracking-wider">
                {interactionMode === 'mouse' ? t('modeMouse') : t('modeGesture')}
              </span>
            </motion.button>
          </div>

          {/* Language Toggle */}
          <motion.button
            onClick={toggleLanguage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full
                       bg-mysticPurple/50 border border-goldAura/30
                       text-goldAura hover:border-goldAura/60
                       transition-colors duration-300 backdrop-blur-sm"
          >
            <Languages className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wider">
              {i18n.language === 'en' ? 'EN' : '中文'}
            </span>
            <span className="text-goldAura/40">/</span>
            <span className="text-sm text-goldAura/50">
              {i18n.language === 'en' ? '中文' : 'EN'}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
