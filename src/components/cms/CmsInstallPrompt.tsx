import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Download, Share2, Smartphone } from 'lucide-react';

interface CmsInstallPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canInstall: boolean;
  isIos: boolean;
  onInstall: () => Promise<void> | void;
}

export function CmsInstallPrompt({
  open,
  onOpenChange,
  canInstall,
  isIos,
  onInstall,
}: CmsInstallPromptProps) {
  const [installing, setInstalling] = React.useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await onInstall();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="gap-3 text-left">
            <Badge className="w-fit bg-[#FF6B35]/15 text-[#FF6B35] hover:bg-[#FF6B35]/15">
            CMS PWA
          </Badge>
          <DialogTitle className="text-2xl">Install Mitra Mobile Ops</DialogTitle>
          <DialogDescription>
            Open the mobile operations board like an app on your phone and keep it ready for the next booking, order, and future rescue alerts.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-[#FF6B35]/20 bg-[#11141A] p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#FF6B35]/15 p-3">
              {canInstall ? <Download className="h-5 w-5 text-[#FF6B35]" /> : <Smartphone className="h-5 w-5 text-[#FF6B35]" />}
            </div>
            <div className="space-y-2">
              <p className="font-medium">
                {canInstall ? 'Install now from this popup.' : 'Install from your browser menu.'}
              </p>
              {isIos ? (
                <ol className="space-y-1 text-sm text-gray-300">
                  <li>1. Tap the <span className="inline-flex items-center gap-1 font-medium text-white"><Share2 className="h-3.5 w-3.5" /> Share</span> button in Safari.</li>
                  <li>2. Choose <span className="font-medium text-white">Add to Home Screen</span>.</li>
                  <li>3. Open the new icon and log in again if Safari asks.</li>
                </ol>
              ) : (
                <p className="text-sm text-gray-300">
                  Install the CMS to your home screen so it opens in standalone mode and is ready for the next notification step.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Later
          </Button>
          <Button
            onClick={handleInstall}
            className="bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90"
            disabled={installing}
          >
            {canInstall ? (installing ? 'Opening install...' : 'Install CMS') : 'Understood'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
