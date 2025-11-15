import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { api, type Block } from '../api';
import { IconChevronLeft, IconChevronRight } from '../components/Icons';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const API_BASE = 'http://localhost:3001';

// Card Image Slider Component
function CardImageSlider({ images, title }: { images: Array<{ url: string; caption?: string }>; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) {
    return <div className="h-64 bg-gray-200" />;
  }

  if (images.length === 1) {
    return (
      <div className="flex flex-col gap-2">
        <img
          src={`${API_BASE}${images[0].url}`}
          alt={images[0].caption || title}
          className="w-full h-64 object-cover"
        />
        {images[0].caption && (
          <p className="font-medium text-[#292c33] text-[14px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
            {images[0].caption}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-64">
        <img
          src={`${API_BASE}${images[currentIndex].url}`}
          alt={images[currentIndex].caption || `${title} - 圖片 ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Left Arrow */}
        <button
          onClick={prevImage}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-[#bbbbbb] hover:bg-[#999999] rounded-full p-2 transition-colors z-10"
          aria-label="上一張"
        >
          <IconChevronLeft size={20} className="text-white" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={nextImage}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#bbbbbb] hover:bg-[#999999] rounded-full p-2 transition-colors z-10"
          aria-label="下一張"
        >
          <IconChevronRight size={20} className="text-white" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-2.5 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex ? 'bg-white' : 'bg-gray-400'
              }`}
              aria-label={`切換到第 ${i + 1} 張`}
            />
          ))}
        </div>
      </div>
      {/* Current Image Caption */}
      {images[currentIndex].caption && (
        <p className="font-medium text-[#292c33] text-[14px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
          {images[currentIndex].caption}
        </p>
      )}
    </div>
  );
}

export default function Exhibition() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const data = await api.getBlocks();
      setBlocks(data);
      setError(null);
    } catch (err) {
      setError('載入資料失敗');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl text-gray-600 mb-4">目前沒有展示內容</h2>
          <a href="/admin" className="text-blue-600 hover:underline">
            前往管理介面新增內容
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {blocks.map((block) => {
          // Filter out hidden cards (visible === false)
          const visibleCards = block.cards.filter((card) => card.visible !== false);

          // Skip rendering block if no visible cards
          if (visibleCards.length === 0) return null;

          return (
            <div key={block.id} className="mb-16">
              {block.title && (
                <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">
                  {block.title}
                </h2>
              )}

              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                className="rounded-lg shadow-2xl"
                breakpoints={{
                  640: {
                    slidesPerView: 1,
                  },
                  768: {
                    slidesPerView: 2,
                  },
                  1024: {
                    slidesPerView: 3,
                  },
                }}
              >
                {visibleCards.map((card) => (
                <SwiperSlide key={card.id}>
                  <div className="bg-white rounded-lg overflow-hidden shadow-lg h-full p-6">
                    <div className="flex flex-col gap-5">
                      {/* Card Images with Caption */}
                      {card.images.length > 0 && (
                        <CardImageSlider images={card.images} title={card.title} />
                      )}

                      {/* Card Content */}
                      <div className="flex flex-col gap-2">
                        <h3 className="font-bold text-[#292c33] text-[28px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                          {card.title}
                        </h3>

                        {card.description && (
                          <p className="font-medium text-[#292c33] text-[16px] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                            {card.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
                ))}
              </Swiper>
            </div>
          );
        })}
      </div>

      {/* Navigation to Admin */}
      <div className="fixed bottom-4 right-4">
        <a
          href="/admin"
          className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          管理介面
        </a>
      </div>
    </div>
  );
}
