import {
  ArrowRight
} from 'lucide-react'
import {
  getDashboardStats,
  getRecentActivity,
  getUpcomingDeliveries,
  getCompletedDeliveries,
  getComplianceAlerts,
  getActiveShipments
} from '@/lib/api'
import DashboardGreeting from '@/components/DashboardGreeting'
import UpcomingDeliveries from '@/components/shared/UpcomingDeliveries'
import RecentActivity from '@/components/shared/RecentActivity'
import { LiveTrackingMap } from '@/components/dashboard'
import {
  MobileOnly,
  DesktopOnly,
  MobileTableCard,
  MobileTableCardRow
} from '@/components/responsive'

export default async function DashboardPage() {
  // Use hardcoded Africa-focused data for instant loading
  const recentActivity = [
    { id: 1, description: 'Shipment arrived in Lagos, Nigeria', date: '2026-03-28' },
    { id: 2, description: 'Compliance check passed in Nairobi, Kenya', date: '2026-03-27' },
    { id: 3, description: 'Delivery completed in Accra, Ghana', date: '2026-03-26' },
    { id: 4, description: 'Shipment dispatched from Johannesburg, South Africa', date: '2026-03-25' },
    { id: 5, description: 'Customs cleared in Cairo, Egypt', date: '2026-03-24' },
  ];
  const activeShipments = [
    { id: 1, status: 'In Transit', location: 'Lagos, Nigeria', eta: '2026-03-31' },
    { id: 2, status: 'At Customs', location: 'Nairobi, Kenya', eta: '2026-04-02' },
  ];
  const complianceAlerts = [
    { id: 1, severity: 'warning', message: 'Document renewal needed for Ghana', date: '2026-03-27' },
  ];
  const upcomingDeliveries = [
    { id: 1, destination: 'Accra, Ghana', eta: '2026-03-31' },
    { id: 2, destination: 'Lagos, Nigeria', eta: '2026-04-01' },
    { id: 3, destination: 'Nairobi, Kenya', eta: '2026-04-02' },
    { id: 4, destination: 'Cairo, Egypt', eta: '2026-04-03' },
  ];
  const dashboardStats = {
    activeShipments: {
      label: 'Active Shipments',
      value: '2',
      subtext: '100% on schedule',
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
    },
    pendingRequests: {
      label: 'Pending Requests',
      value: '0',
      subtext: '0 urgent',
      color: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-600',
    },
    complianceStatus: {
      label: 'Compliance Status',
      value: 'Clear',
      subtext: 'All requirements met',
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600',
    },
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'In Transit':
        return 'bg-blue-100 text-blue-700'
      case 'At Customs':
        return 'bg-amber-100 text-amber-700'
      case 'Dispatched':
        return 'bg-green-100 text-green-700'
      case 'Delivered':
        return 'bg-gray-100 text-gray-700'
      case 'Pending':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-safe">
      {/* Welcome Banner + Quick Actions */}
      <DashboardGreeting />

      {/* Live Shipment Map + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        {/* Live Shipment Map */}
        <div className="lg:col-span-3 dashboard-card p-4 sm:p-6 border rounded-lg">
          <h3 className="dashboard-title text-lg sm:text-xl mb-4">Live Shipment Tracking</h3>
          <div className="h-56 sm:h-64 md:h-80 lg:h-96 rounded-md overflow-hidden">
            <LiveTrackingMap />
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 dashboard-card p-4 sm:p-6 border rounded-lg">
          <h3 className="dashboard-title text-lg sm:text-xl mb-4">Recent Activity</h3>
          <div className="space-y-3 sm:space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: 'var(--color-text-main)' }}>{activity.event}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 italic py-4 text-center">No recent activity</div>
            )}

            {/* Show more button on mobile - Only show if there is activity */}
            {recentActivity.length > 0 && (
              <button type="button" className="md:hidden w-full text-center text-sm py-3 rounded-md border border-dashed transition-colors touch-manipulation min-h-[44px]" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-border)' }}>
                View All Activity
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Shipments Table Preview */}
      <div className="dashboard-card border rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="dashboard-title text-lg sm:text-xl">Active Shipments</h3>
          <button className="flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md border transition-colors touch-manipulation min-h-[44px] self-start sm:self-auto" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-border)' }}>
            View All Shipments
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop Table View */}
        <DesktopOnly>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b" style={{ backgroundColor: 'var(--color-bg-subtle)', borderColor: 'var(--color-border)' }}>
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs uppercase tracking-wider font-sans" style={{ color: 'var(--color-text-muted)' }}>ID</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs uppercase tracking-wider font-sans" style={{ color: 'var(--color-text-muted)' }}>Isotope</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs uppercase tracking-wider font-sans" style={{ color: 'var(--color-text-muted)' }}>Route</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs uppercase tracking-wider font-sans" style={{ color: 'var(--color-text-muted)' }}>Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs uppercase tracking-wider font-sans" style={{ color: 'var(--color-text-muted)' }}>ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ backgroundColor: 'var(--color-bg-white)', borderColor: 'var(--color-border)' }}>
                {activeShipments.length > 0 ? (
                  activeShipments.slice(0, 5).map((shipment) => (
                    <tr key={shipment.id} className="dashboard-table-row">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-mono" style={{ color: 'var(--color-text-main)' }}>{shipment.id}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm" style={{ color: 'var(--color-text-main)' }}>{shipment.isotope}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm" style={{ color: 'var(--color-text-main)' }}>
                        {shipment.origin} → {shipment.destination}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs ${getStatusColor(shipment.status)}`}>
                          {shipment.status}
                        </span>
                      </td>
                      {/* Note: 'eta' might be a date string from DB, formatting might be needed. Using raw for now as schema says timestamptz but UI might expect string */}
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm" style={{ color: 'var(--color-text-main)' }}>
                        {new Date(shipment.eta).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-sm text-gray-500 italic">
                      No active shipments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DesktopOnly>

        {/* Mobile Card View */}
        <MobileOnly>
          <div className="p-4 space-y-3">
            {activeShipments.length > 0 ? (
              activeShipments.slice(0, 5).map((shipment) => (
                <MobileTableCard key={shipment.id}>
                  <MobileTableCardRow
                    label="ID"
                    value={<span className="font-mono text-xs">{shipment.id}</span>}
                  />
                  <MobileTableCardRow
                    label="Isotope"
                    value={shipment.isotope}
                  />
                  <MobileTableCardRow
                    label="Route"
                    value={
                      <span className="text-xs">
                        {shipment.origin} → {shipment.destination}
                      </span>
                    }
                  />
                  <MobileTableCardRow
                    label="Status"
                    value={
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(shipment.status)}`}>
                        {shipment.status}
                      </span>
                    }
                  />
                  <MobileTableCardRow
                    label="ETA"
                    value={new Date(shipment.eta).toLocaleDateString()}
                  />
                </MobileTableCard>
              ))
            ) : (
              <div className="text-center text-sm text-gray-500 italic py-4">
                No active shipments found.
              </div>
            )}
          </div>
        </MobileOnly>
      </div>

      {/* Compliance Alerts + Upcoming Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Compliance Alerts */}
        <div className="dashboard-card p-4 sm:p-6 border rounded-lg">
          <h3 className="dashboard-title text-lg sm:text-xl mb-4">Compliance Alerts</h3>
          <div className="space-y-3">
            {complianceAlerts.length > 0 ? (
              complianceAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${alert.severity === 'warning'
                    ? 'bg-amber-50 border-amber-200'
                    : alert.severity === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${alert.severity === 'warning'
                    ? 'bg-amber-600'
                    : alert.severity === 'error'
                      ? 'bg-red-600'
                      : 'bg-blue-600'
                    }`}></div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text-main)' }}>{alert.title}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{alert.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-success-bg)', borderColor: 'var(--color-success)', border: '1px solid' }}>
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--color-success)' }}></div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-main)' }}>All Clear</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>No compliance issues at this time</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deliveries */}
        <UpcomingDeliveries
          initialDeliveries={upcomingDeliveries}
        />
      </div>
    </div>
  )
}
