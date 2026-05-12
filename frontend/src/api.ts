import axios from 'axios';

// Type definitions
export interface Image {
  url: string;
  caption?: string;
  filename?: string;
}

export interface Card {
  id: string;
  title: string;
  images: Image[];
  description: string;
  visible?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Block {
  id: string;
  title?: string;
  cards: Card[];
  createdAt?: string;
  updatedAt?: string;
}

const API_URL = '/api';
const MAX_UPLOAD_IMAGE_SIZE = 2.8 * 1024 * 1024;
const MAX_UPLOAD_IMAGE_DIMENSION = 1920;
const UPLOAD_IMAGE_TYPE = 'image/webp';
const FALLBACK_IMAGE_TYPE = 'image/jpeg';

async function loadImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      type,
      quality
    );
  });
}

async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  if (file.type === UPLOAD_IMAGE_TYPE && file.size <= MAX_UPLOAD_IMAGE_SIZE) return file;

  const image = await loadImage(file);
  let scale = Math.min(1, MAX_UPLOAD_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  let quality = 0.82;
  let output: Blob | null = null;
  let outputType = UPLOAD_IMAGE_TYPE;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('圖片壓縮失敗');

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    output = await canvasToBlob(canvas, outputType, quality);

    if (!output && outputType === UPLOAD_IMAGE_TYPE) {
      outputType = FALLBACK_IMAGE_TYPE;
      output = await canvasToBlob(canvas, outputType, quality);
    }

    if (!output) throw new Error('圖片壓縮失敗');

    if (output.size <= MAX_UPLOAD_IMAGE_SIZE) break;

    quality = Math.max(0.62, quality - 0.08);
    scale *= 0.86;
  }

  if (!output) return file;

  const filename = file.name.replace(/\.[^.]+$/, '') || 'image';
  const extension = outputType === UPLOAD_IMAGE_TYPE ? 'webp' : 'jpg';

  return new File([output], `${filename}.${extension}`, {
    type: outputType,
    lastModified: Date.now(),
  });
}

export const api = {
  getBlocks: async (): Promise<Block[]> => {
    const response = await axios.get(`${API_URL}/blocks`);
    return response.data;
  },

  getBlock: async (id: string): Promise<Block> => {
    const response = await axios.get(`${API_URL}/blocks/${id}`);
    return response.data;
  },

  createBlock: async (block: Partial<Block>): Promise<Block> => {
    const response = await axios.post(`${API_URL}/blocks`, block);
    return response.data;
  },

  updateBlock: async (id: string, block: Partial<Block>): Promise<Block> => {
    const response = await axios.put(`${API_URL}/blocks/${id}`, block);
    return response.data;
  },

  deleteBlock: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/blocks/${id}`);
  },

  createCard: async (blockId: string, card: Partial<Card>): Promise<Card> => {
    const response = await axios.post(`${API_URL}/blocks/${blockId}/cards`, card);
    return response.data;
  },

  updateCard: async (blockId: string, cardId: string, card: Partial<Card>): Promise<Card> => {
    const response = await axios.put(`${API_URL}/blocks/${blockId}/cards/${cardId}`, card);
    return response.data;
  },

  deleteCard: async (blockId: string, cardId: string): Promise<void> => {
    await axios.delete(`${API_URL}/blocks/${blockId}/cards/${cardId}`);
  },

  uploadImage: async (file: File): Promise<{ url: string; filename: string }> => {
    const uploadFile = await compressImageForUpload(file);
    const formData = new FormData();
    formData.append('image', uploadFile);
    const response = await axios.post(`${API_URL}/upload`, formData);
    return response.data;
  },

  uploadMultipleImages: async (files: File[]): Promise<{ images: Array<{ url: string; filename: string }> }> => {
    const images = [];

    for (const file of files) {
      images.push(await api.uploadImage(file));
    }

    return { images };
  },
};
