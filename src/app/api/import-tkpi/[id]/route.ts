/**
 * app/api/import-tkpi/[id]/route.ts
 * PUT  — update satu bahan berdasarkan ID (UUID)
 * DELETE — hapus satu bahan berdasarkan ID (UUID)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseNum(val: unknown, fallback = 0): number {
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const parsed = parseFloat(String(val).replace(/,/g, ".").trim());
  return isNaN(parsed) ? fallback : parsed;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: "ID tidak ditemukan." }, { status: 400 });
    }

    const body = await req.json();

    if (!body.nama_bahan?.trim()) {
      return NextResponse.json({ success: false, message: "Nama bahan wajib diisi." }, { status: 400 });
    }

    const updated = await prisma.masterBahanTkpi.update({
      where: { id },
      data: {
        kode_tkpi: body.kode_tkpi?.trim() || undefined,
        nama_bahan: body.nama_bahan.trim(),
        kategori: body.kategori?.trim() || null,
        bdd_persen: parseNum(body.bdd_persen, 100),
        harga_estimasi_per_kg: parseNum(body.harga_estimasi_per_kg, 0),
        energi_kcal: parseNum(body.energi_kcal, 0),
        protein_g: parseNum(body.protein_g, 0),
        lemak_g: parseNum(body.lemak_g, 0),
        karbo_g: parseNum(body.karbo_g, 0),
        serat_g: parseNum(body.serat_g, 0),
        besi_fe_mg: parseNum(body.besi_fe_mg, 0),
        kalsium_ca_mg: parseNum(body.kalsium_ca_mg, 0),
        zink_zn_mg: parseNum(body.zink_zn_mg, 0),
        vit_a_mcg: parseNum(body.vit_a_mcg, 0),
        vit_c_mg: parseNum(body.vit_c_mg, 0),
        image_url: body.image_url?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, message: "Data bahan berhasil diperbarui.", data: updated });
  } catch (error: any) {
    console.error("Error PUT /api/import-tkpi/[id]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal memperbarui data." },
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
      return NextResponse.json({ success: false, message: "ID tidak ditemukan." }, { status: 400 });
    }

    await prisma.masterBahanTkpi.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Data bahan berhasil dihapus." });
  } catch (error: any) {
    console.error("Error DELETE /api/import-tkpi/[id]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal menghapus data." },
      { status: 500 }
    );
  }
}
