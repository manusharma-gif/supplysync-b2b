import React, { useState, useEffect } from 'react';
import { Load, ScoredBid, Invoice, Bid } from '../types.js';
import { api, CurrencyHelper } from '../api.js';
import {
  Scale,
  CheckCircle2,
  Sliders,
  Sparkles,
  Star,
  Award,
  TrendingUp,
  IndianRupee,
  ShieldCheck,
  Truck,
  FileText,
  AlertCircle,
  Radio,
} from 'lucide-react';

interface Props {
  onViewInvoice: (invoice: Invoice) => void;
  onOpenParser: () => void;
  onOpenTracking?: (load: Load) => void;
}

interface ProcessedBid {
  bid: Bid;
  carrierName: string;
  reliabilityScore: number;
  bidAmountPaise: number;
  transitHours: number;
  costScore: number;
  compositeScore: number;
  netProfitPaise: number;
  marginPercentStr: string;
  isPositiveMargin: boolean;
  isRankOne: boolean;
}

export const BrokerView: React.FC<Props> = ({ onViewInvoice, onOpenParser, onOpenTracking }) => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [rankedBids, setRankedBids] = useState<ProcessedBid[]>([]);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [approvingBidId, setApprovingBidId] = useState<number | null>(null);
  const [marginSlider, setMarginSlider] = useState<number>(8);

  const fetchLoads = async () => {
    try {
      setLoading(true);
      const data = await api.getLoads();
      setLoads(data);

      // Auto-select load with bids or the first load
      const withBids = data.find((l) => (l.bids?.length || 0) > 0);
      if (withBids && !selectedLoad) {
        handleSelectLoad(withBids);
      } else if (data.length > 0 && !selectedLoad) {
        handleSelectLoad(data[0]);
      }
    } catch (err) {
      console.error('Error fetching loads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads();
  }, []);

  const handleSelectLoad = async (load: Load) => {
    setSelectedLoad(load);
    await processBidsForLoad(load);
  };

  const processBidsForLoad = async (load: Load) => {
    try {
      setScoringLoading(true);

      // Call getRankedBids as required
      let rawScored: ScoredBid[] = [];
      try {
        rawScored = await api.getRankedBids(load.id);
      } catch (err) {
        console.warn('Ranked bids endpoint call error, using local bids:', err);
      }

      // If backend returned scored bids, extract bids from them, or use load.bids
      const bids: Bid[] =
        rawScored.length > 0
          ? rawScored.map((s) => s.bid)
          : load.bids && load.bids.length > 0
          ? load.bids
          : [];

      if (bids.length === 0) {
        setRankedBids([]);
        return;
      }

      const shipperBudget = load.shipper_budget_paise || load.targetRatePaise || 0;
      const minBidPaise = Math.min(...bids.map((b) => b.bid_amount_paise || b.amountPaise || 1));

      // Calculate 70% Cost + 30% Reliability score breakdown
      const processed: ProcessedBid[] = bids.map((b) => {
        const bidPaise = b.bid_amount_paise || b.amountPaise || 0;
        const carrier = b.carrier;
        const carrierName = carrier?.company_name || carrier?.companyName || carrier?.name || 'Carrier Partner';
        const reliability = carrier?.reliability_score ?? carrier?.onTimeRating ?? 85;
        const transitHours = b.estimated_transit_hours || b.transitTimeHours || 12;

        // Cost score: lower cost = higher score (normalized against minimum bid)
        const costScore = bidPaise > 0 ? Math.round((minBidPaise / bidPaise) * 100) : 100;

        // 70% Cost + 30% Reliability composite score
        const compositeScore = Math.round(0.7 * costScore + 0.3 * reliability);

        // Exact Net Profit Margin in ₹: shipper_budget_paise - carrier_bid_paise
        const netProfitPaise = shipperBudget - bidPaise;
        const marginPercentNum = shipperBudget > 0 ? (netProfitPaise / shipperBudget) * 100 : 0;
        const marginPercentStr = `${marginPercentNum >= 0 ? '+' : ''}${marginPercentNum.toFixed(2)}%`;

        return {
          bid: b,
          carrierName,
          reliabilityScore: reliability,
          bidAmountPaise: bidPaise,
          transitHours,
          costScore,
          compositeScore,
          netProfitPaise,
          marginPercentStr,
          isPositiveMargin: netProfitPaise >= 0,
          isRankOne: false,
        };
      });

      // Sort descending by composite score (ranking engine)
      processed.sort((a, b) => b.compositeScore - a.compositeScore);

      if (processed.length > 0) {
        processed[0].isRankOne = true;
      }

      setRankedBids(processed);
    } catch (err) {
      console.error('Error processing bids:', err);
    } finally {
      setScoringLoading(false);
    }
  };

  const handleApproveAndDispatch = async (bidId: number) => {
    try {
      setApprovingBidId(bidId);
      // Calls acceptBid as required by Module 1 & Module 2 specs
      const result = await api.acceptBid(bidId);

      // Refresh loads & state
      await fetchLoads();
      if (selectedLoad) {
        const updatedLoad = await api.getLoad(selectedLoad.id);
        setSelectedLoad(updatedLoad);
        await processBidsForLoad(updatedLoad);
      }

      if (result.invoice) {
        onViewInvoice(result.invoice);
      }
    } catch (err: any) {
      alert(`Approval error: ${err.message || err}`);
    } finally {
      setApprovingBidId(null);
    }
  };

  const handleViewInvoiceForLoad = async (loadId: number) => {
    try {
      const inv = await api.getInvoiceByLoadId(loadId);
      if (inv) {
        onViewInvoice(inv);
      } else {
        const all = await api.getInvoices();
        const found = all.find((i) => i.load_id === loadId || i.loadId === loadId);
        if (found) {
          onViewInvoice(found);
        } else {
          alert('No invoice found for this load yet.');
        }
      }
    } catch (err: any) {
      alert(`Could not load invoice: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Broker Hero Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-purple-800/40">
        <div>
          <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4 text-purple-400" />
            <span>Broker Command Center • SupplySync Freight Solutions</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Carrier Ranking Engine & Dispatch Command Center
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Multi-carrier AI ranking weighted by <strong className="text-white">70% Cost + 30% Reliability</strong>. Inspect exact net profit margins in ₹, identify the AI-recommended Best Value Carrier, and 1-click Approve & Dispatch with instant 12% GTA GST invoicing.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onOpenParser}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Smart Paste Inquiry (WhatsApp/Email)</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Demands List (Left) + Command Center Table & Ranking Engine (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: All Freight Demands (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Freight Demands</h2>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                {loads.length} Loads
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">Loading loads...</div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
                {loads.map((load) => {
                  const isSelected = selectedLoad?.id === load.id;
                  const bidsCount = load.bids?.length || 0;
                  const origin = load.origin_city || load.originCity;
                  const dest = load.destination_city || load.destCity;
                  const weight = load.weight_tons || load.weightMetricTons || 16;
                  const budget = load.shipper_budget_paise || load.targetRatePaise || 0;

                  return (
                    <div
                      key={load.id}
                      onClick={() => handleSelectLoad(load)}
                      className={`p-4 cursor-pointer transition ${
                        isSelected
                          ? 'bg-purple-50/90 border-l-4 border-purple-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            #{load.id}
                          </span>
                          <span className="font-bold text-xs text-slate-900">
                            {origin} → {dest}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            load.status === 'OPEN' || load.status === 'BIDDING'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {load.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                        <span>{weight} MT • Budget: <strong className="text-slate-800">{CurrencyHelper.formatINR(budget)}</strong></span>
                        <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded text-[11px]">
                          {bidsCount} Bid{bidsCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Command Center Table & Carrier Ranking Engine (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedLoad ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Selected Load Summary Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
                    <span className="font-mono font-bold text-purple-700">LOAD-#{selectedLoad.id}</span>
                    <span>•</span>
                    <span>Shipper: <strong>{selectedLoad.shipper?.company_name || selectedLoad.shipper?.companyName || 'Punjab Agro Exporters Ltd'}</strong></span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedLoad.origin_city || selectedLoad.originCity} ({selectedLoad.origin_state || selectedLoad.originState || 'Punjab'}) → {selectedLoad.destination_city || selectedLoad.destCity} ({selectedLoad.destination_state || selectedLoad.destState || 'Delhi'})
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1">
                    <span>Vehicle: <strong>{selectedLoad.vehicle_type || selectedLoad.vehicleType || '32ft Multi-Axle'}</strong></span>
                    <span>•</span>
                    <span>Payload: <strong>{selectedLoad.weight_tons || selectedLoad.weightMetricTons || 16} MT</strong></span>
                    <span>•</span>
                    <span>
                      Shipper Budget: <strong className="text-emerald-700 font-bold">{CurrencyHelper.formatINR(selectedLoad.shipper_budget_paise || selectedLoad.targetRatePaise || 0)}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 flex items-center space-x-2">
                  {(selectedLoad.status === 'ASSIGNED' || selectedLoad.status === 'INVOICED') && (
                    <button
                      onClick={() => handleViewInvoiceForLoad(selectedLoad.id)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View GST Invoice</span>
                    </button>
                  )}
                  {(selectedLoad.status === 'ASSIGNED' || selectedLoad.status === 'INVOICED') && onOpenTracking && (
                    <button
                      onClick={() => onOpenTracking(selectedLoad)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Live FASTag & ULIP</span>
                    </button>
                  )}
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      selectedLoad.status === 'OPEN' || selectedLoad.status === 'BIDDING'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    Status: {selectedLoad.status}
                  </span>
                </div>
              </div>

              {/* Carrier Ranking Engine Table Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Scale className="w-4 h-4 text-purple-600" />
                      <span>Carrier Ranking Engine & Profit Margin Analyzer</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Weighted by <strong className="text-slate-800">70% Cost + 30% Reliability</strong>. Top ranked carrier receives the AI Best Value recommendation.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    {rankedBids.length} Incoming Bids
                  </span>
                </div>

                {scoringLoading ? (
                  <div className="p-12 text-center text-slate-500 text-xs">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    Calculating AI carrier rankings and profit margins...
                  </div>
                ) : rankedBids.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No carrier bids on this load yet</p>
                    <p className="text-slate-400 mt-1">
                      Use the top Quick Role Switcher to switch to Carrier A or Carrier B and submit a bid.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rankedBids.map((item, idx) => {
                      const isAssigned = item.bid.status === 'ACCEPTED';
                      const isApproving = approvingBidId === item.bid.id;

                      return (
                        <div
                          key={item.bid.id}
                          className={`rounded-xl border p-4 transition-all duration-200 ${
                            item.isRankOne
                              ? 'bg-gradient-to-r from-amber-50/60 via-purple-50/40 to-white border-amber-300 ring-2 ring-amber-400/50 shadow-md'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Left: Carrier Identity & Ranking Badges */}
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-800 text-white">
                                  #{idx + 1}
                                </span>
                                <span className="font-bold text-sm text-slate-900">
                                  {item.carrierName}
                                </span>

                                {/* AI-recommended Best Value Carrier Badge */}
                                {item.isRankOne && (
                                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-extrabold shadow-xs">
                                    <Star className="w-3.5 h-3.5 fill-white text-white" />
                                    <span>AI Best Value Carrier</span>
                                  </span>
                                )}

                                {/* Reliability Score Badge */}
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                  <span>{item.reliabilityScore}% Reliability Score</span>
                                </span>
                              </div>

                              {/* Rates & Transit */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                                <span>
                                  Net Bid: <strong className="text-slate-900 font-bold text-sm">{CurrencyHelper.formatINR(item.bidAmountPaise)}</strong>
                                </span>
                                <span>•</span>
                                <span>Transit SLA: <strong>{item.transitHours} Hours</strong></span>
                                {item.bid.notes && (
                                  <>
                                    <span>•</span>
                                    <span className="italic text-slate-500">"{item.bid.notes}"</span>
                                  </>
                                )}
                              </div>

                              {/* 70% Cost + 30% Reliability Score Breakdown */}
                              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                                <div className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                                  Cost Score: <strong className="text-slate-900">{item.costScore}/100</strong>{' '}
                                  <span className="text-[10px] text-slate-500">(70% Weight)</span>
                                </div>
                                <div className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                                  Reliability Score: <strong className="text-slate-900">{item.reliabilityScore}/100</strong>{' '}
                                  <span className="text-[10px] text-slate-500">(30% Weight)</span>
                                </div>
                                <div className="px-2.5 py-1 rounded bg-purple-100 text-purple-900 font-extrabold border border-purple-200">
                                  Composite: {item.compositeScore}/100
                                </div>
                              </div>
                            </div>

                            {/* Right: Net Profit Margin in ₹ & Margin % + Approve & Dispatch Action */}
                            <div className="lg:text-right space-y-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                              {/* Exact Net Profit Margin in ₹ */}
                              <div>
                                <div className="text-xs text-slate-500">Exact Net Profit Margin:</div>
                                <div className="flex items-center lg:justify-end space-x-2 mt-0.5">
                                  <span
                                    className={`text-base font-extrabold ${
                                      item.isPositiveMargin ? 'text-emerald-700' : 'text-rose-600'
                                    }`}
                                  >
                                    {CurrencyHelper.formatINR(item.netProfitPaise)} net profit
                                  </span>
                                  {/* Margin % */}
                                  <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                      item.isPositiveMargin
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                                    }`}
                                  >
                                    {item.marginPercentStr}
                                  </span>
                                </div>
                              </div>

                              {/* Action: Approve & Dispatch Button */}
                              <div>
                                {isAssigned ? (
                                  <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approved & Dispatched</span>
                                  </div>
                                ) : selectedLoad.status === 'OPEN' || selectedLoad.status === 'BIDDING' ? (
                                  <button
                                    onClick={() => handleApproveAndDispatch(item.bid.id)}
                                    disabled={isApproving}
                                    className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md hover:shadow-purple-500/25 transition disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{isApproving ? 'Approving & Dispatching...' : 'Approve & Dispatch'}</span>
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Load already assigned</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <Scale className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-base font-semibold text-slate-700">Select a freight demand on the left</p>
              <p className="text-xs text-slate-500 mt-1">
                To evaluate carrier bids, review AI rankings, calculate profit margins, and trigger GST dispatch invoicing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
