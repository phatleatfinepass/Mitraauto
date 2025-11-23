# CMS Services Setup Guide

Follow these steps to correctly set up the `services` and `service_groups` tables in Supabase. This schema supports localization (Finnish/English) and is required for both the CMS and the public Services page to work correctly.

## 1. Run this SQL in Supabase SQL Editor

Copy and paste the following SQL into the **SQL Editor** of your Supabase dashboard.

**Warning:** This will drop existing `services` and `service_groups` tables if they exist.

```sql
-- Drop existing tables to ensure clean state
DROP TABLE IF EXISTS public.services;
DROP TABLE IF EXISTS public.service_groups;

-- Create service_groups table
CREATE TABLE public.service_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_fi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table with foreign key to groups
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.service_groups(id) ON DELETE CASCADE,
    name_fi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    price_eur NUMERIC(10, 2),
    note_fi TEXT,
    note_en TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.service_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Public Read Access
CREATE POLICY "Allow public read access groups" ON public.service_groups FOR SELECT USING (true);
CREATE POLICY "Allow public read access services" ON public.services FOR SELECT USING (true);

-- Public Write Access (Temporary for CMS without Auth)
CREATE POLICY "Allow public write access groups" ON public.service_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public write access services" ON public.services FOR ALL USING (true) WITH CHECK (true);

-- Insert Initial Data (Service Groups)
INSERT INTO public.service_groups (name_fi, name_en, display_order) VALUES
    ('Autopesu', 'Car Wash', 10),
    ('Huolto', 'Maintenance', 20),
    ('Rengastyöt', 'Tire Work', 30),
    ('Rengashotelli', 'Tire Hotel', 40);

-- Insert Initial Data (Services)
-- Note: We use subqueries to find the group IDs dynamically
INSERT INTO public.services (group_id, name_fi, name_en, price_eur, note_fi, note_en, display_order)
VALUES
    -- Car Wash
    ((SELECT id FROM public.service_groups WHERE name_en = 'Car Wash'), 'Ulkopesu', 'Exterior Wash', 95.00, NULL, NULL, 10),
    ((SELECT id FROM public.service_groups WHERE name_en = 'Car Wash'), 'Täyspesu', 'Full Wash', 150.00, 'Sisältää sisä- ja ulkopesun', 'Includes interior and exterior', 20),
    
    -- Maintenance
    ((SELECT id FROM public.service_groups WHERE name_en = 'Maintenance'), 'Pienhuolto', 'Basic Service', 250.00, 'Sisältää öljynvaihdon', 'Includes oil change', 10),
    ((SELECT id FROM public.service_groups WHERE name_en = 'Maintenance'), 'Ilmastoinnin huolto', 'A/C Service', 120.00, NULL, NULL, 20),
    
    -- Tire Work
    ((SELECT id FROM public.service_groups WHERE name_en = 'Tire Work'), 'Renkaiden vaihto', 'Tire Change', 45.00, 'Henkilöauto', 'Passenger car', 10),
    ((SELECT id FROM public.service_groups WHERE name_en = 'Tire Work'), 'Renkaiden asennus', 'Tire Mounting', 60.00, 'Vanteille asennus', 'Mounting on rims', 20),
    
    -- Tire Hotel
    ((SELECT id FROM public.service_groups WHERE name_en = 'Tire Hotel'), 'Kausisäilytys', 'Seasonal Storage', 90.00, 'Sisältää pesun ja vakuutuksen', 'Includes wash and insurance', 10);
```

## 2. Verify the Setup

1.  Go to your app's **Services Page** (`/services`) - it should now load data from Supabase instead of fallback data.
2.  Go to **CMS** (`/cms`) -> **Services Manager** - click Refresh. You should see the list of services with Finnish/English names and their categories.
