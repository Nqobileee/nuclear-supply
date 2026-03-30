import {
    Activity, ComplianceAlert, DashboardStats, Delivery, Shipment, StatCard
} from '@/models'
import { combineDateAndTime } from '@/lib/dateUtils'
import { Procurement, Product } from '@/lib/api/procurement.api'
import { mockAlerts, mockShipments, mockActivities, mockDeliveries, mockDeliveriesCompleted, mockProcurements } from './hardcoded-data'

export async function getDashboardStats(): Promise<DashboardStats> {
    const active = mockShipments.filter(s => s.status !== 'Delivered')
    const pending = mockShipments.filter(s => s.status === 'Pending')
    const urgent = mockShipments.filter(s => s.status === 'At Customs')

    const inTransitOrDispatched = mockShipments.filter(s =>
        s.status === 'In Transit' || s.status === 'Dispatched'
    )
    const onSchedulePercentage = active.length > 0 && inTransitOrDispatched.length > 0
        ? Math.round((inTransitOrDispatched.length / active.length) * 100)
        : 100

    let complianceValue = 'Clear'
    let complianceSubtext = 'All requirements met'
    let complianceColor = 'from-green-500 to-green-600'
    let complianceTextColor = 'text-green-600'

    const criticalCount = mockAlerts.filter(a => a.severity === 'error').length
    const warningCount = mockAlerts.filter(a => a.severity === 'warning').length

    if (criticalCount > 0) {
        complianceValue = 'Critical'
        complianceSubtext = `${criticalCount} urgent issues`
        complianceColor = 'from-red-500 to-red-600'
        complianceTextColor = 'text-red-600'
    } else if (warningCount > 0) {
        complianceValue = 'Warning'
        complianceSubtext = `${warningCount} items need attention`
        complianceColor = 'from-amber-500 to-amber-600'
        complianceTextColor = 'text-amber-600'
    }

    const monthlyCount = mockShipments.filter(s => s.status === 'Delivered').length

    return {
        activeShipments: {
            label: 'Active Shipments',
            value: active.length.toString(),
            subtext: `${onSchedulePercentage}% on schedule`,
            color: 'from-blue-500 to-blue-600',
            textColor: 'text-blue-600'
        },
        pendingRequests: {
            label: 'Pending Requests',
            value: pending.length.toString(),
            subtext: `${urgent.length} urgent`,
            color: 'from-amber-500 to-amber-600',
            textColor: 'text-amber-600'
        },
        complianceStatus: {
            label: 'Compliance Status',
            value: complianceValue,
            subtext: complianceSubtext,
            color: complianceColor,
            textColor: complianceTextColor
        },
        monthlyTotal: {
            label: 'Monthly Total',
            value: monthlyCount.toString(),
            subtext: 'Completed this month',
            color: 'from-purple-500 to-purple-600',
            textColor: 'text-purple-600'
        }
    }
}

export async function getRecentActivity(limit: number = 5): Promise<Activity[]> {
    return mockActivities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit)
        .map(a => ({
            ...a,
            time: new Date(a.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }))
}

export async function getUpcomingDeliveries(limit: number = 4): Promise<Delivery[]> {
    const now = new Date()
    return mockDeliveries
        .map(delivery => ({
            ...delivery,
            scheduled_datetime: combineDateAndTime(delivery.date, delivery.time),
            status: 'upcoming' as const
        }))
        .filter(delivery => delivery.scheduled_datetime && delivery.scheduled_datetime > now)
        .sort((a, b) => a.scheduled_datetime!.getTime() - b.scheduled_datetime!.getTime())
        .slice(0, limit)
}

export async function getCompletedDeliveries(hoursBack: number = 24): Promise<Delivery[]> {
    const now = new Date()
    const cutoffDate = new Date(now.getTime() - (hoursBack * 60 * 60 * 1000))
    return mockDeliveriesCompleted
        .map(delivery => ({
            ...delivery,
            scheduled_datetime: combineDateAndTime(delivery.date, delivery.time),
            status: 'completed' as const
        }))
        .filter(delivery =>
            delivery.scheduled_datetime &&
            delivery.scheduled_datetime <= now &&
            delivery.scheduled_datetime >= cutoffDate
        )
        .sort((a, b) => b.scheduled_datetime!.getTime() - a.scheduled_datetime!.getTime())
}

export async function getComplianceAlerts(): Promise<ComplianceAlert[]> {
    return [...mockAlerts].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
}

export async function getActiveShipments(): Promise<Shipment[]> {
    return mockShipments
        .filter(s => s.status !== 'Delivered')
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
}

export type SearchResults = {
    shipments: Shipment[]
    alerts: ComplianceAlert[]
    activities: Activity[]
    procurements: (Procurement & { products: Product })[]
}

export async function searchGlobal(query: string): Promise<SearchResults> {
    const q = query.toLowerCase()
    return {
        shipments: mockShipments.filter(s => 
            s.isotope.toLowerCase().includes(q) || 
            s.origin.toLowerCase().includes(q) || 
            s.destination.toLowerCase().includes(q)
        ),
        alerts: mockAlerts.filter(a => 
            a.title.toLowerCase().includes(q) || 
            (a.description || '').toLowerCase().includes(q)
        ),
        activities: mockActivities.filter(a => a.event.toLowerCase().includes(q)),
        procurements: mockProcurements.filter(p => 
            p.status.toLowerCase().includes(q) || 
            p.priority.toLowerCase().includes(q)
        )
    }
}
