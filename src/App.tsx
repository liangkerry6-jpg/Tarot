import { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { TopBar } from './components/TopBar';
import { BackgroundFog } from './components/BackgroundFog';
import { AuthStage } from './components/stages/AuthStage';
import { IntentionStage } from './components/stages/IntentionStage';
import { ShuffleStage } from './components/stages/ShuffleStage';
import { DrawStage } from './components/stages/DrawStage';
import { RevealStage } from './components/stages/RevealStage';

import { TarotCard } from './data/tarotData';
import type { Intention } from './data/contextualSummaries';
import { useGameState } from './hooks/useGameState';

function App() {
  const {
    stage, intention, selectedCards, availableCards,
    goToIntention, setIntention, finishShuffle, selectCard, restart,
  } = useGameState();

  const handleAuthSuccess = useCallback(() => {
    goToIntention();
  }, [goToIntention]);

  const handleSelectIntention = useCallback((intent: Intention) => {
    setIntention(intent);
  }, [setIntention]);

  const handleShuffleComplete = useCallback(() => {
    finishShuffle();
  }, [finishShuffle]);

  const handleSelectCard = useCallback((card: TarotCard) => {
    selectCard(card);
  }, [selectCard]);

  const handleRestart = useCallback(() => {
    restart();
  }, [restart]);

  return (
    <div className="relative w-full h-full bg-darkSpace overflow-y-auto">
      <BackgroundFog />
      <TopBar />

      <main className="relative z-10 w-full h-full">
        <AnimatePresence mode="wait">
          {stage === 'auth' && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <AuthStage onAuthSuccess={handleAuthSuccess} />
            </motion.div>
          )}

          {stage === 'intention' && (
            <motion.div key="intention" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <IntentionStage onSelectIntention={handleSelectIntention} />
            </motion.div>
          )}

          {stage === 'shuffling' && (
            <motion.div key="shuffling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <ShuffleStage onShuffleComplete={handleShuffleComplete} />
            </motion.div>
          )}

          {stage === 'drawing' && (
            <motion.div key="drawing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <DrawStage
                availableCards={availableCards}
                selectedCards={selectedCards}
                onSelectCard={handleSelectCard}
              />
            </motion.div>
          )}

          {(stage === 'revealing' || stage === 'done') && (
            <motion.div key="revealing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <RevealStage
                selectedCards={selectedCards}
                intention={intention}
                onRestart={handleRestart}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
