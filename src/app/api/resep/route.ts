/**
 * app/api/resep/route.ts
 * Menggunakan Prisma ORM — menggantikan Supabase client
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      total_lemak,
      total_karbo,
      total_hpp,
      hpp_per_porsi,
      komposisi = [],
    } = body;

    if (!nama_resep?.trim()) {
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

    // Simpan header resep + komposisi dalam satu transaksi
    const resep = await prisma.resep.create({
      data: {
        nama_resep: nama_resep.trim(),
        kategori: kategori || "Lainnya",
        deskripsi: deskripsi?.trim() || null,
        porsi: Math.max(1, Number(porsi) || 1),
        total_kalori: Number(total_kalori) || 0,
        total_protein: Number(total_protein) || 0,
        total_lemak: Number(total_lemak) || 0,
        total_karbo: Number(total_karbo) || 0,
        total_hpp: Math.round(Number(total_hpp) || 0),
        hpp_per_porsi: Math.round(Number(hpp_per_porsi) || 0),
        komposisi: {
          create: komposisi.map((item: any) => ({
            bahan_tkpi_id: item.bahan_tkpi_id || null,
            nama_bahan: item.nama_bahan || "Bahan Makanan",
            gramasi_kotor: Number(item.gramasi_kotor) || 0,
            bdd_persen: Number(item.bdd_persen) || 100,
            berat_bersih: Number(item.berat_bersih) || 0,
            kalori: Number(item.kalori) || 0,
            protein: Number(item.protein) || 0,
            lemak: Number(item.lemak) || 0,
            karbo: Number(item.karbo) || 0,
            harga: Math.round(Number(item.harga) || 0),
          })),
        },
      },
      include: {
        komposisi: true,
      },
    });

    return NextResponse.json({
      success: true,
      mode: "prisma",
      message: "Resep dan seluruh komposisi berhasil disimpan!",
      resep,
    });
  } catch (error: any) {
    console.error("Error in POST /api/resep:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan internal server." },
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

    const where: any = {};
    if (search) {
      where.nama_resep = { contains: search, mode: "insensitive" };
    }
    if (kategori && kategori !== "all") {
      where.kategori = kategori;
    }

    const data = await prisma.resep.findMany({
      where,
      orderBy: { updated_at: "desc" },
      take: limit,
      include: {
        komposisi: {
          include: {
            bahan_tkpi: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in GET /api/resep:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal mengambil data resep." },
      { status: 500 }
    );
  }
}
