import { useEffect, useState } from 'react';
import { api, type Block, type Card, type Image } from '../api';

const API_BASE = 'http://localhost:3001';

export default function Admin() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<{ blockId: string; card: Card } | null>(null);

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const data = await api.getBlocks();
      setBlocks(data);
    } catch (err) {
      console.error('載入失敗:', err);
      alert('載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;

    try {
      await api.createBlock({ title, cards: [] });
      await loadBlocks();
      setShowBlockForm(false);
    } catch (err) {
      console.error('建立區塊失敗:', err);
      alert('建立區塊失敗');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('確定要刪除此區塊嗎？')) return;

    try {
      await api.deleteBlock(blockId);
      await loadBlocks();
    } catch (err) {
      console.error('刪除失敗:', err);
      alert('刪除失敗');
    }
  };

  const handleDeleteCard = async (blockId: string, cardId: string) => {
    if (!confirm('確定要刪除此卡片嗎？')) return;

    try {
      await api.deleteCard(blockId, cardId);
      await loadBlocks();
    } catch (err) {
      console.error('刪除失敗:', err);
      alert('刪除失敗');
    }
  };

  const toggleCardVisibility = async (blockId: string, cardId: string, currentVisible: boolean) => {
    try {
      await api.updateCard(blockId, cardId, { visible: !currentVisible });
      await loadBlocks();
    } catch (err) {
      console.error('更新可見性失敗:', err);
      alert('更新可見性失敗');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">載入中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">展覽管理系統</h1>
            <div className="space-x-4">
              <a
                href="/"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 inline-block"
              >
                查看展示
              </a>
              <button
                onClick={() => setShowBlockForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                + 新增區塊
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {blocks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">目前沒有任何區塊</p>
            <button
              onClick={() => setShowBlockForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
            >
              建立第一個區塊
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {blocks.map((block) => (
              <div key={block.id} className="bg-white rounded-lg shadow-md p-6">
                {/* Block Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{block.title || '未命名區塊'}</h2>
                    <p className="text-sm text-gray-500">{block.cards.length} 張卡片</p>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => setShowCardForm(block.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      + 新增卡片
                    </button>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      刪除區塊
                    </button>
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {block.cards.map((card) => {
                    const isVisible = card.visible !== false; // Default to true if undefined
                    return (
                      <div
                        key={card.id}
                        className={`border rounded-lg p-4 hover:shadow-lg transition-shadow relative ${
                          !isVisible ? 'opacity-60 bg-gray-50' : ''
                        }`}
                      >
                        {/* Visibility Status Badge */}
                        <div className="absolute top-2 right-2 z-10">
                          <button
                            onClick={() => toggleCardVisibility(block.id, card.id, isVisible)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 transition-colors ${
                              isVisible
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                            title={isVisible ? '點擊隱藏' : '點擊顯示'}
                          >
                            <span>{isVisible ? '👁️' : '👁️‍🗨️'}</span>
                            <span>{isVisible ? '顯示中' : '已隱藏'}</span>
                          </button>
                        </div>

                        {card.images.length > 0 && (
                          <img
                            src={`${API_BASE}${card.images[0].url}`}
                            alt={card.title}
                            className="w-full h-48 object-cover rounded mb-3"
                          />
                        )}
                        <h3 className="font-bold text-lg mb-2">{card.title}</h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-3">{card.description}</p>
                        <p className="text-xs text-gray-500 mb-3">{card.images.length} 張圖片</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingCard({ blockId: block.id, card })}
                            className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleDeleteCard(block.id, card.id)}
                            className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Show Card Form for this block */}
                {showCardForm === block.id && (
                  <CardForm
                    blockId={block.id}
                    onClose={() => setShowCardForm(null)}
                    onSuccess={loadBlocks}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Block Form Modal */}
      {showBlockForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">新增區塊</h3>
            <form onSubmit={handleCreateBlock}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">區塊標題</label>
                <input
                  type="text"
                  name="title"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  建立
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlockForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Card Modal */}
      {editingCard && (
        <CardForm
          blockId={editingCard.blockId}
          existingCard={editingCard.card}
          onClose={() => setEditingCard(null)}
          onSuccess={loadBlocks}
        />
      )}
    </div>
  );
}

// Card Form Component
interface CardFormProps {
  blockId: string;
  existingCard?: Card;
  onClose: () => void;
  onSuccess: () => void;
}

function CardForm({ blockId, existingCard, onClose, onSuccess }: CardFormProps) {
  const [title, setTitle] = useState(existingCard?.title || '');
  const [description, setDescription] = useState(existingCard?.description || '');
  const [images, setImages] = useState<Image[]>(existingCard?.images || []);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const result = await api.uploadMultipleImages(fileArray);
      setImages([...images, ...result.images.map(img => ({ url: img.url, caption: '' }))]);
    } catch (err) {
      console.error('上傳失敗:', err);
      alert('上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const cardData = { title, description, images };
      if (existingCard) {
        await api.updateCard(blockId, existingCard.id, cardData);
      } else {
        await api.createCard(blockId, cardData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('儲存失敗:', err);
      alert('儲存失敗');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateImageCaption = (index: number, caption: string) => {
    const newImages = [...images];
    newImages[index].caption = caption;
    setImages(newImages);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
        <h3 className="text-xl font-bold mb-4">
          {existingCard ? '編輯卡片' : '新增卡片'}
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">標題 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">說明文字</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2 h-32"
              placeholder="輸入卡片說明..."
            />
          </div>

          {/* Images */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">圖片</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full border rounded px-3 py-2 mb-3"
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-gray-600">上傳中...</p>}

            {/* Image Preview */}
            <div className="space-y-3">
              {images.map((image, idx) => (
                <div key={idx} className="border rounded p-3 flex items-start space-x-3">
                  <img
                    src={`${API_BASE}${image.url}`}
                    alt={`預覽 ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={image.caption || ''}
                      onChange={(e) => updateImageCaption(idx, e.target.value)}
                      placeholder="圖片說明（可選）"
                      className="w-full border rounded px-2 py-1 text-sm mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      移除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              儲存
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
