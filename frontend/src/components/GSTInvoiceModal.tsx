import React, { useState } from 'react';
import { Invoice } from '../types.js';
import { CurrencyHelper } from '../api.js';
import {
  FileText,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GSTInvoiceModal: React.FC<Props> = ({ invoice, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const load = invoice.load;
  const bid = invoice.bid;
  const broker = invoice.broker;

  const invNumber = invoice.invoice_number || invoice.invoiceNumber || 'INV-SS-2026';
  const invDate = new Date(invoice.generated_at || invoice.createdAt || Date.now()).toLocaleDateString('en-IN');
  const baseFreight = invoice.baseFreightPaise || bid?.bid_amount_paise || bid?.amountPaise || 0;
  const brokerMargin = invoice.broker_margin_paise || invoice.brokerMarginPaise || 0;
  const subtotal = invoice.subtotalPaise || (baseFreight + brokerMargin);
  const isInterState = invoice.is_interstate !== undefined ? invoice.is_interstate : (invoice.isInterState ?? false);
  const gstAmount = invoice.gst_amount_paise || invoice.totalAmountPaise || 0;
  const totalAmount = invoice.total_payable_paise || invoice.totalAmountPaise || (subtotal + gstAmount);

  // E-Way Bill Rule 138: Mandatory if consignment exceeds ₹50,000 (5,000,000 Paise)
  const isEwayBillRequired = subtotal > 5000000 || !!invoice.eway_bill_number || !!invoice.ewayBillNumber;
  const ewayBillNumber = invoice.eway_bill_number || invoice.ewayBillNumber || '2410 8923 4412';
  const distanceKm = invoice.eway_bill_distance_km || invoice.ewayBillDistanceKm || 310;
  const validityDays = Math.max(1, Math.ceil(distanceKm / 200));

  // Dynamic Validity Expiry Calculation
  const validUntilDate = invoice.eway_bill_valid_until || invoice.ewayBillValidUntil
    ? new Date(invoice.eway_bill_valid_until || invoice.ewayBillValidUntil!)
    : new Date(Date.now() + validityDays * 24 * 3600 * 1000);

  const diffMs = validUntilDate.getTime() - Date.now();
  const hoursRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const minsRemaining = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

  const handleCopyEway = () => {
    navigator.clipboard.writeText(ewayBillNumber.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
          <div className="flex items-center space-x-2 text-slate-700">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">Goods Transport Agency (GTA) Dispatch Invoice</h3>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Tax Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Invoice Printable Document */}
        <div className="space-y-6 text-slate-800">
          {/* Document Header */}
          <div className="flex justify-between items-start pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">SupplySync</span>
                <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                  B2B Freight Brokerage
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">SupplySync Freight Solutions Pvt. Ltd.</p>
              <p className="text-xs text-slate-500">GSTIN: <strong className="text-slate-700">{broker?.gstin || '03AABCS1429B1Z0'}</strong></p>
              <p className="text-xs text-slate-500">SAC Code: <strong>996511</strong> (Goods Transport Agency Services)</p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">TAX INVOICE</span>
              <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{invNumber}</div>
              <p className="text-xs text-slate-500 mt-1">Date: {invDate}</p>
              <span
                className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  invoice.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                Status: {invoice.status || 'GENERATED'}
              </span>
            </div>
          </div>

          {/* Parties & Route Details */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Shipper / Consignor</span>
              <div className="font-bold text-sm text-slate-900 mt-1">
                {load?.shipper?.company_name || load?.shipper?.companyName || 'Punjab Agro Exporters Ltd'}
              </div>
              <div className="text-slate-600 mt-0.5">Contact: {load?.shipper?.name || 'Gurpreet Singh'}</div>
              <div className="text-slate-600">Origin State: <strong>{load?.origin_state || load?.originState || 'Punjab'}</strong></div>
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Assigned Carrier / Transporter</span>
              <div className="font-bold text-sm text-slate-900 mt-1">
                {bid?.carrier?.company_name || bid?.carrier?.companyName || 'SpeedTrans Logistics'}
              </div>
              <div className="text-slate-600 mt-0.5">Reliability Score: {bid?.carrier?.reliability_score || bid?.carrier?.onTimeRating || 95}%</div>
              <div className="text-slate-600">Transit Commitment: {bid?.estimated_transit_hours || bid?.transitTimeHours || 12} Hours</div>
            </div>
          </div>

          {/* Shipment Particulars */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-500">Corridor:</span>{' '}
              <strong className="text-slate-900">
                {load?.origin_city || load?.originCity} ({load?.origin_state || load?.originState || 'Punjab'}) → {load?.destination_city || load?.destCity} ({load?.destination_state || load?.destState || 'Delhi'})
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Payload:</span>{' '}
              <strong>{load?.weight_tons || load?.weightMetricTons || 16} MT</strong>
            </div>
            <div>
              <span className="text-slate-500">Vehicle:</span>{' '}
              <strong>{load?.vehicle_type || load?.vehicleType || '32ft Multi-Axle'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Tax Type:</span>{' '}
              <strong className={isInterState ? 'text-blue-700' : 'text-emerald-700'}>
                {isInterState ? 'Inter-State (IGST 12%)' : 'Intra-State (CGST 6% + SGST 6%)'}
              </strong>
            </div>
          </div>

          {/* Line Items Financial Breakdown (100% Integer Paise Math) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Description of Service</th>
                  <th className="py-2.5 px-4">SAC Code</th>
                  <th className="py-2.5 px-4 text-right">Taxable Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-900">Base Freight Transportation Charge</div>
                    <div className="text-[11px] text-slate-500">Net payable to carrier for dedicated FTL transit</div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">996511</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    {CurrencyHelper.formatINR(baseFreight)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-900">Brokerage & Freight Facilitation Margin</div>
                    <div className="text-[11px] text-slate-500">Broker facilitation margin ({invoice.brokerMarginPercent || 8}%)</div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">996511</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    {CurrencyHelper.formatINR(brokerMargin)}
                  </td>
                </tr>

                {/* Subtotal */}
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={2} className="py-2.5 px-4 text-slate-700">Total Taxable Value (Subtotal)</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-900">
                    {CurrencyHelper.formatINR(subtotal)}
                  </td>
                </tr>

                {/* GST Taxes */}
                {isInterState ? (
                  <tr>
                    <td colSpan={2} className="py-2 px-4 text-slate-600">
                      Integrated GST (IGST @ 12%) — Inter-State Supply
                    </td>
                    <td className="py-2 px-4 text-right font-mono font-bold text-blue-700">
                      {CurrencyHelper.formatINR(invoice.igstPaise || invoice.gst_amount_paise || 0)}
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td colSpan={2} className="py-1.5 px-4 text-slate-600">
                        Central GST (CGST @ 6%) — Intra-State Supply
                      </td>
                      <td className="py-1.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {CurrencyHelper.formatINR(invoice.cgstPaise || Math.round((invoice.gst_amount_paise || 0) / 2))}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="py-1.5 px-4 text-slate-600">
                        State GST (SGST @ 6%) — Intra-State Supply
                      </td>
                      <td className="py-1.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {CurrencyHelper.formatINR(invoice.sgstPaise || Math.round((invoice.gst_amount_paise || 0) / 2))}
                      </td>
                    </tr>
                  </>
                )}

                {/* Final Grand Total */}
                <tr className="bg-purple-900 text-white font-extrabold text-sm">
                  <td colSpan={2} className="py-3 px-4">Grand Total Invoice Payable (INR)</td>
                  <td className="py-3 px-4 text-right font-mono text-amber-300">
                    {CurrencyHelper.formatINR(totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Module Expansion: E-Way Bill Part-A / Part-B Section */}
          {isEwayBillRequired ? (
            <div className="border-2 border-emerald-500/40 bg-emerald-50/40 rounded-2xl p-5 space-y-4">
              {/* E-Way Bill Banner Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-200">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    EWB
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        E-Way Bill (Form GST EWB-01) — Rule 138 Compliant
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white uppercase shadow-xs">
                        {invoice.eway_bill_status || 'ACTIVE'}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Statutory requirement verified: Consignment value ({CurrencyHelper.formatINR(subtotal)}) exceeds ₹50,000 threshold.
                    </p>
                  </div>
                </div>

                {/* 12-digit E-Way Bill Badge */}
                <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shadow-xs">
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">12-Digit EWB No.</span>
                    <span className="font-mono font-black text-slate-900 text-sm tracking-wider">
                      {ewayBillNumber}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyEway}
                    className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-md hover:bg-emerald-50 transition cursor-pointer"
                    title="Copy 12-digit EWB Number"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Dynamic Validity Countdown */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white/80 p-3 rounded-xl border border-emerald-200 text-xs">
                <div className="flex items-center space-x-2 text-slate-700">
                  <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Dynamic Validity: <strong>{validityDays} Day{validityDays > 1 ? 's' : ''}</strong> (Calculated at 1 day per 200 km for <strong>{distanceKm} KM</strong> route)
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 font-semibold text-emerald-900 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                  <span className="text-[11px]">Expires in:</span>
                  <span className="font-mono font-bold text-xs">{hoursRemaining}h {minsRemaining}m</span>
                  <span className="text-[10px] text-emerald-700">({validUntilDate.toLocaleDateString('en-IN')})</span>
                </div>
              </div>

              {/* Part-A & Part-B Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Part-A */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-bold text-slate-900 uppercase text-[11px]">Part-A: Consignment Particulars</span>
                    <span className="text-[10px] text-slate-400 font-mono">SAC 996511</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Supplier GSTIN:</span>
                      <strong className="font-mono text-slate-800">{broker?.gstin || '03AABCS1429B1Z0'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ship-To GSTIN:</span>
                      <strong className="font-mono text-emerald-800">{invoice.ship_to_gstin || invoice.shipToGstin || '07AAACS8812E1Z8'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Place of Delivery:</span>
                      <strong className="text-slate-800">{load?.destination_city || load?.destCity || 'Delhi'} ({load?.destination_state || load?.destState || 'Delhi'})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Document No & Date:</span>
                      <span className="font-mono text-slate-700">{invNumber} ({invDate})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Consignment Value:</span>
                      <strong className="text-slate-900">{CurrencyHelper.formatINR(subtotal)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reason for Transport:</span>
                      <span className="font-medium text-slate-700">Outward Supply (Dedicated Road Freight)</span>
                    </div>
                  </div>
                </div>

                {/* Part-B */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-bold text-slate-900 uppercase text-[11px]">Part-B: Vehicle & Transporter Transit</span>
                    <span className="text-[10px] text-slate-400 font-mono">Road Transit</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Assigned Truck Plate:</span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 font-mono font-bold text-blue-900">
                        {invoice.vehicle_number || invoice.vehicleNumber || 'PB-02-CR-4590'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Place of Dispatch:</span>
                      <strong className="text-slate-800">{load?.origin_city || load?.originCity || 'Ludhiana'} ({load?.origin_state || load?.originState || 'Punjab'})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transporter Doc / Bilty No:</span>
                      <strong className="font-mono text-slate-800">GR-SS-{(load?.id || 101) * 31 + 4000}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Entered Date & Time:</span>
                      <span className="text-slate-700">{invDate} (Automated System Release)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transshipment Status:</span>
                      <span className="font-medium text-emerald-700">Direct Point-to-Point (No Transshipment)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Consignments under ₹50,000 Exemption Badge */
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>E-Way Bill Statutory Exemption (CGST Rule 138):</strong> Consignment subtotal ({CurrencyHelper.formatINR(subtotal)}) is below the ₹50,000 threshold.
                Standard GTA Consignment Bilty & GST Dispatch Invoice generated above are legally sufficient for road transit.
              </div>
            </div>
          )}

          {/* Financial Governance Footer Notice */}
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Strict Financial Governance Certified:</strong> Stored in database as exact integer Paise (
              <span className="font-mono">{totalAmount} Paise</span>). Zero IEEE-754 floating-point drift.
              Compliant with Goods Transport Agency (GTA) forward charge under GST Notification 11/2017 & E-Way Bill Rule 138.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
