"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ReconnectModal({ open, onClose }: Props) {
  const { toast } = useToast();

  const configTemplate = JSON.stringify(
    {
      access_token: "YOUR_EPIC_SANDBOX_TOKEN",
      fhir_base: "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
    },
    null,
    2
  );

  function handleCopy() {
    navigator.clipboard.writeText(configTemplate).then(() => {
      toast({
        title: "📋 Config copied",
        description: "Paste this into Firestore at smart/config",
        duration: 4000,
      });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Reconnect to Epic EHR</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-gray-700">
          <p>Your Epic connection expired or is invalid. Please refresh your SMART credentials:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Go to the <span className="font-semibold">Admin Panel</span>.
            </li>
            <li>
              Enter your latest <span className="font-semibold">SMART client ID & secret</span> or reissue a token.
            </li>
            <li>
              Click <span className="font-semibold">Save</span>. The badge will update to <span className="text-green-600">EHR Connected</span>.
            </li>
          </ol>
        </div>

        <div className="flex justify-between items-center mt-6">
          <Button variant="outline" onClick={handleCopy}>Copy config JSON</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button asChild>
              <a href="/admin">Go to Admin</a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
