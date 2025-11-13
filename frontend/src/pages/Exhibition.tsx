import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { api, type Block } from '../api';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const API_BASE = 'http://localhost:3001';

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
                  <div className="bg-white rounded-lg overflow-hidden shadow-lg h-full">
                    {/* Card Images */}
                    {card.images.length > 0 && (
                      <div className="relative h-64 bg-gray-200">
                        {card.images.length === 1 ? (
                          <img
                            src={`${API_BASE}${card.images[0].url}`}
                            alt={card.images[0].caption || card.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Swiper
                            modules={[Pagination]}
                            pagination={{ clickable: true }}
                            className="h-full"
                          >
                            {card.images.map((image, idx) => (
                              <SwiperSlide key={idx}>
                                <img
                                  src={`${API_BASE}${image.url}`}
                                  alt={image.caption || `${card.title} - 圖片 ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </SwiperSlide>
                            ))}
                          </Swiper>
                        )}
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold mb-3 text-gray-800">
                        {card.title}
                      </h3>

                      {card.description && (
                        <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {card.description}
                        </div>
                      )}

                      {/* Image Captions */}
                      {card.images.some(img => img.caption) && (
                        <div className="mt-4 space-y-2">
                          {card.images.map((image, idx) =>
                            image.caption ? (
                              <p key={idx} className="text-sm text-gray-500 italic">
                                圖 {idx + 1}: {image.caption}
                              </p>
                            ) : null
                          )}
                        </div>
                      )}
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
