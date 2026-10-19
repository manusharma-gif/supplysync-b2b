import React from 'react';
import { User, DemoPersona } from '../types.js';
import { Building2, Truck, Scale, ShieldCheck, Zap, Star } from 'lucide-react';

interface Props {
  currentUser: User | null;
  onSwitch: (persona: 'SHIPPER' | 'CARRIER_A' | 'CARRIER_B' | 'BROKER' | 'CARRIER') => void;
  loading: boolean;
  activePersona?: 'SHIPPER' | 'CARRIER_A' | 'CARRIER_B' | 'BROKER' | 'CARRIER';
}

interface PersonaConfig {
  id: 'SHIPPER' | 'CARRIER_A' | 'CARRIER_B' | 'BROKER';
  label: string;
  name: string;
  company: string;
  reliabilityScore: number;
  gstin: string;
  icon: any;
  color: string;
  activeBg: string;
}

export const QuickRoleSwitcher: React.FC<Props> = ({
  currentUser,
  onSwitch,
  loading,
  activePersona,
}) => {
  const personas: PersonaConfig[] = [
    {
      id: 'SHIPPER',
      label: 'Shipper',
      name: 'Gurpreet Singh',
      company: 'Punjab Agro Exporters Ltd',
      reliabilityScore: 90,
      gstin: '03AABCP8921A1Z2',
      icon: Building2,
      color: 'emerald',
      activeBg: 'from-emerald-600 to-teal-700',
    },
    {
      id: 'CARRIER_A',
      label: 'Carrier A',
      name: 'Rajesh Sharma',
      company: 'SpeedTrans Logistics',
      reliabilityScore: 95,
      gstin: '03AAACS4512C1Z4',
      icon: Truck,
      color: 'blue',
      activeBg: 'from-blue-600 to-indigo-700',
    },
    {
      id: 'CARRIER_B',
      label: 'Carrier B',
      name: 'Manish Verma',
      company: 'Northern Express Hauliers',
      reliabilityScore: 82,
      gstin: '07AAACN1289D1Z8',
      icon: Truck,
      color: 'cyan',
      activeBg: 'from-cyan-600 to-blue-800',
    },
    {
      id: 'BROKER',
      label: 'Freight Broker',
      name: 'Aditya Oberoi',
      company: 'SupplySync Freight Solutions',
      reliabilityScore: 100,
      gstin: '03AABCS1429B1Z0',
      icon: Scale,
      color: 'purple',
      activeBg: 'from-purple-600 to-violet-800',
    },
  ];

  // Determine which persona is currently active
  const getIsActive = (p: PersonaConfig): boolean => {
    if (activePersona) {
      if (activePersona === p.id) return true;
      if (activePersona === 'CARRIER') {
        return p.id === 'CARRIER_A';
      }
    }
    if (!currentUser) return false;
    if (p.id === 'SHIPPER') return currentUser.role === 'SHIPPER';
    if (p.id === 'BROKER') return currentUser.role === 'BROKER';
    if (currentUser.role === 'CARRIER') {
      const email = currentUser.email?.toLowerCase() || '';
      const company = (currentUser.company_name || currentUser.companyName || '').toLowerCase();
      if (p.id === 'CARRIER_B') {
        return email.includes('carrier2') || company.includes('northern') || (currentUser.reliability_score || 0) < 90;
      }
      if (p.id === 'CARRIER_A') {
        return !email.includes('carrier2') && !company.includes('northern');
      }
    }
    return false;
  };

  const activeConfig = personas.find((p) => getIsActive(p)) || (currentUser?.role === 'CARRIER' ? personas[1] : personas[3]);

  return (
    <div className="bg-slate-950 border-b border-slate-800 text-white px-3 sm:px-4 py-2 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Interview Demo Bar Title & Pulse */}
        <div className="flex items-center space-x-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex items-center space-x-1.5 text-xs font-bold tracking-wider uppercase text-amber-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Interview Demo Bar</span>
          </div>
          <span className="hidden md:inline-block text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            1-Click Persona Switcher
          </span>
        </div>

        {/* Center: 4 Persona Switcher Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {personas.map((p) => {
            const isActive = getIsActive(p);
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => onSwitch(p.id)}
                disabled={loading}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-r ${p.activeBg} text-white shadow-md ring-2 ring-white/40 scale-105 font-bold`
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
                }`}
                title={`Switch to ${p.label}: ${p.name} (${p.company})`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{p.label}</span>
                <span className="hidden xl:inline text-[10px] opacity-80">
                  ({p.company.split(' ')[0]} - {p.reliabilityScore}%)
                </span>
                {p.id.startsWith('CARRIER') && (
                  <span className="xl:hidden text-[10px] px-1 py-0.2 rounded bg-black/30">
                    {p.reliabilityScore}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Visual Badges for Active Persona, Reliability Rating, and GSTIN */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          {/* Active Persona Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Active: <strong className="text-white">{currentUser?.name || activeConfig.name}</strong>{' '}
              <span className="text-slate-400">({currentUser?.company_name || currentUser?.companyName || activeConfig.company})</span>
            </span>
          </div>

          {/* Reliability Rating Badge */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{currentUser?.reliability_score || activeConfig.reliabilityScore}% Reliability</span>
          </div>

          {/* GSTIN Badge */}
          <div className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 font-mono text-[11px] text-emerald-400">
            GSTIN: {currentUser?.gstin || activeConfig.gstin}
          </div>
        </div>
      </div>
    </div>
  );
};
