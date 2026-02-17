export function buildProductImageFallback(brand?: string, model?: string): string {
  const name = [brand, model].filter(Boolean).join(' ').trim();
  const label = name.length > 0 ? name.slice(0, 48) : 'No Image';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${escapeXml(
      label
    )}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E2E8F0"/>
          <stop offset="100%" stop-color="#CBD5E1"/>
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill="url(#bg)"/>
      <circle cx="400" cy="320" r="96" fill="#94A3B8"/>
      <rect x="220" y="470" width="360" height="14" rx="7" fill="#64748B"/>
      <text x="400" y="560" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="30" fill="#334155">${escapeXml(
        label
      )}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}