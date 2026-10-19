import React, { useState, useEffect } from 'react';
import { Invoice } from '../types.js';
import { api, CurrencyHelper } from '../api.js';
import { FileText, Eye } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
}

export const InvoicesListModal: React.FC<Props> = ({ isOpen, onClose, onSelectInvoice }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api
        .getInvoices()
        .then(setInvoices)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">GST Dispatch Invoices</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No invoices generated yet. Approve a carrier bid in the Broker view to generate your first invoice!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {invoices.map((inv) => {
              const invNumber = inv.invoice_number || inv.invoiceNumber || 'INV-SS-2026';
              const invDate = new Date(inv.generated_at || inv.createdAt || Date.now()).toLocaleDateString('en-IN');
              const totalAmount = inv.total_payable_paise || inv.totalAmountPaise || 0;
              const carrierName = inv.bid?.carrier?.company_name || inv.bid?.carrier?.companyName || 'Carrier';

              return (
                <div key={inv.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{invNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {inv.status || 'GENERATED'}
                      </span>
                      <span className="text-[10px] text-slate-400">{invDate}</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      LOAD-#{inv.load_id || inv.loadId} • {inv.load?.origin_city || inv.load?.originCity} → {inv.load?.destination_city || inv.load?.destCity} • Carrier:{' '}
                      <strong>{carrierName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {CurrencyHelper.formatINR(totalAmount)}
                    </span>
                    <button
                      onClick={() => {
                        onSelectInvoice(inv);
                        onClose();
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
