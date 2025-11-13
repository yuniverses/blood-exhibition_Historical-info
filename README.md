# 血液基金會展覽系統

這是一個完整的展覽管理系統，包含前端輪播展示和後端管理介面。

## 功能特色

- ✨ 前端輪播展示：使用 Swiper 打造流暢的卡片輪播效果
- 🎨 響應式設計：支援桌面、平板和手機瀏覽
- 🔧 管理介面：可新增、編輯、刪除區塊和卡片
- 👁️ 顯示控制：可控制卡片在展示頁面的顯示/隱藏
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

系統採用三層資料結構：**Block（區塊）> Card（卡片）> Image（圖片）**

### TypeScript 類型定義

```typescript
interface Block {
  id: string;           // 唯一識別碼（時間戳生成）
  title?: string;       // 區塊標題（可選，如「捐血運動歷史」）
  cards: Card[];        // 卡片陣列
  createdAt?: string;   // 建立時間（ISO 8601 格式）
  updatedAt?: string;   // 更新時間（ISO 8601 格式）
}

interface Card {
  id: string;           // 唯一識別碼（時間戳生成）
  title: string;        // 卡片標題
  description: string;  // 卡片說明文字
  images: Image[];      // 圖片陣列
  visible?: boolean;    // 是否在展示頁面顯示（預設 true）
  createdAt?: string;   // 建立時間（ISO 8601 格式）
  updatedAt?: string;   // 更新時間（ISO 8601 格式）
}

interface Image {
  url: string;          // 圖片路徑（如 /uploads/xxx.png）
  caption?: string;     // 圖片說明（可選）
  filename?: string;    // 原始檔案名稱（可選）
}
```

### JSON 資料範例

實際儲存在 `data/exhibition.json` 的資料格式：

```json
{
  "blocks": [
    {
      "id": "1763036460536",
      "title": "捐血運動歷史",
      "cards": [
        {
          "id": "1763036761925",
          "title": "台灣捐血運動發展",
          "description": "從1974年開始，台灣正式推動捐血運動...",
          "images": [
            {
              "url": "/uploads/1763036473920-62269036.png",
              "caption": "早期捐血活動照片",
              "filename": "1763036473920-62269036.png"
            }
          ],
          "visible": true,
          "createdAt": "2025-11-13T12:26:01.925Z",
          "updatedAt": "2025-11-13T12:48:10.748Z"
        },
        {
          "id": "1763036999437",
          "title": "捐血站設立",
          "description": "各地捐血站陸續成立...",
          "images": [],
          "visible": false,
          "createdAt": "2025-11-13T12:30:00.000Z"
        }
      ],
      "createdAt": "2025-11-13T12:21:00.536Z"
    },
    {
      "id": "1763037095229",
      "title": "董理監事典範事蹟",
      "cards": [],
      "createdAt": "2025-11-13T12:31:35.229Z"
    }
  ]
}
```

### 資料層級說明

1. **根物件**：包含 `blocks` 陣列
2. **Block（區塊）**：代表一個展覽主題或分類
   - 可包含多個 Card
   - 在展示頁面會以區塊為單位顯示標題
3. **Card（卡片）**：代表單一展覽項目
   - 可包含多張圖片
   - 具有標題和說明文字
   - 可透過 `visible` 屬性控制是否顯示
4. **Image（圖片）**：卡片中的圖片資源
   - 儲存在 `data/images/` 目錄
   - 可附加說明文字

### 卡片顯示控制

- 當 `card.visible === false` 時，該卡片不會在展示頁面顯示
- 預設值為 `true`（未設置時視為可見）
- 在管理頁面可透過切換按鈕控制顯示狀態
- 隱藏的卡片在管理頁面會以半透明效果顯示

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

#### 管理介面操作

1. 開啟瀏覽器訪問 `http://localhost:5173`
2. 首次使用時，點擊「管理介面」按鈕進入管理頁面
3. **建立區塊**：
   - 點擊「+ 新增區塊」按鈕
   - 輸入區塊標題（如「捐血運動歷史」）
4. **新增卡片**：
   - 在區塊中點擊「+ 新增卡片」
   - 填寫卡片標題和說明
   - 上傳圖片並添加圖片說明
5. **控制卡片顯示**：
   - 點擊卡片右上角的「👁️ 顯示中」按鈕可切換為「👁️‍🗨️ 已隱藏」
   - 隱藏的卡片不會在展示頁面顯示，但仍保留在系統中
   - 隨時可再次點擊按鈕恢復顯示
6. **編輯與刪除**：
   - 點擊「編輯」修改卡片內容
   - 點擊「刪除」移除卡片（需確認）

#### 展示頁面

- 返回首頁 `http://localhost:5173` 查看輪播展示效果
- 只有 `visible !== false` 的卡片會顯示
- 支援雙層輪播：區塊輪播 + 卡片內圖片輪播

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

| 方法 | 端點 | 功能 | 請求體 | 回應 |
|------|------|------|--------|------|
| GET | `/api/blocks` | 取得所有區塊 | - | `Block[]` |
| GET | `/api/blocks/:id` | 取得單一區塊 | - | `Block` |
| POST | `/api/blocks` | 建立新區塊 | `{ title: string }` | `Block` |
| PUT | `/api/blocks/:id` | 更新區塊 | `Partial<Block>` | `Block` |
| DELETE | `/api/blocks/:id` | 刪除區塊 | - | `{ message: string }` |

### 卡片管理

| 方法 | 端點 | 功能 | 請求體 | 回應 |
|------|------|------|--------|------|
| POST | `/api/blocks/:blockId/cards` | 建立新卡片 | `{ title, description, images, visible? }` | `Card` |
| PUT | `/api/blocks/:blockId/cards/:cardId` | 更新卡片 | `Partial<Card>` | `Card` |
| DELETE | `/api/blocks/:blockId/cards/:cardId` | 刪除卡片 | - | `{ message: string }` |

**更新卡片可見性範例**：
```bash
curl -X PUT http://localhost:3001/api/blocks/1763036460536/cards/1763036761925 \
  -H "Content-Type: application/json" \
  -d '{"visible": false}'
```

### 圖片上傳

| 方法 | 端點 | 功能 | 請求體 | 回應 |
|------|------|------|--------|------|
| POST | `/api/upload` | 上傳單張圖片 | `FormData (image)` | `{ url, filename }` |
| POST | `/api/upload-multiple` | 上傳多張圖片 | `FormData (images[])` | `{ images: [{url, filename}] }` |

**支援的圖片格式**：JPEG, JPG, PNG, GIF, WebP

### 靜態檔案服務

- `GET /uploads/:filename` - 存取上傳的圖片檔案

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
