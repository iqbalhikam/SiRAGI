/**
 * app/api/menu-planner/route.ts
 * API CRUD untuk MenuPlannerWeek menggunakan Prisma ORM
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — ambil plan terakhir (atau by ID)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const plan = await prisma.menuPlannerWeek.findUnique({ where: { id } });
      if (!plan) {
        return NextResponse.json({ error: "Plan tidak ditemukan." }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: plan });
    }

    // Ambil plan terbaru
    const plan = await prisma.menuPlannerWeek.findFirst({
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: plan ?? null,
      message: plan ? undefined : "Belum ada plan tersimpan.",
    });
  } catch (error: any) {
    console.error("Error in GET /api/menu-planner:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal mengambil plan." },
      { status: 500 }
    );
  }
}

// POST — buat plan baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      plan_name,
      target_akg_id,
      target_akg_nama,
      target_kalori_mbg,
      target_protein_mbg,
      batas_hpp_maksimal,
      is_valid = false,
      valid_days_count = 0,
      warning_days_count = 0,
      avg_kalori = 0,
      avg_hpp = 0,
      avg_protein = 0,
      total_hpp_week = 0,
      schedule_data = {},
      user_id = null,
    } = body;

    if (!target_akg_id || !target_akg_nama) {
      return NextResponse.json(
        { error: "target_akg_id dan target_akg_nama wajib diisi." },
        { status: 400 }
      );
    }

    const plan = await prisma.menuPlannerWeek.create({
      data: {
        user_id,
        plan_name: plan_name || `Plan ${new Date().toLocaleDateString("id-ID")}`,
        target_akg_id,
        target_akg_nama,
        target_kalori_mbg: Number(target_kalori_mbg) || 0,
        target_protein_mbg: Number(target_protein_mbg) || 0,
        batas_hpp_maksimal: Number(batas_hpp_maksimal) || 0,
        is_valid: Boolean(is_valid),
        valid_days_count: Number(valid_days_count) || 0,
        warning_days_count: Number(warning_days_count) || 0,
        avg_kalori: Number(avg_kalori) || 0,
        avg_hpp: Number(avg_hpp) || 0,
        avg_protein: Number(avg_protein) || 0,
        total_hpp_week: Number(total_hpp_week) || 0,
        schedule_data,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Plan "${plan.plan_name}" berhasil disimpan.`,
      data: plan,
    });
  } catch (error: any) {
    console.error("Error in POST /api/menu-planner:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal menyimpan plan." },
      { status: 500 }
    );
  }
}

// PATCH — update plan yang ada (by ID di body)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID plan wajib diisi untuk update." }, { status: 400 });
    }

    const plan = await prisma.menuPlannerWeek.update({
      where: { id },
      data: {
        plan_name: updateData.plan_name,
        target_akg_id: updateData.target_akg_id,
        target_akg_nama: updateData.target_akg_nama,
        target_kalori_mbg: updateData.target_kalori_mbg !== undefined ? Number(updateData.target_kalori_mbg) : undefined,
        target_protein_mbg: updateData.target_protein_mbg !== undefined ? Number(updateData.target_protein_mbg) : undefined,
        batas_hpp_maksimal: updateData.batas_hpp_maksimal !== undefined ? Number(updateData.batas_hpp_maksimal) : undefined,
        is_valid: updateData.is_valid !== undefined ? Boolean(updateData.is_valid) : undefined,
        valid_days_count: updateData.valid_days_count !== undefined ? Number(updateData.valid_days_count) : undefined,
        warning_days_count: updateData.warning_days_count !== undefined ? Number(updateData.warning_days_count) : undefined,
        avg_kalori: updateData.avg_kalori !== undefined ? Number(updateData.avg_kalori) : undefined,
        avg_hpp: updateData.avg_hpp !== undefined ? Number(updateData.avg_hpp) : undefined,
        avg_protein: updateData.avg_protein !== undefined ? Number(updateData.avg_protein) : undefined,
        total_hpp_week: updateData.total_hpp_week !== undefined ? Number(updateData.total_hpp_week) : undefined,
        schedule_data: updateData.schedule_data,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Plan "${plan.plan_name}" berhasil diperbarui.`,
      data: plan,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/menu-planner:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal memperbarui plan." },
      { status: 500 }
    );
  }
}
