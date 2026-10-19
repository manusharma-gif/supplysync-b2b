import React, { useState, useEffect } from 'react';
import { Load, Bid, User } from '../types.js';
import { api, CurrencyHelper } from '../api.js';
import {
  Truck,
  MapPin,
  Award,
  ShieldCheck,
  CheckCircle2,
  Send,
  Clock,
  IndianRupee,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  activePersona?: 'SHIPPER' | 'CARRIER_A' | 'CARRIER_B' | 'BROKER' | 'CARRIER';
}

export const CarrierView: React.FC<Props> = ({ currentUser, activePersona }) => {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-bids'>('marketplace');
  const [loads, setLoads] = useState<Load[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  // Bid Modal
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [bidAmountRupees, setBidAmountRupees] = useState('');
  const [transitTimeHours, setTransitTimeHours] = useState('12');
  const [notes, setNotes] = useState('GPS-fitted 32ft MX ready for prompt dispatch.');
  const [submitting, setSubmitting] = useState(false);

  // Determine Carrier A vs Carrier B personalization
  const email = (currentUser?.email || '').toLowerCase();
  const company = (currentUser?.company_name || currentUser?.companyName || '').toLowerCase();
  const isCarrierB =
    activePersona === 'CARRIER_B' ||
    email.includes('carrier2') ||
    company.includes('northern') ||
    (currentUser?.reliability_score || 0) === 82;

  const carrierDisplayName = isCarrierB
    ? 'Northern Express Hauliers'
    : 'SpeedTrans Logistics';
  const driverName = isCarrierB ? 'Manish Verma' : 'Rajesh Sharma';
  const reliabilityScore = isCarrierB ? 82 : 95;
  const gstin = isCarrierB ? '07AAACN1289D1Z8' : '03AAACS4512C1Z4';
  const carrierTag = isCarrierB ? 'Carrier B' : 'Carrier A';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allLoads, carrierBids] = await Promise.all([api.getLoads(), api.getMyBids()]);
      // Filter marketplace loads to OPEN or BIDDING
      setLoads(allLoads.filter((l) => l.status === 'OPEN' || l.status === 'BIDDING'));
      setMyBids(carrierBids);
    } catch (err) {
      console.error('Error fetching carrier data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, activePersona]);

  const handleOpenBidModal = (load: Load) => {
    setSelectedLoad(load);
    const budget = load.shipper_budget_paise || load.targetRatePaise || 0;
    // Pre-populate with realistic competitive rate slightly below budget
    const budgetRupees = CurrencyHelper.paiseToRupees(budget);
    const initialBid = isCarrierB ? Math.round(budgetRupees * 0.95) : Math.round(budgetRupees * 0.92);
    setBidAmountRupees(initialBid > 0 ? initialBid.toString() : '35000');
    setTransitTimeHours(isCarrierB ? '14' : '12');
    setNotes(
      isCarrierB
        ? 'Available on return trip with heavy vehicle permit.'
        : 'GPS-fitted container truck ready for immediate dispatch.'
    );
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoad) return;

    try {
      setSubmitting(true);
      await api.placeBid({
        loadId: selectedLoad.id,
        amountRupees: parseFloat(bidAmountRupees),
        transitTimeHours: parseInt(transitTimeHours, 10),
        notes,
      });
      setSelectedLoad(null);
      await fetchData();
      setActiveTab('my-bids');
    } catch (err: any) {
      alert(`Error placing bid: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Carrier Performance Header Personalized for Active Carrier */}
      <div
        className={`rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border ${
          isCarrierB
            ? 'bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 border-cyan-800/40'
            : 'bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border-blue-800/40'
        }`}
      >
        <div>
          <div className="flex items-center space-x-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4 text-blue-400" />
            <span>
              {carrierTag} Dashboard • {carrierDisplayName} ({driverName})
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Carrier Freight Marketplace & Active Bids
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Marketplace board for Indian freight corridors. Your committed transit SLA and{' '}
            <strong className="text-white">{reliabilityScore}% Reliability Score</strong> directly power the Broker's AI composite ranking engine.
          </p>
          <div className="flex items-center space-x-3 mt-3 text-xs text-slate-400">
            <span>GSTIN: <strong className="font-mono text-emerald-400">{gstin}</strong></span>
            <span>•</span>
            <span>Fleet: <strong className="text-slate-200">{isCarrierB ? '24 Haulage Trailers' : '32 Multi-Axle Trucks'}</strong></span>
          </div>
        </div>

        {/* Carrier Scorecard Gauge */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex items-center space-x-5 shrink-0">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1.5 text-amber-300">
              <Award className="w-6 h-6 text-amber-400" />
              <span className="text-3xl font-black">{reliabilityScore}%</span>
            </div>
            <div className="text-[10px] uppercase font-extrabold text-slate-300 tracking-wider mt-0.5">
              Carrier Reliability
            </div>
          </div>
          <div className="h-12 w-px bg-white/20"></div>
          <div>
            <div className="text-xs text-slate-200 font-semibold">
              {isCarrierB ? 'Northern Corridor Fleet' : 'Tier-1 Certified Carrier'}
            </div>
            <div className="text-xs text-emerald-400 font-bold flex items-center space-x-1 mt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Logistics Partner</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              30% weight in Broker AI ranking
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'marketplace'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Marketplace Board ({loads.length} Loads)</span>
        </button>
        <button
          onClick={() => setActiveTab('my-bids')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'my-bids'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Submitted Bids ({myBids.length})</span>
        </button>
      </div>

      {/* Tab 1: Marketplace Board of OPEN/BIDDING Loads */}
      {activeTab === 'marketplace' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Open Freight Demands Ready for Carrier Bids
              </h2>
              <p className="text-xs text-slate-500">
                Indian freight corridor loads currently accepting competitive bids.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              Live Bidding Active
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading marketplace loads...
            </div>
          ) : loads.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-semibold text-slate-700">No open loads currently available</p>
              <p className="text-xs text-slate-500 mt-1">
                Switch to the Shipper persona to post new freight loads or run the AI Dispatch Parser.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {loads.map((load) => {
                const existingBid = myBids.find((b) => (b.load_id || b.loadId) === load.id);
                const origin = load.origin_city || load.originCity || 'Origin';
                const originSt = load.origin_state || load.originState || 'State';
                const dest = load.destination_city || load.destCity || 'Destination';
                const destSt = load.destination_state || load.destState || 'State';
                const weight = load.weight_tons || load.weightMetricTons || 16;
                const vehicle = load.vehicle_type || load.vehicleType || '32ft Multi-Axle';
                const budgetPaise = load.shipper_budget_paise || load.targetRatePaise || 0;

                return (
                  <div key={load.id} className="p-5 hover:bg-slate-50/80 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Route, Payload in MT, Vehicle Type, Shipper Budget */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            LOAD-#{load.id}
                          </span>
                          <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-base">
                            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>
                              {origin}, {originSt}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span>
                              {dest}, {destSt}
                            </span>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {load.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="flex items-center space-x-1">
                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Vehicle Type: <strong className="text-slate-800">{vehicle}</strong>
                            </span>
                          </span>
                          <span>•</span>
                          <span>
                            Payload: <strong className="text-slate-800">{weight} MT</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Shipper Budget: <strong className="text-emerald-700 font-bold">{CurrencyHelper.formatINR(budgetPaise)}</strong>
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">
                            {load.bids?.length || 0} competing bids
                          </span>
                        </div>

                        {load.description && (
                          <div className="text-xs text-slate-500 italic">"{load.description}"</div>
                        )}
                      </div>

                      {/* Right: Submit Bid Action */}
                      <div className="shrink-0">
                        {existingBid ? (
                          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>
                              Bid Placed: {CurrencyHelper.formatINR(existingBid.bid_amount_paise || existingBid.amountPaise || 0)}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenBidModal(load)}
                            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md hover:shadow-blue-500/25 transition cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Bid</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Submitted Bids Tab */}
      {activeTab === 'my-bids' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              My Submitted Bids ({carrierDisplayName})
            </h2>
            <p className="text-xs text-slate-500">
              Track the live approval and dispatch status of your submitted bids.
            </p>
          </div>

          {myBids.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Truck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-base font-semibold text-slate-700">No bids submitted yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Browse open loads in the marketplace board and submit your freight rates.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myBids.map((bid) => {
                const amount = bid.bid_amount_paise || bid.amountPaise || 0;
                const transit = bid.estimated_transit_hours || bid.transitTimeHours || 12;
                const loadId = bid.load_id || bid.loadId;

                return (
                  <div key={bid.id} className="p-5 hover:bg-slate-50 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            BID-#{bid.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            on LOAD-#{loadId}{' '}
                            {bid.load
                              ? `(${bid.load.origin_city || bid.load.originCity} → ${bid.load.destination_city || bid.load.destCity})`
                              : ''}
                          </span>

                          {/* Status Badge: PENDING, ACCEPTED, REJECTED */}
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              bid.status === 'ACCEPTED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : bid.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {bid.status}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-slate-600">
                          <span>
                            Submitted Freight Rate: <strong className="text-slate-900 text-sm font-bold">{CurrencyHelper.formatINR(amount)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Transit SLA: <strong>{transit} Hours</strong>
                          </span>
                        </div>

                        {bid.notes && (
                          <div className="text-xs text-slate-400 italic">"{bid.notes}"</div>
                        )}
                      </div>

                      {/* Contract Award Notification */}
                      {bid.status === 'ACCEPTED' && (
                        <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 shadow-xs shrink-0">
                          <Award className="w-5 h-5 text-emerald-600" />
                          <div>
                            <div>Freight Contract Awarded!</div>
                            <div className="text-[10px] font-normal text-emerald-700">
                              GST Dispatch Invoice issued by Broker.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal to Submit a Bid in INR (₹) and Committed Transit Hours */}
      {selectedLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Submit Carrier Bid ({carrierTag})
                </h3>
              </div>
              <button
                onClick={() => setSelectedLoad(null)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-slate-700 space-y-1.5">
              <div>
                <strong>Route:</strong> {selectedLoad.origin_city || selectedLoad.originCity} ({selectedLoad.origin_state || selectedLoad.originState || 'Punjab'}) → {selectedLoad.destination_city || selectedLoad.destCity} ({selectedLoad.destination_state || selectedLoad.destState || 'Delhi'})
              </div>
              <div>
                <strong>Payload:</strong> {selectedLoad.weight_tons || selectedLoad.weightMetricTons || 16} MT • <strong>Vehicle:</strong> {selectedLoad.vehicle_type || selectedLoad.vehicleType}
              </div>
              <div>
                <strong>Shipper Budget:</strong>{' '}
                <span className="font-bold text-emerald-700">
                  {CurrencyHelper.formatINR(selectedLoad.shipper_budget_paise || selectedLoad.targetRatePaise || 0)}
                </span>
              </div>
              <div className="text-[11px] text-blue-800 pt-0.5">
                Carrier Rating applied: <strong>{reliabilityScore}% Reliability Score</strong>
              </div>
            </div>

            <form onSubmit={handlePlaceBid} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Net Freight Bid (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={bidAmountRupees}
                    onChange={(e) => setBidAmountRupees(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5 pl-7 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Stored in database in exact integer Paise:{' '}
                  <strong>{parseInt(bidAmountRupees || '0', 10) * 100} Paise</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Committed Transit Time (Hours)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={transitTimeHours}
                  onChange={(e) => setTransitTimeHours(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Specs & Driver Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLoad(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Confirm & Place Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
