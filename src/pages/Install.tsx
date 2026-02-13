import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Monitor, Share, PlusSquare, MoreVertical, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">App Installed! ✅</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              STR Management System is installed on your device. You can open it from your home screen.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Smartphone className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Install STR Manager</CardTitle>
          <p className="text-muted-foreground">
            Add this app to your home screen for quick access — no app store needed.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {deferredPrompt && (
            <Button onClick={handleInstall} className="w-full" size="lg">
              <Download className="h-5 w-5 mr-2" />
              Install App Now
            </Button>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="bg-muted rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">🍎</span>
              iPhone / iPad (Safari)
            </h3>
            <ol className="space-y-3 text-sm text-muted-foreground ml-8 list-decimal">
              <li className="flex items-start gap-2">
                <span>Tap the <Share className="inline h-4 w-4 text-primary" /> <strong>Share</strong> button at the bottom of Safari</span>
              </li>
              <li className="flex items-start gap-2">
                <span>Scroll down and tap <PlusSquare className="inline h-4 w-4 text-primary" /> <strong>Add to Home Screen</strong></span>
              </li>
              <li>Tap <strong>Add</strong> in the top right corner</li>
            </ol>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="bg-muted rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">🤖</span>
              Android (Chrome)
            </h3>
            <ol className="space-y-3 text-sm text-muted-foreground ml-8 list-decimal">
              <li className="flex items-start gap-2">
                <span>Tap the <MoreVertical className="inline h-4 w-4 text-primary" /> <strong>menu</strong> (three dots) in Chrome</span>
              </li>
              <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong></li>
              <li>Tap <strong>Install</strong> to confirm</li>
            </ol>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Desktop (Chrome / Edge)
            </h3>
            <ol className="space-y-3 text-sm text-muted-foreground ml-8 list-decimal">
              <li>Click the install icon in the browser address bar</li>
              <li>Click <strong>Install</strong> to confirm</li>
            </ol>
          </div>

          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
