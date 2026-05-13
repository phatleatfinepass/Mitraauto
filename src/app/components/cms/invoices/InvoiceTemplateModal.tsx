import { X } from 'lucide-react';

import type { TemplateDraft } from './types';
import { Button, Input, TextArea } from './ui';

type InvoiceTemplateModalProps = {
  isDark: boolean;
  mutedClass: string;
  panelClass: string;
  templateDraft: TemplateDraft;
  templateLoading: boolean;
  templateSaving: boolean;
  t: (key: string) => string;
  onClose: () => void;
  onSave: () => void;
  onTemplateDraftChange: (updater: (current: TemplateDraft) => TemplateDraft) => void;
};

export function InvoiceTemplateModal({
  isDark,
  mutedClass,
  panelClass,
  templateDraft,
  templateLoading,
  templateSaving,
  t,
  onClose,
  onSave,
  onTemplateDraftChange,
}: InvoiceTemplateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl border shadow-xl ${panelClass}`}>
        <div className="flex items-start justify-between gap-4 border-b border-inherit p-4">
          <div>
            <h2 className="text-lg font-semibold">{t('templateSettings')}</h2>
            <p className={`mt-1 text-sm ${mutedClass}`}>
              {t('templateSettingsDescription')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md p-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-[#F5F5F7]'}`}
            aria-label={t('closeTemplateSettings')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {templateLoading ? (
          <div className={`p-6 text-sm ${mutedClass}`}>{t('loadingTemplateSettings')}</div>
        ) : (
          <div className="space-y-5 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input isDark={isDark} label={t('templateName')} value={templateDraft.displayName} onChange={(value) => onTemplateDraftChange((current) => ({ ...current, displayName: String(value) }))} />
              <Input isDark={isDark} label={t('companyName')} value={templateDraft.companyName} onChange={(value) => onTemplateDraftChange((current) => ({ ...current, companyName: String(value) }))} />
              <Input isDark={isDark} label={t('businessId')} value={templateDraft.businessId} onChange={(value) => onTemplateDraftChange((current) => ({ ...current, businessId: String(value) }))} />
              <Input isDark={isDark} label={t('vatId')} value={templateDraft.vatId} onChange={(value) => onTemplateDraftChange((current) => ({ ...current, vatId: String(value) }))} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input isDark={isDark} label={t('addressLine1')} value={templateDraft.addressLine1} onChange={(value) => onTemplateDraftChange((current) => ({ ...current, addressLine1: String(value) }))} />
              <Input isDark={isDark} label={t('addressLine2')} value={templateDraft.addressLine2} onChange={(value) => onTemplateDraftChange((current) => ({ ...current, addressLine2: String(value) }))} />
              <Input isDark={isDark} label={t('email')} value={templateDraft.email} onChange={(value) => onTemplateDraftChange((current) => ({ ...current, email: String(value) }))} />
              <Input isDark={isDark} label={t('phone')} value={templateDraft.phone} onChange={(value) => onTemplateDraftChange((current) => ({ ...current, phone: String(value) }))} />
              <Input isDark={isDark} label={t('countryCode')} value={templateDraft.countryCode} onChange={(value) => onTemplateDraftChange((current) => ({ ...current, countryCode: String(value).toUpperCase() }))} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input isDark={isDark} label="IBAN" value={templateDraft.iban} onChange={(value) => onTemplateDraftChange((current) => ({ ...current, iban: String(value) }))} />
              <Input isDark={isDark} label="BIC" value={templateDraft.bic} onChange={(value) => onTemplateDraftChange((current) => ({ ...current, bic: String(value) }))} />
            </div>

            <TextArea
              isDark={isDark}
              label={t('paymentTerms')}
              value={templateDraft.paymentTerms}
              onChange={(value) => onTemplateDraftChange((current) => ({ ...current, paymentTerms: String(value) }))}
              rows={3}
              placeholder={t('paymentTermsPlaceholder')}
            />
            <TextArea
              isDark={isDark}
              label={t('footerText')}
              value={templateDraft.footerText}
              onChange={(value) => onTemplateDraftChange((current) => ({ ...current, footerText: String(value) }))}
              rows={3}
              placeholder={t('footerTextPlaceholder')}
            />
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-inherit p-4">
          <Button isDark={isDark} color="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button isDark={isDark} color="primary" onClick={onSave} isLoading={templateSaving} isDisabled={templateLoading}>
            {t('saveTemplate')}
          </Button>
        </div>
      </div>
    </div>
  );
}
