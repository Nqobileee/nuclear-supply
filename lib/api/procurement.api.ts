import { createClient } from '@/lib/supabase/client';

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

export async function getProducts() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

    if (error) throw error;
    return data as Product[];
}

export async function getProcurements() {
    const supabase = createClient();
    console.log('Querying procurements table...');
    const { data, error } = await supabase
        .from('procurements')
        .select(`
      *,
      products (*)
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase Query Error (procurements):', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        console.error('Full Error Object:', error);
        throw error;
    }

    // Map products to product property to maintain interface compatibility
    const mappedData = (data || []).map((item: any) => ({
        ...item,
        product: item.products
    }));

    return mappedData as Procurement[];
}

export async function submitProcurementRequest(procurementData: {
    product_id: string;
    quantity: number;
    priority: 'Normal' | 'High' | 'Urgent';
    delivery_date: string;
    notes?: string;
    location?: string;
}) {
    const supabase = createClient();

    // 1. Get user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // 2. Fetch product details for names/etc
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', procurementData.product_id)
        .single();

    if (!product) throw new Error('Product not found');

    // 3. Create Procurement record
    const { data: procurement, error: pError } = await supabase
        .from('procurements')
        .insert({
            product_id: procurementData.product_id,
            quantity: procurementData.quantity,
            priority: procurementData.priority,
            status: 'Pending',
            delivery_date: procurementData.delivery_date,
            user_id: userId
        })
        .select()
        .single();

    if (pError) throw pError;

    // 4. AUTOMATION: Create Shipment record
    const { data: shipment, error: sError } = await supabase
        .from('shipments')
        .insert({
            isotope: product.name,
            origin: 'Distribution Center',
            destination: procurementData.location || 'Hospital Pharmacy',
            status: 'Pending',
            eta: new Date(new Date(procurementData.delivery_date).getTime() + 86400000).toISOString(), // +1 day
            status_color: 'bg-gray-100 text-gray-800'
        })
        .select()
        .single();

    if (sError) console.error('Failed to auto-create shipment:', sError);

    // 5. AUTOMATION: Create Compliance Alert
    const { error: aError } = await supabase
        .from('compliance_alerts')
        .insert({
            severity: 'info',
            title: `New Procurement: ${product.name}`,
            description: `Compliance review required for procurement ${procurement.id.substring(0, 8)}.`
        });

    if (aError) console.error('Failed to auto-create compliance alert:', aError);

    // 6. AUTOMATION: Create Audit Trail (Traceability)
    const { error: tError } = await supabase
        .from('audit_trail')
        .insert({
            procurement_id: procurement.id,
            shipment_id: shipment?.id,
            event_type: 'Procurement Created',
            actor: session?.user?.email || 'System',
            location: 'Inventory Management',
            description: `Procurement request initiated for ${procurementData.quantity} units of ${product.name}.`,
            hash: '0x' + Math.random().toString(16).substring(2, 66) // Placeholder hash
        });

    if (tError) console.error('Failed to auto-create audit trail:', tError);

    // 7. AUTOMATION: Create Activity
    const { error: actError } = await supabase
        .from('activities')
        .insert({
            event: `New procurement request submitted for ${product.name}`,
            type: 'procurement',
            user_id: userId
        });

    if (actError) console.error('Failed to auto-create activity:', actError);

    return procurement;
}

export async function deleteProcurementRequest(id: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from('procurements')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

