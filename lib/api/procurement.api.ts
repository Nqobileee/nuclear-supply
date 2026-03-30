export interface Product {
    id: string;
    name: string;
    brand: string;
    dosage_form: string;
    strength: string;
    gtin: string;
}

export interface Procurement {
    id: string;
    product_id: string;
    quantity: number;
    priority: 'Normal' | 'High' | 'Urgent';
    status: string;
    delivery_date: string;
    created_at: string;
    product?: Product;
}

import { mockProducts, mockProcurements, mockShipments, mockAlerts, mockActivities } from '../hardcoded-data'

export async function getProducts() {
    return [...mockProducts].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProcurements() {
    return [...mockProcurements].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function submitProcurementRequest(procurementData: {
    product_id: string;
    quantity: number;
    priority: 'Normal' | 'High' | 'Urgent';
    delivery_date: string;
    notes?: string;
    location?: string;
}) {
    const product = mockProducts.find(p => p.id === procurementData.product_id);
    if (!product) throw new Error('Product not found');

    const newProcurement: Procurement & { products: Product } = {
        id: 'PR-' + Math.floor(Math.random() * 10000),
        product_id: procurementData.product_id,
        quantity: procurementData.quantity,
        priority: procurementData.priority,
        status: 'Pending',
        delivery_date: procurementData.delivery_date,
        created_at: new Date().toISOString(),
        products: product
    };

    mockProcurements.push(newProcurement);

    mockShipments.push({
        id: 'SHP-' + Math.floor(Math.random() * 10000),
        isotope: product.name,
        origin: 'Distribution Center',
        destination: procurementData.location || 'Hospital Pharmacy',
        status: 'Pending',
        eta: new Date(new Date(procurementData.delivery_date).getTime() + 86400000).toISOString(),
        status_color: 'bg-gray-100 text-gray-800'
    });

    mockAlerts.push({
        id: 'CA-' + Math.floor(Math.random() * 10000),
        severity: 'info',
        title: `New Procurement: ${product.name}`,
        description: `Compliance review required for new procurement.`
    });

    mockActivities.push({
        id: 'ACT-' + Math.floor(Math.random() * 10000),
        event: `New procurement request submitted for ${product.name}`,
        type: 'procurement',
        time: new Date().toISOString()
    });

    return newProcurement;
}

export async function deleteProcurementRequest(id: string) {
    const index = mockProcurements.findIndex(p => p.id === id);
    if (index > -1) {
        mockProcurements.splice(index, 1);
    }
    return true;
}
