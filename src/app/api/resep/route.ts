import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/utils/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nama_resep,
      kategori,
      deskripsi,
      porsi = 1,
      total_kalori,
      total_protein,
      total_hpp,
      hpp_per_porsi,
      komposisi = [],
    } = body;

    if (!nama_resep || !nama_resep.trim()) {
      return NextResponse.json(
        { error: "Nama resep wajib diisi." },
        { status: 400 }
      );
    }

    if (!Array.isArray(komposisi) || komposisi.length === 0) {
      return NextResponse.json(
        { error: "Komposisi bahan minimal 1 bahan." },
        { status: 400 }
      );
    }

    // Periksa apakah Supabase sudah dikonfigurasi
    if (!isSupabaseConfigured()) {
      // Simulasi ID untuk lingkungan demo tanpa Supabase live keys
      const simulatedResepId = "simulated-" + Date.now();
      return NextResponse.json({
        success: true,
        mode: "simulated",
        message:
          "Disimpan dalam mode simulasi (kredensial Supabase di .env.local belum diisi).",
        resep: {
          id: simulatedResepId,
          nama_resep,
          kategori,
          deskripsi,
          porsi,
          total_kalori,
          total_protein,
          total_hpp,
          hpp_per_porsi,
          created_at: new Date().toISOString(),
        },
        komposisi_count: komposisi.length,
      });
    }

    // 1. Inisialisasi Supabase Server Client (akan menggunakan SUPABASE_SERVICE_ROLE_KEY jika ada untuk bypass RLS)
    const supabase = getSupabaseServerClient();

    // Simpan Header ke tabel `resep`
    const { data: resepData, error: resepError } = await supabase
      .from("resep")
      .insert({
        nama_resep: nama_resep.trim(),
        kategori: kategori || "Umum",
        deskripsi: deskripsi || null,
        porsi: Number(porsi) || 1,
        total_kalori: Number(total_kalori) || 0,
        total_protein: Number(total_protein) || 0,
        total_hpp: Number(total_hpp) || 0,
        hpp_per_porsi: Number(hpp_per_porsi) || 0,
      })
      .select()
      .single();

    if (resepError) {
      console.error("Supabase resep insert error:", resepError);
      return NextResponse.json(
        {
          error: `Gagal menyimpan ke tabel resep: ${resepError.message}`,
          details: resepError,
        },
        { status: 500 }
      );
    }

    const resepId = resepData.id;

    // 2. Simpan Rincian ke tabel `resep_komposisi`
    const komposisiPayload = komposisi.map((item: any) => ({
      resep_id: resepId,
      bahan_tkpi_id: item.bahan_tkpi_id || item.bahan_id || item.id || null,
      bahan_id: item.bahan_id?.startsWith("mb-") ? null : item.bahan_id || null,
      nama_bahan: item.nama_bahan || "Bahan Makanan",
      gramasi_kotor: Number(item.gramasi_kotor) || 0,
      bdd_persen: Number(item.bdd_persen) || 100,
      berat_bersih: Number(item.berat_bersih) || 0,
      kalori: Number(item.kalori) || 0,
      protein: Number(item.protein) || 0,
      harga: Number(item.harga) || 0,
    }));

    let { data: komposisiData, error: komposisiError } = await supabase
      .from("resep_komposisi")
      .insert(komposisiPayload)
      .select();

    // Jika terjadi error karena perbedaan kolom schema (misal tabel resep_komposisi hanya memiliki bahan_tkpi_id & gramasi_kotor)
    if (
      komposisiError &&
      (komposisiError.code === "PGRST204" ||
        komposisiError.message?.includes("Could not find the") ||
        komposisiError.message?.includes("does not exist"))
    ) {
      console.warn("Schema resep_komposisi berbeda, mencoba format standar bahan_tkpi_id & gramasi_kotor...");
      const compactPayload = komposisi.map((item: any) => ({
        resep_id: resepId,
        bahan_tkpi_id: item.bahan_tkpi_id || item.id || null,
        gramasi_kotor: Number(item.gramasi_kotor) || 0,
      }));

      const retryResult = await supabase
        .from("resep_komposisi")
        .insert(compactPayload)
        .select();

      komposisiData = retryResult.data;
      komposisiError = retryResult.error;
    }

    if (komposisiError) {
      console.error("Supabase resep_komposisi insert error:", komposisiError);
      return NextResponse.json(
        {
          error: `Header resep berhasil disimpan (ID: ${resepId}), namun gagal menyimpan komposisi: ${komposisiError.message}`,
          resep: resepData,
          details: komposisiError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mode: "supabase",
      message: "Resep dan seluruh komposisi berhasil disimpan ke Supabase!",
      resep: resepData,
      komposisi: komposisiData,
    });
  } catch (error: any) {
    console.error("Unexpected error in /api/resep:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        configured: false,
        message: "Supabase belum dikonfigurasi di environment.",
        data: [],
      });
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("resep")
      .select(`
        *,
        resep_komposisi (*)
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ configured: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
