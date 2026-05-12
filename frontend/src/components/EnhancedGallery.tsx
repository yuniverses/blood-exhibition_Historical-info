import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { GalleryCard } from './CircularGallery';

// CSS Wave Animation Styles - 柔和的 3D 波浪效果
const waveKeyframes = `
@keyframes wave {
  0%, 100% {
    transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px);
  }
  25% {
    transform: perspective(1000px) rotateX(1.5deg) rotateY(-1deg) translateZ(5px);
  }
  50% {
    transform: perspective(1000px) rotateX(0deg) rotateY(1.5deg) translateZ(0px);
  }
  75% {
    transform: perspective(1000px) rotateX(-1.5deg) rotateY(-0.5deg) translateZ(5px);
  }
}
`;

const SNAP_EASE = 0.22;
const SNAP_TRANSITION = 'transform 0.18s ease-out';
const WHEEL_SNAP_COOLDOWN = 420;
const WHEEL_DELTA_THRESHOLD = 18;

// Inject keyframes into document head
if (typeof document !== 'undefined') {
  const styleId = 'enhanced-gallery-wave-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = waveKeyframes;
    document.head.appendChild(styleSheet);
  }
}

interface EnhancedGalleryProps {
  items: GalleryCard[];
  bend?: number;
  scrollSpeed?: number;
  scrollEase?: number;
  onCardIndexChange?: (index: number) => void; // 回調當前聚焦的卡片索引
  targetCardIndex?: number; // 外部控制：要滾動到的卡片索引
  onCardClick?: (card: GalleryCard, rect: DOMRect) => void; // 新增：點擊回調
  enableWaveEffect?: boolean; // 是否啟用波浪效果
}

export default function EnhancedGallery({
  items: propItems,
  bend = 1,
  scrollSpeed = 2,
  scrollEase = 0.05,
  onCardIndexChange,
  targetCardIndex,
  onCardClick,
  enableWaveEffect = true,
}: EnhancedGalleryProps) {
  const [items, setItems] = useState(propItems);
  const [currentScroll, setCurrentScroll] = useState(0);
  const [targetScroll, setTargetScroll] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wheelTimeoutRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef(0);
  const dragStartIndexRef = useRef(0);
  const dragStartScrollRef = useRef(0);

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
  const centeringAdjustment = windowWidth / 2 - cardBaseWidth / 2;
  const snapThreshold = Math.max(60, Math.min(120, cardWidth * 0.28));


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
  const getNearestIndexFromScroll = (scroll: number) => {
    return Math.round((scroll + centeringAdjustment) / cardWidth);
  };

  const snapToNearestCard = () => {
    if (!enableScroll || items.length < 3) return;
    scrollToIndex(getNearestIndexFromScroll(targetScrollRef.current));
  };

  const scrollToIndex = (index: number) => {
    const targetPosition = index * cardWidth - centeringAdjustment;
    targetScrollRef.current = targetPosition;
    setTargetScroll(targetPosition);
  };

  // 計算當前聚焦的卡片索引（原始陣列的索引）
  const getCurrentCardIndex = () => {
    if (items.length === 0) return 0;
    if (items.length === 1) return 0;
    if (items.length === 2) return 0;

    const rawIndex = getNearestIndexFromScroll(currentScroll);
    return ((rawIndex % items.length) + items.length) % items.length;
  };

  // 回傳當前聚焦的卡片索引
  useEffect(() => {
    if (onCardIndexChange) {
      onCardIndexChange(getCurrentCardIndex());
    }
  }, [currentScroll, onCardIndexChange]);

  // 統一的動畫循環：平滑滾動
  useEffect(() => {
    const animate = () => {
      // 平滑插值
      const diff = targetScrollRef.current - currentScrollRef.current;
      if (Math.abs(diff) > 0.5) {
        currentScrollRef.current += diff * Math.max(scrollEase, SNAP_EASE);
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (!enableScroll) return;
      e.preventDefault();

      if (wheelTimeoutRef.current) return;

      const axisDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const normalizedDelta = e.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? axisDelta * 16
        : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? axisDelta * window.innerHeight
          : axisDelta;

      wheelDeltaRef.current += normalizedDelta;

      if (Math.abs(wheelDeltaRef.current) < WHEEL_DELTA_THRESHOLD) return;

      const currentIndex = getNearestIndexFromScroll(targetScrollRef.current);
      const isHorizontalGesture = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const isNext = isHorizontalGesture ? wheelDeltaRef.current < 0 : wheelDeltaRef.current > 0;

      scrollToIndex(currentIndex + (isNext ? 1 : -1));
      wheelDeltaRef.current = 0;

      wheelTimeoutRef.current = window.setTimeout(() => {
        wheelTimeoutRef.current = null;
        wheelDeltaRef.current = 0;
      }, WHEEL_SNAP_COOLDOWN);
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [enableScroll, cardWidth, cardBaseWidth, windowWidth]);

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
    dragStartScrollRef.current = targetScrollRef.current;
    dragStartIndexRef.current = getNearestIndexFromScroll(targetScrollRef.current);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !enableScroll) return;
    const diff = (startX - clientX) * (scrollSpeed * 0.5);
    const direction = diff > 0 ? 1 : -1;
    const hasPassedThreshold = Math.abs(diff) >= snapThreshold;
    const nextIndex = dragStartIndexRef.current + direction;

    if (!hasPassedThreshold) {
      targetScrollRef.current = dragStartScrollRef.current;
      setTargetScroll(dragStartScrollRef.current);
      return;
    }

    if (getNearestIndexFromScroll(targetScrollRef.current) !== nextIndex) {
      scrollToIndex(nextIndex);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    // 滑動結束後吸附到最近的卡片
    snapToNearestCard();
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

    // 計算縮放：中心卡片 scale=1.0，遠離中心逐漸縮小到 0.8
    const distanceFromCenter = Math.abs(normalizedOffset);
    const scale = 1.0 - (distanceFromCenter * 0.2); // 1.0 -> 0.8

    return {
      transform: `translate(${offset}px, ${arcY}px) rotateZ(${rotation}deg) scale(${scale})`,
      transition: SNAP_TRANSITION,
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
    const centerCardIndex = getNearestIndexFromScroll(currentScroll);

    // 渲染中心卡片 ± 4 張（共 9 張卡片）
    const visibleIndices: number[] = [];
    for (let i = -4; i <= 4; i++) {
      visibleIndices.push(centerCardIndex + i);
    }

    return visibleIndices;
  };

  const visibleCardIndices = getVisibleCards();

  // 計算圖片離中心的距離 (用於模糊和波浪效果)
  const getDistanceFromCenter = (virtualIndex: number): number => {
    if (items.length <= 2) return 0;

    const offset = virtualIndex * cardWidth - currentScroll;
    const centerOffset = offset - windowWidth / 2 + cardWidth / 2;
    const normalizedOffset = centerOffset / (windowWidth / 2);
    return Math.abs(normalizedOffset);
  };

  // 計算 CSS 波浪動畫樣式 + 模糊效果
  const getImageStyle = (virtualIndex: number): React.CSSProperties => {
    const distanceFromCenter = getDistanceFromCenter(virtualIndex);

    // 模糊效果：中心卡片清晰，越遠越模糊 (最大 4px)
    const blurAmount = Math.min(4, distanceFromCenter * 3);

    // 亮度/飽和度：中心卡片正常，兩側明顯降低
    const brightness = 1 - (distanceFromCenter * 0.15); // 1 -> 0.85
    const saturate = 1 - (distanceFromCenter * 0.5); // 1 -> 0.5 (更低飽和度)

    const baseStyle: React.CSSProperties = {
      filter: distanceFromCenter > 0.1
        ? `blur(${blurAmount}px) brightness(${brightness}) saturate(${saturate})`
        : 'none',
      transition: isDragging ? 'filter 0.12s ease-out' : 'filter 0.2s ease-out',
    };

    // 如果啟用波浪效果，添加波浪動畫（保持一致的柔和效果）
    if (enableWaveEffect) {
      const delay = (virtualIndex % 5) * 0.3;

      return {
        ...baseStyle,
        animation: `wave 4s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        transformStyle: 'preserve-3d' as const,
      };
    }

    return baseStyle;
  };

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
      style={{ cursor: enableScroll ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
    >
      {/* Cards Container - Background Layer with Images */}
      <div className="absolute inset-0 flex items-start pt-[15vh]" style={{ zIndex: 1 }}>
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
                  {/* Image Section with Wave + Blur Effect */}
                  <div
                    className="relative bg-[#d9d9d9] w-full rounded-[10px] overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                    style={{
                      aspectRatio: '3/4',
                      maxHeight: '50vh',
                      ...getImageStyle(virtualIndex),
                    }}
                  >
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
