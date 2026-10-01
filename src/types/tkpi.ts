export interface MasterBahanTKPI {
  id?: string;
  kode_tkpi: string;
  nama_bahan: string;
  kategori?: string | null;
  bdd_persen: number;
  harga_estimasi_per_kg: number;
  image?: string | null;
  image_url?: string | null;

  // Gizi per 100g
  energi_kcal: number;
  protein_g: number;
  lemak_g: number;
  karbo_g: number;
  serat_g: number;
  besi_fe_mg: number;
  kalsium_ca_mg: number;
  zink_zn_mg: number;
  vit_a_mcg: number;
  vit_c_mg: number;

  created_at?: string;
  updated_at?: string;
}

export interface TKPIImportPayload {
  items: MasterBahanTKPI[];
}

export interface TKPIImportResponse {
  success: boolean;
  message: string;
  insertedOrUpdated?: number;
  errors?: string[];
}
