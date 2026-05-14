import { useCallback, useReducer } from 'react';
import { TarotCard, tarotCards, shuffleArray } from '../data/tarotData';
import type { Intention } from '../data/contextualSummaries';

// Game stages
export type GameStage = 'auth' | 'intention' | 'shuffling' | 'drawing' | 'revealing' | 'done';

export interface SelectedCard {
  card: TarotCard;
  isReversed: boolean;
}

// Game state interface
export interface GameState {
  stage: GameStage;
  intention: Intention | null;
  selectedCards: SelectedCard[];
  availableCards: TarotCard[];
  hoveredCardIndex: number | null;
  shuffleProgress: number;
  revealProgress: number;
  error: string | null;
}

// Action types
type GameAction =
  | { type: 'GO_TO_INTENTION' }
  | { type: 'SET_INTENTION'; intention: Intention }
  | { type: 'START_SHUFFLE' }
  | { type: 'UPDATE_SHUFFLE_PROGRESS'; progress: number }
  | { type: 'FINISH_SHUFFLE'; cards: TarotCard[] }
  | { type: 'SELECT_CARD'; card: TarotCard }
  | { type: 'SET_HOVERED_CARD'; index: number | null }
  | { type: 'START_REVEAL' }
  | { type: 'UPDATE_REVEAL_PROGRESS'; progress: number }
  | { type: 'FINISH_GAME' }
  | { type: 'RESTART' }
  | { type: 'SET_ERROR'; error: string | null };

// Initial state
const initialState: GameState = {
  stage: 'auth',
  intention: null,
  selectedCards: [],
  availableCards: [],
  hoveredCardIndex: null,
  shuffleProgress: 0,
  revealProgress: 0,
  error: null,
};

// Reducer function
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'GO_TO_INTENTION':
      return {
        ...state,
        stage: 'intention',
        error: null,
      };

    case 'SET_INTENTION':
      return {
        ...state,
        intention: action.intention,
        stage: 'shuffling',
      };

    case 'START_SHUFFLE':
      return {
        ...state,
        stage: 'shuffling',
        shuffleProgress: 0,
        error: null,
      };

    case 'UPDATE_SHUFFLE_PROGRESS':
      return {
        ...state,
        shuffleProgress: action.progress,
      };

    case 'FINISH_SHUFFLE':
      return {
        ...state,
        stage: 'drawing',
        availableCards: action.cards,
        shuffleProgress: 100,
      };

    case 'SELECT_CARD':
      if (state.selectedCards.length >= 3) return state;
      if (state.selectedCards.some(sc => sc.card.id === action.card.id)) return state;

      const isReversed = Math.random() > 0.5;
      const newSelected = [...state.selectedCards, { card: action.card, isReversed }];
      const newAvailable = state.availableCards.filter(c => c.id !== action.card.id);

      return {
        ...state,
        selectedCards: newSelected,
        availableCards: newAvailable,
        hoveredCardIndex: null,
        stage: newSelected.length === 3 ? 'revealing' : 'drawing',
      };

    case 'SET_HOVERED_CARD':
      return {
        ...state,
        hoveredCardIndex: action.index,
      };

    case 'START_REVEAL':
      return {
        ...state,
        stage: 'revealing',
        revealProgress: 0,
      };

    case 'UPDATE_REVEAL_PROGRESS':
      return {
        ...state,
        revealProgress: action.progress,
      };

    case 'FINISH_GAME':
      return {
        ...state,
        stage: 'done',
        revealProgress: 100,
      };

    case 'RESTART':
      return {
        ...initialState,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
      };

    default:
      return state;
  }
}

/**
 * Custom hook for managing game state
 */
export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const goToIntention = useCallback(() => {
    dispatch({ type: 'GO_TO_INTENTION' });
  }, []);

  const setIntention = useCallback((intention: Intention) => {
    dispatch({ type: 'SET_INTENTION', intention });
  }, []);

  const startShuffle = useCallback(() => {
    dispatch({ type: 'START_SHUFFLE' });
  }, []);

  const updateShuffleProgress = useCallback((progress: number) => {
    dispatch({ type: 'UPDATE_SHUFFLE_PROGRESS', progress });
  }, []);

  const finishShuffle = useCallback(() => {
    const shuffled = shuffleArray([...tarotCards]);
    dispatch({ type: 'FINISH_SHUFFLE', cards: shuffled });
  }, []);

  const selectCard = useCallback((card: TarotCard) => {
    dispatch({ type: 'SELECT_CARD', card });
  }, []);

  const setHoveredCard = useCallback((index: number | null) => {
    dispatch({ type: 'SET_HOVERED_CARD', index });
  }, []);

  const startReveal = useCallback(() => {
    dispatch({ type: 'START_REVEAL' });
  }, []);

  const updateRevealProgress = useCallback((progress: number) => {
    dispatch({ type: 'UPDATE_REVEAL_PROGRESS', progress });
  }, []);

  const finishGame = useCallback(() => {
    dispatch({ type: 'FINISH_GAME' });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: 'RESTART' });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  }, []);

  return {
    ...state,
    goToIntention,
    setIntention,
    startShuffle,
    updateShuffleProgress,
    finishShuffle,
    selectCard,
    setHoveredCard,
    startReveal,
    updateRevealProgress,
    finishGame,
    restart,
    setError,
  };
}
