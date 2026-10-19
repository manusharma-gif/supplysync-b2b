import React, { useState, useEffect } from 'react';
import { Load, UlipVerificationResponse } from '../types.js';
import { api, CurrencyHelper } from '../api.js';
import {
  X,
  Truck,
  ShieldCheck,
  Radio,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  load: Load | null;
}

export const LiveTrackingDrawer: React.FC<Props> = ({ isOpen, onClose, load }) => {
  const [vehicleNumber, setVehicleNumber] = useState('PB-02-CR-4590');
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState<UlipVerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const originCity = load?.origin_city || load?.originCity || 'Ludhiana';
  const destCity = load?.destination_city || load?.destCity || 'Delhi';

  const handleVerify = async (plateToVerify?: string) => {
    const plate = plateToVerify || vehicleNumber;
    if (!plate.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.verifyVehicle(plate.trim(), {
        originCity,
        destCity,
      });
      setVerificationData(data);
    } catch (err: any) {
      console.error('ULIP Verification failed:', err);
      setError(err.message || 'Invalid Indian commercial vehicle registration format');
      setVerificationData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleVerify('PB-02-CR-4590');
    }
  }, [isOpen, load]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-indigo-900/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black tracking-tight text-white">
                    Live FASTag & ULIP Highway Tracking
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ULIP API V2
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Unified Logistics Interface Platform (VAHAN RC + NETC FASTag Checkpoints)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Load Corridor Summary Bar */}
          {load && (
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="font-semibold text-slate-700">Corridor:</span>
                <strong className="text-slate-900 font-bold">
                  {originCity} ({load.origin_state || load.originState || 'Punjab'}) → {destCity} ({load.destination_state || load.destState || 'Delhi'})
                </strong>
              </div>
              <div className="flex items-center space-x-3 text-slate-600">
                <span>Weight: <strong>{load.weight_tons || load.weightMetricTons || 16} MT</strong></span>
                <span>•</span>
                <span>Type: <strong>{load.vehicle_type || load.vehicleType || '32ft Multi-Axle'}</strong></span>
                <span>•</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded">
                  {load.status}
                </span>
              </div>
            </div>
          )}

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Interactive Plate Verification Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Simulate Truck Registration Plate (Indian Standard Format):
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Truck className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. PB-02-CR-4590 or HP-38-E-9911"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold tracking-wider rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden uppercase"
                  />
                </div>
                <button
                  onClick={() => handleVerify()}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Verifying...' : 'Verify ULIP'}</span>
                </button>
              </div>

              {/* Quick Sample Presets */}
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500">Quick Test Plates:</span>
                {[
                  { plate: 'PB-02-CR-4590', label: 'Punjab Heavy Multi-Axle' },
                  { plate: 'HP-38-E-9911', label: 'Himachal Container' },
                  { plate: 'DL-01-AB-1234', label: 'Delhi NCR Freight' },
                  { plate: 'MH-12-RN-5020', label: 'Maharashtra Express' },
                ].map((preset) => (
                  <button
                    key={preset.plate}
                    onClick={() => {
                      setVehicleNumber(preset.plate);
                      handleVerify(preset.plate);
                    }}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition cursor-pointer ${
                      vehicleNumber === preset.plate
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {preset.plate}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {verificationData && (
              <>
                {/* 1. VAHAN National Register RC Compliance Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200/60 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                          VAHAN RC Authentication — MoRTH Certified
                        </h3>
                        <p className="text-[11px] text-emerald-700">
                          State: <strong>{verificationData.stateName} ({verificationData.stateCode})</strong> • RTO: {verificationData.vahan.registeredRTO}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-600 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider shadow-xs">
                      100% Compliant
                    </span>
                  </div>

                  <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Registered Fleet Owner</span>
                      <strong className="text-slate-800 text-xs mt-0.5 block">{verificationData.vahan.ownerName}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Vehicle Make & Model</span>
                      <strong className="text-slate-800 text-xs mt-0.5 block">{verificationData.vahan.makerModel}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Emission Standard</span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-green-100 text-green-800 font-bold rounded text-[11px]">
                        {verificationData.vahan.emissionNorms}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Fitness Validity</span>
                      <strong className="text-emerald-700 text-xs mt-0.5 block">
                        Valid until {verificationData.vahan.fitnessValidUntil}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Commercial Insurance</span>
                      <strong className="text-slate-800 text-xs mt-0.5 block">
                        {verificationData.vahan.insurancePolicyNumber}
                      </strong>
                      <span className="text-[10px] text-slate-500">Exp: {verificationData.vahan.insuranceValidUntil}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">National Permit</span>
                      <strong className="text-purple-700 text-xs mt-0.5 block">All India Goods Permit</strong>
                      <span className="text-[10px] text-slate-500">Exp: {verificationData.vahan.nationalPermitValidUntil}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Gross Vehicle Weight (GVW)</span>
                      <strong className="text-slate-900 font-mono text-xs mt-0.5 block">
                        {(verificationData.vahan.grossVehicleWeightKg / 1000).toFixed(1)} MT ({verificationData.vahan.grossVehicleWeightKg.toLocaleString()} kg)
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Unladen Tare Weight</span>
                      <strong className="text-slate-900 font-mono text-xs mt-0.5 block">
                        {(verificationData.vahan.unladenWeightKg / 1000).toFixed(1)} MT ({verificationData.vahan.unladenWeightKg.toLocaleString()} kg)
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">PUC Certificate</span>
                      <strong className="text-emerald-700 text-xs mt-0.5 block">
                        Valid until {verificationData.vahan.pucValidUntil}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. FASTag Electronic Toll Collection (NETC/NPCI) Live Wallet */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        FASTag Electronic Toll Collection (NETC / NPCI)
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded">
                      STATUS: {verificationData.fastag.accountStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">FASTag RFID Tag ID</span>
                      <span className="font-mono text-slate-800 font-bold text-[11px] block mt-0.5">
                        {verificationData.fastag.tagId}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Issuer Clearinghouse Bank</span>
                      <span className="text-slate-800 font-semibold block mt-0.5">
                        {verificationData.fastag.bankName}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Wallet Pre-Paid Balance</span>
                      <span className="text-emerald-700 font-bold font-mono text-sm block mt-0.5">
                        {CurrencyHelper.formatINR(verificationData.fastag.walletBalancePaise)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Live Highway Toll Checkpoints Sequence Timeline */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-purple-600 animate-pulse" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Live Highway Toll Checkpoints ({originCity} → {destCity})
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Sequence: <strong>{verificationData.tollCheckpoints.length} Checkpoints Cleared</strong>
                    </span>
                  </div>

                  {/* Step-by-Step Vertical Timeline */}
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-blue-400 before:to-indigo-500">
                    {verificationData.tollCheckpoints.map((cp, idx) => (
                      <div key={idx} className="relative group">
                        {/* Dot indicator */}
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-xs flex items-center justify-center text-white text-[9px] font-bold">
                          ✓
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 hover:border-blue-300 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-xs text-slate-900">{cp.plazaName}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800">
                                  {cp.highwayNumber}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{cp.laneId}</p>
                            </div>

                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-full uppercase shrink-0">
                              {cp.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/60 text-[11px]">
                            <div className="flex items-center space-x-1.5 text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{cp.timeAgo} ({new Date(cp.timestamp).toLocaleTimeString('en-IN')})</span>
                            </div>

                            <div className="font-mono text-slate-700 font-semibold">
                              Toll Fee: <strong>{CurrencyHelper.formatINR(cp.tollFeePaise)}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Final In-Transit Milestone */}
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-indigo-600 border-2 border-white shadow-xs flex items-center justify-center text-white text-[9px] animate-pulse">
                        ●
                      </div>
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3.5 border border-indigo-200">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-indigo-950">
                            Current Position: En Route to Destination Unloading Dock
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            IN TRANSIT
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-700 mt-1">
                          Vehicle speed steady on corridor. Estimated remaining transit: ~1.5 hours.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>National Logistics Policy (NLP) & ULIP Standards Enforced</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition cursor-pointer"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
