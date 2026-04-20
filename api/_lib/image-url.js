const ABSOLUTE_URL_RE = /^(?:[a-z][a-z\d+.-]*:)?\/\//i;

function getStorageBase() {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/images`;
}

function joinUrl(base, path) {
  return `${base}/${path.replace(/^\/+/, '')}`;
}

export function normalizeImageUrl(url, filename) {
  const storageBase = getStorageBase();

  if ((!url || !String(url).trim()) && filename && storageBase) {
    return joinUrl(storageBase, filename);
  }

  if (!url || typeof url !== 'string') return url;
  if (ABSOLUTE_URL_RE.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const trimmed = url.trim().replace(/^\/+/, '');

  if (trimmed.startsWith('storage/v1/object/public/images/')) {
    return storageBase
      ? joinUrl(storageBase, trimmed.replace(/^storage\/v1\/object\/public\/images\/+/, ''))
      : `/${trimmed}`;
  }

  if (trimmed.startsWith('uploads/')) {
    return storageBase
      ? joinUrl(storageBase, trimmed.replace(/^uploads\/+/, ''))
      : `/${trimmed}`;
  }

  if (trimmed.startsWith('images/')) {
    return storageBase
      ? joinUrl(storageBase, trimmed.replace(/^images\/+/, ''))
      : `/${trimmed}`;
  }

  if (filename && storageBase) {
    return joinUrl(storageBase, filename);
  }

  return storageBase ? joinUrl(storageBase, trimmed) : `/${trimmed}`;
}

export function normalizeImage(image) {
  if (!image || typeof image !== 'object') return image;

  return {
    ...image,
    url: normalizeImageUrl(image.url, image.filename),
  };
}

export function normalizeCard(card) {
  if (!card || typeof card !== 'object') return card;

  return {
    ...card,
    images: Array.isArray(card.images) ? card.images.map(normalizeImage) : [],
  };
}

export function normalizeBlock(block) {
  if (!block || typeof block !== 'object') return block;

  return {
    ...block,
    cards: Array.isArray(block.cards) ? block.cards.map(normalizeCard) : [],
  };
}
