import { createClient } from '@/lib/supabase/server'
import {
    Activity,
    ComplianceAlert,
    DashboardStats,
    Delivery,
    Shipment,
    StatCard
} from '@/models'
import { combineDateAndTime } from '@/lib/dateUtils'
import { Procurement, Product } from '@/lib/api/procurement.api'

// --- Data Fetching Functions ---

export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient()

    // 1. Fetch Shipments for Stats
    const { data: shipments } = await supabase
        .from('shipments')
        .select('*')

    const allShipments = (shipments as Shipment[]) || []
    const active = allShipments.filter(s => s.status !== 'Delivered')
    const pending = allShipments.filter(s => s.status === 'Pending')
    const urgent = allShipments.filter(s => s.status === 'At Customs')

    // Calculate on-schedule percentage
    const inTransitOrDispatched = allShipments.filter(s =>
        s.status === 'In Transit' || s.status === 'Dispatched'
    )
    const onSchedulePercentage = active.length > 0 && inTransitOrDispatched.length > 0
        ? Math.round((inTransitOrDispatched.length / active.length) * 100)
        : 100

    // 2. Fetch Compliance Alerts
    const { data: alerts } = await supabase
        .from('compliance_alerts')
        .select('*')

    const allAlerts = (alerts as ComplianceAlert[]) || []

    // Determine compliance status
    let complianceValue = 'Clear'
    let complianceSubtext = 'All requirements met'
    let complianceColor = 'from-green-500 to-green-600'
    let complianceTextColor = 'text-green-600'

    const criticalCount = allAlerts.filter(a => a.severity === 'error').length
    const warningCount = allAlerts.filter(a => a.severity === 'warning').length

    if (criticalCount > 0) {
        complianceValue = 'Critical'
        complianceSubtext = `${criticalCount} urgent issues`
        complianceColor = 'from-red-500 to-red-600'
        complianceTextColor = 'text-red-600'
    } else if (warningCount > 0) {
        complianceValue = 'Warning'
        complianceSubtext = `${warningCount} items need attention`
        complianceColor = 'from-amber-500 to-amber-600' // Changed to amber to match design
        complianceTextColor = 'text-amber-600'
    }

    // 3. Monthly Total (Mocked calculation for now, or real count)
    // Let's count delivered items in current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { count: monthlyCount } = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Delivered')
        .gte('updated_at', startOfMonth)

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
            value: (monthlyCount || 0).toString(),
            subtext: 'Completed this month',
            color: 'from-purple-500 to-purple-600',
            textColor: 'text-purple-600'
        }
    }
}

export async function getRecentActivity(limit: number = 5): Promise<Activity[]> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('activities')
        .select('*')
        .order('time', { ascending: false })
        .limit(limit)

    // Format time for display if needed, but DB returns ISO string usually.
    // The UI expects a string like "10:30 AM". 
    // We should map the DB results.
    return (data || []).map((a: any) => ({
        ...a,
        time: new Date(a.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    })) as Activity[]
}

export async function getUpcomingDeliveries(limit: number = 4): Promise<Delivery[]> {
    const supabase = await createClient()
    const now = new Date()

    // Get deliveries from today onwards
    const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .gte('date', now.toISOString().split('T')[0]) // From today
        .order('date', { ascending: true })
        .order('time', { ascending: true })

    if (error) {
        console.error('Failed to fetch upcoming deliveries:', error)
        return []
    }

    if (!data || data.length === 0) {
        return []
    }

    // Filter out past deliveries and add scheduled_datetime using utility function
    const upcomingDeliveries = (data as Delivery[])
        .map((delivery) => {
            const scheduledDateTime = combineDateAndTime(delivery.date, delivery.time)

            return {
                ...delivery,
                scheduled_datetime: scheduledDateTime,
                status: 'upcoming' as const
            }
        })
        .filter(delivery => delivery.scheduled_datetime && delivery.scheduled_datetime > now)
        .slice(0, limit)

    return upcomingDeliveries
}

export async function getCompletedDeliveries(hoursBack: number = 24): Promise<Delivery[]> {
    const supabase = await createClient()
    const now = new Date()
    const cutoffDate = new Date(now.getTime() - (hoursBack * 60 * 60 * 1000))

    // Get deliveries from the past 24 hours
    const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .gte('date', cutoffDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .order('time', { ascending: false })

    if (error) {
        console.error('Failed to fetch completed deliveries:', error)
        return []
    }

    if (!data || data.length === 0) {
        return []
    }

    // Filter to get only completed deliveries (past scheduled time) using utility function
    const completedDeliveries = (data as Delivery[])
        .map((delivery) => {
            const scheduledDateTime = combineDateAndTime(delivery.date, delivery.time)

            return {
                ...delivery,
                scheduled_datetime: scheduledDateTime,
                status: 'completed' as const
            }
        })
        .filter(delivery =>
            delivery.scheduled_datetime &&
            delivery.scheduled_datetime <= now &&
            delivery.scheduled_datetime >= cutoffDate
        )

    return completedDeliveries
}

export async function getComplianceAlerts(): Promise<ComplianceAlert[]> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('compliance_alerts')
        .select('*')
        .order('created_at', { ascending: false })

    return (data as ComplianceAlert[]) || []
}

export async function getActiveShipments(): Promise<Shipment[]> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('shipments')
        .select('*')
        .neq('status', 'Delivered')
        .order('created_at', { ascending: false })

    return (data as Shipment[]) || []
}

export type SearchResults = {
    shipments: Shipment[]
    alerts: ComplianceAlert[]
    activities: Activity[]
    procurements: (Procurement & { products: Product })[]
}

export async function searchGlobal(query: string): Promise<SearchResults> {
    const supabase = await createClient()
    const searchQuery = `%${query}%`

    // Parallelize search queries
    const [shipmentsRes, alertsRes, activitiesRes, procurementsRes] = await Promise.all([
        supabase
            .from('shipments')
            .select('*')
            .or(`isotope.ilike.${searchQuery},origin.ilike.${searchQuery},destination.ilike.${searchQuery}`),
        supabase
            .from('compliance_alerts')
            .select('*')
            .or(`title.ilike.${searchQuery},description.ilike.${searchQuery}`),
        supabase
            .from('activities')
            .select('*')
            .ilike('event', searchQuery),
        supabase
            .from('procurements')
            .select(`
                *,
                products (*)
            `)
            .or(`status.ilike.${searchQuery},priority.ilike.${searchQuery}`)
    ])

    return {
        shipments: (shipmentsRes.data as Shipment[]) || [],
        alerts: (alertsRes.data as ComplianceAlert[]) || [],
        activities: (activitiesRes.data as Activity[]) || [],
        procurements: (procurementsRes.data as any[]) || []
    }
}
