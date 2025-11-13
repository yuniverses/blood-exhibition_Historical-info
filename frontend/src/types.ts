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
