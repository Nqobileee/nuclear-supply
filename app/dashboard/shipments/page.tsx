'use client';

import { List, Map, LayoutGrid, Search, Filter, Download, Phone, MapPin, Clock, Activity, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { MobileOnly, DesktopOnly, MobileTableCard, MobileTableCardRow } from '@/components/responsive';

export default function ShipmentsPage() {
  const [viewType, setViewType] = useState<'list' | 'map' | 'kanban'>('list');
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tracking');
  const [shipments, setShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchShipments() {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch shipments');
      } else {
        setShipments(data || []);
      }
      setIsLoading(false);
    }
    fetchShipments();
  }, [supabase]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'In Transit':
        return 'bg-blue-100 text-blue-700';
      case 'At Customs':
        return 'bg-amber-100 text-amber-700';
      case 'Dispatched':
        return 'bg-green-100 text-green-700';
      case 'Delivered':
        return 'bg-gray-100 text-gray-700';
      case 'Pending':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const trackingEvents = [
    { time: '10:30 AM', location: 'Paarl Checkpoint', status: 'In Transit', completed: true },
    { time: '09:45 AM', location: 'Worcester Junction', status: 'Passed', completed: true },
    { time: '08:30 AM', location: 'N1 Highway Entry', status: 'Departed', completed: true },
    { time: '08:00 AM', location: 'Johannesburg Facility', status: 'Dispatched', completed: true },
    { time: '12:00 PM (Est)', location: 'Cape Town Hospital', status: 'Expected Delivery', completed: false },
  ];

  if (selectedShipment) {
    const shipment = shipments.find(s => s.id === selectedShipment);
    if (!shipment) return null;

    return (
      <div className="animate-in fade-in duration-500">
        <button
          onClick={() => setSelectedShipment(null)}
          className="mb-6 text-purple-600 hover:text-purple-700 flex items-center gap-2 font-medium"
        >
          ← Back to Shipments
        </button>

        {/* Header Section */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-mono mb-2 text-gray-900">{shipment.id}</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                <span><strong>Isotope:</strong> {shipment.isotope}</span>
                <span><strong>Carrier:</strong> {shipment.carrier || 'N/A'}</span>
                <span className={`px-3 py-1 rounded-full ${getStatusColor(shipment.status)} self-start font-medium`}>
                  {shipment.status}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Re-route
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                Contact Carrier
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                <Download className="w-4 h-4" />
                Documents
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-4 sm:px-6 overflow-x-auto bg-gray-50">
            <div className="flex gap-4 sm:gap-6 min-w-max">
              {[
                { id: 'tracking', label: 'Tracking' },
                { id: 'decay', label: 'Decay Curve' },
                { id: 'documents', label: 'Documents' },
                { id: 'sensors', label: 'Sensor Data' },
                { id: 'blockchain', label: 'Blockchain' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 border-b-2 transition-all font-medium text-sm ${activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6 min-h-[400px]">
            {activeTab === 'tracking' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Map Mock */}
                <div className="bg-slate-100 rounded-xl h-64 sm:h-80 lg:h-96 flex items-center justify-center relative overflow-hidden ring-1 ring-gray-200">
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <svg viewBox="0 0 400 400" className="w-full h-full">
                      <path
                        d="M 100,100 L 150,120 L 200,150 L 250,140 L 300,100"
                        fill="none"
                        stroke="#7C3AED"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                      />
                    </svg>
                  </div>
                  <div className="relative">
                    <MapPin className="w-16 h-16 text-purple-600 animate-bounce" />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/10 rounded-full blur-[2px]"></div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-6">
                  <h3 className="font-medium text-gray-900 mb-4">Tracking History</h3>
                  {trackingEvents.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${event.completed ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-300'
                            }`}
                        >
                          {event.completed && <div className="w-2 h-2 rounded-full bg-green-600" />}
                        </div>
                        {index < trackingEvents.length - 1 && (
                          <div className={`w-0.5 min-h-[40px] flex-1 ${event.completed ? 'bg-green-600' : 'bg-gray-200'
                            }`}></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${event.completed ? 'text-gray-900' : 'text-gray-400'}`}>{event.status}</span>
                          <span className="text-xs text-gray-400">{event.time}</span>
                        </div>
                        <p className="text-sm text-gray-500">{event.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'decay' && (
              <div className="animate-in slide-in-from-bottom-2 duration-500">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 mb-6 border border-purple-100">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Activity Decay Curve</h3>
                      <p className="text-sm text-gray-600">Predicted activity levels over time</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-600">{shipment.activity || 85}%</div>
                      <div className="text-sm text-gray-600">Current Activity</div>
                    </div>
                  </div>

                  <div className="h-64 flex items-end gap-1.5 px-2">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const height = 100 - (i * 3.5);
                      const isCurrentPosition = i === 8;
                      return (
                        <div key={i} className="flex-1 flex flex-col justify-end relative group">
                          <div
                            className={`rounded-t transition-all duration-300 group-hover:opacity-100 ${isCurrentPosition ? 'bg-purple-600' : 'bg-blue-300 opacity-60'
                              }`}
                            style={{ height: `${height}%` }}
                          ></div>
                          {isCurrentPosition && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap shadow-xl">
                              Now: {shipment.activity || 85}%
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-4 px-2 uppercase tracking-wider font-medium">
                    <span>Dispatch</span>
                    <span>Arrival (Est)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Initial</div>
                    <div className="text-2xl font-bold">500 mCi</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm ring-2 ring-purple-600/10">
                    <div className="text-xs text-purple-600 uppercase tracking-wider font-semibold mb-1">Current</div>
                    <div className="text-2xl font-bold text-purple-600">425 mCi</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-green-600 uppercase tracking-wider font-semibold mb-1">Estimated Delivery</div>
                    <div className="text-2xl font-bold text-green-600">380 mCi</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                {[
                  { name: 'Certificate of Analysis', status: 'Verified', color: 'text-green-600' },
                  { name: 'Radioactive Material Transport Permit', status: 'Approved', color: 'text-green-600' },
                  { name: 'Customs Clearance Form', status: 'Pending', color: 'text-amber-600' },
                  { name: 'Insurance Liability Certificate', status: 'Verified', color: 'text-green-600' },
                ].map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-purple-200 hover:shadow-sm transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-purple-50 transition-colors">
                        <Download className="w-5 h-5 text-gray-400 group-hover:text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{doc.name}</div>
                        <div className={`text-xs font-medium uppercase tracking-tight ${doc.color}`}>{doc.status}</div>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'blockchain' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs font-mono text-green-400 uppercase tracking-widest">Network Active</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">Hyperledger Traceability</h3>
                    <p className="text-sm text-slate-400">Cryptographically verified event logs for shipment {shipment.id}</p>
                  </div>
                </div>

                {[
                  { event: 'Shipment Created', hash: '0x4f3a...8b2c', time: '08:00 AM', node: 'Mainnet-Alpha' },
                  { event: 'Dispatched from Hub', hash: '0x7d2e...4a1f', time: '08:15 AM', node: 'Logistics-Node-1' },
                  { event: 'IoT Sensor Calibration', hash: '0x9b1c...6d3e', time: '08:20 AM', node: 'Sensor-Network' },
                  { event: 'Checkpoint Verification', hash: '0x2e4f...7c8a', time: '10:30 AM', node: 'Authority-Node-SA' },
                ].map((log, index) => (
                  <div key={index} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:border-purple-300 transition-colors group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-gray-900 mb-1">{log.event}</div>
                        <div className="text-xs text-gray-500 font-medium">Node: {log.node}</div>
                      </div>
                      <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">{log.time}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <code className="text-[10px] bg-slate-50 text-slate-500 px-3 py-1.5 rounded-md font-mono border border-slate-100">{log.hash}</code>
                      <button className="text-xs font-bold text-purple-600 hover:text-purple-700 uppercase tracking-wider">
                        Verify Hash
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="dashboard-title text-2xl sm:text-3xl mb-1">Shipments & Logistics</h2>
          <p className="text-sm text-gray-500">Monitor real-time movement and activity levels</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewType('list')}
            className={`p-2.5 rounded-xl transition-all ${viewType === 'list' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'}`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewType('map')}
            className={`p-2.5 rounded-xl transition-all ${viewType === 'map' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'}`}
          >
            <Map className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-8 border border-gray-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, Origin or Destination..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none transition-all text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select className="pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-purple-600/20 appearance-none min-w-[140px]">
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Dispatched</option>
              <option>In Transit</option>
              <option>At Customs</option>
              <option>Delivered</option>
            </select>
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium">
            <Filter className="w-4 h-4" />
            Advanced
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            <p className="text-gray-500 font-medium">Loading logistics data...</p>
          </div>
        ) : (
          <>
            <DesktopOnly>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shipment ID</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Isotope</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Route</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Activity</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">ETA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {shipments.map((shipment) => (
                      <tr
                        key={shipment.id}
                        className="hover:bg-purple-50/30 transition-all cursor-pointer group"
                        onClick={() => setSelectedShipment(shipment.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-purple-600 font-bold">
                          {shipment.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{shipment.isotope}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700">{shipment.origin}</span>
                            <span className="text-[10px] text-gray-400">→ {shipment.destination}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${getStatusColor(shipment.status)}`}>
                            {shipment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-24">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-1000 ${(shipment.activity || 85) >= 90 ? 'bg-green-500' :
                                  (shipment.activity || 85) >= 70 ? 'bg-amber-500' :
                                    'bg-red-500'
                                  }`}
                                style={{ width: `${shipment.activity || 85}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-gray-700">{shipment.activity || 85}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                          {shipment.eta ? new Date(shipment.eta).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {shipments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-32 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                              <List className="w-8 h-8 text-gray-200" />
                            </div>
                            <p className="text-gray-400 font-medium">No shipments found. New procurements will appear here automatically.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DesktopOnly>

            <MobileOnly>
              <div className="p-4 space-y-4">
                {shipments.map((shipment) => (
                  <MobileTableCard
                    key={shipment.id}
                    onClick={() => setSelectedShipment(shipment.id)}
                  >
                    <MobileTableCardRow
                      label="ID"
                      value={<span className="font-mono text-xs text-purple-600 font-bold">{shipment.id}</span>}
                    />
                    <MobileTableCardRow
                      label="Route"
                      value={
                        <span className="text-xs font-medium">
                          {shipment.origin} → {shipment.destination}
                        </span>
                      }
                    />
                    <MobileTableCardRow
                      label="Status"
                      value={
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(shipment.status)}`}>
                          {shipment.status}
                        </span>
                      }
                    />
                    <div className="pt-3 flex items-center justify-between border-t border-gray-50 mt-2">
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Activity</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1">
                          <div
                            className="h-1 rounded-full bg-purple-600"
                            style={{ width: `${shipment.activity || 85}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold">{shipment.activity || 85}%</span>
                      </div>
                    </div>
                  </MobileTableCard>
                ))}
                {shipments.length === 0 && (
                  <div className="text-center py-20 text-gray-400 text-sm">No shipments found.</div>
                )}
              </div>
            </MobileOnly>
          </>
        )}
      </div>
    </div>
  );
}
