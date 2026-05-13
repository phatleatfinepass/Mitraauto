import { X } from 'lucide-react';

type InvoicePreviewModalProps = {
  isDark: boolean;
  mutedClass: string;
  panelClass: string;
  previewUrl: string;
  t: (key: string) => string;
  onClose: () => void;
};

export function InvoicePreviewModal({
  isDark,
  mutedClass,
  panelClass,
  previewUrl,
  t,
  onClose,
}: InvoicePreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5">
      <div className={`flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border shadow-xl ${panelClass}`}>
        <div className="flex items-center justify-between gap-3 border-b border-inherit px-4 py-3">
          <div>
            <h2 className="text-base font-semibold">{t('documentPreview')}</h2>
            <p className={`text-xs ${mutedClass}`}>{t('previewNote')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md p-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-[#F5F5F7]'}`}
            aria-label={t('closePreview')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <iframe
          title={t('documentPreview')}
          src={previewUrl}
          className="h-full w-full bg-white"
        />
      </div>
    </div>
  );
}
