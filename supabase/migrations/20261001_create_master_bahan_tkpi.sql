-- ====================================================================
-- MIGRASI DATABASE: MASTER DATA TKPI (Tabel Komposisi Pangan Indonesia)
-- File: supabase/migrations/20261001_create_master_bahan_tkpi.sql
-- ====================================================================

-- 1. Buat ekstensi pgcrypto / uuid jika belum ada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Buat tabel master_bahan_tkpi
CREATE TABLE IF NOT EXISTS public.master_bahan_tkpi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_tkpi VARCHAR(50) NOT NULL UNIQUE,
    nama_bahan VARCHAR(255) NOT NULL,
    kategori VARCHAR(100),
    bdd_persen NUMERIC(6, 2) NOT NULL DEFAULT 100.00,
    harga_estimasi_per_kg NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    
    -- Kandungan Gizi per 100 gram Bagian Dapat Dimakan (BDD)
    energi_kcal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    protein_g NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    lemak_g NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    karbo_g NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    serat_g NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    besi_fe_mg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    kalsium_ca_mg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    zink_zn_mg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    vit_a_mcg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    vit_c_mg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Metadata Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tambahkan kolom image_url jika tabel sudah terlanjur dibuat sebelumnya
ALTER TABLE public.master_bahan_tkpi ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Indeks untuk optimasi pencarian cepat
CREATE INDEX IF NOT EXISTS idx_master_bahan_tkpi_kode ON public.master_bahan_tkpi (kode_tkpi);
CREATE INDEX IF NOT EXISTS idx_master_bahan_tkpi_nama ON public.master_bahan_tkpi (nama_bahan);
CREATE INDEX IF NOT EXISTS idx_master_bahan_tkpi_kategori ON public.master_bahan_tkpi (kategori);

-- 4. Trigger otomatis update kolom updated_at saat data diubah
CREATE OR REPLACE FUNCTION public.handle_updated_at_master_bahan_tkpi()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_master_bahan_tkpi_updated_at ON public.master_bahan_tkpi;
CREATE TRIGGER trigger_master_bahan_tkpi_updated_at
    BEFORE UPDATE ON public.master_bahan_tkpi
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at_master_bahan_tkpi();

-- 5. Row Level Security (RLS)
ALTER TABLE public.master_bahan_tkpi ENABLE ROW LEVEL SECURITY;

-- Policy: Publik / pengguna terautentikasi dapat membaca data (SELECT)
CREATE POLICY "Izinkan baca publik untuk master_bahan_tkpi"
    ON public.master_bahan_tkpi
    FOR SELECT
    USING (true);

-- Policy: Izinkan insert/upsert untuk pengguna terautentikasi atau service role
CREATE POLICY "Izinkan insert/upsert untuk master_bahan_tkpi"
    ON public.master_bahan_tkpi
    FOR INSERT
    WITH CHECK (true);

-- Policy: Izinkan update untuk master_bahan_tkpi
CREATE POLICY "Izinkan update untuk master_bahan_tkpi"
    ON public.master_bahan_tkpi
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy: Izinkan delete untuk master_bahan_tkpi
CREATE POLICY "Izinkan delete untuk master_bahan_tkpi"
    ON public.master_bahan_tkpi
    FOR DELETE
    USING (true);

-- 6. Komentar Dokumentasi Kolom
COMMENT ON TABLE public.master_bahan_tkpi IS 'Master data Tabel Komposisi Pangan Indonesia (TKPI) beserta estimasi harga dan nilai gizi per 100g';
COMMENT ON COLUMN public.master_bahan_tkpi.kode_tkpi IS 'Kode identifikasi unik bahan makanan (contoh: AR001, KH002)';
COMMENT ON COLUMN public.master_bahan_tkpi.nama_bahan IS 'Nama bahan makanan sesuai standar TKPI Kemenkes RI';
COMMENT ON COLUMN public.master_bahan_tkpi.bdd_persen IS 'Bagian yang Dapat Dimakan (BDD) dalam satuan persen (0 - 100)';
COMMENT ON COLUMN public.master_bahan_tkpi.harga_estimasi_per_kg IS 'Estimasi harga pasar bahan dalam Rupiah per 1000 gram berat kotor';
COMMENT ON COLUMN public.master_bahan_tkpi.energi_kcal IS 'Nilai energi per 100 gram berat bersih (kkal)';
COMMENT ON COLUMN public.master_bahan_tkpi.protein_g IS 'Nilai protein per 100 gram berat bersih (gram)';
