import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import type { GalleryCard } from './CircularGallery';

interface DetailPanelProps {
  card: GalleryCard | null;
  isVisible: boolean;
  onClose: () => void;
  initialRect: DOMRect | null;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ card, isVisible, onClose, initialRect }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWideLayout, setIsWideLayout] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [shouldRender, setShouldRender] = useState(false);

  // Refs for animation
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const captionContainerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mainImageRef = useRef<HTMLImageElement>(null);

  const images = card?.images && card.images.length > 0
    ? card.images
    : card ? [{ url: card.image, caption: card.imageCaption }] : [];

  useEffect(() => {
    const handleResize = () => {
      const aspectRatio = window.innerWidth / window.innerHeight;
      setIsWideLayout(aspectRatio > 1.0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Manage rendering state
  useEffect(() => {
    if (isVisible && card) {
      setShouldRender(true);
      setCurrentImageIndex(0); // Reset image index on open
    } else if (!isVisible && shouldRender) {
      // Wait for exit animation to finish before unmounting
      const timer = setTimeout(() => setShouldRender(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isVisible, card, shouldRender]);

  // FLIP Animation Logic
  useLayoutEffect(() => {
    if (shouldRender && isVisible && initialRect && imageContainerRef.current) {
      const finalEl = imageContainerRef.current;
      const textEl = textContainerRef.current;
      const captionEl = captionContainerRef.current;
      const closeEl = closeButtonRef.current;
      const veilEl = containerRef.current?.querySelector('.dark-veil-wrapper');

      // 1. Set initial state for non-image elements (fade in/slide up)
      // Ensure they are hidden initially to prevent flash
      gsap.set([textEl, captionEl, closeEl], { 
        y: 50, 
        opacity: 0,
        visibility: 'visible' // Make visible for GSAP to handle
      });
      
      // Set initial state for veil
      if (veilEl) {
        gsap.set(veilEl, { opacity: 0, visibility: 'visible' });
      }

      // 2. Calculate FLIP for the image container
      // Get final state
      const finalRect = finalEl.getBoundingClientRect();
      
      // Calculate delta
      const deltaX = initialRect.left - finalRect.left + (initialRect.width / 2 - finalRect.width / 2);
      const deltaY = initialRect.top - finalRect.top + (initialRect.height / 2 - finalRect.height / 2);
      const scaleX = initialRect.width / finalRect.width;
      const scaleY = initialRect.height / finalRect.height;
      const scale = Math.max(scaleX, scaleY);
      
      // Ensure image container is visible for animation
      gsap.set(finalEl, { visibility: 'visible' });

      // Animate from initial position (reverse of exit)
      gsap.fromTo(finalEl, 
        {
          x: deltaX,
          y: deltaY,
          scale: scale,
          opacity: 0 // Start transparent to mirror exit's fade out
        },
        {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "power3.inOut"
        }
      );

      // 3. Animate other elements in
      gsap.to([textEl, captionEl, closeEl], {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.3,
        ease: "power3.out"
      });

      // Animate veil in
      if (veilEl) {
        gsap.to(veilEl, {
          opacity: 1,
          duration: 0.8,
          ease: "power2.out"
        });
      }

    } else if (!isVisible && shouldRender && initialRect && imageContainerRef.current) {
      // Exit animation - reverse FLIP
      const finalEl = imageContainerRef.current;
      const textEl = textContainerRef.current;
      const captionEl = captionContainerRef.current;
      const closeEl = closeButtonRef.current;
      const veilEl = containerRef.current?.querySelector('.dark-veil-wrapper');

      // Fade out details
      gsap.to([textEl, captionEl, closeEl], {
        y: 50,
        opacity: 0,
        duration: 0.4,
        ease: "power3.in"
      });

      // Fade out veil
      if (veilEl) {
        gsap.to(veilEl, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.in"
        });
      }

      // Animate image back to initial position
      const finalRect = finalEl.getBoundingClientRect();
      const deltaX = initialRect.left - finalRect.left + (initialRect.width / 2 - finalRect.width / 2);
      const deltaY = initialRect.top - finalRect.top + (initialRect.height / 2 - finalRect.height / 2);
      const scaleX = initialRect.width / finalRect.width;
      const scaleY = initialRect.height / finalRect.height;
      const scale = Math.max(scaleX, scaleY); // Use same scale logic as entrance

      gsap.to(finalEl, {
        x: deltaX,
        y: deltaY,
        scale: scale,
        opacity: 0, // Fade out at the end
        duration: 0.6,
        ease: "power3.inOut"
      });
    }
  }, [isVisible, shouldRender, initialRect]);

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isVisible) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible, onClose]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Drag handling
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

    if (dragOffset > 50) {
      prevImage();
    } else if (dragOffset < -50) {
      nextImage();
    }

    setDragOffset(0);
  };

  // Scroll handling for carousel
  const lastScrollTime = useRef(0);
  const scrollCooldown = 500; // ms

  const handleWheel = (e: React.WheelEvent) => {
    // Only handle wheel if we have multiple images
    if (images.length <= 1) return;

    const now = Date.now();
    if (now - lastScrollTime.current < scrollCooldown) return;

    // Detect direction
    if (Math.abs(e.deltaY) > 10) {
      if (e.deltaY > 0) {
        nextImage();
      } else {
        prevImage();
      }
      lastScrollTime.current = now;
    }
  };

  const getImageStyle = (index: number): React.CSSProperties => {
    const totalImages = images.length;
    
    // Calculate diff with wrapping
    let diff = index - currentImageIndex;
    
    // Adjust diff for wrapping if we have enough images
    if (totalImages > 2) {
      if (diff < -1) diff += totalImages;
      if (diff > 1) diff -= totalImages;
      
      // Handle edge case where totalImages is small (e.g. 3) and we might have ambiguity
      // But for simple prev/current/next logic:
      // If current is 0, prev is index (total-1), diff becomes (total-1) - 0 = total-1. 
      // We want it to be -1. So if diff > total/2, subtract total.
      // If current is last, next is 0. diff becomes 0 - (total-1) = -(total-1).
      // We want it to be 1. So if diff < -total/2, add total.
      
      // Re-calculate strictly based on shortest path
      const directDiff = index - currentImageIndex;
      const wrappedDiff = directDiff > 0 
        ? directDiff - totalImages 
        : directDiff + totalImages;
        
      if (Math.abs(wrappedDiff) < Math.abs(directDiff)) {
        diff = wrappedDiff;
      }
    }

    // Only show current, prev, and next
    if (Math.abs(diff) > 1) {
      return { display: 'none' };
    }
    
    // Diagonal Layout: Top-Left to Bottom-Right
    // Prev: Top-Left, Faded
    // Next: Bottom-Right, Faded
    
    if (diff === -1) {
      return {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-80%, -80%) scale(0.8)', // Move up-left
        opacity: 0.4,
        zIndex: 1,
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        filter: 'blur(1px)', // Optional depth effect
      };
    } else if (diff === 0) {
      return {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: 1,
        zIndex: 10,
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', // Add shadow to pop
      };
    } else if (diff === 1) {
      return {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-20%, -20%) scale(0.8)', // Move down-right
        opacity: 0.4,
        zIndex: 1,
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        filter: 'blur(1px)',
      };
    }

    return { display: 'none' };
  };

  if (!shouldRender || !card) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <div className="relative z-10 w-full h-full">
        {/* Image carousel section */}
        <div
          ref={imageContainerRef}
          className={`absolute ${
            isWideLayout
              ? 'left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2'
              : 'left-1/2 top-[32%] -translate-x-1/2 -translate-y-1/2'
          } cursor-grab active:cursor-grabbing invisible`}
          onMouseDown={(e) => handleDragStart(e.clientY)}
          onMouseMove={(e) => handleDragMove(e.clientY)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
          onTouchEnd={handleDragEnd}
          onWheel={handleWheel} // Add wheel listener
        >
          <div className="relative" style={{
            width: isWideLayout ? 'min(50vw, 668px)' : 'min(65vw, 459px)',
            height: isWideLayout ? 'min(60vh, 573px)' : 'min(50vh, 394px)',
            perspective: '1200px'
          }}>
            {images.map((img, index) => (
              <div
                key={index}
                style={{
                  ...getImageStyle(index),
                  width: isWideLayout ? 'min(33vw, 445px)' : 'min(55vw, 306px)',
                  height: isWideLayout ? 'min(40vh, 369px)' : 'min(36vh, 254px)',
                }}
                className="rounded-lg overflow-hidden"
              >
                <div className="relative w-full h-full">
                  <img
                    ref={index === currentImageIndex ? mainImageRef : null}
                    src={img.url}
                    alt={img.caption || card.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient Mask for non-active images */}
                  {index !== currentImageIndex && (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))'
                      }}
                    />
                  )}
                  {/* Bottom gradient for all images */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 37%, rgba(0, 0, 0, 0.267) 100%)'
                    }}
                  />
                </div>
              </div>
            ))}
            
            {/* Removed Arrow Buttons */}
          </div>
        </div>

        {/* Text content */}
        <div
          ref={textContainerRef}
          className={`absolute flex flex-col ${
            isWideLayout
              ? 'left-[30%] top-[68%] w-[26%]'
              : 'left-[6%] right-[6%] bottom-[18%] w-[63%]'
          } ${!isWideLayout ? 'gap-[10px]' : ''} invisible`}
        >
          <h2
            className={`font-bold text-white leading-normal ${
              isWideLayout ? 'text-[clamp(1.25rem,2vw,1.768rem)] mb-4' : 'text-[1.25rem] shrink-0'
            }`}
            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          >
            {card.title}
          </h2>
          <div
            className={`text-white leading-[1.65] overflow-y-auto pr-4 custom-scrollbar ${
              isWideLayout ? 'text-[clamp(0.6875rem,1vw,0.829rem)] max-h-[18vh]' : 'text-[0.6rem] max-h-[21vh]'
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

        {/* Captions */}
        {isWideLayout ? (
          <div
            ref={captionContainerRef}
            className="absolute left-[64%] top-[65%] z-20 flex items-start gap-4 invisible"
          >
            <div className="w-[104px] text-right flex-shrink-0">
              <p className="text-white font-medium text-[0.875rem] mt-[2px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                {images[currentImageIndex].caption || ''}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="relative">
                <p
                  className="text-[1rem] font-bold text-white"
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                >
                  {String(currentImageIndex + 1).padStart(2, '0')}
                </p>
                <div className="absolute bottom-[-4px] left-0 w-[39px] h-0 border-b border-white" />
              </div>
              <p
                className="text-[1rem] font-bold text-[#515151]"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              >
                {String(images.length).padStart(2, '0')}
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={captionContainerRef}
            className="absolute right-[10%] top-[56%] z-20 flex items-start gap-3 invisible"
          >
            <div className="w-[80px] text-right flex-shrink-0">
              <p className="text-white font-medium text-[0.875rem] mt-[2px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                {images[currentImageIndex].caption || ''}
              </p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <div className="relative">
                <p
                  className="text-[1rem] font-bold text-white"
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                >
                  {String(currentImageIndex + 1).padStart(2, '0')}
                </p>
                <div className="absolute bottom-[-4px] left-0 w-[39px] h-[1px] bg-white" />
              </div>
              <p
                className="text-[1rem] font-bold text-[#515151]"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
              >
                {String(images.length).padStart(2, '0')}
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        ref={closeButtonRef}
        onClick={onClose}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 w-[85px] h-[40px] flex items-center justify-center invisible"
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
