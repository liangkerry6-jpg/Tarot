import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { TopBar } from './components/TopBar';
import { CursorOverlay } from './components/CursorOverlay';
import { BackgroundFog } from './components/BackgroundFog';
import { AuthStage } from './components/stages/AuthStage';
import { IntentionStage } from './components/stages/IntentionStage';
import { ShuffleStage } from './components/stages/ShuffleStage';
import { DrawStage } from './components/stages/DrawStage';
import { RevealStage } from './components/stages/RevealStage';

import { TarotCard } from './data/tarotData';
import type { Intention } from './data/contextualSummaries';
import { useHandTracking } from './hooks/useHandTracking';
import { useGameState } from './hooks/useGameState';

export type InteractionMode = 'mouse' | 'gesture';

function App() {
  const {
    stage, intention, selectedCards, availableCards,
    goToIntention, setIntention, finishShuffle, selectCard, restart, setError, error,
  } = useGameState();

  const [interactionMode, setInteractionMode] = useState<InteractionMode>('mouse');
  const {
    screenX, screenY,
    isPointing, isCircling, circleDirection,
    isStationary, stationaryDuration,
    gesturePhase,
    isTrackingLost, isHandDetected,
    isLoading: isTrackingLoading,
    error: trackingError,
    cameraStatus,
  } = useHandTracking(interactionMode);

  const [hoverProgress, setHoverProgress] = useState(0);

  // ---- cursor-none on body in gesture mode ----
  useEffect(() => {
    if (interactionMode === 'gesture') {
      document.body.classList.add('cursor-none');
    } else {
      document.body.classList.remove('cursor-none');
    }
    return () => document.body.classList.remove('cursor-none');
  }, [interactionMode]);

  // ---- Mode toggle ----
  const handleToggleMode = useCallback(() => {
    setInteractionMode(prev => prev === 'mouse' ? 'gesture' : 'mouse');
    setHoverProgress(0);
  }, []);

  // ---- Auth ----
  const handleAuthSuccess = useCallback(() => {
    goToIntention();
  }, [goToIntention]);

  // ---- Intention ----
  const handleSelectIntention = useCallback((intent: Intention) => {
    setIntention(intent);
  }, [setIntention]);

  // ---- Shuffle complete ----
  const handleShuffleComplete = useCallback(() => {
    finishShuffle();
  }, [finishShuffle]);

  // ---- Card selection ----
  const handleSelectCard = useCallback((card: TarotCard) => {
    selectCard(card);
  }, [selectCard]);

  // ---- Restart ----
  const handleRestart = useCallback(() => {
    setHoverProgress(0);
    restart();
  }, [restart]);

  // Sync tracking errors
  useEffect(() => {
    if (trackingError) setError(trackingError);
  }, [trackingError, setError]);

  const isGesture = interactionMode === 'gesture';

  return (
    <div className={`relative w-full h-full bg-darkSpace ${stage === 'revealing' || stage === 'done' || stage === 'intention' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      <BackgroundFog />
      <TopBar
        interactionMode={interactionMode}
        onToggleMode={handleToggleMode}
      />

      <main className="relative z-10 w-full h-full">
        <AnimatePresence mode="wait">
          {stage === 'auth' && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <AuthStage
                onAuthSuccess={handleAuthSuccess}
                isLoading={isGesture ? isTrackingLoading : false}
                error={isGesture ? error : null}
                interactionMode={interactionMode}
                cursorX={screenX}
                cursorY={screenY}
                isHandDetected={isHandDetected}
              />
            </motion.div>
          )}

          {stage === 'intention' && (
            <motion.div key="intention" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <IntentionStage
                onSelectIntention={handleSelectIntention}
                cursorX={screenX}
                cursorY={screenY}
                isHandDetected={isHandDetected}
                interactionMode={interactionMode}
              />
            </motion.div>
          )}

          {stage === 'shuffling' && (
            <motion.div key="shuffling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <ShuffleStage
                isPointing={isPointing}
                isCircling={isCircling}
                circleDirection={circleDirection}
                isStationary={isStationary}
                stationaryDuration={stationaryDuration}
                onShuffleComplete={handleShuffleComplete}
                interactionMode={interactionMode}
              />
            </motion.div>
          )}

          {stage === 'drawing' && (
            <motion.div key="drawing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <DrawStage
                availableCards={availableCards}
                selectedCards={selectedCards}
                cursorX={screenX}
                cursorY={screenY}
                isHandDetected={isHandDetected}
                onSelectCard={handleSelectCard}
                onHoverProgress={setHoverProgress}
                interactionMode={interactionMode}
              />
            </motion.div>
          )}

          {(stage === 'revealing' || stage === 'done') && (
            <motion.div key="revealing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <RevealStage
                selectedCards={selectedCards}
                intention={intention}
                onRestart={handleRestart}
                interactionMode={interactionMode}
                cursorX={screenX}
                cursorY={screenY}
                isHandDetected={isHandDetected}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Golden cursor — gesture mode only */}
      {isGesture && (
        <CursorOverlay
          x={screenX}
          y={screenY}
          isVisible={cameraStatus === 'active' && isHandDetected}
          isTrackingLost={isTrackingLost}
          gesturePhase={gesturePhase}
          hoverProgress={hoverProgress}
        />
      )}
    </div>
  );
}

export default App;
