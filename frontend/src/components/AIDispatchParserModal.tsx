import React, { useState } from 'react';
import { ParsedDispatchPayload } from '../types.js';
import { api, CurrencyHelper } from '../api.js';
import { Sparkles, Send, CheckCircle2, AlertTriangle, ArrowRight, Truck, MapPin, IndianRupee, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoadCreated: () => void;
}

export const AIDispatchParserModal: React.FC<Props> = ({ isOpen, onClose, onLoadCreated }) => {
  const [inputText, setInputText] = useState(
    'Need 14ft container from Jalandhar to Gurugram urgent tomorrow, load is 7.5 metric tons of auto parts, budget around 28,000 rs'
  );
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedDispatchPayload | null>(null);

  if (!isOpen) return null;

  const sampleTexts = [
    {
      title: 'WhatsApp (Jalandhar → Gurugram 14ft Container)',
      text: 'Need 14ft container from Jalandhar to Gurugram urgent tomorrow, load is 7.5 metric tons of auto parts, budget around 28,000 rs',
    },
    {
      title: 'Email (Ludhiana → Delhi NCR 18 MT Coils)',
      text: 'Need 32ft MX from Ludhiana to Delhi NCR, 18 MT steel coils, target rate 38,000. Loading tomorrow morning.',
    },
    {
      title: 'Factory Dispatch (Pathankot → Chandigarh Cement)',
      text: 'Urgent requirement: Pathankot to Chandigarh, 22 tons cement bags. Vehicle: Taurus 16T. Budget: Rs 28,000 + GST.',
    },
  ];

  const handleParse = async () => {
    try {
      setParsing(true);
      const res = await api.parseInquiry(inputText);
      setParsedResult(res);
    } catch (err: any) {
      alert(`Parsing failed: ${err.message}`);
    } finally {
      setParsing(false);
    }
  };

  const handleCreateLoad = async () => {
    if (!parsedResult) return;
    try {
      setCreating(true);
      await api.createLoadFromParsed(parsedResult);
      onLoadCreated();
      onClose();
    } catch (err: any) {
      alert(`Failed to create load: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Dispatch Parser</h3>
              <p className="text-[11px] text-slate-500">
                Transforms unstructured WhatsApp & Email freight inquiries into structured load payloads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* Preset Sample Buttons */}
        <div className="space-y-1.5 mb-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Quick-Fill Real Indian Logistics Examples:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleTexts.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(sample.text)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium transition"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Input Text Area */}
        <div className="space-y-2 mb-4">
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste raw WhatsApp or Email transport inquiry text here..."
            className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-violet-500 focus:outline-hidden font-mono text-slate-800"
          />
          <div className="flex justify-end">
            <button
              onClick={handleParse}
              disabled={parsing || !inputText.trim()}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{parsing ? 'Parsing Payload...' : 'Parse Unstructured Text'}</span>
            </button>
          </div>
        </div>

        {/* Parsed Result Card */}
        {parsedResult && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Extracted Shipment Schema
              </span>
              <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Confidence: {parsedResult.confidenceScore}%</span>
              </div>
            </div>

            {/* Entities Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Origin</span>
                <div className="font-bold text-slate-900 mt-0.5">{parsedResult.originCity}</div>
                <div className="text-[10px] text-slate-500">{parsedResult.originState}</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Destination</span>
                <div className="font-bold text-slate-900 mt-0.5">{parsedResult.destCity}</div>
                <div className="text-[10px] text-slate-500">{parsedResult.destState}</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Payload & Type</span>
                <div className="font-bold text-slate-900 mt-0.5">{parsedResult.weightMetricTons} MT</div>
                <div className="text-[10px] text-slate-500">{parsedResult.vehicleType}</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Target Budget</span>
                <div className="font-bold text-emerald-700 mt-0.5">
                  ₹{parsedResult.targetRateRupees.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500">{parsedResult.targetRatePaise} Paise</div>
              </div>
            </div>

            {/* Convert to Live Load Action */}
            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={handleCreateLoad}
                disabled={creating}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md hover:shadow-emerald-500/25 transition disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                <span>{creating ? 'Publishing...' : 'Deploy as Live Marketplace Load'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
