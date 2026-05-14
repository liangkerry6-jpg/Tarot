import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export function TopBar() {
  const { t } = useTranslation();

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-3 md:px-6 py-2 md:py-4"
    >
      <div className="max-w-7xl mx-auto flex justify-start items-center">
        <div className="flex flex-col items-start">
          <motion.h1
            className="text-lg md:text-3xl font-bold text-goldAura tracking-wider"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {t('appTitle')}
          </motion.h1>
          <motion.p
            className="text-xs md:text-sm text-goldAura/60 tracking-widest"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {t('appSubtitle')}
          </motion.p>
        </div>
      </div>
    </motion.header>
  );
}
