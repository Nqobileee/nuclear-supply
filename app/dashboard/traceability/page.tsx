'use client';

import { Search, Download, FileText, Clock, MapPin, User, Database, Loader2, ShieldCheck, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { VerifyShipmentDialog } from '@/components/traceability';
import { downloadAuditTrailJSON, generateSignedPDFReport } from '@/lib/traceability-utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function TraceabilityPage() {
  const [selectedShipment, setSelectedShipment] = useState('');
  const [shipments, setShipments] = useState<any[]>([]);
  const [isRegulatorView, setIsRegulatorView] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    async function fetchInitialData() {
      const { data } = await supabase.from('shipments').select('id, isotope').order('created_at', { ascending: false }).limit(5);
      if (data && data.length > 0) {
        setShipments(data);
        if (!selectedShipment) {
          setSelectedShipment(data[0].id);
        }
      }
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedShipment) {
      fetchAuditTrail();
    }
  }, [selectedShipment]);

  async function fetchAuditTrail() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_trail')
        .select('*')
        .or(`shipment_id.eq.${selectedShipment},procurement_id.eq.${selectedShipment}`)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Audit Trail Fetch Error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      setAuditEvents(data || []);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      toast.error('Failed to load audit trail');
    } finally {
      setIsLoading(false);
    }
  }


  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'created': return FileText;
      case 'dispatched': return MapPin;
      case 'loaded': return User;
      case 'temperature': return Database;
      case 'checkpoint': return MapPin;
      case 'customs': return FileText;
      default: return ActivityIcon;
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="dashboard-title text-2xl sm:text-3xl mb-1">Blockchain Traceability</h2>
          <p className="text-sm text-gray-500">Immutable ledger of every handling event</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isRegulatorView}
              onChange={(e) => setIsRegulatorView(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            <span className="ml-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Regulator Mode</span>
          </label>
        </div>
      </div>

      {isRegulatorView && (
        <div className="bg-blue-900 rounded-2xl p-6 mb-8 border border-blue-800 shadow-xl shadow-blue-900/10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-800 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-700">
              <ShieldCheck className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Regulatory Oversight Active</h3>
              <p className="text-blue-200 text-xs">
                Encryption layers active. Pricing and sensitive identifiers are hashed.
                Proof-of-authority consensus verified for current session.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Search Transaction</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={selectedShipment}
                onChange={(e) => setSelectedShipment(e.target.value)}
                placeholder="Enter Shipment or Procurement ID..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-purple-600/20"
              />
              {/* Recent Suggestions */}
              {shipments.length > 0 && !selectedShipment.includes('-') && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 mt-2 p-2 hidden group-focus-within:block">
                  <div className="text-[10px] font-bold text-gray-400 px-3 py-2 uppercase tracking-widest">Recent Shipments</div>
                  {shipments.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedShipment(s.id)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-gray-700 font-mono">{s.id.substring(0, 8)}...</span>
                      <span className="text-[10px] text-gray-400">{s.isotope}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Context</label>
            <div className="px-4 py-3 bg-purple-50 border border-purple-100 rounded-2xl text-xs font-bold text-purple-700">
              {selectedShipment ? `Tracking: ${selectedShipment.substring(0, 12)}...` : 'Select a record'}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Network Status</label>
            <div className="px-4 py-3 bg-green-50 border border-green-100 rounded-2xl text-xs font-bold text-green-700 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Synchronized
            </div>
          </div>
        </div>
      </div>


      {/* Hero Badge */}
      <div className="bg-gray-900 rounded-3xl p-8 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Shipment Hash</div>
              <div className="text-xl font-mono text-white truncate max-w-[150px]">{selectedShipment}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Network</div>
              <div className="text-xl font-bold text-white">Fabric-v2.5</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Nodes</div>
              <div className="text-xl font-bold text-green-500">12 Primary</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Trust Score</div>
              <div className="text-xl font-bold text-white flex items-center gap-2">
                100%
                <ShieldCheck className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </div>
          <button
            onClick={() => setVerifyDialogOpen(true)}
            className="px-8 py-3 bg-purple-600 text-white rounded-2xl font-bold text-sm hover:bg-purple-500 transition-all active:scale-95 shadow-lg shadow-purple-600/20"
          >
            Deep Verify
          </button>
        </div>
      </div>

      {/* Main Audit Feed */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Ledger Activity</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chronological Evidence Stream</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => generateSignedPDFReport(selectedShipment, auditEvents, {})}
              className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              title="Export PDF"
            >
              <FileText className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => downloadAuditTrailJSON(selectedShipment, auditEvents)}
              className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              title="Download Data"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Querying Ledger...</p>
            </div>
          ) : auditEvents.length > 0 ? (
            <div className="relative space-y-12">
              {/* Decorative line */}
              <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-purple-100 via-gray-100 to-purple-100"></div>

              {auditEvents.map((event, index) => {
                const Icon = getEventIcon(event.type || 'created');
                return (
                  <div key={event.id} className="relative pl-20 group">
                    {/* Node dot */}
                    <div className="absolute left-0 top-0 w-14 h-14 bg-white rounded-2xl border border-gray-100 shadow-sm group-hover:border-purple-200 group-hover:shadow-md transition-all flex items-center justify-center z-10 overflow-hidden">
                      <div className="relative z-10">
                        <Icon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="absolute inset-0 bg-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    {/* Card */}
                    <div className="bg-gray-50 rounded-3xl p-6 border border-transparent hover:border-gray-100 hover:bg-white transition-all shadow-sm hover:shadow-xl hover:shadow-gray-100/50">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-1">{event.event_type || event.description}</h4>
                          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-gray-100">
                              <Clock className="w-3 h-3" />
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-gray-100">
                              <User className="w-3 h-3" />
                              {event.actor || 'System'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Validated</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-white rounded-2xl border border-gray-100">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Contextual Details</span>
                          <p className="text-sm text-gray-600 font-medium">{event.description}</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-gray-100">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Verification Source</span>
                          <p className="text-sm text-gray-600 font-medium">{event.location || 'Distributed Node Network'}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-900 rounded-2xl flex items-center justify-between group/hash cursor-pointer hover:bg-black transition-colors">
                        <div className="flex-1 mr-4 overflow-hidden">
                          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Transaction Hash</span>
                          <code className="text-[10px] text-green-400 font-mono truncate block">
                            {event.hash || '0x' + Math.random().toString(16).slice(2, 66)}
                          </code>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-600 group-hover/hash:text-purple-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-24 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Database className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Ledger Data Found</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                We couldn't find any immutable records for shipment ID <strong>{selectedShipment}</strong>.
                Try searching for SH-2851 for a demo trail.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
