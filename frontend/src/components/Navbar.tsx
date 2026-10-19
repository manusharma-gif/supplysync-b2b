import React from 'react';
import { User } from '../types.js';
import { Truck, Sparkles, FileText, IndianRupee, Layers } from 'lucide-react';

interface Props {
  currentUser: User | null;
  onOpenParser: () => void;
  onOpenInvoices: () => void;
}

export const Navbar: React.FC<Props> = ({ currentUser, onOpenParser, onOpenInvoices }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-[45px] z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">SupplySync</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                B2B Logistics
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Enterprise Freight Brokerage & Dispatch MVP
            </p>
          </div>
        </div>

        {/* Action Tools & Status */}
        <div className="flex items-center space-x-3">
          {/* Indian Standards Compliance Tag */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            <span>12% GTA GST & Paise Math Active</span>
          </div>

          {/* AI Dispatch Parser Quick Action */}
          <button
            onClick={onOpenParser}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Dispatch Parser</span>
          </button>

          {/* GST Invoices Quick Action */}
          <button
            onClick={onOpenInvoices}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Invoices</span>
          </button>

          {/* Current Persona Pill */}
          {currentUser && (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  currentUser.role === 'SHIPPER'
                    ? 'bg-emerald-600'
                    : currentUser.role === 'CARRIER'
                    ? 'bg-blue-600'
                    : 'bg-purple-600'
                }`}
              >
                {currentUser.role[0]}
              </div>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <div className="font-semibold text-slate-800">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 uppercase">{currentUser.role}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
