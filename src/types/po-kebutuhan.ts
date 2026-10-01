export interface POItemBOM {
  id: string;
  bahanId?: string;
  namaBahan: string;
  kategori: string;
  bddPersen: number; // e.g. 58%
  gramasiResepPerPorsi: number; // Total gramasi per porsi (gram)
  totalKebutuhanKotorKg: number; // (gramasi * targetPorsi) / (bdd / 100) / 1000
  toleransiSusutKg: number; // toleransi 5% dalam kg
  totalBeliFinalKg: number; // Total Beli + susut (kg)
  hargaPerKg: number; // Rp per kg
  subtotalBiaya: number; // Total Beli Final * Harga/kg
  satuanBeli: string; // e.g. "kg", "ikat", "butir"
  dipakaiPadaResep: string[]; // Daftar menu yang memakai bahan ini
}

export interface POSummary {
  startDate: string;
  endDate: string;
  totalHariEfektif: number;
  targetPorsiPerHari: number;
  totalPorsiKumulatif: number;
  toleransiSusutPersen: number;
  totalTonaseKg: number;
  totalAnggaranPO: number;
  biayaPerPorsiSiswa: number;
  totalJenisBahan: number;
  items: POItemBOM[];
}

export interface POGeneratePayload {
  startDate: string;
  endDate: string;
  targetPorsi: number;
  toleransiSusut?: number; // default 5
  selectedRecipeIds?: string[];
}
