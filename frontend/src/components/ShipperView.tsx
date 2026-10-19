import React, { useState, useEffect } from 'react';
import { Load, Corridor, Bid, Invoice } from '../types.js';
import { api, CurrencyHelper } from '../api.js';
import {
  Plus,
  Package,
  MapPin,
  Truck,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  IndianRupee,
  ShieldCheck,
  Star,
  Layers,
  ChevronDown,
  Sparkles,
  FileText,
  Radio,
} from 'lucide-react';

interface Props {
  onRefreshNeeded?: () => void;
  onOpenParser?: () => void;
  onViewInvoice?: (invoice: Invoice) => void;
  onOpenTracking?: (load: Load) => void;
}

export const ShipperView: React.FC<Props> = ({ onRefreshNeeded, onOpenParser, onViewInvoice, onOpenTracking }) => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLoadForBids, setSelectedLoadForBids] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'BIDDING' | 'ASSIGNED' | 'INVOICED'>('ALL');

  // Pre-seeded Indian corridors fallback list in case backend endpoint is empty
  const defaultCorridors = [
    {
      id: 1,
      originCity: 'Pathankot',
      originState: 'Punjab',
      destCity: 'Chandigarh',
      destState: 'Punjab',
      distanceKm: 245,
      avgRatePerTonPaise: 145000,
    },
    {
      id: 2,
      originCity: 'Ludhiana',
      originState: 'Punjab',
      destCity: 'Delhi',
      destState: 'Delhi',
      distanceKm: 310,
      avgRatePerTonPaise: 233000,
    },
    {
      id: 3,
      originCity: 'Amritsar',
      originState: 'Punjab',
      destCity: 'Jaipur',
      destState: 'Rajasthan',
      distanceKm: 620,
      avgRatePerTonPaise: 337500,
    },
    {
      id: 4,
      originCity: 'Mumbai',
      originState: 'Maharashtra',
      destCity: 'Pune',
      destState: 'Maharashtra',
      distanceKm: 150,
      avgRatePerTonPaise: 220000,
    },
    {
      id: 5,
      originCity: 'Bangalore',
      originState: 'Karnataka',
      destCity: 'Chennai',
      destState: 'Tamil Nadu',
      distanceKm: 345,
      avgRatePerTonPaise: 210000,
    },
  ];

  // Form State
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('');
  const [originCity, setOriginCity] = useState('Ludhiana');
  const [originState, setOriginState] = useState('Punjab');
  const [destCity, setDestCity] = useState('Delhi');
  const [destState, setDestState] = useState('Delhi');
  const [weightMetricTons, setWeightMetricTons] = useState('18');
  const [vehicleType, setVehicleType] = useState('32ft Multi-Axle');
  const [targetRateRupees, setTargetRateRupees] = useState('42000');
  const [description, setDescription] = useState('Export grade auto parts & machine tools. Palletized loading ready.');

  const fetchLoads = async () => {
    try {
      setLoading(true);
      const data = await api.getLoads();
      setLoads(data);
    } catch (err) {
      console.error('Error fetching loads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (loadId: number) => {
    if (!onViewInvoice) return;
    try {
      const inv = await api.getInvoiceByLoadId(loadId);
      if (inv) {
        onViewInvoice(inv);
      } else {
        const allInvoices = await api.getInvoices();
        const found = allInvoices.find((i) => i.load_id === loadId || i.loadId === loadId);
        if (found) {
          onViewInvoice(found);
        } else {
          alert('No invoice generated for this load yet.');
        }
      }
    } catch (err: any) {
      alert(`Could not load invoice: ${err.message}`);
    }
  };

  const fetchCorridors = async () => {
    try {
      const data = await api.getCorridors();
      if (data && data.length > 0) {
        setCorridors(data);
      } else {
        setCorridors(defaultCorridors);
      }
    } catch (err) {
      console.warn('Using default corridors list:', err);
      setCorridors(defaultCorridors);
    }
  };

  useEffect(() => {
    fetchLoads();
    fetchCorridors();
  }, []);

  const handleCorridorChange = (corridorId: string) => {
    setSelectedCorridorId(corridorId);
    const corridor = corridors.find((c) => c.id.toString() === corridorId);
    if (corridor) {
      setOriginCity(corridor.originCity);
      setOriginState(corridor.originState);
      setDestCity(corridor.destCity);
      setDestState(corridor.destState);
      const tons = parseFloat(weightMetricTons) || 16;
      const ratePerTon = CurrencyHelper.paiseToRupees(corridor.avgRatePerTonPaise);
      setTargetRateRupees(Math.round(tons * ratePerTon).toString());
    }
  };

  const handlePostLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createLoad({
        originCity,
        originState,
        destCity,
        destState,
        weightMetricTons: parseFloat(weightMetricTons),
        vehicleType,
        targetRateRupees: parseFloat(targetRateRupees),
        description,
      });
      setShowPostModal(false);
      await fetchLoads();
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err: any) {
      alert(`Error posting load: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Status counts
  const openCount = loads.filter((l) => l.status === 'OPEN').length;
  const biddingCount = loads.filter((l) => l.status === 'BIDDING').length;
  const assignedCount = loads.filter((l) => l.status === 'ASSIGNED').length;
  const invoicedCount = loads.filter((l) => l.status === 'INVOICED').length;

  const filteredLoads = loads.filter((l) => {
    if (statusFilter === 'ALL') return true;
    return l.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Shipper Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-800/40">
        <div>
          <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Shipper Portal • Punjab Agro Exporters Ltd (Gurpreet Singh)</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Freight Dispatch Board & Corridors
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Publish FTL freight demands across major Indian transport corridors. Real-time carrier bidding with automated transit SLA commitment and zero floating-point rate governance.
          </p>
          <div className="flex items-center space-x-3 mt-3 text-xs text-slate-400">
            <span>GSTIN: <strong className="font-mono text-emerald-400">03AABCP8921A1Z2</strong></span>
            <span>•</span>
            <span>Base: <strong className="text-slate-200">Punjab</strong></span>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {onOpenParser && (
            <button
              onClick={onOpenParser}
              className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Smart Paste Inquiry (WhatsApp/Email)</span>
            </button>
          )}
          <button
            onClick={() => setShowPostModal(true)}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg hover:shadow-emerald-500/25 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Post New Freight Load</span>
          </button>
        </div>
      </div>

      {/* Live Status Tracker Navigation Pills */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Live Load Status Tracker:
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>All Demands</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {loads.length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('OPEN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                statusFilter === 'OPEN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>OPEN</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200/50">
                {openCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('BIDDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                statusFilter === 'BIDDING'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <span>BIDDING</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-200/50">
                {biddingCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('ASSIGNED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                statusFilter === 'ASSIGNED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>ASSIGNED</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-200/50">
                {assignedCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('INVOICED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                statusFilter === 'INVOICED'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>INVOICED</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-200/50">
                {invoicedCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Loads Directory Table with Active Bid Counts & Bids Drawer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Freight Postings ({filteredLoads.length} Loads)
            </h2>
            <p className="text-xs text-slate-500">
              Click the bids counter on any load to open its carrier bids drawer.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {loads.length} Total Registered Loads
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
            Loading freight demands...
          </div>
        ) : filteredLoads.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">No freight loads matching filter</p>
            <p className="text-xs text-slate-500 mt-1">
              Select another status or click "Post New Freight Load" to create a new demand.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLoads.map((load) => {
              const bidsCount = load.bids?.length || 0;
              const isDrawerOpen = selectedLoadForBids === load.id;
              const origin = load.origin_city || load.originCity || 'Origin';
              const originSt = load.origin_state || load.originState || 'State';
              const dest = load.destination_city || load.destCity || 'Destination';
              const destSt = load.destination_state || load.destState || 'State';
              const weight = load.weight_tons || load.weightMetricTons || 16;
              const vehicle = load.vehicle_type || load.vehicleType || '32ft Multi-Axle';
              const budgetPaise = load.shipper_budget_paise || load.targetRatePaise || 0;

              return (
                <div key={load.id} className="p-5 hover:bg-slate-50/70 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Load Details */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          LOAD-#{load.id}
                        </span>
                        <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-base">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            {origin}, {originSt}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span>
                            {dest}, {destSt}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            load.status === 'OPEN'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : load.status === 'BIDDING'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : load.status === 'ASSIGNED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {load.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center space-x-1">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Vehicle: <strong>{vehicle}</strong></span>
                        </span>
                        <span>•</span>
                        <span>Weight: <strong>{weight} MT</strong></span>
                        <span>•</span>
                        <span>
                          Shipper Budget: <strong className="text-emerald-700 font-bold">{CurrencyHelper.formatINR(budgetPaise)}</strong>
                        </span>
                        {load.description && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 italic max-w-md truncate">"{load.description}"</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Active Bid Count & Drawer Toggle & View GST Invoice */}
                    <div className="shrink-0 flex items-center space-x-2">
                      {(load.status === 'ASSIGNED' || load.status === 'INVOICED') && onViewInvoice && (
                        <button
                          onClick={() => handleViewInvoice(load.id)}
                          className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View GST Invoice</span>
                        </button>
                      )}
                      {(load.status === 'ASSIGNED' || load.status === 'INVOICED') && onOpenTracking && (
                        <button
                          onClick={() => onOpenTracking(load)}
                          className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          <span>Live FASTag & ULIP</span>
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setSelectedLoadForBids(isDrawerOpen ? null : load.id)
                        }
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          bidsCount > 0
                            ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{bidsCount} Active Carrier Bid{bidsCount !== 1 ? 's' : ''}</span>
                        <ChevronDown
                          className={`w-4 h-4 transform transition duration-200 ${
                            isDrawerOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Bids Drawer */}
                  {isDrawerOpen && (
                    <div className="mt-4 pt-4 border-t border-slate-200/80 bg-slate-50/80 p-4 rounded-xl space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                          <Layers className="w-3.5 h-3.5 text-purple-600" />
                          <span>Incoming Carrier Bids for LOAD-#{load.id}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {bidsCount} Bid{bidsCount !== 1 ? 's' : ''} Submitted
                        </span>
                      </div>

                      {bidsCount === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3 bg-white rounded-lg border border-slate-200">
                          No carrier bids submitted yet. Switch to Carrier A or Carrier B from the top bar to place competitive bids.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {load.bids?.map((bid) => {
                            const bidAmount = bid.bid_amount_paise || bid.amountPaise || 0;
                            const transit = bid.estimated_transit_hours || bid.transitTimeHours || 12;
                            const carrierName =
                              bid.carrier?.company_name || bid.carrier?.companyName || 'Carrier Partner';
                            const carrierReliability =
                              bid.carrier?.reliability_score ?? bid.carrier?.onTimeRating ?? 85;

                            return (
                              <div
                                key={bid.id}
                                className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-bold text-xs text-slate-900">{carrierName}</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                      ★ {carrierReliability}%
                                    </span>
                                  </div>
                                  <span className="text-sm font-extrabold text-emerald-700">
                                    {CurrencyHelper.formatINR(bidAmount)}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-600">
                                  <span>Transit SLA: <strong>{transit} Hours</strong></span>
                                  <span
                                    className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                      bid.status === 'ACCEPTED'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : bid.status === 'REJECTED'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {bid.status}
                                  </span>
                                </div>

                                {bid.notes && (
                                  <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-100">
                                    "{bid.notes}"
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form to Post a New Load (Modal) */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Post New Freight Load
                </h3>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostLoad} className="space-y-4">
              {/* Indian Corridor Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Indian Corridor (Auto-fills cities & recommended rates)
                </label>
                <select
                  value={selectedCorridorId}
                  onChange={(e) => handleCorridorChange(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/50"
                >
                  <option value="">-- Choose Indian Corridor (or fill manually) --</option>
                  {corridors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.originCity} ({c.originState}) → {c.destCity} ({c.destState}) • {c.distanceKm} km
                    </option>
                  ))}
                </select>
              </div>

              {/* Origin & Destination */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Origin City</label>
                  <input
                    type="text"
                    required
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Origin State</label>
                  <input
                    type="text"
                    required
                    value={originState}
                    onChange={(e) => setOriginState(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination City</label>
                  <input
                    type="text"
                    required
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination State</label>
                  <input
                    type="text"
                    required
                    value={destState}
                    onChange={(e) => setDestState(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Weight & Vehicle Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (Tons / MT)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={weightMetricTons}
                    onChange={(e) => setWeightMetricTons(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="32ft Multi-Axle">32ft Multi-Axle (MX)</option>
                    <option value="Taurus 16T">Taurus 16T</option>
                    <option value="14 Wheeler">14 Wheeler</option>
                    <option value="20ft Container">20ft Container</option>
                    <option value="Tata 407">Tata 407</option>
                  </select>
                </div>
              </div>

              {/* Target Budget in INR */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shipper Target Budget (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={targetRateRupees}
                    onChange={(e) => setTargetRateRupees(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5 pl-7 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Persisted with strict financial integer precision: <strong>{parseInt(targetRateRupees || '0', 10) * 100} Paise</strong>.
                </p>
              </div>

              {/* Loading Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Commodity / Loading Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Publishing...' : 'Publish to Freight Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
