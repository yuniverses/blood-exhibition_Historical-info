# 血液基金會展覽系統

這是一個完整的展覽管理系統，包含前端輪播展示和後端管理介面。

## 功能特色

- ✨ 前端輪播展示：使用 Swiper 打造流暢的卡片輪播效果
- 🎨 響應式設計：支援桌面、平板和手機瀏覽
- 🔧 管理介面：可新增、編輯、刪除區塊和卡片
- 📷 圖片上傳：支援多圖上傳和圖片說明
- 💾 本地儲存：所有資料儲存在本地 JSON 檔案中

## 技術架構

### 前端
- React 19 + TypeScript
- Vite（構建工具）
- Tailwind CSS（樣式）
- Swiper（輪播）
- React Router（路由）
- Axios（API 請求）

### 後端
- Node.js + Express
- 本地 JSON 檔案儲存
- Multer（檔案上傳）

## 資料結構

```typescript
Block {
  id: string
  title: string
  cards: Card[]
}

Card {
  id: string
  title: string
  description: string
  images: Image[]
}

Image {
  url: string
  caption?: string
}
```

## 快速開始

### 1. 安裝依賴

```bash
# 安裝後端依賴
cd backend
npm install

# 安裝前端依賴
cd ../frontend
npm install
```

### 2. 啟動後端伺服器

```bash
cd backend
npm start
```

後端將在 `http://localhost:3001` 運行

### 3. 啟動前端開發伺服器

開啟新的終端視窗：

```bash
cd frontend
npm run dev
```

前端將在 `http://localhost:5173` 運行

### 4. 使用系統

1. 開啟瀏覽器訪問 `http://localhost:5173`
2. 首次使用時，點擊「管理介面」按鈕
3. 建立新的區塊
4. 在區塊中新增卡片，上傳圖片和填寫內容
5. 返回首頁查看輪播展示效果

## 目錄結構

```
blood-exhibition_Historical-info/
├── backend/                # 後端 API
│   ├── server.js          # Express 伺服器
│   └── package.json
├── frontend/              # 前端應用
│   ├── src/
│   │   ├── pages/        # 頁面元件
│   │   │   ├── Exhibition.tsx  # 展示頁面
│   │   │   └── Admin.tsx       # 管理頁面
│   │   ├── api.ts        # API 服務層
│   │   ├── types.ts      # TypeScript 類型定義
│   │   ├── App.tsx       # 主應用元件
│   │   └── main.tsx      # 應用入口
│   └── package.json
└── data/                  # 資料儲存
    ├── exhibition.json   # 展覽資料
    └── images/           # 上傳的圖片

## API 端點

### 區塊管理
- `GET /api/blocks` - 取得所有區塊
- `GET /api/blocks/:id` - 取得單一區塊
- `POST /api/blocks` - 建立新區塊
- `PUT /api/blocks/:id` - 更新區塊
- `DELETE /api/blocks/:id` - 刪除區塊

### 卡片管理
- `POST /api/blocks/:blockId/cards` - 建立新卡片
- `PUT /api/blocks/:blockId/cards/:cardId` - 更新卡片
- `DELETE /api/blocks/:blockId/cards/:cardId` - 刪除卡片

### 圖片上傳
- `POST /api/upload` - 上傳單張圖片
- `POST /api/upload-multiple` - 上傳多張圖片

## 建置與部署

### 建置前端

```bash
cd frontend
npm run build
```

建置完成後，產物會在 `frontend/dist` 目錄中。

### 生產環境部署

1. 將建置好的前端檔案部署到靜態檔案伺服器
2. 設定後端 API 伺服器
3. 更新前端的 API_URL 設定指向生產環境的後端地址

## 開發說明

- 前端使用 TypeScript strict mode，確保類型安全
- 所有圖片檔案儲存在 `data/images` 目錄
- 資料檔案位於 `data/exhibition.json`
- 後端預設端口 3001，前端預設端口 5173

## 授權

ISC
