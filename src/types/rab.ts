export type SatuanBahan = "kg" | "liter" | "pcs" | "pouch" | "kotak" | "ball";

export const SATUAN_OPTIONS: SatuanBahan[] = [
  "kg",
  "liter",
  "pcs",
  "pouch",
  "kotak",
  "ball",
];

export interface BahanInput {
  id: string;
  uraianBahan: string;
  kuantitas: number | "";
  satuan: SatuanBahan;
  keterangan: string;
}

export interface MenuInput {
  id: string;
  namaMenu: string;
  bahanList: BahanInput[];
}

export interface RabFormData {
  tanggal: string; // YYYY-MM-DD
  lokasiSppg: string;
  menuList: MenuInput[];
}

// Flat row format for Tab_Input_Harian:
// ID, Tanggal, Lokasi SPPG, Nama Menu, Uraian Bahan, Kuantitas_Angka, Satuan, Keterangan
export interface SheetRowRecord {
  id: string;
  tanggal: string;
  lokasiSppg: string;
  namaMenu: string;
  uraianBahan: string;
  kuantitasAngka: number;
  satuan: string;
  keterangan: string;
}

export interface ExportReportResponse {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  title?: string;
  rowCount?: number;
  message?: string;
}
