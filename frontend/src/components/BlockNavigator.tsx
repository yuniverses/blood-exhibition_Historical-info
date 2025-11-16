import { useState, useRef } from 'react';
import { type Block } from '../api';

interface BlockNavigatorProps {
  blocks: Block[];
  currentBlockIndex: number;
  currentCardIndex: number; // 當前聚焦的卡片索引
  currentCardCount: number; // 當前區塊的卡片數量
  onBlockChange: (index: number) => void;
  onCardChange?: (cardIndex: number) => void; // 切換到指定卡片
}

export default function BlockNavigator({
  blocks,
  currentBlockIndex,
  currentCardIndex,
  currentCardCount,
  onBlockChange,
  onCardChange,
}: BlockNavigatorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const titleContainerRef = useRef<HTMLDivElement>(null);

  // 處理滑動開始
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  // 處理滑動結束
  const handleEnd = (clientX: number) => {
    if (!isDragging) return;
    setIsDragging(false);

    const diff = startX - clientX;
    const threshold = 50; // 滑動閾值

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // 向左滑動，切換到下一個區塊
        const nextIndex = (currentBlockIndex + 1) % blocks.length;
        onBlockChange(nextIndex);
      } else {
        // 向右滑動，切換到上一個區塊
        const prevIndex = (currentBlockIndex - 1 + blocks.length) % blocks.length;
        onBlockChange(prevIndex);
      }
    }
  };

  // 計算要顯示的 3 個標題索引（左、中、右）
  const getVisibleTitles = () => {
    if (blocks.length === 0) return [];
    if (blocks.length === 1) return [0]; // 只有一個區塊
    if (blocks.length === 2) return [0, 1]; // 只有兩個區塊

    // 3 個以上：顯示當前、左邊、右邊（使用取模實現無限循環）
    const leftIndex = (currentBlockIndex - 1 + blocks.length) % blocks.length;
    const centerIndex = currentBlockIndex;
    const rightIndex = (currentBlockIndex + 1) % blocks.length;

    return [leftIndex, centerIndex, rightIndex];
  };

  const visibleIndices = getVisibleTitles();

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white" style={{ zIndex: 30 }}>
      {/* Progress Bar - 基於當前區塊的卡片數量，高亮當前聚焦的卡片，可點擊切換 */}
      <div className="flex w-full h-[8px]">
        {Array.from({ length: currentCardCount }).map((_, index) => (
          <button
            key={index}
            onClick={() => onCardChange?.(index)}
            className="flex-1 mx-[6px] transition-colors duration-300 hover:opacity-80 cursor-pointer"
            style={{
              backgroundColor: index === currentCardIndex ? '#5a5a5a' : '#d9d9d9',
            }}
            aria-label={`切換到卡片 ${index + 1}`}
          />
        ))}
      </div>

      {/* Section Titles - 固定顯示 3 個標題（左、中、右），支援滑動切換 */}
      <div
        ref={titleContainerRef}
        className="flex items-center justify-center gap-[85px] py-[30px] select-none"
        style={{
          fontFamily: "'Noto Sans TC', sans-serif",
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => {
          if (isDragging) e.preventDefault();
        }}
        onMouseUp={(e) => handleEnd(e.clientX)}
        onMouseLeave={(e) => {
          if (isDragging) handleEnd(e.clientX);
        }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => {
          if (isDragging) e.preventDefault();
        }}
        onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
      >
        {blocks.length === 0 ? (
          <p className="text-[#292c33] text-[24px] font-bold">沒有區塊</p>
        ) : blocks.length === 1 ? (
          // 只有一個區塊：只顯示中間
          <p
            className="text-[#292c33] text-[24px] font-bold text-center"
            style={{
              opacity: 1,
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {blocks[0].title || '區塊1'}
          </p>
        ) : blocks.length === 2 ? (
          // 只有兩個區塊：顯示兩個
          <>
            <button
              onClick={() => onBlockChange(visibleIndices[0])}
              className="flex-shrink-0"
              style={{
                fontSize: visibleIndices[0] === currentBlockIndex ? '24px' : '18px',
                fontWeight: 'bold',
                color: '#292c33',
                opacity: visibleIndices[0] === currentBlockIndex ? 1 : 0.5,
                cursor: 'pointer',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {blocks[visibleIndices[0]].title || `區塊${visibleIndices[0] + 1}`}
            </button>
            <button
              onClick={() => onBlockChange(visibleIndices[1])}
              className="flex-shrink-0"
              style={{
                fontSize: visibleIndices[1] === currentBlockIndex ? '24px' : '18px',
                fontWeight: 'bold',
                color: '#292c33',
                opacity: visibleIndices[1] === currentBlockIndex ? 1 : 0.5,
                cursor: 'pointer',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {blocks[visibleIndices[1]].title || `區塊${visibleIndices[1] + 1}`}
            </button>
          </>
        ) : (
          // 3 個以上：永遠顯示左、中、右
          <>
            {/* 左側標題 */}
            <button
              onClick={() => onBlockChange(visibleIndices[0])}
              className="flex-shrink-0"
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#292c33',
                opacity: 0.5,
                cursor: 'pointer',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {blocks[visibleIndices[0]].title || `區塊${visibleIndices[0] + 1}`}
            </button>

            {/* 中間標題（當前） */}
            <p
              className="text-[24px] font-bold text-center"
              style={{
                color: '#292c33',
                opacity: 1,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {blocks[visibleIndices[1]].title || `區塊${visibleIndices[1] + 1}`}
            </p>

            {/* 右側標題 */}
            <button
              onClick={() => onBlockChange(visibleIndices[2])}
              className="flex-shrink-0"
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#292c33',
                opacity: 0.5,
                cursor: 'pointer',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {blocks[visibleIndices[2]].title || `區塊${visibleIndices[2] + 1}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
