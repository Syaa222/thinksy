import { NextResponse } from "next/server";
import {
  getAllSharedClasses,
  saveSharedClass,
  deleteSharedClass,
  getDeletedClassIds,
  getDeletedClassRecords,
  getArchivedClassIds,
  getArchivedClassRecords,
  archiveSharedClass,
  restoreSharedClass,
} from "@/lib/shared-classes";

export async function GET() {
  try {
    const classes = getAllSharedClasses();
    const deletedClassIds = getDeletedClassIds();
    const deletedRecords = getDeletedClassRecords();
    const archivedClassIds = getArchivedClassIds();
    const archivedRecords = getArchivedClassRecords();
    return NextResponse.json({
      success: true,
      classes,
      archivedClassIds,
      archivedRecords,
      deletedClassIds,
      deletedRecords,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.subjectCode) {
      return NextResponse.json({ error: "Data kelas dan token wajib ada." }, { status: 400 });
    }

    const saved = saveSharedClass(body);
    return NextResponse.json({ success: true, class: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, classId } = body;

    if (!classId) {
      return NextResponse.json({ error: "classId wajib disertakan." }, { status: 400 });
    }

    if (action === "archive" || action === "unenroll") {
      archiveSharedClass(classId);
      return NextResponse.json({
        success: true,
        action: "archive",
        classId,
        archivedClassIds: getArchivedClassIds(),
        message: `Kelas ${classId} berhasil di-unenroll dan dipindahkan ke arsip.`,
      });
    }

    if (action === "restore") {
      restoreSharedClass(classId);
      return NextResponse.json({
        success: true,
        action: "restore",
        classId,
        archivedClassIds: getArchivedClassIds(),
        message: `Kelas ${classId} berhasil dipulihkan ke daftar pengampuan aktif.`,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali (hanya 'archive' atau 'restore')." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    let classId = url.searchParams.get("id") || url.searchParams.get("classId");

    if (!classId) {
      try {
        const body = await req.json();
        classId = body?.id || body?.classId;
      } catch {}
    }

    if (!classId) {
      return NextResponse.json(
        { error: "classId atau id wajib disertakan untuk menghapus kelas." },
        { status: 400 }
      );
    }

    const ok = deleteSharedClass(classId);
    const deletedClassIds = getDeletedClassIds();

    return NextResponse.json({
      success: ok,
      message: `Kelas ${classId} berhasil dihapus secara permanen.`,
      deletedId: classId,
      deletedClassIds,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

