import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Block, type Card, type Image } from '../api';
import { IconSearch, IconEdit, IconLogOut, IconAdd, IconUpload, IconX, IconChevronLeft, IconChevronRight } from '../components/Icons';
import { resolveImageUrl } from '../lib/imageUrl';

export default function Admin() {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [editingBlockTitle, setEditingBlockTitle] = useState(false);
  const [blockTitleInput, setBlockTitleInput] = useState('');

  useEffect(() => {
    loadBlocks();
  }, []);

  useEffect(() => {
    if (blocks.length > 0 && !currentBlockId) {
      setCurrentBlockId(blocks[0].id);
    }
  }, [blocks, currentBlockId]);

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
      const newBlock = await api.createBlock({ title, cards: [] });
      await loadBlocks();
      setCurrentBlockId(newBlock.id);
      setShowBlockForm(false);
    } catch (err) {
      console.error('建立區塊失敗:', err);
      alert('建立區塊失敗');
    }
  };

  const handleDeleteBlock = async () => {
    if (!currentBlockId) return;
    if (!confirm('確定要刪除此區塊嗎？')) return;

    try {
      await api.deleteBlock(currentBlockId);
      await loadBlocks();
      setCurrentBlockId(null);
    } catch (err) {
      console.error('刪除失敗:', err);
      alert('刪除失敗');
    }
  };

  const handleStartEditBlockTitle = () => {
    const currentBlock = blocks.find(b => b.id === currentBlockId);
    if (currentBlock) {
      setBlockTitleInput(currentBlock.title || '');
      setEditingBlockTitle(true);
    }
  };

  const handleUpdateBlockTitle = async () => {
    if (!currentBlockId || !blockTitleInput.trim()) return;

    try {
      await api.updateBlock(currentBlockId, { title: blockTitleInput.trim() });
      await loadBlocks();
      setEditingBlockTitle(false);
    } catch (err) {
      console.error('更新區塊名稱失敗:', err);
      alert('更新區塊名稱失敗');
    }
  };

  const handleCancelEditBlockTitle = () => {
    setEditingBlockTitle(false);
    setBlockTitleInput('');
  };

  const handleBatchDelete = async () => {
    if (!currentBlockId || selectedCards.size === 0) return;
    if (!confirm(`確定要刪除選中的 ${selectedCards.size} 張卡片嗎？`)) return;

    try {
      for (const cardId of selectedCards) {
        await api.deleteCard(currentBlockId, cardId);
      }
      await loadBlocks();
      setSelectedCards(new Set());
    } catch (err) {
      console.error('批量刪除失敗:', err);
      alert('批量刪除失敗');
    }
  };

  const handleBatchVisibility = async (visible: boolean) => {
    if (!currentBlockId || selectedCards.size === 0) return;

    try {
      for (const cardId of selectedCards) {
        await api.updateCard(currentBlockId, cardId, { visible });
      }
      await loadBlocks();
      setSelectedCards(new Set());
    } catch (err) {
      console.error('批量更新失敗:', err);
      alert('批量更新失敗');
    }
  };

  const toggleCardSelection = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const toggleAllCards = () => {
    if (!currentBlock) return;
    const filteredCards = getFilteredCards();
    if (selectedCards.size === filteredCards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(filteredCards.map((c) => c.id)));
    }
  };

  const getFilteredCards = () => {
    if (!currentBlock) return [];
    if (!searchQuery) return currentBlock.cards;
    return currentBlock.cards.filter((card) =>
      card.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const currentBlock = blocks.find((b) => b.id === currentBlockId);
  const filteredCards = getFilteredCards();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">載入中...</div>;
  }

  return (
    <div className="bg-white relative min-h-screen">
      {/* Sidebar */}
      <div className="bg-[#f2f2f2] flex flex-col gap-8 px-5 py-6 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-[294px] lg:gap-12 lg:px-[40px] lg:py-[50px] lg:items-center">
        <p className="font-bold text-[24px] text-black w-full lg:text-[28px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
          資料管理系統
        </p>

        <div className="flex flex-col gap-8 lg:h-full lg:items-start lg:justify-between w-full">
          <div className="flex flex-col gap-0">
            <p className="font-semibold text-[#838383] text-[16px] mb-2" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
              資料呈現區
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:w-[214px] lg:overflow-visible lg:pb-0">
              {blocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => setCurrentBlockId(block.id)}
                  className={`flex min-w-fit items-center px-4 py-2.5 text-left rounded transition-colors lg:w-full lg:px-5 ${
                    currentBlockId === block.id ? 'bg-[#c5e4ff]' : 'hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium text-[16px] text-black whitespace-nowrap lg:text-[20px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                    {block.title || '未命名區塊'}
                  </p>
                </button>
              ))}
              <button
                onClick={() => setShowBlockForm(true)}
                className="bg-white flex gap-2 items-center px-4 py-2.5 rounded min-w-fit lg:w-full lg:mt-2 lg:px-5 hover:bg-gray-50 transition-colors"
              >
                <IconAdd size={18} className="text-[#838383]" />
                <p className="font-medium text-[#838383] text-[16px] whitespace-nowrap lg:text-[18px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                  新增區塊
                </p>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:gap-[30px] lg:w-[214px]">
            <button
              onClick={() => navigate('/')}
              className="bg-white flex items-center justify-center px-5 py-2.5 rounded w-full"
            >
              <p className="font-medium text-[18px] text-black" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                查看展示
              </p>
            </button>

            <div className="hidden lg:flex items-center justify-between w-full">
              <div className="flex gap-3 items-center">
                <div className="size-9 rounded-full bg-gray-300" />
                <p className="font-medium text-[18px] text-black" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                  User 01
                </p>
              </div>
              <IconLogOut size={24} className="text-black cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-5 px-5 py-6 lg:ml-[294px] lg:p-12">
        {currentBlock ? (
          <>
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-1.5">
                <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                  資料呈現區
                </p>
                {editingBlockTitle ? (
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <input
                      type="text"
                      value={blockTitleInput}
                      onChange={(e) => setBlockTitleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateBlockTitle();
                        } else if (e.key === 'Escape') {
                          handleCancelEditBlockTitle();
                        }
                      }}
                      className="font-bold text-[24px] lg:text-[28px] text-black border-b-2 border-blue-500 outline-none bg-transparent"
                      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelEditBlockTitle}
                        className="bg-white border border-[#5a5a5a] flex items-center justify-center px-4 py-2 rounded"
                      >
                        <p className="font-medium text-[#838383] text-[14px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                          取消
                        </p>
                      </button>
                      <button
                        onClick={handleUpdateBlockTitle}
                        className="bg-[#339cfd] flex items-center justify-center px-4 py-2 rounded"
                      >
                        <p className="font-medium text-white text-[14px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                          儲存
                        </p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 items-center">
                    <p className="font-bold text-[24px] lg:text-[28px] text-black" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                      {currentBlock.title || '未命名區塊'}
                    </p>
                    <button onClick={handleStartEditBlockTitle}>
                      <IconEdit size={24} className="text-black hover:text-gray-600 transition-colors" />
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleDeleteBlock}
                className="border border-[#ff2f2f] flex items-center justify-center px-5 py-2.5 rounded self-start lg:self-auto"
              >
                <p className="font-medium text-[#ff2f2f] text-[14px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                  刪除區塊
                </p>
              </button>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 lg:flex-row lg:gap-2.5 lg:items-center">
                <div className="bg-[#eaeaea] flex gap-2.5 items-center p-2.5 rounded-[7px] w-full lg:w-[190px]">
                  <IconSearch size={20} className="text-gray-600" />
                  <input
                    type="text"
                    placeholder="搜尋..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent outline-none flex-1 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={handleBatchDelete}
                    disabled={selectedCards.size === 0}
                    className={`border border-[#5a5a5a] flex items-center px-5 py-2.5 rounded ${
                      selectedCards.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <p className="font-medium text-[#161616] text-[14px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                      刪除卡片
                    </p>
                  </button>
                  <button
                    onClick={() => handleBatchVisibility(true)}
                    disabled={selectedCards.size === 0}
                    className={`border border-[#5a5a5a] flex items-center px-5 py-2.5 rounded ${
                      selectedCards.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <p className="font-medium text-[#161616] text-[14px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                      顯示
                    </p>
                  </button>
                  <button
                    onClick={() => handleBatchVisibility(false)}
                    disabled={selectedCards.size === 0}
                    className={`border border-[#5a5a5a] flex items-center px-5 py-2.5 rounded ${
                      selectedCards.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <p className="font-medium text-[#161616] text-[14px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                      隱藏
                    </p>
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingCard(null);
                  setShowCardForm(true);
                }}
                className="bg-[#339cfd] flex gap-2 items-center justify-center px-5 py-2.5 rounded w-full lg:w-auto"
              >
                <IconAdd size={16} className="text-white" />
                <p className="font-medium text-[14px] text-white" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                  新增卡片
                </p>
              </button>
            </div>

            {/* Mobile Card List */}
            <div className="flex flex-col gap-3 lg:hidden">
              {filteredCards.length === 0 ? (
                <div className="bg-[#f7f7f7] rounded-[10px] p-5 text-center text-gray-500">沒有卡片資料</div>
              ) : (
                filteredCards.map((card) => {
                  const isVisible = card.visible !== false;
                  return (
                    <div
                      key={card.id}
                      className="bg-[#f7f7f7] rounded-[14px] p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedCards.has(card.id)}
                            onChange={() => toggleCardSelection(card.id)}
                            className="mt-1 size-5 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[18px] text-black break-words" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                              {card.title}
                            </p>
                            <p className="mt-1 text-sm text-[#838383]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                              {isVisible ? '顯示中' : '已隱藏'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setEditingCard(card);
                            setShowCardForm(true);
                          }}
                          className="border border-[#5a5a5a] rounded px-3 py-1.5 text-sm"
                        >
                          編輯
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded bg-white p-3">
                          <p className="text-[#838383] mb-1">建立者</p>
                          <p>User 01</p>
                        </div>
                        <div className="rounded bg-white p-3">
                          <p className="text-[#838383] mb-1">狀態</p>
                          <p>{isVisible ? '顯示' : '隱藏'}</p>
                        </div>
                        <div className="rounded bg-white p-3">
                          <p className="text-[#838383] mb-1">建立日期</p>
                          <p>{card.createdAt ? new Date(card.createdAt).toLocaleDateString('zh-TW') : '2022.6.10'}</p>
                        </div>
                        <div className="rounded bg-white p-3">
                          <p className="text-[#838383] mb-1">最後更新</p>
                          <p>{card.updatedAt ? new Date(card.updatedAt).toLocaleDateString('zh-TW') : '2022.6.10'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:flex bg-[#f7f7f7] flex-col gap-4 p-5 rounded-[10px]">
              {/* Table Header */}
              <div className="flex items-center px-3.5">
                <div className="flex items-center justify-center w-[30px]">
                  <input
                    type="checkbox"
                    checked={selectedCards.size === getFilteredCards().length && getFilteredCards().length > 0}
                    onChange={toggleAllCards}
                    className="size-5 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-center flex-1">
                  <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                    標題
                  </p>
                </div>
                <div className="flex items-center justify-center w-[134px]">
                  <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                    建立者
                  </p>
                </div>
                <div className="flex items-center justify-center w-[204px]">
                  <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                    建立日期
                  </p>
                </div>
                <div className="flex items-center justify-center w-[204px]">
                  <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                    最後更新
                  </p>
                </div>
                <div className="flex items-center justify-center w-[112px]">
                  <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                    狀態
                  </p>
                </div>
              </div>

              {/* Table Rows */}
              <div className="flex flex-col gap-2">
                {filteredCards.length === 0 ? (
                  <div className="bg-white flex items-center justify-center px-3.5 py-5 rounded-[5px]">
                    <p className="text-gray-500">沒有卡片資料</p>
                  </div>
                ) : (
                  filteredCards.map((card) => {
                    const isVisible = card.visible !== false;
                    return (
                      <div
                        key={card.id}
                        className="bg-white flex items-center px-3.5 py-5 rounded-[5px] cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          setEditingCard(card);
                          setShowCardForm(true);
                        }}
                      >
                        <div
                          className="flex items-center justify-center w-[30px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCards.has(card.id)}
                            onChange={() => toggleCardSelection(card.id)}
                            className="size-5 cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center justify-center flex-1">
                          <p className="font-semibold text-[18px] text-black" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                            {card.title}
                          </p>
                        </div>
                        <div className="flex gap-2.5 items-center justify-center w-[134px]">
                          <div className="size-7 rounded-full bg-gray-300" />
                          <p className="font-semibold text-[16px] text-black" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                            User 01
                          </p>
                        </div>
                        <div className="flex items-center justify-center w-[204px]">
                          <p className="font-semibold text-[16px] text-black" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                            {card.createdAt ? new Date(card.createdAt).toLocaleDateString('zh-TW') : '2022.6.10'}
                          </p>
                        </div>
                        <div className="flex items-center justify-center w-[204px]">
                          <p className="font-semibold text-[16px] text-black" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                            {card.updatedAt ? new Date(card.updatedAt).toLocaleDateString('zh-TW') : '2022.6.10'}
                          </p>
                        </div>
                        <div className="flex items-center justify-center w-[112px]">
                          <p
                            className={`font-semibold text-[16px] ${isVisible ? 'text-black' : 'text-[#838383]'}`}
                            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                          >
                            {isVisible ? '顯示' : '隱藏'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)]">
            <p className="text-gray-600 mb-4 text-lg">目前沒有任何區塊</p>
            <button
              onClick={() => setShowBlockForm(true)}
              className="bg-[#339cfd] text-white px-6 py-3 rounded hover:bg-blue-600"
            >
              建立第一個區塊
            </button>
          </div>
        )}
      </div>

      {/* Block Form Modal */}
      {showBlockForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
              新增區塊
            </h3>
            <form onSubmit={handleCreateBlock}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                  區塊標題
                </label>
                <input
                  type="text"
                  name="title"
                  className="w-full border rounded px-3 py-2"
                  required
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#339cfd] text-white py-2 rounded hover:bg-blue-600"
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                >
                  建立
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlockForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                  style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card Form Modal */}
      {showCardForm && currentBlockId && (
        <CardForm
          blockId={currentBlockId}
          existingCard={editingCard || undefined}
          onClose={() => {
            setShowCardForm(false);
            setEditingCard(null);
          }}
          onSuccess={() => {
            loadBlocks();
            setShowCardForm(false);
            setEditingCard(null);
          }}
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
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(existingCard?.title || '');
  const [description, setDescription] = useState(existingCard?.description || '');
  const [images, setImages] = useState<Image[]>(existingCard?.images || []);
  const [visible, setVisible] = useState(existingCard?.visible !== false);
  const [uploading, setUploading] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    try {
      const data = await api.getBlocks();
      setBlocks(data);
      const block = data.find((b) => b.id === blockId);
      setCurrentBlock(block || null);
    } catch (err) {
      console.error('載入失敗:', err);
    }
  };

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

  const handleSave = async () => {
    if (!title.trim()) {
      alert('請輸入標題');
      return;
    }

    try {
      const cardData = { title, description, images, visible };
      if (existingCard) {
        await api.updateCard(blockId, existingCard.id, cardData);
      } else {
        await api.createCard(blockId, cardData);
      }
      onSuccess();
    } catch (err) {
      console.error('儲存失敗:', err);
      alert('儲存失敗');
    }
  };

  const handleDeleteCard = async () => {
    if (!existingCard) return;
    if (!confirm('確定要刪除此卡片嗎？')) return;

    try {
      await api.deleteCard(blockId, existingCard.id);
      onSuccess();
    } catch (err) {
      console.error('刪除失敗:', err);
      alert('刪除失敗');
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

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="bg-white fixed inset-0 z-50 overflow-y-auto">
      {/* Sidebar */}
      <div className="hidden lg:flex fixed bg-[#f2f2f2] h-screen flex-col gap-12 items-center px-[40px] py-[50px] w-[294px] left-0 top-0">
        <p className="font-bold text-[28px] text-black w-full" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
          資料管理系統
        </p>

        <div className="flex flex-col h-full items-start justify-between w-full">
          <div className="flex flex-col gap-0">
            <p className="font-semibold text-[#838383] text-[16px] mb-2" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
              資料呈現區
            </p>
            <div className="flex flex-col gap-2 w-[214px]">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className={`flex items-center px-5 py-2.5 w-full ${
                    blockId === block.id ? 'bg-[#c5e4ff]' : ''
                  }`}
                >
                  <p className="font-medium text-[20px] text-black" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                    {block.title || '未命名區塊'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[30px] w-[214px]">
            <button
              onClick={() => navigate('/')}
              className="bg-white flex items-center justify-center px-5 py-2.5 rounded w-full"
            >
              <p className="font-medium text-[18px] text-black" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                查看展示
              </p>
            </button>

            <div className="flex items-center justify-between w-full">
              <div className="flex gap-3 items-center">
                <div className="size-9 rounded-full bg-gray-300" />
                <p className="font-medium text-[18px] text-black" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                  User 01
                </p>
              </div>
              <IconLogOut size={24} className="text-black cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-5 px-5 py-6 lg:ml-[294px] lg:px-[93px] lg:py-12">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
              資料呈現區
            </p>
            <p className="font-bold text-[22px] lg:text-[28px] text-black" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
              {currentBlock?.title || '未命名區塊'} / {existingCard ? existingCard.title : '新增卡片'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="bg-white border border-[#5a5a5a] flex-1 lg:flex-none items-center justify-center px-5 py-2.5 rounded"
            >
              <p className="font-medium text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                取消
              </p>
            </button>
            <button
              onClick={handleSave}
              className="bg-[#339cfd] flex-1 lg:flex-none items-center justify-center px-5 py-2.5 rounded"
            >
              <p className="font-medium text-[16px] text-white" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                儲存
              </p>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-5">
          {/* Left Panel */}
          <div className="flex flex-col gap-5 w-full lg:w-[601px]">
            {/* Image Upload */}
            <div className="flex flex-col gap-3">
              <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                圖片
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-[#f7f7f7] flex flex-col gap-3 h-[137px] items-center justify-center rounded-[10px] hover:bg-gray-200 transition-colors"
              >
                <IconUpload size={48} className="text-[#838383]" />
                <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                  {uploading ? '上傳中...' : '點擊上傳圖片'}
                </p>
              </button>
            </div>

            {/* Image List */}
            {images.map((image, idx) => (
              <div key={idx} className="border border-[#d9d9d9] flex flex-col gap-4 p-3.5 rounded-[10px] sm:flex-row sm:gap-6">
                <div className="relative bg-[#d9d9d9] h-[180px] w-full sm:h-[100px] sm:w-[160px] rounded-[10px] flex items-center justify-center overflow-hidden">
                  {image.url ? (
                    <img
                      src={resolveImageUrl(image.url)}
                      alt={`圖片 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                      圖片 {idx + 1}
                    </p>
                  )}
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute right-2 top-2 bg-white rounded-full p-1 hover:bg-red-100 transition-colors"
                  >
                    <IconX size={16} className="text-red-500" />
                  </button>
                </div>
                <div className="flex-1 flex flex-col gap-2.5">
                  <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                    圖片說明文字
                  </p>
                  <input
                    type="text"
                    value={image.caption || ''}
                    onChange={(e) => updateImageCaption(idx, e.target.value)}
                    placeholder="請輸入（可選）"
                    className="bg-white border border-[#d9d9d9] px-2.5 py-2.5 rounded-[5px] text-[14px]"
                    style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                  />
                </div>
              </div>
            ))}

            {/* Title */}
            <div className="flex flex-col gap-3">
              <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                標題
              </p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white border border-[#d9d9d9] px-3.5 py-3.5 rounded-[5px] text-[18px] font-bold"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                placeholder="請輸入標題"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-3">
              <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                說明文字
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white border border-[#d9d9d9] h-[129px] p-4 rounded-[10px] text-[14px]"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                placeholder="請輸入說明文字"
              />
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-5 w-full lg:w-[356px]">
            {/* Preview */}
            <div className="flex flex-col gap-3">
              <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                預覽
              </p>
              <div className="bg-white border-[6px] border-[#f7f7f7] p-3.5 rounded-[5px]">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    {images.length > 0 ? (
                      <div className="relative">
                        <img
                          src={resolveImageUrl(images[currentImageIndex].url)}
                          alt="預覽"
                          className="w-full h-[220px] sm:h-[260px] lg:h-[202px] object-cover bg-[#d9d9d9]"
                        />
                        {images.length > 1 && (
                          <>
                            {/* Left Arrow */}
                            <button
                              onClick={prevImage}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-[#bbbbbb] hover:bg-[#999999] rounded-full p-1 transition-colors"
                              aria-label="上一張"
                            >
                              <IconChevronLeft size={16} className="text-white" />
                            </button>

                            {/* Right Arrow */}
                            <button
                              onClick={nextImage}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#bbbbbb] hover:bg-[#999999] rounded-full p-1 transition-colors"
                              aria-label="下一張"
                            >
                              <IconChevronRight size={16} className="text-white" />
                            </button>

                            {/* Dots Indicator */}
                            <div className="absolute bottom-2.5 left-1/2 transform -translate-x-1/2 flex gap-1">
                              {images.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setCurrentImageIndex(i)}
                                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                    i === currentImageIndex ? 'bg-white' : 'bg-gray-400'
                                  }`}
                                  aria-label={`切換到第 ${i + 1} 張`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-[202px] bg-[#d9d9d9]" />
                    )}
                    {images[currentImageIndex]?.caption && (
                      <p className="font-medium text-[#292c33] text-[10px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                        {images[currentImageIndex].caption}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="font-bold text-[#292c33] text-[19px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                      {title || '標題'}
                    </p>
                    <p className="font-medium text-[#292c33] text-[12px] line-clamp-3" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                      {description || '說明文字'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Setting */}
            <div className="flex flex-col gap-3">
              <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                狀態設定
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setVisible(true)}
                  className={`flex items-center px-5 py-2.5 rounded ${
                    visible ? 'bg-[#339cfd]' : 'border border-[#5a5a5a] opacity-50'
                  }`}
                >
                  <p
                    className={`font-medium text-[14px] ${visible ? 'text-white' : 'text-[#161616]'}`}
                    style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                  >
                    顯示
                  </p>
                </button>
                <button
                  onClick={() => setVisible(false)}
                  className={`flex items-center px-5 py-2.5 rounded ${
                    !visible ? 'bg-[#339cfd]' : 'border border-[#5a5a5a] opacity-50'
                  }`}
                >
                  <p
                    className={`font-medium text-[14px] ${!visible ? 'text-white' : 'text-[#161616]'}`}
                    style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
                  >
                    隱藏
                  </p>
                </button>
              </div>
            </div>

            {/* Card Management */}
            {existingCard && (
              <div className="flex flex-col gap-3">
                <p className="font-semibold text-[#838383] text-[16px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                  卡片管理
                </p>
                <button
                  onClick={handleDeleteCard}
                  className="border border-[#ff2f2f] flex items-center justify-center px-5 py-2.5 rounded w-full sm:w-fit"
                >
                  <p className="font-medium text-[#ff2f2f] text-[14px]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
                    刪除卡片
                  </p>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
