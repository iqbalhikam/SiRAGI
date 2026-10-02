-- ====================================================================
-- MIGRASI DATABASE: MENU PLANNER MBG (Jadwal Menu Mingguan)
-- File: supabase/migrations/20261002_create_menu_planner.sql
-- ====================================================================

-- 1. Buat ekstensi pgcrypto / uuid jika belum ada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Buat tabel menu_planner_week untuk menyimpan jadwal menu mingguan
CREATE TABLE IF NOT EXISTS public.menu_planner_week (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identifikasi Plan
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL DEFAULT 'Plan Mingguan',
    
    -- Target AKG yang dipilih
    target_akg_id TEXT NOT NULL DEFAULT 'akg-sd-b',
    target_akg_nama TEXT NOT NULL,
    target_kalori_mbg INTEGER NOT NULL,
    target_protein_mbg INTEGER NOT NULL,
    batas_hpp_maksimal INTEGER NOT NULL,
    
    -- Status Validasi
    is_valid BOOLEAN DEFAULT false,
    valid_days_count INTEGER DEFAULT 0,
    warning_days_count INTEGER DEFAULT 0,
    
    -- Statistik Mingguan
    avg_kalori INTEGER DEFAULT 0,
    avg_hpp INTEGER DEFAULT 0,
    avg_protein NUMERIC(10,2) DEFAULT 0,
    total_hpp_week INTEGER DEFAULT 0,
    
    -- Data Menu per Hari (JSONB untuk fleksibilitas)
    -- Format: {
    --   "senin": [{ "instanceId": "...", "recipe": { "id": "...", "nama_resep": "...", ... } }],
    --   "selasa": [...],
    --   ...
    -- }
    schedule_data JSONB NOT NULL DEFAULT '{"senin": [], "selasa": [], "rabu": [], "kamis": [], "jumat": []}',
    
    -- Metadata Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indeks untuk optimasi pencarian cepat
CREATE INDEX IF NOT EXISTS idx_menu_planner_week_user_id ON public.menu_planner_week (user_id);
CREATE INDEX IF NOT EXISTS idx_menu_planner_week_created_at ON public.menu_planner_week (created_at DESC);

-- 4. Trigger otomatis update kolom updated_at saat data diubah
CREATE OR REPLACE FUNCTION public.handle_updated_at_menu_planner_week()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_menu_planner_week_updated_at ON public.menu_planner_week;
CREATE TRIGGER trigger_menu_planner_week_updated_at
    BEFORE UPDATE ON public.menu_planner_week
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at_menu_planner_week();

-- 5. Row Level Security (RLS)
ALTER TABLE public.menu_planner_week ENABLE ROW LEVEL SECURITY;

-- Policy: Publik dapat membaca data mereka sendiri
CREATE POLICY "Izinkan baca menu_planner_week untuk pemilik"
    ON public.menu_planner_week
    FOR SELECT
    USING (auth.uid() IS NULL OR user_id = auth.uid());

-- Policy: Izinkan insert untuk pengguna terautentikasi atau tanpa auth (untuk guest)
CREATE POLICY "Izinkan insert menu_planner_week"
    ON public.menu_planner_week
    FOR INSERT
    WITH CHECK (auth.uid() IS NULL OR user_id = auth.uid());

-- Policy: Izinkan update untuk pemilik
CREATE POLICY "Izinkan update menu_planner_week"
    ON public.menu_planner_week
    FOR UPDATE
    USING (auth.uid() IS NULL OR user_id = auth.uid())
    WITH CHECK (auth.uid() IS NULL OR user_id = auth.uid());

-- Policy: Izinkan delete untuk pemilik
CREATE POLICY "Izinkan delete menu_planner_week"
    ON public.menu_planner_week
    FOR DELETE
    USING (auth.uid() IS NULL OR user_id = auth.uid());

-- 6. Komentar Dokumentasi Kolom
COMMENT ON TABLE public.menu_planner_week IS 'Menyimpan jadwal menu mingguan MBG (Senin-Jumat) dengan validasi gizi dan anggaran';
COMMENT ON COLUMN public.menu_planner_week.user_id IS 'ID pengguna yang membuat plan (nullable untuk guest mode)';
COMMENT ON COLUMN public.menu_planner_week.plan_name IS 'Nama/note untuk plan ini';
COMMENT ON COLUMN public.menu_planner_week.schedule_data IS 'Data JSON berisi menu setiap hari Senin-Jumat';
COMMENT ON COLUMN public.menu_planner_week.is_valid IS 'Status apakah semua hari lolos validasi MBG';
