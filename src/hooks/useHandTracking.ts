import { useCallback, useEffect, useRef, useState } from 'react';
import type { InteractionMode } from '../App';

type Landmark = { x: number; y: number; z: number };
type Results = {
  multiHandLandmarks?: Landmark[][];
  multiHandedness?: { index: number; score: number; label: string }[];
};

export type GesturePhase = 'idle' | 'pointing' | 'circling' | 'stationary' | 'selecting';
export type CircleDirection = 'clockwise' | 'counterclockwise' | 'none';
export type CameraStatus = 'inactive' | 'active' | 'error';

interface PositionEntry {
  x: number;
  y: number;
  timestamp: number;
}

export interface HandTrackingResult {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  isPointing: boolean;
  isCircling: boolean;
  circleDirection: CircleDirection;
  isStationary: boolean;
  stationaryDuration: number;
  gesturePhase: GesturePhase;
  normalizedVelocity: number;
  isTrackingLost: boolean;
  isHandDetected: boolean;
}

const POSITION_HISTORY_LENGTH = 60;
const CIRCLE_ANALYSIS_FRAMES = 30;
const CIRCLE_ANGLE_THRESHOLD_DEG = 280;
const CENTROID_RADIUS_MIN = 0.025;
const STATIONARY_VELOCITY_THRESHOLD = 0.004;
const STATIONARY_MIN_DURATION_MS = 2000;
const STATIONARY_HISTORY_WINDOW = 15;
const POINTING_HYSTERESIS = 3;

export function useHandTracking(interactionMode: InteractionMode) {
  const [result, setResult] = useState<HandTrackingResult>({
    x: 0.5, y: 0.5,
    screenX: window.innerWidth / 2,
    screenY: window.innerHeight / 2,
    isPointing: false,
    isCircling: false,
    circleDirection: 'none',
    isStationary: false,
    stationaryDuration: 0,
    gesturePhase: 'idle',
    normalizedVelocity: 0,
    isTrackingLost: true,
    isHandDetected: false,
  });

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('inactive');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Persistent refs (never recreated) ----
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastDetectionTimeRef = useRef<number>(Date.now());

  // Gesture state refs
  const positionHistoryRef = useRef<PositionEntry[]>([]);
  const stationaryStartTimeRef = useRef<number | null>(null);
  const pointingCountRef = useRef(0);
  const notPointingCountRef = useRef(0);

  // ---- Stable video element: created once, lives forever ----
  useEffect(() => {
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.style.display = 'none';
    document.body.appendChild(video);
    videoRef.current = video;
    return () => {
      video.remove();
      videoRef.current = null;
    };
  }, []);

  // ---- Gesture detectors (stable, no deps) ----

  const checkPointing = useCallback((landmarks: Landmark[]): boolean => {
    const indexTip = landmarks[8];
    const indexPIP = landmarks[6];
    // Simply check if the index finger is extended (tip is higher than PIP, y-axis goes down)
    return indexTip.y < indexPIP.y;
  }, []);

  const detectCircularMotion = useCallback((): { isCircling: boolean; direction: CircleDirection } => {
    const history = positionHistoryRef.current;
    if (history.length < CIRCLE_ANALYSIS_FRAMES) {
      return { isCircling: false, direction: 'none' };
    }

    const recent = history.slice(-CIRCLE_ANALYSIS_FRAMES);

    let sumX = 0, sumY = 0;
    for (const p of recent) { sumX += p.x; sumY += p.y; }
    const cx = sumX / recent.length;
    const cy = sumY / recent.length;

    let maxDist = 0;
    for (const p of recent) {
      const d = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
      if (d > maxDist) maxDist = d;
    }
    if (maxDist < CENTROID_RADIUS_MIN) {
      return { isCircling: false, direction: 'none' };
    }

    let totalAngle = 0;
    for (let i = 1; i < recent.length; i++) {
      const a1 = Math.atan2(recent[i - 1].y - cy, recent[i - 1].x - cx);
      const a2 = Math.atan2(recent[i].y - cy, recent[i].x - cx);
      let delta = a2 - a1;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      totalAngle += delta;
    }

    const totalDegrees = Math.abs(totalAngle) * (180 / Math.PI);

    if (totalDegrees >= CIRCLE_ANGLE_THRESHOLD_DEG) {
      const direction: CircleDirection = totalAngle < 0 ? 'clockwise' : 'counterclockwise';
      return { isCircling: true, direction };
    }

    return { isCircling: false, direction: 'none' };
  }, []);

  const detectStationary = useCallback((): { isStationary: boolean; stationaryDuration: number; velocity: number } => {
    const history = positionHistoryRef.current;
    if (history.length < STATIONARY_HISTORY_WINDOW) {
      return { isStationary: false, stationaryDuration: 0, velocity: 1 };
    }

    const recent = history.slice(-STATIONARY_HISTORY_WINDOW);

    let totalDisplacement = 0;
    for (let i = 1; i < recent.length; i++) {
      const dx = recent[i].x - recent[i - 1].x;
      const dy = recent[i].y - recent[i - 1].y;
      totalDisplacement += Math.sqrt(dx * dx + dy * dy);
    }
    const avgVelocity = totalDisplacement / (recent.length - 1);

    const isSlowEnough = avgVelocity < STATIONARY_VELOCITY_THRESHOLD;

    if (isSlowEnough) {
      if (stationaryStartTimeRef.current === null) {
        stationaryStartTimeRef.current = Date.now();
      }
      const duration = Date.now() - stationaryStartTimeRef.current;
      return { isStationary: duration >= STATIONARY_MIN_DURATION_MS, stationaryDuration: duration, velocity: avgVelocity };
    } else {
      stationaryStartTimeRef.current = null;
      return { isStationary: false, stationaryDuration: 0, velocity: avgVelocity };
    }
  }, []);

  // ---- onResults callback (stable identity) ----
  const onResults = useCallback((results: Results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const indexTip = landmarks[8];
      const mirroredX = 1 - indexTip.x;
      const screenX = mirroredX * window.innerWidth;
      const screenY = indexTip.y * window.innerHeight;
      const now = Date.now();
      lastDetectionTimeRef.current = now;

      positionHistoryRef.current.push({ x: mirroredX, y: indexTip.y, timestamp: now });
      if (positionHistoryRef.current.length > POSITION_HISTORY_LENGTH) {
        positionHistoryRef.current = positionHistoryRef.current.slice(-POSITION_HISTORY_LENGTH);
      }

      const rawPointing = checkPointing(landmarks);
      if (rawPointing) {
        pointingCountRef.current++;
        notPointingCountRef.current = 0;
      } else {
        notPointingCountRef.current++;
        pointingCountRef.current = 0;
      }

      const isPointing = pointingCountRef.current >= POINTING_HYSTERESIS;
      const { isCircling, direction } = detectCircularMotion();
      const { isStationary, stationaryDuration, velocity } = detectStationary();

      let gesturePhase: GesturePhase = 'idle';
      if (isPointing) {
        if (isStationary) {
          gesturePhase = 'stationary';
        } else if (isCircling) {
          gesturePhase = 'circling';
        } else {
          gesturePhase = 'pointing';
        }
      }

      setResult({
        x: mirroredX,
        y: indexTip.y,
        screenX,
        screenY,
        isPointing,
        isCircling,
        circleDirection: direction,
        isStationary,
        stationaryDuration,
        gesturePhase,
        normalizedVelocity: velocity,
        isTrackingLost: false,
        isHandDetected: true,
      });
    } else {
      const now = Date.now();
      if (now - lastDetectionTimeRef.current > 500) {
        setResult(prev => ({
          ...prev,
          isTrackingLost: true,
          isHandDetected: false,
          isPointing: false,
          isCircling: false,
          isStationary: false,
          gesturePhase: 'idle',
        }));
        positionHistoryRef.current = [];
        stationaryStartTimeRef.current = null;
      }
    }
  }, [checkPointing, detectCircularMotion, detectStationary]);

  // Keep a stable ref so the camera effect doesn't need onResults as a dep
  const onResultsRef = useRef(onResults);
  onResultsRef.current = onResults;

  // ---- Camera lifecycle: driven by interactionMode ----
  useEffect(() => {
    let active = true;

    const fullyStopCamera = async () => {
      if (cameraRef.current) {
        await cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      // Reset gesture state
      positionHistoryRef.current = [];
      stationaryStartTimeRef.current = null;
      pointingCountRef.current = 0;
      notPointingCountRef.current = 0;
      setCameraStatus('inactive');
      setIsLoading(false);
      setResult(prev => ({
        ...prev,
        isTrackingLost: true,
        isHandDetected: false,
        isPointing: false,
        isCircling: false,
        isStationary: false,
        gesturePhase: 'idle',
      }));
      // Let the browser release hardware resources
      await new Promise(resolve => setTimeout(resolve, 50));
    };

    const startCamera = async () => {
      // Fully release any previous stream before starting a new one
      await fullyStopCamera();
      if (!active) return;

      setIsLoading(true);
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = videoRef.current!;
        video.srcObject = stream;

        const { Hands } = await import('@mediapipe/hands');
        const { Camera } = await import('@mediapipe/camera_utils');

        if (!active) return;

        const hands = new Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: Results) => onResultsRef.current(results));
        handsRef.current = hands;

        const camera = new Camera(video, {
          onFrame: async () => {
            if (handsRef.current && video.readyState >= 2) {
              await handsRef.current.send({ image: video });
            }
          },
          width: 640,
          height: 480,
        });

        await camera.start();
        if (!active) return;

        cameraRef.current = camera;
        setCameraStatus('active');
        setIsLoading(false);
      } catch (err) {
        if (!active) return;
        console.error('Camera init failed:', err);
        setCameraStatus('error');
        setError(err instanceof Error ? err.message : 'Camera access denied');
        setIsLoading(false);
      }
    };

    if (interactionMode === 'gesture') {
      startCamera();
    } else {
      fullyStopCamera();
    }

    return () => {
      active = false;
      fullyStopCamera();
    };
  }, [interactionMode]);

  return { ...result, isLoading, error, cameraStatus };
}
