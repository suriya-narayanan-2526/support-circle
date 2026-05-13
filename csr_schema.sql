-- Create the CSR Applications table
CREATE TABLE IF NOT EXISTS public.csr_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    org_name TEXT NOT NULL,
    reg_number TEXT,
    contact_person TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    org_type TEXT,
    interests JSONB DEFAULT '[]'::jsonb,
    support_type TEXT,
    estimated_capacity TEXT,
    collaboration_duration TEXT,
    digital_signature TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Under Review', -- 'Under Review', 'Panel Assigned', 'Approved', 'Rejected'
    panel_member_id UUID REFERENCES auth.users(id),
    meeting_scheduled TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.csr_applications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Partners can view their own csr apps" ON public.csr_applications FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "Partners can insert their own csr apps" ON public.csr_applications FOR INSERT WITH CHECK (auth.uid() = partner_id);
CREATE POLICY "Admins can view all csr apps" ON public.csr_applications FOR SELECT USING (true);
CREATE POLICY "Admins can update all csr apps" ON public.csr_applications FOR UPDATE USING (true);
