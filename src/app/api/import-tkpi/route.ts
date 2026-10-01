import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/utils/supabase/client";
import { MasterBahanTKPI } from "@/types/tkpi";

function parseNum(val: unknown, fallback: number = 0): number {
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const str = String(val).replace(/,/g, ".").trim();
  const parsed = parseFloat(str);
  return isNaN(parsed) ? fallback : parsed;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawItems: unknown[] = Array.isArray(body) ? body : body?.items || [];

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        { success: false, message: "Data kosong atau format JSON tidak sesuai." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Koneksi Supabase belum dikonfigurasi di environment. Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY sudah disetel.",
        },
        { status: 503 }
      );
    }

    // 1. Validasi & Sanitasi Data
    const validRecords: MasterBahanTKPI[] = [];
    const invalidRows: { index: number; reason: string }[] = [];

    rawItems.forEach((item: any, idx: number) => {
      const kode = String(
        item.kode_tkpi || item.kode || item.Kode || item.id || item.ID || ""
      ).trim();
      const nama = String(
        item.nama_bahan || item.nama || item.Nama || item.name || item.Name || ""
      ).trim();

      if (!kode || !nama) {
        invalidRows.push({
          index: idx + 1,
          reason: "Kode/ID dan Nama Bahan wajib diisi",
        });
        return;
      }

      const imageUrl = item.image_url ?? item.image ?? item.img ?? item.Image ?? null;

      validRecords.push({
        kode_tkpi: kode,
        nama_bahan: nama,
        kategori: item.kategori ? String(item.kategori).trim() : (item.category ? String(item.category).trim() : null),
        bdd_persen: parseNum(item.bdd_persen ?? item.bdd ?? item.BDD, 100),
        harga_estimasi_per_kg: parseNum(
          item.harga_estimasi_per_kg ?? item.harga_per_kg ?? item.harga ?? item.price ?? item.Harga,
          0
        ),
        energi_kcal: parseNum(
          item.energi_kcal ?? item.energi ?? item.kalori ?? item.calories ?? item.calorie ?? item.Energi ?? item.Calories,
          0
        ),
        protein_g: parseNum(
          item.protein_g ?? item.protein ?? item.proteins ?? item.Protein ?? item.Proteins,
          0
        ),
        lemak_g: parseNum(
          item.lemak_g ?? item.lemak ?? item.fat ?? item.fats ?? item.Lemak ?? item.Fat,
          0
        ),
        karbo_g: parseNum(
          item.karbo_g ?? item.karbo ?? item.karbohidrat ?? item.carbohydr ?? item.carbohydrate ?? item.carbohydrates ?? item.carbs ?? item.Karbo,
          0
        ),
        serat_g: parseNum(item.serat_g ?? item.serat ?? item.fiber ?? item.fibers ?? item.Serat, 0),
        besi_fe_mg: parseNum(item.besi_fe_mg ?? item.besi ?? item.fe ?? item.iron ?? item.Fe, 0),
        kalsium_ca_mg: parseNum(item.kalsium_ca_mg ?? item.kalsium ?? item.ca ?? item.calcium ?? item.Ca, 0),
        zink_zn_mg: parseNum(item.zink_zn_mg ?? item.zink ?? item.zn ?? item.zinc ?? item.Zn, 0),
        vit_a_mcg: parseNum(item.vit_a_mcg ?? item.vit_a ?? item.vitamin_a ?? item.VitA, 0),
        vit_c_mg: parseNum(item.vit_c_mg ?? item.vit_c ?? item.vitamin_c ?? item.VitC, 0),
        image_url: imageUrl ? String(imageUrl).trim() : null,
      });
    });

    if (validRecords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada data valid yang dapat diimpor.",
          invalidRows,
        },
        { status: 422 }
      );
    }

    // 2. Batching / Chunking Insert (misal per 200 baris agar aman dan cepat)
    const supabase = getSupabaseServerClient();
    const CHUNK_SIZE = 250;
    let totalProcessed = 0;
    const upsertErrors: string[] = [];

    for (let i = 0; i < validRecords.length; i += CHUNK_SIZE) {
      const chunk = validRecords.slice(i, i + CHUNK_SIZE);

      const { data, error } = await supabase
        .from("master_bahan_tkpi")
        .upsert(chunk, {
          onConflict: "kode_tkpi",
          ignoreDuplicates: false, // Update data jika kode_tkpi sudah ada
        })
        .select("kode_tkpi");

      if (error) {
        console.error("Supabase upsert error chunk:", error);
        upsertErrors.push(`Batch ${i / CHUNK_SIZE + 1}: ${error.message}`);
      } else {
        totalProcessed += (data?.length || chunk.length);
      }
    }

    if (upsertErrors.length > 0 && totalProcessed === 0) {
      const isTableMissing = upsertErrors.some((e) =>
        e.includes("Could not find the table") || e.includes("relation \"public.master_bahan_tkpi\" does not exist")
      );
      return NextResponse.json(
        {
          success: false,
          message: isTableMissing
            ? "Tabel 'master_bahan_tkpi' belum dibuat di database Supabase Anda. Silakan eksekusi file migrasi SQL di Supabase SQL Editor (supabase/migrations/20261001_create_master_bahan_tkpi.sql)."
            : "Gagal menyimpan data ke Supabase.",
          errors: upsertErrors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses ${totalProcessed} bahan makanan ke tabel master_bahan_tkpi (Upsert).`,
      insertedOrUpdated: totalProcessed,
      totalSubmitted: validRecords.length,
      invalidCount: invalidRows.length,
      errors: upsertErrors.length > 0 ? upsertErrors : undefined,
    });
  } catch (error: any) {
    console.error("Error in /api/import-tkpi:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Terjadi kesalahan internal saat mengimpor data.",
      },
      { status: 500 }
    );
  }
}

// Endpoint GET untuk mengambil data master_bahan_tkpi dari Supabase
export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          isConfigured: false,
          message: "Supabase belum terkonfigurasi.",
          data: [],
          total: 0,
        },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const kategori = searchParams.get("kategori") || "";
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("master_bahan_tkpi")
      .select("*", { count: "exact" })
      .order("nama_bahan", { ascending: true })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`nama_bahan.ilike.%${search}%,kode_tkpi.ilike.%${search}%`);
    }

    if (kategori && kategori !== "all") {
      query = query.eq("kategori", kategori);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching master_bahan_tkpi:", error);
      const isTableMissing = error.message?.includes("Could not find the table") || error.code === "42P01";
      return NextResponse.json(
        {
          success: false,
          isConfigured: true,
          isTableCreated: !isTableMissing,
          message: isTableMissing
            ? "Tabel 'master_bahan_tkpi' belum dibuat di Supabase. Silakan jalankan file migrasi SQL yang telah disediakan."
            : error.message,
          data: [],
          total: 0,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      isConfigured: true,
      data: data || [],
      total: count || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal mengambil data.", data: [], total: 0 },
      { status: 500 }
    );
  }
}
