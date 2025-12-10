import { useState, useEffect, useRef } from 'react';
import type { GalleryCard } from './CircularGallery';
import { IconChevronRight } from './Icons';
import { CardModal } from './CardModal';

interface EnhancedGalleryProps {
  items: GalleryCard[];
  bend?: number;
  scrollSpeed?: number;
  scrollEase?: number;
  onCardIndexChange?: (index: number) => void; // 回調當前聚焦的卡片索引
  targetCardIndex?: number; // 外部控制：要滾動到的卡片索引
}

export default function EnhancedGallery({
  items,
  bend = 1,
  scrollSpeed = 2,
  scrollEase = 0.05,
  onCardIndexChange,
  targetCardIndex,
}: EnhancedGalleryProps) {
  const [currentScroll, setCurrentScroll] = useState(0);
  const [targetScroll, setTargetScroll] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startScroll, setStartScroll] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wheelTimeoutRef = useRef<number | null>(null);

  // 使用 ref 來存儲最新的 scroll 值，避免閉包問題
  const currentScrollRef = useRef(0);
  const targetScrollRef = useRef(0);

  // 為每張原始卡片維護當前顯示的圖片索引
  const [currentImageIndices, setCurrentImageIndices] = useState<{ [key: number]: number }>(
    items.reduce((acc, _, index) => ({ ...acc, [index]: 0 }), {})
  );

  // 卡片彈窗狀態
  const [selectedCard, setSelectedCard] = useState<GalleryCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 卡片翻轉狀態：記錄哪個卡片正在翻轉
  const [flippingCardIndex, setFlippingCardIndex] = useState<number | null>(null);

  const cardWidth = 375 + 100; // Card width + gap
  const enableScroll = items.length >= 3;

  // 圖片切換函數
  const handleImageChange = (originalIndex: number, direction: 'next' | 'prev') => {
    setCurrentImageIndices((prev) => {
      const card = items[originalIndex];
      const imageCount = card.images?.length || 1;
      const currentIdx = prev[originalIndex] || 0;

      let newIdx;
      if (direction === 'next') {
        newIdx = (currentIdx + 1) % imageCount;
      } else {
        newIdx = (currentIdx - 1 + imageCount) % imageCount;
      }

      return { ...prev, [originalIndex]: newIdx };
    });
  };

  // 卡片點擊處理函數
  const handleCardClick = (card: GalleryCard, originalIndex: number) => {
    // 先觸發卡片翻轉 + 放大動畫
    setFlippingCardIndex(originalIndex);

    // 在動畫進行到一半時打開 modal，實現無縫銜接
    setTimeout(() => {
      setSelectedCard(card);
      setIsModalOpen(true);
    }, 375); // 在翻轉到側面時打開 modal（0.75s 的一半）

    // 稍後重置翻轉狀態
    setTimeout(() => {
      setFlippingCardIndex(null);
    }, 750);
  };

  // 關閉彈窗
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedCard(null), 300); // 延遲清除，讓關閉動畫完成
  };

  // 吸附到最近的卡片位置
  const snapToNearestCard = () => {
    if (!enableScroll || items.length < 3) return;

    // 計算最近的卡片索引
    const nearestCardIndex = Math.round(targetScrollRef.current / cardWidth);
    const snapPosition = nearestCardIndex * cardWidth;

    // 設置目標位置為最近的卡片位置
    targetScrollRef.current = snapPosition;
    setTargetScroll(snapPosition);
  };

  // 計算當前聚焦的卡片索引（原始陣列的索引）
  const getCurrentCardIndex = () => {
    if (items.length === 0) return 0;
    if (items.length === 1) return 0;
    if (items.length === 2) return 0;

    const centerScroll = currentScroll + window.innerWidth / 2 - cardWidth / 2;
    const rawIndex = Math.round(centerScroll / cardWidth);
    return ((rawIndex % items.length) + items.length) % items.length;
  };

  // 回傳當前聚焦的卡片索引
  useEffect(() => {
    if (onCardIndexChange) {
      onCardIndexChange(getCurrentCardIndex());
    }
  }, [currentScroll, onCardIndexChange]);

  // 統一的動畫循環：平滑滾動（無瞬移）
  useEffect(() => {
    const animate = () => {
      // 平滑插值
      const diff = targetScrollRef.current - currentScrollRef.current;
      if (Math.abs(diff) > 0.01) {
        currentScrollRef.current += diff * scrollEase;
      } else {
        currentScrollRef.current = targetScrollRef.current;
      }

      // 更新 React state（觸發重新渲染）
      setCurrentScroll(currentScrollRef.current);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (wheelTimeoutRef.current !== null) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [scrollEase]);

  // 初始化滾動位置，讓第一張卡片居中
  useEffect(() => {
    // 讓索引 0 的卡片居中
    const initialPosition = cardWidth / 2 - window.innerWidth / 2;
    currentScrollRef.current = initialPosition;
    targetScrollRef.current = initialPosition;
    setCurrentScroll(initialPosition);
    setTargetScroll(initialPosition);
  }, [items.length, cardWidth]);

  // 同步 targetScroll state 到 ref
  useEffect(() => {
    targetScrollRef.current = targetScroll;
  }, [targetScroll]);

  // 外部控制：當 targetCardIndex 改變時，滾動到對應的卡片
  useEffect(() => {
    if (targetCardIndex !== undefined && !isDragging) {
      // 計算讓卡片居中的滾動位置
      // 卡片中心 = targetCardIndex * cardWidth + cardWidth / 2
      // 視窗中心 = currentScroll + window.innerWidth / 2
      // 要讓卡片居中：currentScroll = 卡片中心 - 視窗中心
      const targetPosition = targetCardIndex * cardWidth + cardWidth / 2 - window.innerWidth / 2;
      targetScrollRef.current = targetPosition;
      setTargetScroll(targetPosition);
    }
  }, [targetCardIndex, cardWidth, isDragging]);

  // Mouse/Touch handlers
  const handleStart = (clientX: number) => {
    if (!enableScroll) return;
    setIsDragging(true);
    setStartX(clientX);
    setStartScroll(targetScroll);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !enableScroll) return;
    const diff = (startX - clientX) * (scrollSpeed * 0.5);
    const newTarget = startScroll + diff;
    targetScrollRef.current = newTarget;
    setTargetScroll(newTarget);
  };

  const handleEnd = () => {
    setIsDragging(false);
    // 滑動結束後吸附到最近的卡片
    snapToNearestCard();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!enableScroll) return;
    e.preventDefault();
    const delta = e.deltaY;
    const newTarget = targetScrollRef.current + (delta > 0 ? scrollSpeed * 20 : -scrollSpeed * 20);
    targetScrollRef.current = newTarget;
    setTargetScroll(newTarget);

    // 清除之前的 timeout
    if (wheelTimeoutRef.current !== null) {
      clearTimeout(wheelTimeoutRef.current);
    }

    // 滾輪停止後吸附到最近的卡片（延遲 150ms）
    wheelTimeoutRef.current = window.setTimeout(() => {
      snapToNearestCard();
    }, 150);
  };

  // 計算弧形位置
  const getArcPosition = (index: number, totalCards: number): { x: number; y: number; rotation: number } => {
    const angle = (index / (totalCards - 1)) * Math.PI * 0.3 - (Math.PI * 0.15); // -27° to +27°
    const radius = 800; // 弧形半徑
    const x = Math.sin(angle) * radius;
    const y = -Math.cos(angle) * radius + radius; // 向下彎曲
    const rotation = (angle * 180) / Math.PI;

    return { x, y: y * bend, rotation };
  };

  // 計算卡片樣式（基於虛擬索引）
  const getCardStyle = (virtualIndex: number): React.CSSProperties => {
    // 1 張卡片：完全置中（使用實際卡片寬度 375px，不包含 gap）
    if (items.length === 1) {
      return {
        transform: `translateX(${window.innerWidth / 2 - 375 / 2}px) rotateZ(0deg)`,
        transition: 'none',
        zIndex: 10,
      };
    }

    // 2 張卡片：弧形顯示
    if (items.length === 2) {
      const arc = getArcPosition(virtualIndex, 2);
      const centerX = window.innerWidth / 2;

      return {
        transform: `translate(${centerX + arc.x - cardWidth / 2}px, ${arc.y}px) rotateZ(${arc.rotation}deg)`,
        transition: 'none',
        zIndex: 10,
      };
    }

    // 3 張以上：使用虛擬索引計算位置（支援無限滾動）
    const offset = virtualIndex * cardWidth - currentScroll;
    const centerOffset = offset - window.innerWidth / 2 + cardWidth / 2;
    const normalizedOffset = centerOffset / (window.innerWidth / 2);

    // 計算旋轉和 Y 軸位移（弧形效果）
    const rotation = Math.max(-10, Math.min(10, normalizedOffset * 10));
    const arcY = Math.abs(normalizedOffset) * 50 * bend; // 弧形深度

    // 計算縮放：中心卡片 scale=1.1，遠離中心逐漸縮小到 0.95
    const distanceFromCenter = Math.abs(normalizedOffset);
    const scale = 1.1 - (distanceFromCenter * 0.15); // 1.1 -> 0.95

    return {
      transform: `translate(${offset}px, ${arcY}px) rotateZ(${rotation}deg) scale(${scale})`,
      transition: isDragging ? 'none' : 'transform 0.3s ease-out',
      zIndex: Math.abs(normalizedOffset) < 0.5 ? 10 : 5,
    };
  };

  // 計算要渲染的卡片（虛擬滾動）
  const getVisibleCards = () => {
    if (items.length === 0) return [];

    // 對於 1-2 張卡片，直接渲染所有卡片
    if (items.length < 3) {
      return items.map((_, index) => index);
    }

    // 對於 3 張以上，計算視窗中心的卡片索引
    const centerScroll = currentScroll + window.innerWidth / 2 - cardWidth / 2;
    const centerCardIndex = Math.round(centerScroll / cardWidth);

    // 渲染中心卡片 ± 4 張（共 9 張卡片）
    const visibleIndices: number[] = [];
    for (let i = -4; i <= 4; i++) {
      visibleIndices.push(centerCardIndex + i);
    }

    return visibleIndices;
  };

  const visibleCardIndices = getVisibleCards();

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden"
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      onWheel={handleWheel}
      style={{ cursor: enableScroll ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
    >
      {/* Cards Container */}
      <div className="absolute inset-0 flex items-start pt-[15vh]">
        {visibleCardIndices.map((virtualIndex) => {
          // 計算實際的卡片內容索引（使用取模）
          const originalIndex = ((virtualIndex % items.length) + items.length) % items.length;
          const card = items[originalIndex];
          const currentImgIdx = currentImageIndices[originalIndex] || 0;
          const images = card.images || [{ url: card.image, caption: card.imageCaption }];
          const currentImage = images[currentImgIdx];

          const isFlipping = flippingCardIndex === originalIndex;

          return (
            <div
              key={virtualIndex}
              className="absolute"
              style={{
                ...getCardStyle(virtualIndex),
                perspective: '1500px',
              }}
            >
              <div className="flex flex-col gap-6 items-center w-[375px]">
                {/* Card Content - 簡化版：只顯示圖片和名稱 */}
                <div
                  className="cursor-pointer"
                  style={{
                    width: '375px',
                    fontFamily: "'Noto Sans TC', sans-serif",
                    transformStyle: 'preserve-3d',
                    transform: isFlipping
                      ? 'rotateY(90deg) scale(2.2)'
                      : 'rotateY(0deg) scale(1)',
                    opacity: isFlipping ? 0 : 1,
                    transition: 'all 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  onClick={() => handleCardClick(card, originalIndex)}
                >
                  {/* Image Section */}
                  <div className="relative bg-[#d9d9d9] h-[450px] w-full rounded-[10px] overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <img
                      src={currentImage.url}
                      alt={card.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Title Below Image */}
                <h3
                  className="font-bold text-white text-[30px] text-center leading-tight"
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                >
                  {card.title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
