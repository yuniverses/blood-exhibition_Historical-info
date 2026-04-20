const ABSOLUTE_URL_RE = /^(?:[a-z][a-z\d+.-]*:)?\/\//i;

export function resolveImageUrl(url?: string) {
  if (!url) return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  if (ABSOLUTE_URL_RE.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
