'use client';

import { Shield, AlertTriangle, CheckCircle, FileText, Eye, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  RenewDocumentDialog,
  ViewDocumentDialog,
  GenerateDocumentDialog
} from '@/components/compliance';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function CompliancePage() {
  const [selectedShipment, setSelectedShipment] = useState('SH-2851');
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('compliance_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch compliance alerts');
      } else {
        setAlerts(data || []);
      }
      setIsLoading(false);
    }
    fetchData();
  }, [supabase]);

  const documents = [
    {
      name: 'Certificate of Analysis',
      description: 'Quality assurance documentation',
      required: ['South Africa', 'Namibia'],
      status: 'complete',
      statusColor: 'text-green-600',
      statusBg: 'bg-green-50',
      icon: CheckCircle
    },
    {
      name: 'Transport Permit',
      description: 'Nuclear material transport authorization',
      required: ['South Africa'],
      status: 'complete',
      statusColor: 'text-green-600',
      statusBg: 'bg-green-50',
      icon: CheckCircle
    },
    {
      name: 'Customs Declaration',
      description: 'International shipping documentation',
      required: ['South Africa', 'International'],
      status: 'in-progress',
      statusColor: 'text-amber-600',
      statusBg: 'bg-amber-50',
      icon: AlertTriangle
    },
    {
      name: 'Radiation Safety Certificate',
      description: 'Safety compliance certification',
      required: ['All jurisdictions'],
      status: 'expired',
      statusColor: 'text-red-600',
      statusBg: 'bg-red-50',
      icon: AlertTriangle
    },
    {
      name: 'Insurance Certificate',
      description: 'Shipment insurance documentation',
      required: ['International'],
      status: 'complete',
      statusColor: 'text-green-600',
      statusBg: 'bg-green-50',
      icon: CheckCircle
    },
    {
      name: 'Export License',
      description: 'Export authorization for nuclear materials',
      required: ['International'],
      status: 'not-started',
      statusColor: 'text-gray-600',
      statusBg: 'bg-gray-50',
      icon: FileText
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        <p className="text-gray-500 font-medium">Loading compliance records...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="dashboard-title text-2xl sm:text-3xl mb-1">Compliance & Regulatory</h2>
        <p className="text-sm text-gray-500">Global regulatory tracking and documentation</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {alerts.length === 0 ? '100%' : `${Math.round(((alerts.length - alerts.filter(a => a.severity === 'error').length) / alerts.length) * 100)}%`}
              </div>
              <div className="text-sm font-medium text-gray-500">Total Compliance</div>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: alerts.length === 0 ? '100%' : `${Math.round(((alerts.length - alerts.filter(a => a.severity === 'error').length) / alerts.length) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{alerts.filter(a => a.severity === 'warning').length}</div>
              <div className="text-sm font-medium text-gray-500">Expiring Soon</div>
            </div>
          </div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Review required within 7 days</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <Shield className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{alerts.filter(a => a.severity === 'error').length}</div>
              <div className="text-sm font-medium text-gray-500">Action Required</div>
            </div>
          </div>
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Critical status: immediate attention</p>
        </div>
      </div>


      {/* Jurisdiction Map */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
        <h3 className="text-xl font-bold mb-6 text-gray-900">Global Status Hub</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { country: 'South Africa', status: 'compliant', color: 'bg-green-50 text-green-700 border-green-100' },
            { country: 'Kenya', status: 'compliant', color: 'bg-green-50 text-green-700 border-green-100' },
            { country: 'Nigeria', status: 'review', color: 'bg-amber-50 text-amber-700 border-amber-100' },
            { country: 'Egypt', status: 'action-needed', color: 'bg-red-50 text-red-700 border-red-100' },
            { country: 'Zimbabwe', status: 'compliant', color: 'bg-green-50 text-green-700 border-green-100' },
          ].map((jurisdiction) => (
            <div key={jurisdiction.country} className={`${jurisdiction.color} rounded-xl p-4 text-center border transition-all hover:shadow-sm`}>
              <div className="font-bold text-sm mb-1">{jurisdiction.country}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">{jurisdiction.status.replace('-', ' ')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts Panel */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
        <h3 className="text-xl font-bold mb-6 text-gray-900">Compliance Intelligence</h3>
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${alert.severity === 'error' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${alert.severity === 'error' ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                  <AlertTriangle className={`w-6 h-6 ${alert.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className={`font-bold text-lg ${alert.severity === 'error' ? 'text-red-900' : 'text-amber-900'}`}>
                      {alert.title}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 font-mono">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm mb-3 ${alert.severity === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                    {alert.description}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedDocument({
                        name: alert.title,
                        shipmentId: alert.shipment_id || 'N/A'
                      });
                      setRenewDialogOpen(true);
                    }}
                    className={`text-xs font-bold uppercase tracking-widest underline ${alert.severity === 'error' ? 'text-red-600 hover:text-red-800' : 'text-amber-600 hover:text-amber-800'
                      }`}
                  >
                    Action Required
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Shield className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">No urgent compliance alerts. System is fully operational.</p>
            </div>
          )}
        </div>
      </div>

      {/* Document Checklist */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Document Control</h3>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Master Audit Checklist</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedShipment}
              onChange={(e) => setSelectedShipment(e.target.value)}
              className="pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-purple-600/20 appearance-none min-w-[140px]"
            >
              <option value="SH-2851">SH-2851</option>
              {/* Other options could be mapped from shipments */}
            </select>
            <button className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm">
              Verify All
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc, index) => {
              const Icon = doc.icon;
              return (
                <div
                  key={index}
                  className={`border rounded-2xl p-5 hover:shadow-md transition-all group ${doc.status === 'complete' ? 'bg-white border-gray-100' :
                    doc.status === 'expired' ? 'bg-red-50/30 border-red-100' :
                      'bg-amber-50/30 border-amber-100'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${doc.status === 'complete' ? 'bg-green-50 text-green-600 group-hover:bg-green-100' :
                      doc.status === 'expired' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-purple-600 transition-colors">{doc.name}</h4>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${doc.statusColor}`}>
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-1">{doc.description}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="flex -space-x-2">
                          {doc.required.map((j, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500" title={j}>
                              {j.substring(0, 1)}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.status === 'complete' ? (
                            <button
                              onClick={() => {
                                setSelectedDocument({ ...doc, shipmentId: selectedShipment });
                                setViewDialogOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedDocument({ name: doc.name, shipmentId: selectedShipment });
                                setRenewDialogOpen(true);
                              }}
                              className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${doc.status === 'expired' ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'
                                }`}
                            >
                              Manage
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <RenewDocumentDialog
        isOpen={renewDialogOpen}
        onClose={() => setRenewDialogOpen(false)}
        document={selectedDocument}
      />
      <ViewDocumentDialog
        isOpen={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        document={selectedDocument}
      />
      <GenerateDocumentDialog
        isOpen={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        document={selectedDocument}
      />
    </div>
  );
}
