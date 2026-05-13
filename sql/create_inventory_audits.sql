-- Create inventory_audits table
CREATE TABLE IF NOT EXISTS public.inventory_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orphanage_id UUID REFERENCES public.orphanages(id) ON DELETE CASCADE,
    orphanage_name TEXT,
    volunteer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'requested', -- requested, accepted, completed, verified
    beneficiary_count INTEGER DEFAULT 0,
    audit_data JSONB DEFAULT '[]'::jsonb, -- [{name, available, required, deficit, status_level, per_child_consumption}]
    photos TEXT[] DEFAULT '{}',
    signature TEXT,
    notes TEXT,
    visit_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory_audits ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Audits viewable by all" ON public.inventory_audits FOR SELECT USING (true);
CREATE POLICY "Audits insertable by all" ON public.inventory_audits FOR INSERT WITH CHECK (true);
CREATE POLICY "Audits updatable by all" ON public.inventory_audits FOR UPDATE USING (true);
