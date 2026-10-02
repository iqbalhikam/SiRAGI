/**
 * app/api/resep/[id]/route.ts
 * GET    — Ambil detail 1 resep lengkap dengan komposisi & relasi bahan TKPI
 * PUT    — Update resep (header + komposisi)
 * DELETE — Hapus resep
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID resep tidak valid." },
        { status: 400 }
      );
    }

    const resep = await prisma.resep.findUnique({
      where: { id },
      include: {
        komposisi: {
          include: {
            bahan_tkpi: true,
          },
        },
      },
    });

    if (!resep) {
      return NextResponse.json(
        { success: false, error: "Resep tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, resep });
  } catch (error: any) {
    console.error("Error GET /api/resep/[id]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengambil data resep." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID resep tidak valid." },
        { status: 400 }
      );
    }

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
        { success: false, error: "Nama resep wajib diisi." },
        { status: 400 }
      );
    }

    if (!Array.isArray(komposisi) || komposisi.length === 0) {
      return NextResponse.json(
        { success: false, error: "Komposisi bahan minimal 1 bahan." },
        { status: 400 }
      );
    }

    // Lakukan update dalam transaction: update header, hapus komposisi lama, buat komposisi baru
    const updatedResep = await prisma.$transaction(async (tx) => {
      // 1. Update Header
      await tx.resep.update({
        where: { id },
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
        },
      });

      // 2. Hapus komposisi lama
      await tx.resepKomposisi.deleteMany({
        where: { resep_id: id },
      });

      // 3. Masukkan komposisi baru
      await tx.resepKomposisi.createMany({
        data: komposisi.map((item: any) => ({
          resep_id: id,
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
      });

      // 4. Return data lengkap terbaru
      return tx.resep.findUnique({
        where: { id },
        include: {
          komposisi: {
            include: {
              bahan_tkpi: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Resep "${nama_resep}" berhasil diperbarui!`,
      resep: updatedResep,
    });
  } catch (error: any) {
    console.error("Error PUT /api/resep/[id]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memperbarui data resep." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID resep tidak valid." },
        { status: 400 }
      );
    }

    await prisma.resep.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Resep berhasil dihapus.",
    });
  } catch (error: any) {
    console.error("Error DELETE /api/resep/[id]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menghapus resep." },
      { status: 500 }
    );
  }
}
