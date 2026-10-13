import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const update = () => setInstalled(media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const complete = () => { setInstalled(true); setPrompt(null); };
    update();
    media.addEventListener("change", update);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", complete);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);
  if (installed) return null;
  const install = async () => {
    if (!prompt) { setOpen(true); return; }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  };
  return <>
    <Button variant="ghost" size="icon" aria-label="Install KrushiMitra AI" title="Add to home screen" onClick={install}><Download /></Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm rounded-lg">
        <DialogTitle>KrushiMitra AI on your phone</DialogTitle>
        <DialogDescription>Add the published app to your home screen to open it from its own icon.</DialogDescription>
        <p className="text-sm leading-6"><Share className="mr-2 inline h-4 w-4 text-accent" />iPhone: open in Safari, tap Share, then Add to Home Screen.</p>
        <p className="text-sm leading-6">Android: open in Chrome, tap the menu, then Install app or Add to Home screen.</p>
        <p className="text-xs text-muted-foreground">An internet connection is required for diagnosis and garden data.</p>
      </DialogContent>
    </Dialog>
  </>;
}