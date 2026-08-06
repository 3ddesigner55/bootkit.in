"use client";

import { useEffect, useRef, useState } from "react";

export default function useOverlayPresence(
  isOpen: boolean,
  duration = 250
) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    if (isOpen) {
      setIsMounted(true);
      const animationFrame = requestAnimationFrame(() => setIsVisible(true));

      return () => cancelAnimationFrame(animationFrame);
    }

    setIsVisible(false);
    closeTimerRef.current = setTimeout(() => setIsMounted(false), duration);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [duration, isOpen]);

  return { isMounted, isVisible };
}
