import React, { useState, useEffect } from 'react';
import { User, UserRole, Invoice, Load } from './types.js';
import { api } from './api.js';
import { QuickRoleSwitcher } from './components/QuickRoleSwitcher.js';
import { Navbar } from './components/Navbar.js';
import { ShipperView } from './components/ShipperView.js';
import { CarrierView } from './components/CarrierView.js';
import { BrokerView } from './components/BrokerView.js';
import { AIDispatchParserModal } from './components/AIDispatchParserModal.js';
import { GSTInvoiceModal } from './components/GSTInvoiceModal.js';
import { InvoicesListModal } from './components/InvoicesListModal.js';
import { LiveTrackingDrawer } from './components/LiveTrackingDrawer.js';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(api.getCurrentUser());
  const [activePersona, setActivePersona] = useState<'SHIPPER' | 'CARRIER_A' | 'CARRIER_B' | 'BROKER'>('BROKER');
  const [loadingRole, setLoadingRole] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals & Drawers
  const [showParser, setShowParser] = useState(false);
  const [showInvoicesList, setShowInvoicesList] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showTracking, setShowTracking] = useState(false);
  const [trackingLoad, setTrackingLoad] = useState<Load | null>(null);

  // Initial auto-login to BROKER or saved user
  useEffect(() => {
    if (!currentUser) {
      handleRoleSwitch('BROKER');
    } else {
      if (currentUser.role === 'CARRIER') {
        const email = currentUser.email?.toLowerCase() || '';
        const comp = (currentUser.company_name || currentUser.companyName || '').toLowerCase();
        if (email.includes('carrier2') || comp.includes('northern')) {
          setActivePersona('CARRIER_B');
        } else {
          setActivePersona('CARRIER_A');
        }
      } else if (currentUser.role === 'SHIPPER') {
        setActivePersona('SHIPPER');
      } else {
        setActivePersona('BROKER');
      }
    }
  }, []);

  const handleRoleSwitch = async (persona: 'SHIPPER' | 'CARRIER_A' | 'CARRIER_B' | 'BROKER' | 'CARRIER') => {
    try {
      setLoadingRole(true);
      const res = await api.quickSwitch(persona);
      setCurrentUser(res.user);
      if (persona === 'CARRIER_A' || persona === 'CARRIER_B' || persona === 'SHIPPER' || persona === 'BROKER') {
        setActivePersona(persona);
      } else if (res.user.email?.includes('carrier2')) {
        setActivePersona('CARRIER_B');
      } else if (res.user.role === 'CARRIER') {
        setActivePersona('CARRIER_A');
      } else {
        setActivePersona(res.user.role as any);
      }
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setLoadingRole(false);
    }
  };

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* 1. Floating Demo Mode Quick Switcher Toolbar */}
      <QuickRoleSwitcher
        currentUser={currentUser}
        activePersona={activePersona}
        onSwitch={handleRoleSwitch}
        loading={loadingRole}
      />

      {/* 2. Enterprise Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenParser={() => setShowParser(true)}
        onOpenInvoices={() => setShowInvoicesList(true)}
      />

      {/* 3. Main Dashboard Workspace according to Active Persona */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loadingRole ? (
          <div className="p-20 text-center text-slate-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-sm font-semibold">Switching persona...</p>
          </div>
        ) : (
          <div key={refreshKey}>
            {currentUser?.role === 'SHIPPER' && (
              <ShipperView
                onRefreshNeeded={triggerRefresh}
                onOpenParser={() => setShowParser(true)}
                onViewInvoice={(inv) => setSelectedInvoice(inv)}
                onOpenTracking={(load) => {
                  setTrackingLoad(load);
                  setShowTracking(true);
                }}
              />
            )}
            {currentUser?.role === 'CARRIER' && (
              <CarrierView currentUser={currentUser} activePersona={activePersona} />
            )}
            {currentUser?.role === 'BROKER' && (
              <BrokerView
                onViewInvoice={(inv) => setSelectedInvoice(inv)}
                onOpenParser={() => setShowParser(true)}
                onOpenTracking={(load) => {
                  setTrackingLoad(load);
                  setShowTracking(true);
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* 4. Modals & Drawers */}
      <AIDispatchParserModal
        isOpen={showParser}
        onClose={() => setShowParser(false)}
        onLoadCreated={triggerRefresh}
      />

      <InvoicesListModal
        isOpen={showInvoicesList}
        onClose={() => setShowInvoicesList(false)}
        onSelectInvoice={(inv) => setSelectedInvoice(inv)}
      />

      <GSTInvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      <LiveTrackingDrawer
        isOpen={showTracking}
        onClose={() => {
          setShowTracking(false);
          setTrackingLoad(null);
        }}
        load={trackingLoad}
      />
    </div>
  );
}

export default App;
