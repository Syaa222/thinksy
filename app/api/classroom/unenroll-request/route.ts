import { NextResponse } from "next/server";
import {
  getAllUnenrollRequests,
  createUnenrollRequest,
  updateUnenrollRequestStatus,
  cancelUnenrollRequest,
} from "@/lib/unenroll-requests";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const list = getAllUnenrollRequests();
    return NextResponse.json({ success: true, requests: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { studentId, studentName, classId, className, action } = body;

    // Jika action adalah cancel
    if (action === "cancel") {
      const target = classId || body.requestId;
      if (!target) {
        return NextResponse.json({ error: "classId or requestId required" }, { status: 400 });
      }
      cancelUnenrollRequest(studentId || "", target);
      return NextResponse.json({ success: true, message: "Permintaan keluar kelas dibatalkan." });
    }

    if (!classId || !className) {
      return NextResponse.json({ error: "classId and className are required" }, { status: 400 });
    }

    const created = createUnenrollRequest(
      studentId || "student-1",
      studentName || "Siswa Thinksy",
      classId,
      className
    );

    return NextResponse.json({
      success: true,
      message: "Permintaan keluar kelas berhasil dikirim. Menunggu konfirmasi guru.",
      request: created,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { requestId, action } = body;

    if (!requestId || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { error: "requestId and valid action (approve/reject) are required" },
        { status: 400 }
      );
    }

    const updated = updateUnenrollRequestStatus(
      requestId,
      action === "approve" ? "approved" : "rejected"
    );

    if (!updated) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Jika disetujui, cabut juga dari Supabase jika ada anggota_kelas terkait
    if (action === "approve" && updated.studentId && updated.classId) {
      try {
        const adminDb = createAdminClient();
        await adminDb
          .from("anggota_kelas")
          .delete()
          .eq("siswa_id", updated.studentId)
          .eq("kelas_id", updated.classId);
      } catch (dbErr) {
        console.warn("[UNENROLL DB REMOVE WARNING]", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "Permintaan keluar kelas telah disetujui."
          : "Permintaan keluar kelas ditolak.",
      request: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
