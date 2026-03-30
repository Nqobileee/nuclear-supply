import {
    Activity, ComplianceAlert, Delivery, Shipment
} from '@/models'
import { Procurement, Product } from '@/lib/api/procurement.api'

// Profiles
export const defaultProfile = {
  id: 'user-1',
  name: 'Demo Admin',
  role: 'Hospital Administrator',
  initials: 'DA'
}

// Products
export const mockProducts: Product[] = [
  { id: 'PT-1001', name: 'Molybdenum-99 (Mo-99)', brand: 'Necsa', dosage_form: 'Generator', strength: '500GBq', gtin: '4012345001001' },
  { id: 'PT-2005', name: 'Iodine-131 (I-131)', brand: 'NTP Radioisotopes', dosage_form: 'Capsule', strength: '370MBq', gtin: '4012345002005' },
  { id: 'PT-3003', name: 'Fluorine-18 (F-18)', brand: 'iThemba LABS', dosage_form: 'Radiotracer', strength: '1000MBq', gtin: '4012345003003' },
  { id: 'PT-4004', name: 'Lutetium-177 (Lu-177)', brand: 'Necsa', dosage_form: 'Vial', strength: '7.4GBq', gtin: '4012345004004' }
]

const now = new Date()

// Shipments
export const mockShipments: Shipment[] = [
  {
    id: 'SHP-2894-XJ',
    isotope: 'Molybdenum-99',
    origin: 'Koeberg Nuclear Power Station (ZA)',
    destination: 'Aga Khan University (KE)',
    status: 'In Transit',
    eta: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
    status_color: 'blue',
    created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: now.toISOString()
  },
  {
    id: 'SHP-9921-AF',
    isotope: 'Iodine-131',
    origin: 'NTP Radioisotopes (ZA)',
    destination: 'Korle Bu Hospital (GH)',
    status: 'At Customs',
    eta: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    status_color: 'amber',
    created_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: now.toISOString()
  },
  {
    id: 'SHP-1029-BZ',
    isotope: 'Fluorine-18',
    origin: 'iThemba LABS (ZA)',
    destination: 'Chris Hani Baragwanath (ZA)',
    status: 'Dispatched',
    eta: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(),
    status_color: 'purple',
    created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: now.toISOString()
  },
  {
    id: 'SHP-4451-LQ',
    isotope: 'Lutetium-177',
    origin: 'Reacteur Triga Mark II (MA)',
    destination: 'Institut Curie, Dakar (SN)',
    status: 'Pending',
    eta: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
    status_color: 'gray',
    created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: now.toISOString()
  },
  {
    id: 'SHP-5582-MC',
    isotope: 'Technetium-99m',
    origin: 'Nur Research Reactor (DZ)',
    destination: 'Cairo University Hospital (EG)',
    status: 'Delivered',
    eta: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    status_color: 'green',
    created_at: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
  }
]

// Compliance Alerts
export const mockAlerts: ComplianceAlert[] = [
  { id: 'ca-1', severity: 'warning', title: 'Route Deviation Detected', description: 'Shipment SHP-2894-XJ slightly off optimal path. Driver notified.', created_at: now.toISOString() },
  { id: 'ca-2', severity: 'error', title: 'Customs Delay', description: 'Missing Form 4A for I-131 shipment at Kotoka International Airport.', created_at: new Date(now.getTime() - 3600000).toISOString() },
  { id: 'ca-3', severity: 'info', title: 'Permit Renewal Required', description: 'Transport permit for West Africa corridor expires in 15 days.', created_at: new Date(now.getTime() - 7200000).toISOString() }
]

// Activities
export const mockActivities: Activity[] = [
  { id: 'act-1', time: now.toISOString(), event: 'Shipment SHP-1029-BZ departed iThemba LABS', type: 'delivery', user_id: 'user-1' },
  { id: 'act-2', time: new Date(now.getTime() - 1800000).toISOString(), event: 'Customs clearance pending for SHP-9921-AF in Accra', type: 'customs', user_id: 'user-1' },
  { id: 'act-3', time: new Date(now.getTime() - 5400000).toISOString(), event: 'Procurement Request PR-882 approved', type: 'approval', user_id: 'user-1' }
]

// Deliveries
export const mockDeliveries: Delivery[] = [
  { id: 'del-1', date: now.toISOString().split('T')[0], time: '14:00', isotope: 'Fluorine-18', destination: 'Chris Hani Baragwanath (ZA)', created_at: new Date(now.getTime() - 86400000).toISOString() },
  { id: 'del-2', date: new Date(now.getTime() + 86400000).toISOString().split('T')[0], time: '09:30', isotope: 'Molybdenum-99', destination: 'Aga Khan University (KE)', created_at: new Date(now.getTime() - 86400000).toISOString() }
]

export const mockDeliveriesCompleted: Delivery[] = [
  { id: 'del-3', date: new Date(now.getTime() - 86400000).toISOString().split('T')[0], time: '11:00', isotope: 'Technetium-99m', destination: 'Cairo University Hospital (EG)', created_at: new Date(now.getTime() - 172800000).toISOString() }
]

// Procurements
export const mockProcurements: (Procurement & { products: Product })[] = [
  { id: 'PR-882', product_id: 'PT-1001', quantity: 2, priority: 'High', status: 'Approved', delivery_date: new Date(now.getTime() + 86400000 * 3).toISOString().split('T')[0], user_id: 'user-1', created_at: now.toISOString(), updated_at: now.toISOString(), products: mockProducts[0] }
]
