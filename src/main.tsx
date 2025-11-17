
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  if (hostname === 'mitra-auto.fi') {
    const redirectedUrl = window.location.href.replace(
      '://mitra-auto.fi',
      '://www.mitra-auto.fi'
    );
    window.location.replace(redirectedUrl);
  }
}

createRoot(document.getElementById('root')!).render(<App />);
