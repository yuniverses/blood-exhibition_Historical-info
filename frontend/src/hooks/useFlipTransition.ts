import { useState, useCallback } from 'react';

export type ViewMode = 'list' | 'detail';

interface UseFlipTransitionReturn {
  viewMode: ViewMode;
  isFlipping: boolean;
  selectedId: string | null;
  selectedRect: DOMRect | null;
  handleOpen: (id: string, rect: DOMRect) => void;
  handleClose: () => void;
}

export function useFlipTransition(): UseFlipTransitionReturn {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isFlipping, setIsFlipping] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null);

  const handleOpen = useCallback((id: string, rect: DOMRect) => {
    setSelectedId(id);
    setSelectedRect(rect);
    setIsFlipping(true);
    
    // Start transition
    requestAnimationFrame(() => {
      setViewMode('detail');
      // Reset flipping state after animation usually completes
      // This might be handled by the component listening to transition end
      // but for safety we can reset it here or let the DetailPanel handle it
      setTimeout(() => setIsFlipping(false), 800); 
    });
  }, []);

  const handleClose = useCallback(() => {
    setViewMode('list');
    setIsFlipping(true);
    setTimeout(() => {
      setIsFlipping(false);
      setSelectedId(null);
      setSelectedRect(null);
    }, 800);
  }, []);

  return {
    viewMode,
    isFlipping,
    selectedId,
    selectedRect,
    handleOpen,
    handleClose,
  };
}
