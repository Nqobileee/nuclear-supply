-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  role TEXT CHECK (role IN ('Hospital Administrator', 'Logistics Manager', 'Compliance Officer')),
  initials TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, initials)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'Hospital Administrator'),
    COALESCE(new.raw_user_meta_data->>'initials', SUBSTRING(new.email, 1, 2))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. SHIPMENTS
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  isotope TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  status TEXT CHECK (status IN ('In Transit', 'At Customs', 'Dispatched', 'Delivered', 'Pending')),
  eta TIMESTAMPTZ NOT NULL,
  status_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shipments are viewable by authenticated users" ON public.shipments;
CREATE POLICY "Shipments are viewable by authenticated users" 
ON public.shipments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can create shipments" ON public.shipments;
CREATE POLICY "Authenticated users can create shipments" 
ON public.shipments FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update shipments" ON public.shipments;
CREATE POLICY "Authenticated users can update shipments" 
ON public.shipments FOR UPDATE TO authenticated USING (true);


-- 3. COMPLIANCE ALERTS
CREATE TABLE IF NOT EXISTS public.compliance_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  severity TEXT CHECK (severity IN ('warning', 'info', 'error')),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alerts are viewable by authenticated users" ON public.compliance_alerts;
CREATE POLICY "Alerts are viewable by authenticated users" 
ON public.compliance_alerts FOR SELECT TO authenticated USING (true);

-- 4. PERMITS
CREATE TABLE IF NOT EXISTS public.permits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('valid', 'expiring', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permits are viewable by authenticated users" ON public.permits;
CREATE POLICY "Permits are viewable by authenticated users" 
ON public.permits FOR SELECT TO authenticated USING (true);

-- 5. ACTIVITIES
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  time TIMESTAMPTZ DEFAULT NOW(),
  event TEXT NOT NULL,
  type TEXT CHECK (type IN ('delivery', 'procurement', 'customs', 'alert', 'approval')),
  user_id UUID REFERENCES auth.users(id)
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Activities are viewable by authenticated users" ON public.activities;
CREATE POLICY "Activities are viewable by authenticated users" 
ON public.activities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert activities" ON public.activities;
CREATE POLICY "Users can insert activities" 
ON public.activities FOR INSERT TO authenticated WITH CHECK (true);

-- 6. DELIVERIES (For dashboard stats/calendar)
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  isotope TEXT NOT NULL,
  destination TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deliveries viewable by authenticated users" ON public.deliveries;
CREATE POLICY "Deliveries viewable by authenticated users" 
ON public.deliveries FOR SELECT TO authenticated USING (true);

-- 7. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  dosage_form TEXT,
  strength TEXT,
  gtin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products viewable by authenticated users" ON public.products;
CREATE POLICY "Products viewable by authenticated users" ON public.products FOR SELECT TO authenticated USING (true);

-- 8. PROCUREMENT REQUESTS
CREATE TABLE IF NOT EXISTS public.procurements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  priority TEXT CHECK (priority IN ('Normal', 'High', 'Urgent')),
  status TEXT CHECK (status IN ('Pending', 'Approved', 'Ordered', 'In Transit', 'Completed', 'Cancelled')),
  delivery_date DATE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.procurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Procurements viewable by authenticated users" ON public.procurements;
CREATE POLICY "Procurements viewable by authenticated users" ON public.procurements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert procurements" ON public.procurements;
CREATE POLICY "Users can insert procurements" ON public.procurements FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own procurements" ON public.procurements;
CREATE POLICY "Users can update own procurements" ON public.procurements FOR UPDATE TO authenticated USING (true);

-- 9. AUDIT TRAIL (Traceability)
CREATE TABLE IF NOT EXISTS public.audit_trail (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  shipment_id UUID REFERENCES public.shipments(id),
  procurement_id UUID REFERENCES public.procurements(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  event_type TEXT NOT NULL,
  actor TEXT,
  location TEXT,
  description TEXT,
  hash TEXT,
  blockchain_tx TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit trail viewable by authenticated users" ON public.audit_trail;
CREATE POLICY "Audit trail viewable by authenticated users" ON public.audit_trail FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "System can insert audit trail" ON public.audit_trail;
CREATE POLICY "System can insert audit trail" ON public.audit_trail FOR INSERT TO authenticated WITH CHECK (true);

-- Seed Products from Spreadsheet
INSERT INTO public.products (id, name, brand, dosage_form, strength, gtin) VALUES
('PT-1001', 'AmoxiTrace 500', 'PharmaTrace Labs', 'Capsule', '500mg', '4012345001001'),
('PT-2005', 'CardioGuard 20', 'PharmaTrace Labs', 'Tablet', '20mg', '4012345002005'),
('PT-3003', 'VaxSafe COVID', 'PharmaTrace Bio', 'Vial', '0.5ml', '4012345003003'),
('PT-4004', 'PainRelief Max', 'PharmaTrace Generic', 'Tablet', '100mg', '4012345004004'),
('PT-5005', 'OncoCure IV', 'PharmaTrace Bio', 'Vial', '50ml', '4012345005005'),
('PT-6001', 'HerbaLife Supp', 'GreenPharma', 'Bottle', '60 Caps', '4012345006001'),
('PT-7007', 'NeuroCalm', 'PharmaTrace Generic', 'Tablet', '10mg', '4012345007007'),
('PT-8008', 'DermaCream', 'PharmaTrace Consumer', 'Tube', '50g', '4012345008008'),
('PT-9009', 'EyeClear Drops', 'PharmaTrace Bio', 'Dropper', '10ml', '4012345009009'),
('PT-1100', 'DiabetInsul', 'PharmaTrace Bio', 'Pen', '3ml', '4012345011000'),
('PT-1200', 'PainFree Gel', 'PharmaTrace Consumer', 'Tube', '100g', '4012345012000')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  dosage_form = EXCLUDED.dosage_form,
  strength = EXCLUDED.strength,
  gtin = EXCLUDED.gtin;

-- Force Cache Reload
NOTIFY pgrst, 'reload schema';
