import { useEffect, useState } from "react";
import { api, type Block } from "../api";
import EnhancedGallery from "../components/EnhancedGallery";
import BlockNavigator from "../components/BlockNavigator";
import Header from "../components/Header";
import type { GalleryCard } from "../components/CircularGallery";
import { useFlipTransition } from "../hooks/useFlipTransition";
import { DetailPanel } from "../components/DetailPanel";
import PixelBlast from "../components/PixelBlast";

const API_BASE = "http://localhost:3001";

export default function Exhibition() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [targetCardIndex, setTargetCardIndex] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FLIP Animation Hook
  const { viewMode, selectedId, selectedRect, handleOpen, handleClose } = useFlipTransition();

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

  // Get current block
  const currentBlock = blocks[currentBlockIndex];

  // Prepare gallery items from current block's visible cards
  const galleryItems: GalleryCard[] = currentBlock
    ? currentBlock.cards
        .filter((card) => card.visible !== false && card.images.length > 0)
        .map((card) => ({
          id: card.id, // Ensure ID is passed
          image: `${API_BASE}${card.images[0].url}`,
          images: card.images.map((img) => ({
            url: `${API_BASE}${img.url}`,
            caption: img.caption,
          })),
          title: card.title,
          description: card.description,
          imageCaption: card.images[0]?.caption,
        }))
    : [];

  if (galleryItems.length === 0 && blocks.length > 0) {
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

  // 處理點擊 Progress Bar 切換卡片
  const handleCardChange = (cardIndex: number) => {
    setTargetCardIndex(cardIndex);
    // 重置 targetCardIndex，避免影響後續的滑動操作
    setTimeout(() => setTargetCardIndex(undefined), 100);
  };

  // Find selected card for detail view
  const selectedCard = galleryItems.find(item => item.id === selectedId) || null;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#000000' }}>
      {/* PixelBlast Background */}
      <div className="fixed inset-0 z-0">
        <PixelBlast
          variant="square"
          pixelSize={4}
          color="#f16f96"
          patternScale={2.5}
          patternDensity={1}
          enableRipples
          rippleSpeed={0.3}
          rippleThickness={0.1}
          rippleIntensityScale={1}
          speed={0.5}
          transparent
          edgeFade={0.25}
        />
      </div>

      {/* Header */}
      <div className={`relative z-10 transition-opacity duration-500 ${viewMode === 'detail' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Header />
      </div>

      {/* Enhanced Gallery */}
      <div
        className={`relative z-10 w-screen transition-opacity duration-500 ${viewMode === 'detail' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ height: 'calc(100vh - 150px)' }}
      >
        <EnhancedGallery
          items={galleryItems}
          bend={1}
          scrollSpeed={2}
          scrollEase={0.05}
          onCardIndexChange={setCurrentCardIndex}
          targetCardIndex={targetCardIndex}
          onCardClick={(card, rect) => handleOpen(card.id || '', rect)}
        />
      </div>

      {/* Block Navigator */}
      {blocks.length > 0 && (
        <div className={`relative z-10 transition-opacity duration-500 ${viewMode === 'detail' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <BlockNavigator
            blocks={blocks}
            currentBlockIndex={currentBlockIndex}
            currentCardIndex={currentCardIndex}
            currentCardCount={galleryItems.length}
            onBlockChange={setCurrentBlockIndex}
            onCardChange={handleCardChange}
          />
        </div>
      )}

      {/* Navigation to Admin */}
      <div className={`fixed bottom-[160px] right-4 z-20 transition-opacity duration-500 ${viewMode === 'detail' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <a
          href="/admin"
          className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          管理介面
        </a>
      </div>

      {/* Detail Panel */}
      <DetailPanel 
        card={selectedCard}
        isVisible={viewMode === 'detail'}
        onClose={handleClose}
        initialRect={selectedRect}
      />
    </div>
  );
}
