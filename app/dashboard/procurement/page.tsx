'use client';

import { Plus, Filter, Search, Eye, Edit, X, ChevronDown, Loader2 } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MobileOnly, DesktopOnly, MobileTableCard, MobileTableCardRow } from '@/components/responsive';
import {
  getProducts,
  getProcurements,
  submitProcurementRequest,
  deleteProcurementRequest,
  Product,
  Procurement
} from '@/lib/api/procurement.api';
import { toast } from 'sonner';

export default function ProcurementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>}>
      <ProcurementContent />
    </Suspense>
  );
}

function ProcurementContent() {
  const searchParams = useSearchParams();
  const viewParam = searchParams?.get('view');
  const [view, setView] = useState<'list' | 'form' | 'quotes'>('list');
  const [editingRequest, setEditingRequest] = useState<any>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<Procurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
    priority: 'Normal' as 'Normal' | 'High' | 'Urgent',
    delivery_date: '',
    location: '',
    notes: ''
  });

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const prodList = await getProducts();
        setProducts(prodList);
        const reqList = await getProcurements();
        setRequests(reqList);
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error occurred';
        console.error('Procurement Fetch Error:', error);
        toast.error(`Failed to load procurement data: ${errorMessage}`);

        if (errorMessage.includes('relation "public.products" does not exist')) {
          toast.warning('Database tables missing. Please apply schema.sql in your Supabase dashboard.');
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (viewParam === 'form') {
      setView('form');
    }
  }, [viewParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id || !formData.delivery_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitProcurementRequest(formData);
      toast.success('Procurement request submitted! Logistics & Compliance updated.');

      // Refresh list
      const updatedRequests = await getProcurements();
      setRequests(updatedRequests);
      setView('list');

      // Reset form
      setFormData({
        product_id: '',
        quantity: 1,
        priority: 'Normal',
        delivery_date: '',
        location: '',
        notes: ''
      });
      setEditingRequest(null);
    } catch (error) {
      console.error('Submission failed:', error);
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (request: any) => {
    setEditingRequest(request);
    setFormData({
      product_id: request.product_id,
      quantity: request.quantity,
      priority: request.priority || 'Normal',
      delivery_date: request.delivery_date,
      location: request.location || '',
      notes: request.notes || ''
    });
    setView('form');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this procurement request?')) return;

    try {
      await deleteProcurementRequest(id);
      toast.success('Request deleted successfully');
      // Refresh list
      const updatedRequests = await getProcurements();
      setRequests(updatedRequests);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete request');
    }
  };

  if (view === 'form') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <h2 className="dashboard-title text-xl sm:text-2xl">
            {editingRequest ? 'Edit Procurement Request' : 'New Procurement Request'}
          </h2>
          <button
            onClick={() => {
              setView('list');
              setEditingRequest(null);
            }}
            className="dashboard-nav-item px-4 py-2 transition-colors self-start"
            style={{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            Cancel
          </button>
        </div>
        <div className="dashboard-card p-4 sm:p-6 lg:p-8 border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm mb-2 text-foreground">Product Type *</label>
              <div className="relative">
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent appearance-none"
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                >
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2 text-foreground">Quantity Required *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-foreground">Priority</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option>Normal</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2">Delivery Date *</label>
              <input
                type="date"
                required
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-foreground">Delivery Location</label>
              <input
                type="text"
                placeholder="Enter delivery address..."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Special Instructions</label>
              <textarea
                rows={3}
                placeholder="Enter any special handling or delivery instructions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
              ></textarea>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {editingRequest ? 'Update Request' : 'Submit Request'}
              </button>
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => toast.info('Draft functionality coming soon')}
              >
                Save as Draft
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h2 className="dashboard-title text-xl sm:text-2xl">Procurement Requests</h2>
        <button
          onClick={() => setView('form')}
          className="btn-primary px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-center gap-2 self-start font-sans"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          New Request
        </button>
      </div>

      <div className="dashboard-card p-3 sm:p-4 mb-6 border flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search requests..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
          <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Ordered</option>
          </select>
          <button className="px-4 py-2 border border-gray-300 rounded-lg bg-white flex items-center justify-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="dashboard-card border overflow-hidden">
        <DesktopOnly>
          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-purple-600">{request.id.substring(0, 8)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.product?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.delivery_date ? new Date(request.delivery_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.priority}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(request)} className="p-1 hover:text-purple-600"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(request.id)} className="p-1 hover:text-red-600"><X className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DesktopOnly>

        <MobileOnly>
          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
          ) : (
            <div className="p-4 space-y-3">
              {requests.map((request) => (
                <MobileTableCard key={request.id}>
                  <MobileTableCardRow label="ID" value={<span className="font-mono text-xs text-purple-600">{request.id.substring(0, 8)}</span>} />
                  <MobileTableCardRow label="Product" value={request.product?.name} />
                  <MobileTableCardRow label="Quantity" value={request.quantity} />
                  <MobileTableCardRow label="Status" value={<span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">{request.status}</span>} />
                  <div className="flex gap-2 pt-2 border-t">
                    <button onClick={() => handleEdit(request)} className="flex-1 flex items-center justify-center gap-2 py-2 border rounded-lg"><Edit className="w-4 h-4" /> Edit</button>
                    <button onClick={() => handleDelete(request.id)} className="px-3 border rounded-lg text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                </MobileTableCard>
              ))}
            </div>
          )}
        </MobileOnly>
      </div>
    </div>
  );
}
