/**
 * app/api/import-tkpi/route.ts
 * Menggunakan Prisma ORM — menggantikan Supabase client
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    // Validasi & Sanitasi Data
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
        invalidRows.push({ index: idx + 1, reason: "Kode/ID dan Nama Bahan wajib diisi" });
        return;
      }

      const imageUrl = item.image_url ?? item.image ?? item.img ?? item.Image ?? null;

      validRecords.push({
        kode_tkpi: kode,
        nama_bahan: nama,
        kategori: item.kategori
          ? String(item.kategori).trim()
          : item.category
          ? String(item.category).trim()
          : null,
        bdd_persen: parseNum(item.bdd_persen ?? item.bdd ?? item.BDD, 100),
        harga_estimasi_per_kg: parseNum(
          item.harga_estimasi_per_kg ?? item.harga_per_kg ?? item.harga ?? item.price ?? item.Harga,
          0
        ),
        energi_kcal: parseNum(
          item.energi_kcal ?? item.energi ?? item.kalori ?? item.calories ?? item.calorie ?? item.Energi,
          0
        ),
        protein_g: parseNum(item.protein_g ?? item.protein ?? item.Protein, 0),
        lemak_g: parseNum(item.lemak_g ?? item.lemak ?? item.fat ?? item.Lemak, 0),
        karbo_g: parseNum(item.karbo_g ?? item.karbo ?? item.karbohidrat ?? item.carbohydrate ?? item.carbs, 0),
        serat_g: parseNum(item.serat_g ?? item.serat ?? item.fiber, 0),
        besi_fe_mg: parseNum(item.besi_fe_mg ?? item.besi ?? item.fe ?? item.iron, 0),
        kalsium_ca_mg: parseNum(item.kalsium_ca_mg ?? item.kalsium ?? item.calcium, 0),
        zink_zn_mg: parseNum(item.zink_zn_mg ?? item.zink ?? item.zinc, 0),
        vit_a_mcg: parseNum(item.vit_a_mcg ?? item.vit_a ?? item.vitamin_a, 0),
        vit_c_mg: parseNum(item.vit_c_mg ?? item.vit_c ?? item.vitamin_c, 0),
        image_url: imageUrl ? String(imageUrl).trim() : null,
      });
    });

    if (validRecords.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data valid yang dapat diimpor.", invalidRows },
        { status: 422 }
      );
    }

    // Upsert menggunakan Prisma — batch per 250 agar tidak timeout
    const CHUNK_SIZE = 250;
    let totalProcessed = 0;
    const upsertErrors: string[] = [];

    for (let i = 0; i < validRecords.length; i += CHUNK_SIZE) {
      const chunk = validRecords.slice(i, i + CHUNK_SIZE);
      try {
        // Prisma tidak support bulk upsert langsung, gunakan createManyAndReturn dengan skipDuplicates
        // atau upsert per record dalam transaction
        const result = await prisma.$transaction(
          chunk.map((record) =>
            prisma.masterBahanTkpi.upsert({
              where: { kode_tkpi: record.kode_tkpi },
              create: {
                kode_tkpi: record.kode_tkpi,
                nama_bahan: record.nama_bahan,
                kategori: record.kategori ?? null,
                bdd_persen: record.bdd_persen,
                harga_estimasi_per_kg: record.harga_estimasi_per_kg,
                energi_kcal: record.energi_kcal,
                protein_g: record.protein_g,
                lemak_g: record.lemak_g,
                karbo_g: record.karbo_g,
                serat_g: record.serat_g,
                besi_fe_mg: record.besi_fe_mg,
                kalsium_ca_mg: record.kalsium_ca_mg,
                zink_zn_mg: record.zink_zn_mg,
                vit_a_mcg: record.vit_a_mcg,
                vit_c_mg: record.vit_c_mg,
                image_url: record.image_url ?? null,
              },
              update: {
                nama_bahan: record.nama_bahan,
                kategori: record.kategori ?? null,
                bdd_persen: record.bdd_persen,
                harga_estimasi_per_kg: record.harga_estimasi_per_kg,
                energi_kcal: record.energi_kcal,
                protein_g: record.protein_g,
                lemak_g: record.lemak_g,
                karbo_g: record.karbo_g,
                serat_g: record.serat_g,
                besi_fe_mg: record.besi_fe_mg,
                kalsium_ca_mg: record.kalsium_ca_mg,
                zink_zn_mg: record.zink_zn_mg,
                vit_a_mcg: record.vit_a_mcg,
                vit_c_mg: record.vit_c_mg,
                image_url: record.image_url ?? null,
              },
            })
          )
        );
        totalProcessed += result.length;
      } catch (batchErr: any) {
        console.error(`Batch ${Math.floor(i / CHUNK_SIZE) + 1} error:`, batchErr);
        upsertErrors.push(`Batch ${Math.floor(i / CHUNK_SIZE) + 1}: ${batchErr.message}`);
      }
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
      { success: false, message: error?.message || "Terjadi kesalahan internal saat mengimpor data." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const kategori = searchParams.get("kategori") || "";
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where: any = {};

    if (search) {
      where.OR = [
        { nama_bahan: { contains: search, mode: "insensitive" } },
        { kode_tkpi: { contains: search, mode: "insensitive" } },
      ];
    }

    if (kategori && kategori !== "all") {
      where.kategori = kategori;
    }

    const [data, total] = await prisma.$transaction([
      prisma.masterBahanTkpi.findMany({
        where,
        orderBy: { nama_bahan: "asc" },
        skip: offset,
        take: limit,
      }),
      prisma.masterBahanTkpi.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      isConfigured: true,
      data,
      total,
    });
  } catch (error: any) {
    console.error("Error fetching master_bahan_tkpi:", error);
    return NextResponse.json(
      { success: false, isConfigured: true, message: error?.message || "Gagal mengambil data.", data: [], total: 0 },
      { status: 500 }
    );
  }
}
