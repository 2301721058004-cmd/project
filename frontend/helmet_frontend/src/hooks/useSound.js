import { useCallback, useRef, useEffect } from 'react';

export function useSound() {
  const audioContextRef = useRef(null);

  // Initialize audio context on first interaction
  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      console.log('[Sound] AudioContext initialized:', audioContext.state);
      return audioContext;
    } catch (error) {
      console.error('[Sound] Failed to create AudioContext:', error);
      return null;
    }
  }, []);

  // Resume audio context if suspended (due to browser autoplay policy)
  const resumeAudioContext = useCallback(async () => {
    const audioContext = audioContextRef.current || initAudioContext();
    if (!audioContext) return false;

    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('[Sound] AudioContext resumed');
      }
      return true;
    } catch (error) {
      console.error('[Sound] Failed to resume AudioContext:', error);
      return false;
    }
  }, [initAudioContext]);

  const playAlert = useCallback(async () => {
    const audio = audioContextRef.current || initAudioContext();
    if (!audio) {
      console.warn('[Sound] AudioContext not available');
      return;
    }

    try {
      // Resume context if needed
      if (audio.state === 'suspended') {
        const resumed = await resumeAudioContext();
        if (!resumed) {
          console.warn('[Sound] Could not resume AudioContext');
          return;
        }
      }

      const oscillator = audio.createOscillator();
      const gainNode = audio.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audio.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audio.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + 0.5);

      oscillator.start(audio.currentTime);
      oscillator.stop(audio.currentTime + 0.5);
      console.log('[Sound] Alert played');
    } catch (error) {
      console.error('[Sound] Failed to play alert:', error);
    }
  }, [initAudioContext, resumeAudioContext]);

  // Violation alert - distinctive warning sound with multiple beeps
  const playViolationAlert = useCallback(async () => {
    const audio = audioContextRef.current || initAudioContext();
    if (!audio) {
      console.warn('[Sound] AudioContext not available for violation alert');
      return;
    }

    try {
      // Resume context if needed
      if (audio.state === 'suspended') {
        const resumed = await resumeAudioContext();
        if (!resumed) {
          console.warn('[Sound] Could not resume AudioContext for violation alert');
          return;
        }
      }

      const playBeep = (startTime, frequency = 900, duration = 0.3) => {
        try {
          const oscillator = audio.createOscillator();
          const gainNode = audio.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audio.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.4, startTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        } catch (e) {
          console.error('[Sound] Failed to play beep:', e);
        }
      };
      
      const now = audio.currentTime;
      // Play three beeps with different frequencies for a distinct warning sound
      playBeep(now, 900, 0.25);           // First beep
      playBeep(now + 0.3, 1100, 0.25);    // Second beep (higher frequency)
      playBeep(now + 0.6, 900, 0.25);     // Third beep
      console.log('[Sound] Violation alert played');
    } catch (error) {
      console.error('[Sound] Failed to play violation alert:', error);
    }
  }, [initAudioContext, resumeAudioContext]);

  // Initialize audio context on mount to handle autoplay policy early
  useEffect(() => {
    const handleUserInteraction = () => {
      initAudioContext();
      resumeAudioContext();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [initAudioContext, resumeAudioContext]);

  return { playAlert, playViolationAlert };
}