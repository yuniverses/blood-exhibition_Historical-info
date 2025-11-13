import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../data/images')));

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../data/images'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允許上傳圖片檔案！'));
    }
  }
});

const DATA_FILE = path.join(__dirname, '../data/exhibition.json');

// Helper function to read data
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default structure
    return { blocks: [] };
  }
}

// Helper function to write data
async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Initialize data file if it doesn't exist
async function initializeData() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await writeData({ blocks: [] });
  }
}

// API Routes

// Get all blocks
app.get('/api/blocks', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.blocks);
  } catch (error) {
    res.status(500).json({ error: '讀取資料失敗' });
  }
});

// Get single block
app.get('/api/blocks/:id', async (req, res) => {
  try {
    const data = await readData();
    const block = data.blocks.find(b => b.id === req.params.id);
    if (block) {
      res.json(block);
    } else {
      res.status(404).json({ error: '找不到區塊' });
    }
  } catch (error) {
    res.status(500).json({ error: '讀取資料失敗' });
  }
});

// Create new block
app.post('/api/blocks', async (req, res) => {
  try {
    const data = await readData();
    const newBlock = {
      id: Date.now().toString(),
      cards: [],
      ...req.body,
      createdAt: new Date().toISOString()
    };
    data.blocks.push(newBlock);
    await writeData(data);
    res.status(201).json(newBlock);
  } catch (error) {
    res.status(500).json({ error: '建立區塊失敗' });
  }
});

// Update block
app.put('/api/blocks/:id', async (req, res) => {
  try {
    const data = await readData();
    const index = data.blocks.findIndex(b => b.id === req.params.id);
    if (index !== -1) {
      data.blocks[index] = {
        ...data.blocks[index],
        ...req.body,
        id: req.params.id,
        updatedAt: new Date().toISOString()
      };
      await writeData(data);
      res.json(data.blocks[index]);
    } else {
      res.status(404).json({ error: '找不到區塊' });
    }
  } catch (error) {
    res.status(500).json({ error: '更新區塊失敗' });
  }
});

// Delete block
app.delete('/api/blocks/:id', async (req, res) => {
  try {
    const data = await readData();
    const index = data.blocks.findIndex(b => b.id === req.params.id);
    if (index !== -1) {
      data.blocks.splice(index, 1);
      await writeData(data);
      res.json({ message: '刪除成功' });
    } else {
      res.status(404).json({ error: '找不到區塊' });
    }
  } catch (error) {
    res.status(500).json({ error: '刪除區塊失敗' });
  }
});

// Create card in block
app.post('/api/blocks/:blockId/cards', async (req, res) => {
  try {
    const data = await readData();
    const block = data.blocks.find(b => b.id === req.params.blockId);
    if (block) {
      const newCard = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      block.cards.push(newCard);
      await writeData(data);
      res.status(201).json(newCard);
    } else {
      res.status(404).json({ error: '找不到區塊' });
    }
  } catch (error) {
    res.status(500).json({ error: '建立卡片失敗' });
  }
});

// Update card
app.put('/api/blocks/:blockId/cards/:cardId', async (req, res) => {
  try {
    const data = await readData();
    const block = data.blocks.find(b => b.id === req.params.blockId);
    if (block) {
      const cardIndex = block.cards.findIndex(c => c.id === req.params.cardId);
      if (cardIndex !== -1) {
        block.cards[cardIndex] = {
          ...block.cards[cardIndex],
          ...req.body,
          id: req.params.cardId,
          updatedAt: new Date().toISOString()
        };
        await writeData(data);
        res.json(block.cards[cardIndex]);
      } else {
        res.status(404).json({ error: '找不到卡片' });
      }
    } else {
      res.status(404).json({ error: '找不到區塊' });
    }
  } catch (error) {
    res.status(500).json({ error: '更新卡片失敗' });
  }
});

// Delete card
app.delete('/api/blocks/:blockId/cards/:cardId', async (req, res) => {
  try {
    const data = await readData();
    const block = data.blocks.find(b => b.id === req.params.blockId);
    if (block) {
      const cardIndex = block.cards.findIndex(c => c.id === req.params.cardId);
      if (cardIndex !== -1) {
        block.cards.splice(cardIndex, 1);
        await writeData(data);
        res.json({ message: '刪除成功' });
      } else {
        res.status(404).json({ error: '找不到卡片' });
      }
    } else {
      res.status(404).json({ error: '找不到區塊' });
    }
  } catch (error) {
    res.status(500).json({ error: '刪除卡片失敗' });
  }
});

// Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '沒有上傳檔案' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ error: '上傳失敗' });
  }
});

// Upload multiple images
app.post('/api/upload-multiple', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '沒有上傳檔案' });
    }
    const images = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename
    }));
    res.json({ images });
  } catch (error) {
    res.status(500).json({ error: '上傳失敗' });
  }
});

// Start server
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
