import Link from 'next/link'
import { searchGlobal } from '@/lib/api'
import { ArrowRight, Package, AlertTriangle, Activity, FileText } from 'lucide-react'

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic'

interface SearchPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const resolvedSearchParams = await searchParams
    const query = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : ''

    if (!query) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Search</h1>
                <p className="text-gray-500">Please enter a search term.</p>
            </div>
        )
    }

    const results = await searchGlobal(query)
    const hasResults = results.shipments.length > 0 || results.alerts.length > 0 || results.activities.length > 0 || results.procurements.length > 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                    Search Results for <span className="text-primary">"{query}"</span>
                </h1>
                <p className="text-sm text-gray-500">
                    {results.shipments.length + results.alerts.length + results.activities.length + results.procurements.length} results found
                </p>
            </div>

            {!hasResults ? (
                <div className="text-center py-12 border rounded-lg bg-gray-50">
                    <p className="text-gray-500">No results found for "{query}"</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Shipments */}
                    {results.shipments.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-600" />
                                Shipments
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {results.shipments.map((shipment) => (
                                    <Link
                                        key={shipment.id}
                                        href={`/dashboard/shipments/${shipment.id}`}
                                        className="block p-4 border rounded-lg hover:border-blue-500 transition-colors bg-white hover:shadow-sm"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-sm font-medium">{shipment.id}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${shipment.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                                                shipment.status === 'Delivered' ? 'bg-gray-100 text-gray-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                {shipment.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 mb-1">
                                            <span className="font-semibold text-gray-900">{shipment.isotope}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {shipment.origin} → {shipment.destination}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Compliance Alerts */}
                    {results.alerts.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                                Compliance Alerts
                            </h2>
                            <div className="space-y-3">
                                {results.alerts.map((alert) => (
                                    <div key={alert.id} className="p-4 border rounded-lg bg-white flex gap-4">
                                        <div className={`w-1 h-full min-h-[40px] rounded-full ${alert.severity === 'error' ? 'bg-red-500' :
                                            alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                            }`} />
                                        <div>
                                            <h3 className="font-medium text-sm">{alert.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Procurements */}
                    {results.procurements.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-600" />
                                Procurements
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                                {results.procurements.map((procurement) => (
                                    <Link
                                        key={procurement.id}
                                        href={`/dashboard/procurement`}
                                        className="block p-4 border rounded-lg hover:border-purple-500 transition-colors bg-white hover:shadow-sm"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-sm font-medium">{procurement.id.substring(0, 8)}</span>
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                                                {procurement.status}
                                            </span>
                                        </div>
                                        <div className="text-sm font-semibold text-gray-900 mb-1">
                                            {procurement.products?.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Quantity: {procurement.quantity} | Priority: {procurement.priority}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Activities */}
                    {results.activities.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-600" />
                                Activities
                            </h2>
                            <div className="divide-y border rounded-lg bg-white">
                                {results.activities.map((activity) => (
                                    <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                        <span className="text-sm font-medium">{activity.event}</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(activity.time).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}
