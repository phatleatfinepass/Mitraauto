const IMAGE_PREFIX = 'https://images.unsplash.com/';

function sanitize(input: string): string {
  return input.trim().toLowerCase();
}

export function buildProductImageFallback(brand?: string | null, model?: string | null): string {
  const b = sanitize(brand ?? '');
  const m = sanitize(model ?? '');
  const seed = `${b}-${m}`;

  if (seed.includes('rim') || seed.includes('wheel') || seed.includes('vanne')) {
    return `${IMAGE_PREFIX}photo-1619767886558-efdc259cde1a?w=800&h=800&fit=crop`;
  }

  return `${IMAGE_PREFIX}photo-1625402302260-34722fef9a01?w=800&h=800&fit=crop`;
}
