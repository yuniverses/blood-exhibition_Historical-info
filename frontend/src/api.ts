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

const API_URL = 'http://localhost:3001/api';

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
    const formData = new FormData();
    formData.append('image', file);
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadMultipleImages: async (files: File[]): Promise<{ images: Array<{ url: string; filename: string }> }> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    const response = await axios.post(`${API_URL}/upload-multiple`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
