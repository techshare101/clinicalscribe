import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";
import { FileText, X } from "lucide-react";

interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: string;
  date: number;
  pdf: string | null;
  hostedUrl: string | null;
}

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
}

export function InvoiceDialog({ isOpen, onClose, invoices }: InvoiceDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold">
              Invoice History
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-1.5 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="mt-6 space-y-4 overflow-y-auto">
            {invoices.length === 0 ? (
              <p className="text-center text-gray-500">No invoices found</p>
            ) : (
              invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">Invoice #{invoice.number}</p>
                    <p className="text-sm text-gray-500">
                      {format(invoice.date, "MMMM d, yyyy")}
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      ${invoice.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {invoice.pdf && (
                      <a
                        href={invoice.pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
                      >
                        <FileText className="h-4 w-4" />
                        PDF
                      </a>
                    )}
                    {invoice.hostedUrl && (
                      <a
                        href={invoice.hostedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}