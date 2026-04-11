function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getInitials(brand?: string | null, model?: string | null): string {
  const source = `${brand ?? ''} ${model ?? ''}`.trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return 'MA';
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function buildProductImageFallback(brand?: string | null, model?: string | null): string {
  const initials = getInitials(brand, model);
  const title = [brand, model].filter(Boolean).join(' ').trim() || 'Mitra Auto';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" role="img" aria-label="${escapeXml(title)}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f7f7f8" />
          <stop offset="100%" stop-color="#eceef2" />
        </linearGradient>
      </defs>
      <rect width="640" height="640" rx="48" fill="url(#bg)" />
      <circle cx="320" cy="240" r="120" fill="#111827" opacity="0.08" />
      <text x="320" y="352" text-anchor="middle" font-family="Arial, sans-serif" font-size="132" font-weight="700" fill="#111827">${escapeXml(initials)}</text>
      <text x="320" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#4b5563">${escapeXml(title)}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
