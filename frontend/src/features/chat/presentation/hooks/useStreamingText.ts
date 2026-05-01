import { useState, useEffect, useRef } from 'react';

interface UseStreamingTextOptions {
  enabled?: boolean;
  speed?: number; // Approximate characters per update
  onComplete?: () => void;
}

export function useStreamingText(
  fullText: string,
  { enabled = true, speed = 5, onComplete }: UseStreamingTextOptions = {}
) {
  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const currentIndex = useRef(0);
  const animationFrameId = useRef<number>(0);
  const lastUpdateTime = useRef<number>(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let active = true;

    if (!enabled) {
      return;
    }

    currentIndex.current = 0;
    lastUpdateTime.current = performance.now();

    const animate = (time: number) => {
      if (!active) return;
      const elapsed = time - lastUpdateTime.current;

      if (currentIndex.current === 0) {
        setIsStreaming(true);
      }

      // Update every ~40ms for a natural typing feel
      if (elapsed > 40 || currentIndex.current === 0) {
        lastUpdateTime.current = time;
        // Randomize speed slightly for a more human feel
        const charsToAdd = Math.max(1, Math.floor(Math.random() * speed) + 1);
        currentIndex.current += charsToAdd;

        if (currentIndex.current >= fullText.length) {
          setDisplayedText(fullText);
          setIsStreaming(false);
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          return;
        } else {
          setDisplayedText(fullText.substring(0, currentIndex.current));
        }
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      active = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [fullText, enabled, speed]);

  return {
    displayedText: enabled ? displayedText : fullText,
    isStreaming: enabled ? isStreaming : false,
  };
}