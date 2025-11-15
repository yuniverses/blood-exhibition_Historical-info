import { useEffect, useState } from "react";
import { api, type Block } from "../api";
import CircularGallery from "../components/CircularGallery";

const API_BASE = "http://localhost:3001";

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
      setError("載入資料失敗");
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

  // Prepare gallery items from all visible cards
  const galleryItems = blocks.flatMap((block) =>
    block.cards
      .filter((card) => card.visible !== false && card.images.length > 0)
      .map((card) => ({
        image: `${API_BASE}${card.images[0].url}`,
        text: card.title,
      }))
  );

  if (galleryItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl text-gray-600 mb-4">目前沒有可顯示的卡片</h2>
          <a href="/admin" className="text-blue-600 hover:underline">
            前往管理介面新增內容
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Page Title */}

      {/* Circular Gallery */}
      <div className="w-screen h-screen">
        <CircularGallery
          items={galleryItems}
          bend={1}
          textColor="#ffffff"
          borderRadius={0.05}
          font="bold 30px 'Noto Sans TC', sans-serif"
          scrollSpeed={2}
          scrollEase={0.05}
        />
      </div>

      {/* Navigation to Admin */}
      <div className="fixed bottom-4 right-4 z-20">
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
