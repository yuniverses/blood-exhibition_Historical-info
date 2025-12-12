import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { GalleryCard } from './CircularGallery';

interface EnhancedGalleryProps {
  items: GalleryCard[];
  bend?: number;
  scrollSpeed?: number;
  scrollEase?: number;
  onCardIndexChange?: (index: number) => void; // 回調當前聚焦的卡片索引
  targetCardIndex?: number; // 外部控制：要滾動到的卡片索引
  onCardClick?: (card: GalleryCard, rect: DOMRect) => void; // 新增：點擊回調
}

export default function EnhancedGallery({
  items: propItems,
  bend = 1,
  scrollSpeed = 2,
  scrollEase = 0.05,
  onCardIndexChange,
  targetCardIndex,
  onCardClick,
}: EnhancedGalleryProps) {
  const [items, setItems] = useState(propItems);
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
  const [currentImageIndices] = useState<{ [key: number]: number }>(
    items.reduce((acc, _, index) => ({ ...acc, [index]: 0 }), {})
  );

  // Calculate responsive card dimensions
  // Mobile: 65vw, Desktop: 375px
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? document.documentElement.clientWidth : 0);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(document.documentElement.clientWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardBaseWidth = Math.min(375, windowWidth * 0.65);
  const cardWidth = cardBaseWidth + (windowWidth < 768 ? 20 : 100); // Smaller gap on mobile
  const enableScroll = items.length >= 3;

  // Handle items transition
  useEffect(() => {
    // Skip if items are effectively the same (check first item ID and length)
    if (items.length === propItems.length && items[0]?.id === propItems[0]?.id) {
      return;
    }

    // Animate Out
    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        // Update items
        setItems(propItems);
        
        // Reset scroll to center
        const initialPosition = -(windowWidth / 2 - cardBaseWidth / 2);
        currentScrollRef.current = initialPosition;
        targetScrollRef.current = initialPosition;
        setCurrentScroll(initialPosition);
        setTargetScroll(initialPosition);

        // Animate In
        gsap.to(containerRef.current, {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: 'power2.out'
        });
      }
    });
  }, [propItems, windowWidth, cardBaseWidth]);


  // 卡片點擊處理函數
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>, card: GalleryCard) => {
    if (onCardClick) {
      const rect = e.currentTarget.getBoundingClientRect();
      onCardClick(card, rect);
    }
  };

  // 吸附到最近的卡片位置
  const snapToNearestCard = () => {
    if (!enableScroll || items.length < 3) return;

    // Current centered card index
    // We want to center the CARD (cardBaseWidth), not the unit (cardWidth)
    
    const centerOffset = windowWidth / 2 - cardBaseWidth / 2;
    const nearestCardIndex = Math.round((currentScrollRef.current + centerOffset) / cardWidth);

    scrollToIndex(nearestCardIndex);
  };

  const scrollToIndex = (index: number) => {
    const centeringAdjustment = windowWidth / 2 - cardBaseWidth / 2;
    const targetPosition = index * cardWidth - centeringAdjustment;
    targetScrollRef.current = targetPosition;
    setTargetScroll(targetPosition);
  };

  // 計算當前聚焦的卡片索引（原始陣列的索引）
  const getCurrentCardIndex = () => {
    if (items.length === 0) return 0;
    if (items.length === 1) return 0;
    if (items.length === 2) return 0;

    const centerScroll = currentScroll + windowWidth / 2 - cardWidth / 2;
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
    const initialPosition = -(windowWidth / 2 - cardBaseWidth / 2);
    currentScrollRef.current = initialPosition;
    targetScrollRef.current = initialPosition;
    setCurrentScroll(initialPosition);
    setTargetScroll(initialPosition);
  }, [items.length, cardWidth, cardBaseWidth, windowWidth]);

  // 同步 targetScroll state 到 ref
  useEffect(() => {
    targetScrollRef.current = targetScroll;
  }, [targetScroll]);

  // 外部控制：當 targetCardIndex 改變時，滾動到對應的卡片
  useEffect(() => {
    if (targetCardIndex !== undefined && !isDragging) {
      scrollToIndex(targetCardIndex);
    }
  }, [targetCardIndex, cardWidth, isDragging, cardBaseWidth, windowWidth]);

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
    
    if (wheelTimeoutRef.current) return; // Simple cooldown

    const delta = e.deltaY;
    const centeringAdjustment = windowWidth / 2 - cardBaseWidth / 2;
    const currentIndex = Math.round((targetScrollRef.current + centeringAdjustment) / cardWidth);

    if (Math.abs(delta) > 10) {
       if (delta > 0) {
         scrollToIndex(currentIndex + 1);
       } else {
         scrollToIndex(currentIndex - 1);
       }
       
       // Set a cooldown
       wheelTimeoutRef.current = window.setTimeout(() => {
         wheelTimeoutRef.current = null;
       }, 500);
    }
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
    // 1 張卡片：完全置中（使用實際卡片寬度）
    if (items.length === 1) {
      return {
        transform: `translateX(${windowWidth / 2 - cardBaseWidth / 2}px) rotateZ(0deg)`,
        transition: 'none',
        zIndex: 10,
      };
    }

    // 2 張卡片：弧形顯示
    if (items.length === 2) {
      const arc = getArcPosition(virtualIndex, 2);
      const centerX = windowWidth / 2;

      return {
        transform: `translate(${centerX + arc.x - cardWidth / 2}px, ${arc.y}px) rotateZ(${arc.rotation}deg)`,
        transition: 'none',
        zIndex: 10,
      };
    }

    // 3 張以上：使用虛擬索引計算位置（支援無限滾動）
    const offset = virtualIndex * cardWidth - currentScroll;
    const centerOffset = offset - windowWidth / 2 + cardWidth / 2;
    const normalizedOffset = centerOffset / (windowWidth / 2);

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
    const centerScroll = currentScroll + windowWidth / 2 - cardWidth / 2;
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
      className="relative w-full h-screen overflow-hidden"
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

          return (
            <div
              key={virtualIndex}
              className="absolute"
              style={{
                ...getCardStyle(virtualIndex),
                perspective: '1500px',
              }}
            >
              <div className="flex flex-col gap-6 items-center" style={{ width: `${cardBaseWidth}px` }}>
                {/* Card Content - 簡化版：只顯示圖片和名稱 */}
                <div
                  className="cursor-pointer"
                  style={{
                    width: '100%',
                    fontFamily: "'Noto Sans TC', sans-serif",
                  }}
                  onClick={(e) => handleCardClick(e, card)}
                >
                  {/* Image Section */}
                  <div className="relative bg-[#d9d9d9] w-full rounded-[10px] overflow-hidden shadow-lg hover:shadow-xl transition-shadow" style={{ aspectRatio: '3/4', maxHeight: '50vh' }}>
                    <img
                      src={currentImage.url}
                      alt={card.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Title Below Image */}
                <h3
                  className="font-bold text-white text-center leading-tight"
                  style={{ 
                    fontFamily: "'Noto Sans TC', sans-serif",
                    fontSize: 'clamp(1.2rem, 3vw, 1.8rem)'
                  }}
                >
                  {card.title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
