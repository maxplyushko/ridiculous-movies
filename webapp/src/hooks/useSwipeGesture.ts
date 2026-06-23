import { useEffect, useRef, useState } from "react";

type UseSwipeGestureOptions = {
  actionsWidth: number;
  openThreshold: number;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onBegin: () => void;
};

export function useSwipeGesture({
  actionsWidth,
  openThreshold,
  isOpen,
  onOpen,
  onClose,
  onBegin,
}: UseSwipeGestureOptions) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [keepActionsVisible, setKeepActionsVisible] = useState(false);

  const offsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const touchAxis = useRef<"horizontal" | "vertical" | null>(null);
  const swipeBeginNotified = useRef(false);
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    offsetRef.current = offsetX;
  }, [offsetX]);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => setOffsetX(-actionsWidth));
      return;
    }
    queueMicrotask(() => {
      if (offsetRef.current !== 0) setKeepActionsVisible(true);
      setOffsetX(0);
    });
  }, [isOpen, actionsWidth]);

  const clamp = (value: number) => Math.max(-actionsWidth, Math.min(0, value));

  const closeSwipe = () => {
    if (offsetRef.current !== 0) setKeepActionsVisible(true);
    setOffsetX(0);
    onClose();
  };

  const handleTransitionEnd = (propertyName: string) => {
    if (propertyName === "transform") setKeepActionsVisible(false);
  };

  const isRevealed = offsetX !== 0 || isOpen;
  const showActions = offsetX < 0 || isDragging || keepActionsVisible;

  const touchHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      suppressNextClickRef.current = false;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      startOffset.current = offsetRef.current;
      touchAxis.current = null;
      swipeBeginNotified.current = false;
      isDraggingRef.current = true;
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;

      if (touchAxis.current === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        touchAxis.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      }
      if (touchAxis.current === "vertical") return;

      if (!swipeBeginNotified.current) {
        swipeBeginNotified.current = true;
        onBegin();
      }

      setIsDragging(true);
      setOffsetX(clamp(startOffset.current + dx));
    },
    onTouchEnd: () => {
      const wasTap = touchAxis.current === null;
      touchAxis.current = null;
      swipeBeginNotified.current = false;
      isDraggingRef.current = false;
      setIsDragging(false);

      if (wasTap && isRevealed) {
        suppressNextClickRef.current = true;
        closeSwipe();
        return;
      }

      setOffsetX((current) => {
        const next = current <= -openThreshold ? -actionsWidth : 0;
        if (next === -actionsWidth) {
          onOpen();
        } else {
          if (current !== 0) setKeepActionsVisible(true);
          onClose();
        }
        return next;
      });
    },
  };

  return { offsetX, isDragging, isRevealed, showActions, closeSwipe, handleTransitionEnd, suppressNextClickRef, touchHandlers };
}
