import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/utils/supabase/client";
import { POItemBOM, POSummary } from "@/types/po-kebutuhan";
import { MOCK_MASTER_BAHAN } from "@/types/recipe";

// Helper: Hitung jumlah hari kerja (Senin - Jumat) antara dua tanggal
function countWeekdays(startStr: string, endStr: string): number {
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 1;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day >= 1 && day <= 5) {
        // Senin s.d. Jumat
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(1, count);
  } catch {
    return 1;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      startDate = new Date().toISOString().split("T")[0],
      endDate = new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0],
      targetPorsi = 5000,
      toleransiSusut = 5, // default 5%
    } = body;

    const porsiPerHari = Math.max(1, Number(targetPorsi) || 5000);
    const susutPersen = Math.max(0, Number(toleransiSusut) || 5);
    const hariEfektif = countWeekdays(startDate, endDate);
    const totalPorsiKumulatif = porsiPerHari * hariEfektif;

    // Struktur Map untuk mengelompokkan bahan dari berbagai resep
    // Key: nama_bahan (lowercase)
    const groupedBahan = new Map<
      string,
      {
        id: string;
        bahanId?: string;
        namaBahan: string;
        kategori: string;
        bddPersen: number;
        totalGramasiPerPorsi: number;
        hargaPerKg: number;
        satuanBeli: string;
        resepList: Set<string>;
      }
    >();

    let source = "mock";

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseServerClient();

      // Query join tabel resep dan resep_komposisi
      const { data: dbResep, error } = await supabase
        .from("resep")
        .select(`
          id,
          nama_resep,
          resep_komposisi (
            id,
            bahan_id,
            nama_bahan,
            gramasi_kotor,
            bdd_persen,
            harga
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && dbResep && dbResep.length > 0) {
        source = "supabase";
        dbResep.forEach((r: any) => {
          const items = r.resep_komposisi || [];
          items.forEach((item: any) => {
            const key = item.nama_bahan.trim().toLowerCase();
            const master = MOCK_MASTER_BAHAN.find(
              (m) => m.nama_bahan.toLowerCase() === key
            );

            const bdd = Number(item.bdd_persen) || master?.bdd_persen || 100;
            const hargaKg =
              master?.harga_per_kg ||
              (item.gramasi_kotor > 0 && item.harga > 0
                ? Math.round((item.harga / item.gramasi_kotor) * 1000)
                : 25000);

            if (!groupedBahan.has(key)) {
              groupedBahan.set(key, {
                id: item.id || `b-${Date.now()}-${Math.random()}`,
                bahanId: item.bahan_id || undefined,
                namaBahan: item.nama_bahan,
                kategori: master?.kategori || "Bahan Makanan",
                bddPersen: bdd,
                totalGramasiPerPorsi: Number(item.gramasi_kotor) || 50,
                hargaPerKg: hargaKg,
                satuanBeli: "kg",
                resepList: new Set([r.nama_resep]),
              });
            } else {
              const existing = groupedBahan.get(key)!;
              existing.totalGramasiPerPorsi += Number(item.gramasi_kotor) || 0;
              existing.resepList.add(r.nama_resep);
            }
          });
        });
      }
    }

    // Jika Supabase kosong / belum ada resep, gunakan standar siklus 5 hari MBG
    if (groupedBahan.size === 0) {
      source = "standard_tkpi";
      // Contoh komposisi harian siklus MBG standar
      const standardBOM = [
        {
          nama: "Beras Putih Giling",
          kategori: "Makanan Pokok",
          gramPerPorsi: 100,
          bdd: 100,
          hargaKg: 14500,
          resep: "Nasi Putih Pulen MBG",
        },
        {
          nama: "Daging Ayam Karkas (Utuh)",
          kategori: "Lauk Hewani",
          gramPerPorsi: 120,
          bdd: 58,
          hargaKg: 38000,
          resep: "Ayam Bakar Madu / Ayam Lengkuas",
        },
        {
          nama: "Daging Sapi Murni",
          kategori: "Lauk Hewani",
          gramPerPorsi: 50,
          bdd: 100,
          hargaKg: 135000,
          resep: "Rolade Daging Sapi",
        },
        {
          nama: "Telur Ayam Ras (dengan Cangkang)",
          kategori: "Lauk Hewani",
          gramPerPorsi: 60,
          bdd: 89,
          hargaKg: 28000,
          resep: "Semur Telur Bulat",
        },
        {
          nama: "Ikan Kembung Segar",
          kategori: "Lauk Hewani",
          gramPerPorsi: 70,
          bdd: 80,
          hargaKg: 42000,
          resep: "Ikan Kembung Goreng Garing",
        },
        {
          nama: "Tempe Kedelai Murni",
          kategori: "Lauk Nabati",
          gramPerPorsi: 40,
          bdd: 100,
          hargaKg: 16000,
          resep: "Tempe Goreng Tepung / Orek Tempe",
        },
        {
          nama: "Tahu Putih Segar",
          kategori: "Lauk Nabati",
          gramPerPorsi: 50,
          bdd: 100,
          hargaKg: 12000,
          resep: "Semur Tahu Cokelat",
        },
        {
          nama: "Wortel Segar",
          kategori: "Sayuran",
          gramPerPorsi: 45,
          bdd: 88,
          hargaKg: 15000,
          resep: "Sup Wortel Buncis / Tumis Sayur",
        },
        {
          nama: "Buncis Segar",
          kategori: "Sayuran",
          gramPerPorsi: 35,
          bdd: 90,
          hargaKg: 18000,
          resep: "Tumis Buncis Jagung Pipil",
        },
        {
          nama: "Bayam Hijau Segar",
          kategori: "Sayuran",
          gramPerPorsi: 50,
          bdd: 71,
          hargaKg: 12000,
          resep: "Sayur Bening Bayam Jagung",
        },
        {
          nama: "Minyak Kelapa Sawit (Goreng)",
          kategori: "Bumbu & Minyak",
          gramPerPorsi: 15,
          bdd: 100,
          hargaKg: 18500,
          resep: "Minyak Pengolahan Masak",
        },
        {
          nama: "Bawang Merah Lokal",
          kategori: "Bumbu & Minyak",
          gramPerPorsi: 10,
          bdd: 90,
          hargaKg: 35000,
          resep: "Bumbu Dasar Masakan",
        },
        {
          nama: "Bawang Putih Impor",
          kategori: "Bumbu & Minyak",
          gramPerPorsi: 8,
          bdd: 88,
          hargaKg: 40000,
          resep: "Bumbu Dasar Masakan",
        },
        {
          nama: "Pisang Ambon",
          kategori: "Buah",
          gramPerPorsi: 100,
          bdd: 75,
          hargaKg: 20000,
          resep: "Buah Segar Pencuci Mulut",
        },
        {
          nama: "Susu Sapi Segar (Full Cream)",
          kategori: "Lainnya",
          gramPerPorsi: 125,
          bdd: 100,
          hargaKg: 22000,
          resep: "Susu Tambahan Gizi",
        },
      ];

      standardBOM.forEach((item, idx) => {
        const key = item.nama.toLowerCase();
        groupedBahan.set(key, {
          id: `bom-${idx + 1}`,
          namaBahan: item.nama,
          kategori: item.kategori,
          bddPersen: item.bdd,
          totalGramasiPerPorsi: item.gramPerPorsi,
          hargaPerKg: item.hargaKg,
          satuanBeli: "kg",
          resepList: new Set([item.resep]),
        });
      });
    }

    // Hitung Kalkulasi BOM Sesuai Rumus Permintaan User:
    // Total Beli (kg) = (Total Gramasi di Resep * Target Porsi) / (BDD Persen / 100) / 1000
    // Tambahkan parameter toleransi_susut (misal 5%)
    let totalTonaseKg = 0;
    let totalAnggaranPO = 0;

    const items: POItemBOM[] = [];

    groupedBahan.forEach((val) => {
      const bddRatio = Math.max(0.1, val.bddPersen / 100);

      // Rumus: Total Beli (kg) = (Total Gramasi * Target Porsi Kumulatif) / (BDD / 100) / 1000
      const totalKebutuhanKotorKg =
        (val.totalGramasiPerPorsi * totalPorsiKumulatif) / bddRatio / 1000;

      // Toleransi susut
      const toleransiSusutKg = totalKebutuhanKotorKg * (susutPersen / 100);
      const totalBeliFinalKg = totalKebutuhanKotorKg + toleransiSusutKg;

      const subtotalBiaya = Math.round(totalBeliFinalKg * val.hargaPerKg);

      totalTonaseKg += totalBeliFinalKg;
      totalAnggaranPO += subtotalBiaya;

      items.push({
        id: val.id,
        bahanId: val.bahanId,
        namaBahan: val.namaBahan,
        kategori: val.kategori,
        bddPersen: val.bddPersen,
        gramasiResepPerPorsi: Math.round(val.totalGramasiPerPorsi * 10) / 10,
        totalKebutuhanKotorKg: Math.round(totalKebutuhanKotorKg * 10) / 10,
        toleransiSusutKg: Math.round(toleransiSusutKg * 10) / 10,
        totalBeliFinalKg: Math.round(totalBeliFinalKg * 10) / 10,
        hargaPerKg: val.hargaPerKg,
        subtotalBiaya,
        satuanBeli: val.satuanBeli,
        dipakaiPadaResep: Array.from(val.resepList),
      });
    });

    // Urutkan berdasarkan subtotal biaya tertinggi ke terendah
    items.sort((a, b) => b.subtotalBiaya - a.subtotalBiaya);

    const summary: POSummary = {
      startDate,
      endDate,
      totalHariEfektif: hariEfektif,
      targetPorsiPerHari: porsiPerHari,
      totalPorsiKumulatif,
      toleransiSusutPersen: susutPersen,
      totalTonaseKg: Math.round(totalTonaseKg * 10) / 10,
      totalAnggaranPO: Math.round(totalAnggaranPO),
      biayaPerPorsiSiswa: Math.round(totalAnggaranPO / totalPorsiKumulatif),
      totalJenisBahan: items.length,
      items,
    };

    return NextResponse.json({
      success: true,
      source,
      data: summary,
    });
  } catch (error: any) {
    console.error("Error in /api/po-kebutuhan:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan internal saat menghitung BOM PO." },
      { status: 500 }
    );
  }
}
