import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { GalleryCard } from './CircularGallery';
import { DarkVeil } from './DarkVeil';
import { IconChevronRight } from './Icons';

interface CardModalProps {
  card: GalleryCard;
  isOpen: boolean;
  onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({ card, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWideLayout, setIsWideLayout] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [shouldRender, setShouldRender] = useState(false);

  // GSAP 動畫引用
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const captionContainerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const images = card.images && card.images.length > 0
    ? card.images
    : [{ url: card.image, caption: card.imageCaption }];

  useEffect(() => {
    const handleResize = () => {
      // 700mm height x 395mm width = aspect ratio ~0.56 (narrow)
      // Wide layout when aspect ratio > 1.0, narrow when <= 1.0
      const aspectRatio = window.innerWidth / window.innerHeight;
      setIsWideLayout(aspectRatio > 1.0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 簡單直接的動畫邏輯
  useEffect(() => {
    if (isOpen) {
      // 1. 先渲染到 DOM
      setShouldRender(true);
    } else if (shouldRender) {
      // 2. 關閉：執行動畫後移除
      const elements = [
        imageContainerRef.current,
        textContainerRef.current,
        captionContainerRef.current,
        closeButtonRef.current
      ];

      gsap.to(elements, {
        y: 80,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.in',
        stagger: 0.08,
        onComplete: () => setShouldRender(false)
      });
    }
  }, [isOpen, shouldRender]);

  // 開啟動畫：在 DOM 渲染後立即執行
  useEffect(() => {
    if (shouldRender && isOpen) {
      const elements = [
        imageContainerRef.current,
        textContainerRef.current,
        captionContainerRef.current,
        closeButtonRef.current
      ];

      // 立即設置初始狀態（避免閃爍）
      gsap.set(elements, { y: 80, opacity: 0 });

      // 執行開啟動畫
      const tl = gsap.timeline();
      tl.to(imageContainerRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
      })
      .to(textContainerRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
      }, '-=0.5')
      .to(captionContainerRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power3.out',
      }, '-=0.4')
      .to(closeButtonRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power3.out',
      }, '-=0.4');
    }
  }, [shouldRender, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // 拖曳處理
  const handleDragStart = (clientY: number) => {
    if (images.length <= 1) return;
    setIsDragging(true);
    setStartY(clientY);
    setDragOffset(0);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging || images.length <= 1) return;
    const diff = clientY - startY;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging || images.length <= 1) return;
    setIsDragging(false);

    // 拖曳超過 50px 才切換
    if (dragOffset > 50) {
      prevImage(); // 向下拖 = 上一張
    } else if (dragOffset < -50) {
      nextImage(); // 向上拖 = 下一張
    }

    setDragOffset(0);
  };

  // 計算圖片的垂直堆疊位置（根據 Figma 設計）
  const getImageStyle = (index: number): React.CSSProperties => {
    const diff = index - currentImageIndex;
    const totalImages = images.length;

    // 只顯示當前圖片前後各1張
    if (Math.abs(diff) > 1 && totalImages > 3) {
      return { display: 'none' };
    }

    // 圖片垂直堆疊，帶輕微旋轉（3D 卡片效果）
    if (diff === -1) {
      // 前一張：上方，輕微向左旋轉
      return {
        position: 'absolute',
        left: '50%',
        top: '-100px',
        transform: 'translateX(-50%) rotate(-3deg) scale(0.9)',
        opacity: 0.6,
        zIndex: 1,
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      };
    } else if (diff === 0) {
      // 當前：中央，無旋轉
      return {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%) rotate(0deg) scale(1)',
        opacity: 1,
        zIndex: 10,
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      };
    } else if (diff === 1) {
      // 下一張：下方，輕微向右旋轉
      return {
        position: 'absolute',
        left: '50%',
        bottom: '-100px',
        transform: 'translateX(-50%) rotate(3deg) scale(0.9)',
        opacity: 0.6,
        zIndex: 1,
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      };
    }

    return { display: 'none' };
  };

  if (!shouldRender) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50"
    >
      <DarkVeil />

      {/* Content container */}
      <div className="relative z-10 w-full h-full">

        {/* Image carousel section - 垂直堆疊輪播 */}
        <div
          ref={imageContainerRef}
          className={`absolute ${
            isWideLayout
              ? 'left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2'
              : 'left-1/2 top-[32%] -translate-x-1/2 -translate-y-1/2'
          } cursor-grab active:cursor-grabbing`}
          onMouseDown={(e) => handleDragStart(e.clientY)}
          onMouseMove={(e) => handleDragMove(e.clientY)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
          onTouchEnd={handleDragEnd}
        >
          <div className="relative" style={{
            width: isWideLayout ? 'min(50vw, 668px)' : 'min(85vw, 459px)',
            height: isWideLayout ? 'min(60vh, 573px)' : 'min(50vh, 394px)',
            perspective: '1200px'
          }}>

            {/* 對角線堆疊的圖片 */}
            {images.map((img, index) => (
              <div
                key={index}
                style={{
                  ...getImageStyle(index),
                  width: isWideLayout ? 'min(33vw, 445px)' : 'min(77vw, 306px)',
                  height: isWideLayout ? 'min(40vh, 369px)' : 'min(36vh, 254px)',
                }}
                className="rounded-lg overflow-hidden shadow-2xl"
              >
                <div className="relative w-full h-full">
                  <img
                    src={img.url}
                    alt={img.caption || card.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Figma 設計的漸層效果：底部漸變為暗色 */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 37%, rgba(0, 0, 0, 0.267) 100%)'
                    }}
                  />
                  {/* 非當前圖片的額外遮罩 */}
                  {index !== currentImageIndex && (
                    <div className="absolute inset-0 bg-black/30" />
                  )}
                </div>
              </div>
            ))}

            {/* Navigation buttons - 上下位置，不干擾文字 */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-1/2 top-[10px] -translate-x-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-all shadow-lg border border-white/30"
                  aria-label="上一張"
                >
                  <IconChevronRight className="transform rotate-[-90deg] w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute left-1/2 bottom-[10px] -translate-x-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-all shadow-lg border border-white/30"
                  aria-label="下一張"
                >
                  <IconChevronRight className="transform rotate-[90deg] w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 文字內容區 - 使用百分比定位 */}
        <div
          ref={textContainerRef}
          className={`absolute flex flex-col ${
            isWideLayout
              ? 'left-[30%] top-[68%] w-[26%]'
              : 'left-[6%] right-[6%] bottom-[18%] w-[63%]'
          } ${!isWideLayout ? 'gap-[10px]' : ''}`}
        >
          <h2
            className={`font-bold text-white leading-normal ${
              isWideLayout ? 'text-[clamp(20px,2vw,28.289px)] mb-4' : 'text-[20px] shrink-0'
            }`}
            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          >
            {card.title}
          </h2>
          <div
            className={`text-white leading-[1.65] overflow-y-auto pr-4 custom-scrollbar ${
              isWideLayout ? 'text-[clamp(11px,1vw,13.268px)] max-h-[18vh]' : 'text-[9.38px] max-h-[21vh]'
            }`}
            style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 500 }}
          >
            {card.description?.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* 圖片說明文字和編號 (Figma 設計風格) - 使用百分比定位 */}
        {isWideLayout ? (
          <div
            ref={captionContainerRef}
            className="absolute left-[64%] top-[65%] z-20 flex items-start gap-4"
          >
            {/* 預留固定空間給圖片說明文字 */}
            <div className="w-[104px] text-right flex-shrink-0">
              <p className="text-white font-medium text-[14px] mt-[2px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                {images[currentImageIndex].caption || ''}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              {/* 當前圖片編號 - 白色帶底線 */}
              <div className="relative">
                <p
                  className="text-[16px] font-bold text-white"
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                >
                  {String(currentImageIndex + 1).padStart(2, '0')}
                </p>
                <div className="absolute bottom-[-4px] left-0 w-[39px] h-0 border-b border-white" />
              </div>
              {/* 總圖片數 - 灰色 */}
              <p
                className="text-[16px] font-bold text-[#515151]"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              >
                {String(images.length).padStart(2, '0')}
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={captionContainerRef}
            className="absolute right-[10%] top-[56%] z-20 flex items-start gap-3"
          >
            {/* 預留固定空間給圖片說明文字 */}
            <div className="w-[80px] text-right flex-shrink-0">
              <p className="text-white font-medium text-[14px] mt-[2px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                {images[currentImageIndex].caption || ''}
              </p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              {/* 當前圖片編號 - 白色帶底線 */}
              <div className="relative">
                <p
                  className="text-[16px] font-bold text-white"
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                >
                  {String(currentImageIndex + 1).padStart(2, '0')}
                </p>
                <div className="absolute bottom-[-4px] left-0 w-[39px] h-[1px] bg-white" />
              </div>
              {/* 總圖片數 - 灰色 */}
              <p
                className="text-[16px] font-bold text-[#515151]"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              >
                {String(images.length).padStart(2, '0')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Close button - 底部中央膠囊樣式 (Figma 設計) */}
      <button
        ref={closeButtonRef}
        onClick={onClose}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 w-[85px] h-[40px] flex items-center justify-center"
        aria-label="關閉"
      >
        <div className="w-full h-full rotate-90 flex items-center justify-center">
          <div className="border-[0.5px] border-white rounded-[58px] px-[10px] py-[22px] backdrop-blur-sm bg-transparent hover:bg-white/10 transition-colors flex items-center justify-center">
            <span
              className="text-white text-[14px] font-bold whitespace-nowrap -rotate-90 block w-[41px] text-center leading-none"
              style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
            >
              關閉
            </span>
          </div>
        </div>
      </button>

      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}
      </style>
    </div>
  );
};
