import * as XLSX from "xlsx";
import { POSummary } from "@/types/po-kebutuhan";

export function exportPOToExcel(summary: POSummary) {
  // 1. Siapkan baris header metadata
  const rows: any[] = [
    ["REKAPITULASI PURCHASE ORDER (PO) / KEBUTUHAN BELANJA BAHAN MBG"],
    ["PROGRAM MAKAN BERGIZI GRATIS (BGN / SPMB)"],
    [],
    ["Periode Menu:", `${summary.startDate} s/d ${summary.endDate} (${summary.totalHariEfektif} Hari Sekolah)`],
    ["Target Porsi / Hari:", `${summary.targetPorsiPerHari.toLocaleString("id-ID")} porsi siswa`],
    ["Total Porsi Kumulatif:", `${summary.totalPorsiKumulatif.toLocaleString("id-ID")} porsi`],
    ["Parameter Toleransi Susut:", `${summary.toleransiSusutPersen}% (Waste & Trimming)`],
    ["Total Tonase Pembelian:", `${summary.totalTonaseKg.toLocaleString("id-ID")} kg`],
    ["Total Estimasi Anggaran PO:", `Rp ${summary.totalAnggaranPO.toLocaleString("id-ID")}`],
    ["Rata-rata Biaya Bahan / Siswa:", `Rp ${summary.biayaPerPorsiSiswa.toLocaleString("id-ID")} / porsi`],
    [],
    [
      "No",
      "Nama Bahan Pangan",
      "Kategori",
      "BDD (%)",
      "Gramasi / Porsi (g)",
      "Kebutuhan Mentah Dasar (kg)",
      `Toleransi Susut (+${summary.toleransiSusutPersen}%) (kg)`,
      "Total Beli Final (kg)",
      "Harga Beli / kg (Rp)",
      "Estimasi Subtotal (Rp)",
      "Menu Masakan Terkait",
    ],
  ];

  // 2. Isi data bahan
  summary.items.forEach((item, index) => {
    rows.push([
      index + 1,
      item.namaBahan,
      item.kategori,
      `${item.bddPersen}%`,
      item.gramasiResepPerPorsi,
      item.totalKebutuhanKotorKg,
      item.toleransiSusutKg,
      item.totalBeliFinalKg,
      item.hargaPerKg,
      item.subtotalBiaya,
      item.dipakaiPadaResep.join(", "),
    ]);
  });

  // 3. Tambahkan baris TOTAL
  rows.push([]);
  rows.push([
    "TOTAL",
    "",
    "",
    "",
    "",
    "",
    "",
    summary.totalTonaseKg,
    "",
    summary.totalAnggaranPO,
    "",
  ]);

  // 4. Buat Worksheet & Workbook
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Atur lebar kolom agar rapi
  worksheet["!cols"] = [
    { wch: 5 },  // No
    { wch: 32 }, // Nama Bahan
    { wch: 18 }, // Kategori
    { wch: 10 }, // BDD %
    { wch: 18 }, // Gramasi / porsi
    { wch: 25 }, // Kebutuhan mentah dasar
    { wch: 25 }, // Toleransi susut
    { wch: 20 }, // Total Beli Final (kg)
    { wch: 20 }, // Harga / kg
    { wch: 22 }, // Subtotal Biaya
    { wch: 38 }, // Menu Terkait
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "PO_Kebutuhan_MBG");

  // 5. Unduh file Excel
  const filename = `PO_Kebutuhan_MBG_${summary.targetPorsiPerHari}porsi_${summary.startDate}_sd_${summary.endDate}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
